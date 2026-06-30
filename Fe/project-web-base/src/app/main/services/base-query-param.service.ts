import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class BaseQueryParamService {

  constructor() {}

  /** 
   * Subscribe queryParams một lần, sau đó chạy callback.
   * Callback có dạng async tùy component cần.
   */
  handleOnce(
    activatedRoute: ActivatedRoute,
    callback: (params: any) => void | Promise<void>
  ) {
    activatedRoute.queryParams.pipe(take(1)).subscribe(async (params) => {
      await callback(params);
    });
  }
}