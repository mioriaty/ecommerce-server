import { Injectable } from '@nestjs/common';
import { OrderStatus } from '../../generated/prisma/client.js';
import { PaymentStatus } from '../constants/payment.constant.js';
import { PrismaService } from '../services/prisma.service.js';

@Injectable()
export class SharedPaymentRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async cancelPaymentAndOrder(paymentId: number) {
    const payment = await this.prismaService.payment.findUnique({
      where: {
        id: paymentId
      },
      include: {
        orders: {
          include: {
            items: true
          }
        }
      }
    });
    if (!payment) {
      throw Error('Payment not found');
    }
    await this.prismaService.$transaction(async (tx) => {
      const orders = await tx.order.findMany({
        where: {
          paymentId,
          status: OrderStatus.PENDING_PAYMENT,
          deletedAt: null
        },
        include: {
          items: true
        }
      });
      const productSKUSnapshots = orders.flatMap((order) => order.items);
      const updateOrder$ = tx.order.updateMany({
        where: {
          id: {
            in: orders.map((order) => order.id)
          },
          status: OrderStatus.PENDING_PAYMENT,
          deletedAt: null
        },
        data: {
          status: OrderStatus.CANCELLED
        }
      });

      const updateSkus$ = Promise.all(
        productSKUSnapshots
          .filter((item) => item.skuId)
          .map((item) =>
            tx.sKU.update({
              where: {
                id: item.skuId as number
              },
              data: {
                stock: {
                  increment: item.quantity
                }
              }
            })
          )
      );

      const updatePayment$ = tx.payment.update({
        where: {
          id: paymentId
        },
        data: {
          status: PaymentStatus.FAILED
        }
      });
      return await Promise.all([updateOrder$, updateSkus$, updatePayment$]);
    });
  }
}
