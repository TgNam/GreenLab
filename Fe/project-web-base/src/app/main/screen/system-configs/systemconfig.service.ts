import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot } from '@angular/router';

import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from 'environments/environment';

export interface SystemConfig {
  id: number;
  name: string;
  value: string;
  key: string;
  note: string;
  active: boolean;
  create_time: number;
  created_by: string;
  update_time: number;
  updated_by: string;
}

export interface Response<T> {
  success: boolean;
  code: string;
  message: string;
  data: T;
}

@Injectable()
export class SystemConfigService implements Resolve<any> {
  public rows: any;
  public onSystemConfigListChange: BehaviorSubject<any[]>;
  public totalCount: number;
  private basePath = `${environment.apiUrl}/config/system-configs`;
  public totalPage: Number;
  constructor(private _httpClient: HttpClient) {
    this.onSystemConfigListChange = new BehaviorSubject<any[]>([]);
  }

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<any> | Promise<any> | any {
    return Promise.resolve();
  }

  buildParams(page?: number, size?: number, id?: number, timeFrom?: string | null, timeTo?: string | null, name?: string, value?: string, key?: string, typeSort?: string, isActive?: boolean, timeType?: number) {
    const params: any = {};
    if (page != null) params.page = page;
    if (size != null) params.size = size;
    if (name) params.name = name;
    if (value) params.value = value;
    if (key) params.key = key;
    if (typeSort) params.typeSort = typeSort;
    if (id) params.id = id;
    if (timeFrom != null && timeFrom !== undefined && timeFrom !== '') params.timeFrom = String(timeFrom);
    if (timeTo != null && timeTo !== undefined && timeTo !== '') params.timeTo = String(timeTo);
    if (isActive != null) params.isActive = isActive;
    if (timeType != null && timeType !== undefined) params.timeType = Number(timeType);

    const query = Object.keys(params)
      .map(key => `${key}=${encodeURIComponent(params[key])}`)
      .join('&');

    return query ? `?${query}` : '';
  }

  getDataTableRows(page?: number, size?: number, id?: number, timeFrom?: string | null, timeTo?: string | null, name?: string, value?: string, key?: string, typeSort?: string, isActive?: boolean, timeType?: number): Promise<any[]> {
    const params = this.buildParams(page, size, id, timeFrom, timeTo, name, value, key, typeSort, isActive, timeType);
    return new Promise((resolve, reject) => {
      this._httpClient.get(`${this.basePath}/list${params}`).subscribe((response: any) => {
        // Xử lý cấu trúc response mới: data nằm trong response.data
        const data = response?.data || response;
        const total = data?.totalElements;
        this.totalPage = data?.totalPages || 0;
        this.totalCount = total ? parseInt(String(total), 10) : 0;
        this.rows = Array.isArray(data?.content) ? data.content : [];
        this.onSystemConfigListChange.next(this.rows);
        resolve(this.rows);
      }, reject);
    });
  }


  create(systemconfig: SystemConfig): Promise<SystemConfig> {
    return new Promise((resolve, reject) => {
      this._httpClient.post<Response<SystemConfig>>(`${this.basePath}/create`, systemconfig).subscribe({
        next: (response: Response<SystemConfig>) => {
          if (response.success && response.data) {
            resolve(response.data);
          } else {
            reject(new Error(response.message || 'Tạo cấu hình thất bại'));
          }
        },
        error: (err) => reject(err)
      });
    });
  }

  // Lấy danh sách SystemConfigKey chưa tạo 
  getUnusedKeyList(): Observable<any[]> {
    return this._httpClient.get<Response<any[]>>(`${this.basePath}/keys/unused`).pipe(
      map((response: Response<any[]>) => {
        return response.success && response.data ? response.data : [];
      })
    );
  }

  updateSystemConfig(systemconfig: SystemConfig): Promise<SystemConfig> {
    return new Promise((resolve, reject) => {
      this._httpClient.put<Response<SystemConfig>>(`${this.basePath}/update/${systemconfig.key}`, systemconfig).subscribe({
        next: (response: Response<SystemConfig>) => {
          if (response.success && response.data) {
            resolve(response.data);
          } else {
            reject(new Error(response.message || 'Cập nhật cấu hình thất bại'));
          }
        },
        error: (err) => reject(err)
      });
    });
  }

  delete(key: String): Promise<void> {
    return new Promise((resolve, reject) => {
      this._httpClient.delete<Response<any>>(`${this.basePath}/delete/${key}`).subscribe({
        next: (response: Response<any>) => {
          if (response.success) {
            resolve();
          } else {
            reject(new Error(response.message || 'Xóa cấu hình thất bại'));
          }
        },
        error: (err) => reject(err)
      });
    });
  }

  getSystemConfigKeys(): Observable<any[]>  {
    return this._httpClient.get<Response<any[]>>(`${this.basePath}/keys`).pipe(
      map((response: Response<any[]>) => {
        return response.success && response.data ? response.data : [];
      })
    );
  }
}


