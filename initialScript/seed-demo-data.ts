import { MediaType } from '../src/generated/prisma/client.js'
import { PrismaService } from '../src/shared/services/prisma.service.js'
import { HashingService } from '../src/shared/services/hashing.service.js'
import { RoleName } from '../src/shared/constants/role.constant.js'
import { OrderStatus } from '../src/shared/constants/order.constant.js'
import { PaymentStatus } from '../src/shared/constants/payment.constant.js'

const prisma = new PrismaService()
const hashingService = new HashingService()
const PREFIX = 'DEMO-'
const IMAGE = (seed: string, text: string) => `https://placehold.co/800x800/png?text=${seed}-${text}`

const daysAgo = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000)
const daysFromNow = (days: number) => new Date(Date.now() + days * 24 * 60 * 60 * 1000)

const getSkuValues = (variants: Array<{ options: string[] }>) =>
  variants.reduce<string[]>(
    (values, variant) =>
      values.flatMap((value) => variant.options.map((option) => `${value}${value ? '-' : ''}${option}`)),
    [''],
  )

const main = async () => {
  const existingDemoProducts = await prisma.product.count({ where: { name: { startsWith: PREFIX } } })
  if (existingDemoProducts > 0) {
    throw new Error(`Demo data already exists (${existingDemoProducts} products). Refusing to duplicate it.`)
  }

  const [adminRole, clientRole, sellerRole] = await Promise.all([
    prisma.role.findFirstOrThrow({ where: { name: RoleName.Admin } }),
    prisma.role.findFirstOrThrow({ where: { name: RoleName.Client } }),
    prisma.role.findFirstOrThrow({ where: { name: RoleName.Seller } }),
  ])
  const admin = await prisma.user.findFirstOrThrow({ where: { roleId: adminRole.id } })
  const seller = await prisma.user.findFirstOrThrow({ where: { roleId: sellerRole.id } })

  await prisma.language.upsert({
    where: { id: 'vi' },
    update: { name: 'Tiếng Việt' },
    create: { id: 'vi', name: 'Tiếng Việt', createdById: admin.id },
  })
  await prisma.language.upsert({
    where: { id: 'en' },
    update: { name: 'English' },
    create: { id: 'en', name: 'English', createdById: admin.id },
  })

  const brandRows = Array.from({ length: 16 }, (_, index) => ({
    name: `${PREFIX}Brand ${String(index + 1).padStart(2, '0')}`,
    logo: IMAGE('brand', String(index + 1)),
    createdById: admin.id,
  }))
  const brands = await prisma.brand.createManyAndReturn({ data: brandRows })
  await prisma.brandTranslation.createMany({
    data: brands.flatMap((brand, index) => [
      {
        brandId: brand.id,
        languageId: 'vi',
        name: `Thương hiệu Demo ${index + 1}`,
        description: 'Thương hiệu mẫu dùng cho màn hình quản trị và cửa hàng.',
        createdById: admin.id,
      },
      {
        brandId: brand.id,
        languageId: 'en',
        name: `Demo Brand ${index + 1}`,
        description: 'Sample brand for storefront and admin screens.',
        createdById: admin.id,
      },
    ]),
  })

  const rootCategories = await prisma.category.createManyAndReturn({
    data: Array.from({ length: 12 }, (_, index) => ({
      name: `${PREFIX}Category ${String(index + 1).padStart(2, '0')}`,
      logo: IMAGE('category', String(index + 1)),
      createdById: admin.id,
    })),
  })
  const childCategories = await prisma.category.createManyAndReturn({
    data: Array.from({ length: 18 }, (_, index) => ({
      name: `${PREFIX}Subcategory ${String(index + 1).padStart(2, '0')}`,
      logo: IMAGE('subcategory', String(index + 1)),
      parentCategoryId: rootCategories[index % rootCategories.length].id,
      createdById: admin.id,
    })),
  })
  const categories = [...rootCategories, ...childCategories]
  await prisma.categoryTranslation.createMany({
    data: categories.flatMap((category, index) => [
      {
        categoryId: category.id,
        languageId: 'vi',
        name: `Danh mục Demo ${index + 1}`,
        description: 'Danh mục mẫu để kiểm tra bộ lọc, phân trang và trang chi tiết.',
        createdById: admin.id,
      },
      {
        categoryId: category.id,
        languageId: 'en',
        name: `Demo Category ${index + 1}`,
        description: 'Sample category for filters, pagination and detail pages.',
        createdById: admin.id,
      },
    ]),
  })

  const password = await hashingService.hash('Demo@123456')
  const users = await prisma.user.createManyAndReturn({
    data: Array.from({ length: 160 }, (_, index) => ({
      email: `demo.customer.${String(index + 1).padStart(3, '0')}@example.com`,
      name: `${PREFIX}Customer ${String(index + 1).padStart(3, '0')}`,
      password,
      phoneNumber: `090${String(1000000 + index).padStart(7, '0')}`,
      avatar: `https://i.pravatar.cc/160?img=${(index % 70) + 1}`,
      status: index % 17 === 0 ? 'BLOCKED' : 'ACTIVE',
      roleId: clientRole.id,
      createdById: admin.id,
      createdAt: daysAgo(index % 180),
    })),
  })
  await prisma.userTranslation.createMany({
    data: users.flatMap((user, index) => [
      {
        userId: user.id,
        languageId: 'vi',
        address: `${index + 1} Nguyễn Trãi, Quận ${(index % 12) + 1}, TP. Hồ Chí Minh`,
        description: 'Khách hàng demo có dữ liệu hồ sơ mẫu.',
        createdById: admin.id,
      },
      {
        userId: user.id,
        languageId: 'en',
        address: `${index + 1} Nguyen Trai Street, District ${(index % 12) + 1}, Ho Chi Minh City`,
        description: 'Demo customer with sample profile data.',
        createdById: admin.id,
      },
    ]),
  })

  const productRows = Array.from({ length: 120 }, (_, index) => {
    const number = index + 1
    const variants =
      number % 3 === 0
        ? [
            { value: 'Màu sắc', options: ['Đỏ', 'Xanh', 'Đen'] },
            { value: 'Kích thước', options: ['S', 'M', 'L'] },
          ]
        : number % 3 === 1
          ? [
              { value: 'Màu sắc', options: ['Trắng', 'Xám'] },
              { value: 'Dung tích', options: ['500ml', '750ml', '1000ml', '1500ml'] },
            ]
          : [{ value: 'Phiên bản', options: ['Tiêu chuẩn', 'Cao cấp', 'Pro'] }]
    const isUnpublished = number % 10 === 0
    const isScheduled = number % 10 === 1
    return {
      name: `${PREFIX}Product ${String(number).padStart(3, '0')}`,
      basePrice: 49000 + number * 17500,
      virtualPrice: 65000 + number * 21000,
      brandId: brands[index % brands.length].id,
      images: [IMAGE('product', String(number)), IMAGE('product-alt', String(number))],
      variants,
      publishedAt: isUnpublished ? null : isScheduled ? daysFromNow(7 + (number % 14)) : daysAgo(number % 90),
      createdById: index % 4 === 0 ? admin.id : seller.id,
      updatedById: admin.id,
      createdAt: daysAgo(number % 120),
    }
  })
  const products: any[] = []
  for (const [index, product] of productRows.entries()) {
    products.push(
      await prisma.product.create({
        data: {
          ...product,
          categories: {
            connect: [
              { id: categories[index % categories.length].id },
              { id: categories[(index * 7 + 3) % categories.length].id },
            ],
          },
        },
      }),
    )
  }
  await prisma.productTranslation.createMany({
    data: products.flatMap((product, index) => [
      {
        productId: product.id,
        languageId: 'vi',
        name: `Sản phẩm Demo ${index + 1}`,
        description: 'Sản phẩm mẫu có đầy đủ hình ảnh, biến thể và thông tin bán hàng để frontend hiển thị.',
        createdById: product.createdById,
      },
      {
        productId: product.id,
        languageId: 'en',
        name: `Demo Product ${index + 1}`,
        description: 'Sample product with images, variants and commerce data for the frontend.',
        createdById: product.createdById,
      },
    ]),
  })
  const skuRows = products.flatMap((product, index) =>
    getSkuValues(product.variants as Array<{ options: string[] }>).map((value, skuIndex) => ({
      value,
      price: product.basePrice + skuIndex * 5000,
      stock: skuIndex % 11 === 0 ? 0 : 20 + ((index + skuIndex) % 80),
      image: IMAGE('sku', `${index + 1}-${skuIndex + 1}`),
      productId: product.id,
      createdById: product.createdById,
    })),
  )
  await prisma.sKU.createMany({ data: skuRows })

  const [allSkus, allTranslations] = await Promise.all([
    prisma.sKU.findMany({ where: { productId: { in: products.map((product) => product.id) }, deletedAt: null } }),
    prisma.productTranslation.findMany({
      where: { productId: { in: products.map((product) => product.id) }, deletedAt: null },
    }),
  ])
  const translationsByProduct = new Map<number, typeof allTranslations>()
  for (const translation of allTranslations) {
    const list = translationsByProduct.get(translation.productId) ?? []
    list.push(translation)
    translationsByProduct.set(translation.productId, list)
  }

  const orders: any[] = []
  const orderStatuses = [
    OrderStatus.PENDING_PAYMENT,
    OrderStatus.PENDING_PICKUP,
    OrderStatus.PENDING_DELIVERY,
    OrderStatus.DELIVERED,
    OrderStatus.RETURNED,
    OrderStatus.CANCELLED,
  ]
  for (let index = 0; index < 220; index++) {
    const customer = users[index % users.length]
    const status = orderStatuses[index % orderStatuses.length]
    const selectedSkus = [0, 1 + (index % 5), 2 + (index % 7)]
      .map((offset) => allSkus[(index * 3 + offset) % allSkus.length])
      .filter((sku, skuIndex, list) => sku && list.findIndex((item) => item.productId === sku.productId) === skuIndex)
    const createdAt = daysAgo(index % 150)
    const paymentStatus =
      status === OrderStatus.PENDING_PAYMENT
        ? PaymentStatus.PENDING
        : status === OrderStatus.CANCELLED
          ? PaymentStatus.FAILED
          : PaymentStatus.SUCCESS
    const payment = await prisma.payment.create({ data: { status: paymentStatus, createdAt } })
    orders.push(
      await prisma.order.create({
        data: {
          userId: customer.id,
          status,
          receiver: {
            name: customer.name,
            phone: customer.phoneNumber,
            address: `${index + 1} Nguyễn Huệ, Quận ${(index % 12) + 1}, TP. Hồ Chí Minh`,
          },
          shopId: seller.id,
          paymentId: payment.id,
          createdById: customer.id,
          createdAt,
          products: { connect: selectedSkus.map((sku) => ({ id: sku.productId })) },
          items: {
            create: selectedSkus.map((sku, skuIndex) => ({
              productName: products.find((product) => product.id === sku.productId)!.name,
              skuPrice: sku.price,
              image: sku.image,
              skuValue: sku.value,
              skuId: sku.id,
              productId: sku.productId,
              quantity: 1 + ((index + skuIndex) % 4),
              productTranslations: translationsByProduct.get(sku.productId)!.map((translation) => ({
                id: translation.id,
                name: translation.name,
                description: translation.description,
                languageId: translation.languageId,
              })),
            })),
          },
        },
      }),
    )
  }

  const deliveredOrders = orders.filter((order) => order.status === OrderStatus.DELIVERED)
  const reviewRows = deliveredOrders.flatMap((order, orderIndex) =>
    allSkus
      .filter((sku) => sku.productId && products.some((product) => product.id === sku.productId))
      .filter((sku) => order.id % allSkus.length === sku.id % allSkus.length)
      .slice(0, 1)
      .map((sku) => ({
        content: `Sản phẩm demo dùng rất ổn, đánh giá số ${orderIndex + 1}. Giao hàng nhanh và đóng gói chắc chắn.`,
        rating: 1 + (orderIndex % 5),
        orderId: order.id,
        productId: sku.productId!,
        userId: order.userId,
      })),
  )
  if (reviewRows.length > 0) {
    const reviews = await prisma.review.createManyAndReturn({ data: reviewRows })
    await prisma.reviewMedia.createMany({
      data: reviews.map((review, index) => ({
        reviewId: review.id,
        url: IMAGE('review', String(index + 1)),
        type: index % 8 === 0 ? MediaType.VIDEO : MediaType.IMAGE,
      })),
    })
  }

  await prisma.cartItem.createMany({
    data: Array.from({ length: 140 }, (_, index) => ({
      userId: users[index].id,
      skuId: allSkus[(index * 11) % allSkus.length].id,
      quantity: 1 + (index % 5),
    })),
  })
  await prisma.device.createMany({
    data: users.slice(0, 100).map((user, index) => ({
      userId: user.id,
      userAgent: index % 2 === 0 ? 'Mozilla/5.0 Demo Chrome' : 'Demo Mobile App/1.0',
      ip: `192.168.10.${index + 1}`,
      isActive: index % 9 !== 0,
    })),
  })
  await prisma.message.createMany({
    data: Array.from({ length: 180 }, (_, index) => ({
      fromUserId: users[index % users.length].id,
      toUserId: seller.id,
      content: `${PREFIX}Message ${index + 1}: Xin tư vấn thêm về sản phẩm và thời gian giao hàng.`,
      readAt: index % 4 === 0 ? daysAgo(index % 20) : null,
      createdAt: daysAgo(index % 45),
    })),
  })

  const result = {
    brands: brands.length,
    categories: categories.length,
    users: users.length,
    products: products.length,
    skus: skuRows.length,
    orders: orders.length,
    reviews: reviewRows.length,
    cartItems: 140,
    devices: 100,
    messages: 180,
  }
  const [productCount, orderCount, userCount] = await Promise.all([
    prisma.product.count({ where: { name: { startsWith: PREFIX } } }),
    prisma.order.count({ where: { createdBy: { name: { startsWith: PREFIX } } } }),
    prisma.user.count({ where: { name: { startsWith: PREFIX } } }),
  ])
  if (productCount !== result.products || orderCount !== result.orders || userCount !== result.users) {
    throw new Error(`Seed verification failed: ${JSON.stringify({ productCount, orderCount, userCount })}`)
  }
  console.log(JSON.stringify(result, null, 2))
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
