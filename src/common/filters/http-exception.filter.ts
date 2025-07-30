import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

interface ExceptionResponse {
  message?: string | string[];
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      const responseMessage =
        typeof exceptionResponse === 'string'
          ? exceptionResponse
          : (exceptionResponse as ExceptionResponse).message;

      message = Array.isArray(responseMessage)
        ? responseMessage.join(', ')
        : responseMessage || exception.message;
    }

    response.status(status).json({
      code: status,
      message,
      data: null,
      timestamp: Date.now(),
    });
  }
}
