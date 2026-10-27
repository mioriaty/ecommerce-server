import { UnprocessableEntityException } from '@nestjs/common';

export const PermissionAlreadyExistsException = new UnprocessableEntityException({
  message: '',
  errors: [
    {
      message: 'Error.PermissionAlreadyExists',
      field: 'path'
    },
    {
      message: 'Error.PermissionAlreadyExists',
      field: 'method'
    }
  ]
});
