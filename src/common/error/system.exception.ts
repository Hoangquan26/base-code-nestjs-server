import { HttpStatus } from '@nestjs/common'
import { AppException } from './app.exception'
import { ErrorCode } from './error-code.enum'

export class SystemException extends AppException {
  constructor(
    message = 'Internal server error'
  ) {
    super(
      ErrorCode.INTERNAL_ERROR,
      message,
      HttpStatus.INTERNAL_SERVER_ERROR
    )
  }
}
