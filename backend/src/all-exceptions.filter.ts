import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = 400; // Bad request
    let message = 'La demande est invalide';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      // Si ce n'est pas une exception explicite, et que la route n'existe pas, retournez un 404
      if (status === 500) {
        status = 404;
        message = 'La route demandée n’existe pas';
      } else {
        message = exception.message;
      }
    }
    
    response
      .status(status)
      .json({
        statusCode: status,
        message,
        timestamp: new Date().toISOString(),
        path: request.url,
      });
  }
}
