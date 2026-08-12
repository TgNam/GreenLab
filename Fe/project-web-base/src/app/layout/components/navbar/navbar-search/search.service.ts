import { Injectable } from '@angular/core';

import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  // Public
  public search = '';
  public onIsBookmarkOpenChange: BehaviorSubject<any>;

  constructor() {
    this.onIsBookmarkOpenChange = new BehaviorSubject(false);
  }
}
