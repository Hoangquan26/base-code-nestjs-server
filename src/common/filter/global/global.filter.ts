import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    HttpException,
    HttpStatus,
} from '@nestjs/common'
import { Request, Response } from 'express'
import { AppException } from 'src/common/error/app.exception'
import { ErrorCode } from 'src/common/error/error-code.enum'
import { ErrorResponse } from 'src/common/response/error.type'
import { LogProducerService } from 'src/common/logger/log-producer.service'

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
    constructor(private readonly logProducer?: LogProducerService) { }

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp()
        const res = ctx.getResponse<Response>()
        const req = ctx.getRequest<Request>()

        const requestId = (req as any).requestId
        const timestamp = new Date().toISOString()

        let status = HttpStatus.INTERNAL_SERVER_ERROR
        let code = ErrorCode.INTERNAL_ERROR
        let message = 'Internal server error'

        if (exception instanceof AppException) {
            status = exception.getStatus()
            code = exception.code
            message = exception.message
        } else if (exception instanceof HttpException) {
            status = exception.getStatus()
            message =
                (exception.getResponse() as any)?.message ||
                exception.message

            code =
                status === 401
                    ? ErrorCode.UNAUTHORIZED
                    : status === 403
                        ? ErrorCode.FORBIDDEN
                        : status === 404
                            ? ErrorCode.NOT_FOUND
                            : ErrorCode.VALIDATION_ERROR
        }

        if (this.logProducer) {
            const trace =
                exception instanceof Error ? exception.stack : undefined
            void this.logProducer.error(
                message,
                {
                    status,
                    code,
                    requestId,
                    method: req.method,
                    path: req.originalUrl ?? req.url,
                },
                trace,
                GlobalExceptionFilter.name,
            )
        } else {
            console.error('[ERROR]: ', exception, message)
        }

        const response: ErrorResponse = {
            success: false,
            code,
            message,
            meta: {
                requestId,
                timestamp,
            },
        }

        res.status(status).json(response)
    }
}
