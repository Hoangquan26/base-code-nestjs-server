export type ErrorResponse = {
    success: false
    code: string
    message: string
    meta: {
        requestId?: string
        timestamp: string
    }
}
