import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class MenuEventService {
  // Subject phát sự kiện reload menu
  private reloadMenuSource = new Subject<void>();

  // Observable để component khác subscribe
  reloadMenu$ = this.reloadMenuSource.asObservable();

  // Hàm để phát sự kiện
  emitReloadMenu() {
    this.reloadMenuSource.next();
  }
}
