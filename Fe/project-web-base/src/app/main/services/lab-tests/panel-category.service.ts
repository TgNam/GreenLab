import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from 'environments/environment';
import { BaseService } from 'app/main/services/base.service';

export interface PanelCategory {
  id?: number;
  code?: string;
  name?: string;
  description?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

@Injectable()
export class PanelCategoryService extends BaseService<PanelCategory> {
  constructor(http: HttpClient, router: Router) {
    super(router, http, environment.apiUrl + '/panel-categories');
  }

  getDataTableRows(
    page?: number,
    size?: number,
    code?: string,
    name?: string,
    isActive?: boolean | null
  ): Promise<PanelCategory[]> {
    const params: any = {};
    if (page) params['page'] = page;
    if (size) params['size'] = size;
    if (code) params['code'] = code;
    if (name) params['name'] = name;
    if (isActive !== null && isActive !== undefined) params['isActive'] = isActive;

    return this.getList(params);
  }

  getPanelCategoryById(id: number): Promise<PanelCategory> {
    return new Promise((resolve, reject) => {
      this.http.get<any>(`${this.basePath}/${id}`).subscribe(
        (res) => resolve(res?.success && res?.data ? res.data : res),
        reject
      );
    });
  }

  createPanelCategory(panelCategory: PanelCategory): Promise<any> {
    return new Promise((resolve, reject) => {
      this.http.post<any>(`${this.basePath}`, panelCategory).subscribe(
        (res) => resolve(res?.success && res?.data ? res.data : res),
        (error) => (error?.error ? resolve(error.error) : reject(error))
      );
    });
  }

  updatePanelCategory(panelCategory: PanelCategory): Promise<any> {
    return new Promise((resolve, reject) => {
      this.http.put<any>(`${this.basePath}/${panelCategory.id}`, panelCategory).subscribe(
        (res) => resolve(res?.success && res?.data ? res.data : res),
        (error) => (error?.error ? resolve(error.error) : reject(error))
      );
    });
  }

  deletePanelCategory(id: number): Promise<any> {
    return new Promise((resolve, reject) => {
      this.http.delete(`${this.basePath}/${id}`).subscribe(
        (res) => resolve(res),
        (error) => (error?.error ? resolve(error.error) : reject(error))
      );
    });
  }
}
