import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from 'environments/environment';
import { BaseService } from 'app/main/services/base.service';

export interface DiscountType {
  id?: number;
  code?: string;
  name?: string;
  calculationMethod?: 'PERCENTAGE' | 'FIXED';
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

@Injectable()
export class DiscountTypeService extends BaseService<DiscountType> {
  constructor(http: HttpClient, router: Router) {
    super(router, http, environment.apiUrl + '/discount-types');
  }

  getDataTableRows(
    page?: number,
    size?: number,
    code?: string,
    name?: string,
    isActive?: boolean | null
  ): Promise<DiscountType[]> {
    const params: any = {};
    if (page) params['page'] = page;
    if (size) params['size'] = size;
    if (code) params['code'] = code;
    if (name) params['name'] = name;
    if (isActive !== null && isActive !== undefined) params['isActive'] = isActive;

    return this.getList(params);
  }

  getDiscountTypeById(id: number): Promise<DiscountType> {
    return new Promise((resolve, reject) => {
      this.http.get<any>(`${this.basePath}/${id}`).subscribe(
        (res) => resolve(res?.success && res?.data ? res.data : res),
        reject
      );
    });
  }

  createDiscountType(discountType: DiscountType): Promise<any> {
    return new Promise((resolve, reject) => {
      this.http.post<any>(`${this.basePath}`, discountType).subscribe(
        (res) => resolve(res?.success && res?.data ? res.data : res),
        (error) => (error?.error ? resolve(error.error) : reject(error))
      );
    });
  }

  updateDiscountType(discountType: DiscountType): Promise<any> {
    return new Promise((resolve, reject) => {
      this.http.put<any>(`${this.basePath}/${discountType.id}`, discountType).subscribe(
        (res) => resolve(res?.success && res?.data ? res.data : res),
        (error) => (error?.error ? resolve(error.error) : reject(error))
      );
    });
  }

  deleteDiscountType(id: number): Promise<any> {
    return new Promise((resolve, reject) => {
      this.http.delete(`${this.basePath}/${id}`).subscribe(
        (res) => resolve(res),
        (error) => (error?.error ? resolve(error.error) : reject(error))
      );
    });
  }
}
