import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Observable, map } from 'rxjs'
import { Request } from 'express'
import { SKIP_RESPONSE_TRANSFORM } from 'src/common/decorator/skip-response-transform/skip-response-transform.decorator'
import { SuccessResponse } from 'src/common/response/response.type'


export interface WithMeta<T = any> {
    payload: T
    meta?: Record<string, any>
}

function isWithMeta(data: any): data is WithMeta {
    return (
        data &&
        typeof data === 'object' &&
        'payload' in data &&
        Object.keys(data).length <= 2
    )
}

@Injectable()
export class ResponseTransformInterceptor
    implements NestInterceptor {
    constructor(private readonly reflector: Reflector) { }

    intercept(
        context: ExecutionContext,
        next: CallHandler
    ): Observable<any> {
        const skip = this.reflector.get<boolean>(
            SKIP_RESPONSE_TRANSFORM,
            context.getHandler()
        )

        if (skip) {
            return next.handle()
        }

        const httpCtx = context.switchToHttp()
        const req = httpCtx.getRequest<Request>()

        return next.handle().pipe(
            map((data): SuccessResponse<any> => {
                if (isWithMeta(data)) {
                    return {
                        success: true,
                        data: data.payload,
                        meta: {
                            requestId: (req as any).requestId,
                            timestamp: new Date().toISOString(),
                            ...(data.meta ?? {}),
                        },
                    }
                }

                return {
                    success: true,
                    data,
                    meta: {
                        requestId: (req as any).requestId,
                        timestamp: new Date().toISOString(),
                    },
                }
            })

        )
    }
}
