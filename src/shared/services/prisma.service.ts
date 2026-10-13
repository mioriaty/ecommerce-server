import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client.js';
import envConfig from '../config.js';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    const adapter = new PrismaPg({
      connectionString: envConfig.DATABASE_URL
    });
    super({ adapter, log: ['info', 'warn', 'error'] });
  }

  async onModuleInit() {
    this.$connect();
  }
}
