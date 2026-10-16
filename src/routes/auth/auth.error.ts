import { ForbiddenException, UnauthorizedException, UnprocessableEntityException } from '@nestjs/common';

export const InvalidOTPException = new UnprocessableEntityException({
  message: 'Error.OTPFailure',
  errors: [
    {
      field: 'code',
      message: 'Error.InvalidOTP'
    }
  ]
});

export const OTPExpiredException = new UnprocessableEntityException({
  message: 'Error.OTPFailure',
  errors: [
    {
      field: 'code',
      message: 'Error.ExpiredOTP'
    }
  ]
});

export const FailedToSendOTPException = new UnprocessableEntityException({
  message: 'Error.OTPFailure',
  errors: [
    {
      field: 'code',
      message: 'Error.FailedToSendOTP'
    }
  ]
});

// Login
export const PasswordIncorrectException = new UnprocessableEntityException({
  message: 'Error.UserFailure',
  errors: [
    {
      field: 'password',
      message: 'Error.PasswordIncorrect'
    }
  ]
});

// Email related errors

export const EmailAlreadyExistException = new UnprocessableEntityException({
  message: 'Error.UserFailure',
  errors: [
    {
      field: 'email',
      message: 'Error.EmailAlreadyExist'
    }
  ]
});

export const EmailNotFoundException = new UnprocessableEntityException({
  message: 'Error.UserFailure',
  errors: [
    {
      field: 'email',
      message: 'Error.EmailNotFound'
    }
  ]
});

// Auth token related errors
export const RefreshTokenAlreadyUsedException = new UnauthorizedException('Error.RefreshTokenAlreadyUsed');
export const UnauthorizedAccessException = new UnauthorizedException('Error.UnauthorizedAccess');
export const AccountBlockedException = new ForbiddenException('Error.AccountBlocked');

// Google auth related errors
export const GoogleUserInfoError = new Error('Error.FailedToGetGoogleUserInfo');

export const InvalidTOTPException = new UnprocessableEntityException({
  message: 'Error.TOTPFailure',
  errors: [
    {
      field: 'totpCode',
      message: 'Error.InvalidTOTP'
    }
  ]
});

export const TOTPAlreadyEnabledException = new UnprocessableEntityException({
  message: 'Error.TOTPFailure',
  errors: [
    {
      field: 'totpCode',
      message: 'Error.TOTPAlreadyEnabled'
    }
  ]
});

export const TOTPNotEnabledException = new UnprocessableEntityException({
  message: 'Error.TOTPFailure',
  errors: [
    {
      message: 'Error.TOTPNotEnabled',
      field: 'totpCode'
    }
  ]
});

export const InvalidTOTPAndCodeException = new UnprocessableEntityException({
  message: 'Error.TOTPFailure',
  errors: [
    {
      message: 'Error.InvalidTOTPAndCode',
      field: 'totpCode'
    },
    {
      message: 'Error.InvalidTOTPAndCode',
      field: 'code'
    }
  ]
});
