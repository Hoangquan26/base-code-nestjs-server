import { HttpException, HttpStatus } from '@nestjs/common'
import { ErrorCode } from './error-code.enum'

export class AppException extends HttpException {
    readonly code: ErrorCode

    constructor(
        code: ErrorCode,
        message: string,
        status: HttpStatus
    ) {
        super(message, status)
        this.code = code
    }
}
