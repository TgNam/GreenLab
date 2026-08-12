import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from 'environments/environment';
import { BaseService } from 'app/main/services/base.service';

export interface Unit {
  id?: number;
  code?: string;
  name?: string;
  symbol?: string;
  isActive?: boolean;
  createdAt?: string;
  [key: string]: any;
}

@Injectable()
export class UnitService extends BaseService<Unit> {
  constructor(http: HttpClient, router: Router) {
    super(router, http, environment.apiUrl + '/units');
  }

  getDataTableRows(
    page?: number,
    size?: number,
    code?: string,
    name?: string,
    isActive?: boolean | null
  ): Promise<Unit[]> {
    const params: any = {};
    if (page) params['page'] = page;
    if (size) params['size'] = size;
    if (code) params['code'] = code;
    if (name) params['name'] = name;
    if (isActive !== null && isActive !== undefined) params['isActive'] = isActive;

    return this.getList(params);
  }

  getUnitById(id: number): Promise<Unit> {
    return new Promise((resolve, reject) => {
      this.http.get<any>(`${this.basePath}/${id}`).subscribe(
        (res) => resolve(res?.success && res?.data ? res.data : res),
        reject
      );
    });
  }

  createUnit(unit: Unit): Promise<any> {
    return new Promise((resolve, reject) => {
      this.http.post<any>(`${this.basePath}`, unit).subscribe(
        (res) => resolve(res?.success && res?.data ? res.data : res),
        (error) => (error?.error ? resolve(error.error) : reject(error))
      );
    });
  }

  updateUnit(unit: Unit): Promise<any> {
    return new Promise((resolve, reject) => {
      this.http.put<any>(`${this.basePath}/${unit.id}`, unit).subscribe(
        (res) => resolve(res?.success && res?.data ? res.data : res),
        (error) => (error?.error ? resolve(error.error) : reject(error))
      );
    });
  }

  deleteUnit(id: number): Promise<any> {
    return new Promise((resolve, reject) => {
      this.http.delete(`${this.basePath}/${id}`).subscribe(
        (res) => resolve(res),
        (error) => (error?.error ? resolve(error.error) : reject(error))
      );
    });
  }
}
