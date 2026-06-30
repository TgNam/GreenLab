import { Injectable } from '@angular/core';
import { MediaChange, MediaObserver } from '@angular/flex-layout';

import { BehaviorSubject } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class CoreMediaService {
  currentMediaQuery: string;
  onMediaUpdate: BehaviorSubject<string> = new BehaviorSubject<string>('');

  /**
   * Constructor
   *
   * @param {MediaObserver} _mediaObserver
   */
  constructor(private _mediaObserver: MediaObserver) {
    // Set the defaults
    this.currentMediaQuery = '';

    // Initialize
    this._init();
  }

  // @ Private methods
  // -----------------------------------------------------------------------------------------------------

  /**
   * Initialize
   *
   * @private
   */
  private _init(): void {
    this._mediaObserver
      .asObservable()
      .pipe(
        debounceTime(500),
        map((changes: MediaChange[]) => (changes.length ? changes[0] : null)),
        filter((change): change is MediaChange => change != null),
        distinctUntilChanged((a, b) => a.mqAlias === b.mqAlias)
      )
      .subscribe((change: MediaChange) => {
        if (this.currentMediaQuery !== change.mqAlias) {
          this.currentMediaQuery = change.mqAlias;
          this.onMediaUpdate.next(change.mqAlias);
        }
      });
  }
}
