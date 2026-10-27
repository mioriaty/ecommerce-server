import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { PermissionService } from './permission.service.js';
import { ZodResponse } from 'nestjs-zod';
import {
  CreatePermissionBodyDTO,
  GetPermissionDetailResponseDTO,
  GetPermissionParamsDTO,
  GetPermissionsQueryDTO,
  GetPermissionsResponseDTO,
  UpdatePermissionBodyDTO
} from 'src/routes/permission/permission.dto.js';
import { ActiveUser } from 'src/shared/decorators/active-user.decorator.js';
import { MessageResDTO } from 'src/shared/dtos/response.dto.js';

@Controller('permission')
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

  @Get()
  @ZodResponse({ type: GetPermissionsResponseDTO })
  list(@Query() query: GetPermissionsQueryDTO) {
    return this.permissionService.list(query);
  }

  @Get(':permissionId')
  @ZodResponse({ type: GetPermissionDetailResponseDTO })
  findById(@Param() params: GetPermissionParamsDTO) {
    return this.permissionService.findById(params.permissionId);
  }

  @Post()
  @ZodResponse({ type: GetPermissionDetailResponseDTO })
  create(@Body() body: CreatePermissionBodyDTO, @ActiveUser('userId') userId: number) {
    return this.permissionService.create({
      data: body,
      createdById: userId
    });
  }

  @Put(':permissionId')
  @ZodResponse({ type: GetPermissionDetailResponseDTO })
  update(
    @Body() body: UpdatePermissionBodyDTO,
    @Param() params: GetPermissionParamsDTO,
    @ActiveUser('userId') userId: number
  ) {
    return this.permissionService.update({
      data: body,
      id: params.permissionId,
      updatedById: userId
    });
  }

  @Delete(':permissionId')
  @ZodResponse({ type: MessageResDTO })
  delete(@Param() params: GetPermissionParamsDTO, @ActiveUser('userId') userId: number) {
    return this.permissionService.delete({
      id: params.permissionId,
      deletedById: userId
    });
  }
}
