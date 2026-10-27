import { Module } from '@nestjs/common';
import { PermissionService } from './permission.service.js';
import { PermissionController } from './permission.controller.js';
import { PermissionRepository } from 'src/routes/permission/permission.reposiroty.js';

@Module({
  controllers: [PermissionController],
  providers: [PermissionService, PermissionRepository]
})
export class PermissionModule {}
