import { ErrorHandler, Injectable } from '@angular/core';

@Injectable()
export class ChunkErrorHandler implements ErrorHandler {
  handleError(error: any): void {
    if (error?.message?.includes('ChunkLoadError')) {
      console.warn('⚠️ ChunkLoadError → reload app');
      window.location.reload();
    } else {
      console.error(error);
    }
  }
}