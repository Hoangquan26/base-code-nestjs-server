import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    HttpException,
    HttpStatus,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Request, Response } from 'express'
import { AppException } from 'src/common/error/app.exception'
import { ErrorCode } from 'src/common/error/error-code.enum'
import { ErrorResponse } from 'src/common/response/error.type'
import { LogProducerService } from 'src/common/logger/log-producer.service'

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
    constructor(
        private readonly logProducer?: LogProducerService,
        private readonly configService?: ConfigService,
    ) { }

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp()
        const res = ctx.getResponse<Response>()
        const req = ctx.getRequest<Request>()

        const requestId = (req as any).requestId
        const traceId = (req as any).traceId ?? requestId
        const timestamp = new Date().toISOString()

        let status = HttpStatus.INTERNAL_SERVER_ERROR
        let code = ErrorCode.INTERNAL_ERROR
        let message = 'Internal server error'
        let logMessage = message

        if (exception instanceof AppException) {
            status = exception.getStatus()
            code = exception.code
            message = exception.message
            logMessage = message
        } else if (exception instanceof HttpException) {
            status = exception.getStatus()
            logMessage = this.getHttpMessage(exception)
            message = this.sanitizeMessage(status, logMessage)

            code = this.mapHttpStatusToCode(status, logMessage)
        }

        if (this.logProducer) {
            const trace =
                exception instanceof Error ? exception.stack : undefined
            void this.logProducer.error(
                logMessage,
                {
                    status,
                    code,
                    requestId,
                    traceId,
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
                traceId,
                timestamp,
            },
        }

        res.status(status).json(response)
    }

    private getHttpMessage(exception: HttpException) {
        const response = exception.getResponse() as any
        if (typeof response === 'string') {
            return response
        }
        const msg = response?.message
        if (Array.isArray(msg)) {
            return msg.join(', ')
        }
        if (typeof msg === 'string') {
            return msg
        }
        return exception.message
    }

    private mapHttpStatusToCode(status: number, message: string) {
        if (status === HttpStatus.BAD_REQUEST) {
            return ErrorCode.VALIDATION_ERROR
        }
        if (status === HttpStatus.UNAUTHORIZED) {
            if (message?.toLowerCase().includes('jwt expired')) {
                return ErrorCode.AUTH_TOKEN_EXPIRED
            }
            return ErrorCode.UNAUTHORIZED
        }
        if (status === HttpStatus.FORBIDDEN) {
            return ErrorCode.FORBIDDEN
        }
        if (status === HttpStatus.NOT_FOUND) {
            return ErrorCode.NOT_FOUND
        }
        if (status === HttpStatus.TOO_MANY_REQUESTS) {
            return ErrorCode.RATE_LIMITED
        }
        if (status >= 500) {
            return ErrorCode.INTERNAL_ERROR
        }
        return ErrorCode.VALIDATION_ERROR
    }

    private sanitizeMessage(status: number, message: string) {
        const env = this.configService?.get<string>('app.env') ?? 'development'
        if (env === 'production' && status >= 500) {
            return 'Internal server error'
        }
        return message || 'Internal server error'
    }
}
