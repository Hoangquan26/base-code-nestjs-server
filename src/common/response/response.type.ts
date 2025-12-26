export type ResponseMeta = {
    requestId?: string
    traceId?: string
    timestamp: string
}

export type SuccessResponse<T> = {
    success: true
    data: T
    meta: ResponseMeta
}
