import { ForbiddenException, UnprocessableEntityException } from '@nestjs/common';

export const RoleAlreadyExistsException = new UnprocessableEntityException({
  message: 'Error.InvalidRole',
  errors: [
    {
      message: 'Error.RoleAlreadyExists',
      field: 'name'
    }
  ]
});

export const ProhibitedActionOnBaseRoleException = new ForbiddenException('Error.ProhibitedActionOnBaseRole');
