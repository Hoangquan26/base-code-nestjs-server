import { HttpStatus } from '@nestjs/common'
import { AppException } from './app.exception'
import { ErrorCode } from './error-code.enum'

export class BusinessException extends AppException {
  constructor(
    code: ErrorCode,
    message: string,
    status: HttpStatus = HttpStatus.BAD_REQUEST
  ) {
    super(code, message, status)
  }
}
