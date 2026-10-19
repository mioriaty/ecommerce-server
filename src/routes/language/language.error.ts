import { UnprocessableEntityException } from '@nestjs/common';

export const LanguageAlreadyExistException = new UnprocessableEntityException({
  message: 'Error.LanguageError',
  errors: [
    {
      field: 'id',
      message: 'Error.LanguageAlreadyExists'
    }
  ]
});
