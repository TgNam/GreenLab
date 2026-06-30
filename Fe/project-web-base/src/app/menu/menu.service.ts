import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot } from '@angular/router';

import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from 'environments/environment';


@Injectable({
  providedIn: 'root'
})
export class MenuService implements Resolve<any> {
  private basePath = `${environment.apiUrl}/common`;

  constructor(private _httpClient: HttpClient) {
  }

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<any> | Promise<any> | any {
    return Promise.resolve();
  }


  getRolesForAdmin(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this._httpClient.get(this.basePath + '/roles').subscribe((response: any[]) => {
        resolve(response);
      }, reject);
    });
  }

  // getLocations(): Promise<any[]> {
  //   return new Promise((resolve, reject) => {
  //     this._httpClient.get(this.basePath + '/locations').subscribe((response: any[]) => {
  //       resolve(response);
  //     }, reject);
  //   });
  // }

  findPermissionsForAdmin(searchText): Promise<any> {
    return new Promise((resolve, reject) => {
      this._httpClient.get(this.basePath + '/permissions?searchText=' + encodeURIComponent(searchText.toString().trim())).subscribe((response: any[]) => {
        resolve(response);
      }, reject);
    });
  }
}


