import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from 'environments/environment';
import { BaseService } from 'app/main/services/base.service';

export interface Test {
  id?: number;
  code?: string;
  name?: string;
  shortName?: string;
  description?: string;
  testCategoryId?: number;
  testCategoryName?: string;
  specimenTypeId?: number;
  specimenTypeName?: string;
  unitId?: number;
  unitName?: string;
  price?: number;
  normalRange?: string;
  method?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

@Injectable()
export class TestService extends BaseService<Test> {
  constructor(http: HttpClient, router: Router) {
    super(router, http, environment.apiUrl + '/tests');
  }

  getDataTableRows(
    page?: number,
    size?: number,
    code?: string,
    name?: string,
    testCategoryId?: number | null,
    specimenTypeId?: number | null,
    isActive?: boolean | null
  ): Promise<Test[]> {
    const params: any = {};
    if (page) params['page'] = page;
    if (size) params['size'] = size;
    if (code) params['code'] = code;
    if (name) params['name'] = name;
    if (testCategoryId) params['testCategoryId'] = testCategoryId;
    if (specimenTypeId) params['specimenTypeId'] = specimenTypeId;
    if (isActive !== null && isActive !== undefined) params['isActive'] = isActive;

    return this.getList(params);
  }

  getTestById(id: number): Promise<Test> {
    return new Promise((resolve, reject) => {
      this.http.get<any>(`${this.basePath}/${id}`).subscribe(
        (res) => resolve(res?.success && res?.data ? res.data : res),
        reject
      );
    });
  }

  createTest(test: Test): Promise<any> {
    return new Promise((resolve, reject) => {
      this.http.post<any>(`${this.basePath}`, test).subscribe(
        (res) => resolve(res?.success && res?.data ? res.data : res),
        (error) => (error?.error ? resolve(error.error) : reject(error))
      );
    });
  }

  updateTest(test: Test): Promise<any> {
    return new Promise((resolve, reject) => {
      this.http.put<any>(`${this.basePath}/${test.id}`, test).subscribe(
        (res) => resolve(res?.success && res?.data ? res.data : res),
        (error) => (error?.error ? resolve(error.error) : reject(error))
      );
    });
  }

  deleteTest(id: number): Promise<any> {
    return new Promise((resolve, reject) => {
      this.http.delete(`${this.basePath}/${id}`).subscribe(
        (res) => resolve(res),
        (error) => (error?.error ? resolve(error.error) : reject(error))
      );
    });
  }
}
