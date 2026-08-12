// src/app/core/services/loading.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class LoadingService {
  private loadingCount = 0;
  public isLoading$ = new BehaviorSubject<boolean>(false);

  show(): void {
    this.loadingCount++;
    this.isLoading$.next(true);
  }

  hide(): void {
    this.loadingCount--;
    if (this.loadingCount <= 0) {
      this.loadingCount = 0;
      this.isLoading$.next(false);
    }
  }
}
