import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { RolesService } from './roles.service.js';
import { ZodResponse } from 'nestjs-zod';
import {
  CreateRoleBodyDTO,
  CreateRoleResponseDTO,
  GetRoleDetailResponseDTO,
  GetRoleParamsDTO,
  GetRolesQueryDTO,
  GetRolesResponseDTO,
  UpdateRoleBodyDTO
} from 'src/routes/roles/roles.dto.js';
import { ActiveUser } from 'src/shared/decorators/active-user.decorator.js';
import { MessageResDTO } from 'src/shared/dtos/response.dto.js';

@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @ZodResponse({ type: GetRolesResponseDTO })
  list(@Query() query: GetRolesQueryDTO) {
    return this.rolesService.list({
      limit: query.limit,
      page: query.page
    });
  }

  @Get(':roleId')
  @ZodResponse({ type: GetRoleDetailResponseDTO })
  findById(@Param() params: GetRoleParamsDTO) {
    return this.rolesService.findById(params.roleId);
  }

  @Post()
  @ZodResponse({ type: CreateRoleResponseDTO })
  create(@Body() body: CreateRoleBodyDTO, @ActiveUser('userId') userId: number) {
    return this.rolesService.create({ body, createdById: userId });
  }

  @Put(':roleId')
  @ZodResponse({ type: GetRoleDetailResponseDTO })
  update(@Body() body: UpdateRoleBodyDTO, @Param() param: GetRoleParamsDTO, @ActiveUser('userId') userId: number) {
    return this.rolesService.update({
      id: param.roleId,
      body,
      updatedById: userId
    });
  }

  @Delete(':roleId')
  @ZodResponse({ type: MessageResDTO })
  delete(@Param() params: GetRoleParamsDTO, @ActiveUser('userId') userId: number) {
    return this.rolesService.delete({
      id: params.roleId,
      deletedById: userId
    });
  }
}
