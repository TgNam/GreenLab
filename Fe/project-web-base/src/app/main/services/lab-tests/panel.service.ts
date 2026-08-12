import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from 'environments/environment';
import { BaseService } from 'app/main/services/base.service';

export interface Panel {
  id?: number;
  code?: string;
  name?: string;
  shortDescription?: string;
  panelCategoryId?: number;
  panelCategoryName?: string;
  discountTypeId?: number;
  discountTypeName?: string;
  originalPrice?: number;
  sellingPrice?: number;
  discountAmount?: number;
  discountValue?: number;
  testCount?: number;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

@Injectable()
export class PanelService extends BaseService<Panel> {
  constructor(http: HttpClient, router: Router) {
    super(router, http, environment.apiUrl + '/panels');
  }

  getDataTableRows(
    page?: number,
    size?: number,
    code?: string,
    name?: string,
    panelCategoryId?: number | null
  ): Promise<Panel[]> {
    const params: any = {};
    if (page) params['page'] = page;
    if (size) params['size'] = size;
    if (code) params['code'] = code;
    if (name) params['name'] = name;
    if (panelCategoryId) params['panelCategoryId'] = panelCategoryId;

    return this.getList(params);
  }

  getPanelById(id: number): Promise<Panel> {
    return new Promise((resolve, reject) => {
      this.http.get<any>(`${this.basePath}/${id}`).subscribe(
        (res) => resolve(res?.success && res?.data ? res.data : res),
        reject
      );
    });
  }

  createPanel(panel: Panel): Promise<any> {
    return new Promise((resolve, reject) => {
      this.http.post<any>(`${this.basePath}`, panel).subscribe(
        (res) => resolve(res?.success && res?.data ? res.data : res),
        (error) => (error?.error ? resolve(error.error) : reject(error))
      );
    });
  }

  updatePanel(panel: Panel): Promise<any> {
    return new Promise((resolve, reject) => {
      this.http.put<any>(`${this.basePath}/${panel.id}`, panel).subscribe(
        (res) => resolve(res?.success && res?.data ? res.data : res),
        (error) => (error?.error ? resolve(error.error) : reject(error))
      );
    });
  }

  deletePanel(id: number): Promise<any> {
    return new Promise((resolve, reject) => {
      this.http.delete(`${this.basePath}/${id}`).subscribe(
        (res) => resolve(res),
        (error) => (error?.error ? resolve(error.error) : reject(error))
      );
    });
  }
}
