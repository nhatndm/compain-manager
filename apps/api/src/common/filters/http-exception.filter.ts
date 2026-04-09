import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common'
import { ApiErrorSchema } from '@repo/schemas'
import { Request, Response } from 'express'

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<Request>()

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR

    let message: string
    let error: string | undefined

    if (exception instanceof HttpException) {
      const res = exception.getResponse()
      if (typeof res === 'string') {
        message = res
      } else if (typeof res === 'object' && res !== null) {
        const body = res as Record<string, unknown>
        message = Array.isArray(body['message'])
          ? (body['message'] as string[]).join(', ')
          : String(body['message'] ?? exception.message)
        error = body['error'] as string | undefined
      } else {
        message = exception.message
      }
    } else {
      message = 'Internal server error'
    }

    const body = ApiErrorSchema.parse({
      statusCode: status,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
    })

    response.status(status).json(body)
  }
}
