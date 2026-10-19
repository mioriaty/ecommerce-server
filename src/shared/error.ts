import { ConflictException, NotFoundException, UnprocessableEntityException } from '@nestjs/common';

export const NotFoundRecordException = new NotFoundException('Error.NotFound');

export const InvalidPasswordException = new UnprocessableEntityException({
  message: 'Error.UnprocessableEntity',
  errors: [
    {
      message: 'Error.InvalidPassword',
      field: 'password'
    }
  ]
});

export const VersionConflictException = new ConflictException('Error.VersionConflict');
