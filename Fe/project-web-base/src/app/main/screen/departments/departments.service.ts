import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, Router, RouterStateSnapshot } from '@angular/router';

import { BehaviorSubject } from 'rxjs';
import { environment } from 'environments/environment';
import { BaseService } from 'app/main/services/base.service';

export interface Department {
  id?: number;
  name: string;
  short_name: string;
  status: number;
  create_time?: number;
  update_time?: number;
  [key: string]: any;
}

@Injectable()
export class DepartmentsService extends BaseService<Department> implements Resolve<any> {
  public departments: any[] = [];
  public onDepartmentListChange: BehaviorSubject<any>;

  constructor(http: HttpClient, router: Router) {
    super(router, http, `${environment.apiUrl}/departments`);
    this.onDepartmentListChange = new BehaviorSubject<any[]>([]);

    this.onListChange.subscribe(rows => {
      this.departments = rows;
      this.onDepartmentListChange.next(rows);
    });
  }

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<any> {
    return Promise.resolve();
  }

  override getList(paramsObj: any = {}, isPush: boolean = false, url: string = ''): Promise<Department[]> {
    return super.getList(paramsObj, isPush, url ? url : `${this.basePath}`);
  }

  private normalizeDateParam(val: string | number | null | undefined): string | undefined {
    if (val == null || val === '') return undefined;
    if (typeof val === 'number') return new Date(val).toISOString().split('T')[0];
    return String(val).trim() || undefined;
  }

  getDataTableRows(
    page?: number,
    size?: number,
    id?: number,
    from_time?: string | number | null,
    to_time?: string | number | null,
    name?: string,
    shortName?: string,
    status?: number | null
  ): Promise<any[]> {
    const trimmedName = name ? name.trim() : name;
    const trimmedShortName = shortName ? shortName.trim() : shortName;

    return this.getList(
      {
        page,
        size,
        id,
        from_time: this.normalizeDateParam(from_time),
        to_time: this.normalizeDateParam(to_time),
        name: trimmedName,
        shortName: trimmedShortName,
        status: status === null || status === undefined ? undefined : status
      },
      false
    );
  }

  getDepartmentById(id: number): Promise<Department> {
    return new Promise((resolve, reject) => {
      this.http.get<any>(`${this.basePath}/${id}`).subscribe((res) => {
        resolve(res?.success && res?.data ? res.data : res);
      }, reject);
    });
  }

  createDepartment(department: Department): any {
    return new Promise((resolve, reject) => {
      this.http.post<any>(`${this.basePath}`, department).subscribe(
        (res) => {
          resolve(res?.success && res?.data ? res.data : res);
        },
        (error: any) => {
          if (error?.error) {
            resolve(error.error);
          } else {
            reject(error);
          }
        }
      );
    });
  }

  updateDepartment(department: Department): any {
    return new Promise((resolve, reject) => {
      this.http.put<any>(`${this.basePath}/${department.id}`, department).subscribe(
        (res) => {
          resolve(res?.success && res?.data ? res.data : res);
        },
        (error: any) => {
          if (error?.error) {
            resolve(error.error);
          } else {
            reject(error);
          }
        }
      );
    });
  }

  deleteDepartment(id: number): any {
    return new Promise((resolve, reject) => {
      this.http.delete(`${this.basePath}/${id}`).subscribe(
        (response) => {
          resolve(response);
        },
        (error: any) => {
          if (error?.error) {
            resolve(error.error);
          } else {
            reject(error);
          }
        }
      );
    });
  }
}
