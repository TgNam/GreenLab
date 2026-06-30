import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, Router, RouterStateSnapshot } from '@angular/router';

import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from 'environments/environment';
import { id } from '@swimlane/ngx-datatable';
import { BaseService } from 'app/main/services/base.service';

export interface Administrator {
  id: number;
  user_name: string;
  email: string;
  phone: string;
  full_name: string;
  position: string;
  status: number;
  department_id: string,
  roles: any[]
}

@Injectable()
export class AdministratorService extends BaseService<Administrator> {
  public rows: any;
  public onListChange: BehaviorSubject<any>;
  public totalCount = 0;
  public totalPage = 0;
  private rolePath = `${environment.apiUrl}/roles`;

  constructor(http: HttpClient, router: Router) {
    super(router, http, `${environment.apiUrl}/administrators`);
  }

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<any> | Promise<any> | any {
    return Promise.resolve();
  }

  // buildParams(page?: number, size?: number, id?: number, createdFrom?: number, createdTo?: number, name?: string, phone?: string, isActive?: boolean, managerId?: number, department_id?: string, workAreaId?: string, username?: string, timeType?: number) {
  //   const params: any = {};
  //   if (page != null) params.page = page;
  //   if (size != null) params.size = size;
  //   if (name) params.name = name.trim();
  //   if (phone) params.phone = phone.trim();
  //   if (id) params.id = id;
  //   if (createdFrom) params.createdTimeFrom = createdFrom;
  //   if (createdTo) params.createdTimeTo = createdTo;
  //   if (isActive != null) params.isActive = isActive;
  //   if (managerId != null) params.managerId = managerId;
  //   if (department_id) params.departmentId = department_id;
  //   if (workAreaId) params.workAreaId = workAreaId;
  //   if (username) params.username = username;
  //   params.timeType = timeType;
  //   const query = Object.keys(params)
  //     .map(key => `${key}=${encodeURIComponent(params[key])}`)
  //     .join('&');

  //   return query ? `?${query}` : '';
  // }

  getDataTableRows(page?: number, size?: number, id?: number, createdFrom?: string | null, createdTo?: string | null, name?: string, phone?: string, isActive?: boolean, managerId?: number, department_id?: string, workAreaId?: string, username?: string, timeType?: number, areaId?: string): Promise<any[]> {
    return this.getList({
      page, size, id, createdFrom, createdTo, name, phone,
      isActive, managerId, department_id, workAreaId, username, timeType, areaId
    }, true);
  }

  getById(id: any): Promise<Administrator> {
    return new Promise((resolve, reject) => {
      this.http.get(`${this.basePath}/${id}`).subscribe((response: Administrator) => resolve(response), reject);
    });
  }

  getDepartments(): any {
    return new Promise((resolve, reject) => {
      this.http.get(`${this.basePath}/get-departments`).subscribe((response: any) => resolve(response), reject);
    });
  }

  getWorkAreas(): any {
    return new Promise((resolve, reject) => {
      this.http.get(`${this.basePath}/get-workareas`).subscribe((response: any) => resolve(response), reject);
    });
  }

  getAreas(): any {
    return new Promise((resolve, reject) => {
      this.http.get(`${this.basePath}/get-areas`).subscribe((response: any) => resolve(response), reject);
    });
  }

  searchAdmin(adminIds, searchText, page): Promise<any> {
    return new Promise((resolve, reject) => {
      this.http.post(`${this.basePath}/search-admin?page=${page}&username=${encodeURIComponent(searchText)}`, adminIds).subscribe((response: any[]) => {
        resolve(response);
      }, reject);
    });
  }

  getAllRoles(adminId) {
    return new Promise((resolve, reject) => {
      this.http.get(`${this.basePath}/get-all-roles?adminId=${adminId}`).subscribe((response: Administrator) => resolve(response), reject);
    });
  }

  getAllRolesCanSet(adminId) {
    return new Promise((resolve, reject) => {
      this.http.get(`${this.basePath}/get-all-roles-can-set?adminId=${adminId}`).subscribe((response: Administrator) => resolve(response), reject);
    });
  }

  getAllRolesDetail(adminId) {
    return new Promise((resolve, reject) => {
      this.http.get(`${this.basePath}/get-all-roles-detail?adminId=${adminId}`).subscribe((response: Administrator) => resolve(response), reject);
    });
  }

  assignRoles(adminId, ids): any {
    return new Promise((resolve, reject) => {
      this.http.put(`${this.basePath}/${adminId}/assign-role`, ids).subscribe((response: Administrator) => resolve(response), reject);
    });
  }

  assignManager(id, managerId): any {
    return new Promise((resolve, reject) => {
      this.http.put(`${this.basePath}/${id}/assign-manager?managerId=${managerId}`, null).subscribe((response: Administrator) => resolve(response), reject);
    });
  }

  assignRolesCanSet(adminId, ids): any {
    return new Promise((resolve, reject) => {
      this.http.put(`${this.basePath}/${adminId}/assign-role-can-set`, ids).subscribe((response: Administrator) => resolve(response), reject);
    });
  }

  create(admin: any): Promise<any> {
    const formData = new FormData();

    // 🔹 Append tất cả field text với xử lý an toàn cho null/undefined
    formData.append('user_name', (admin.user_name || '').toString().trim());
    formData.append('work_area_id', admin.work_area_id || '');
    formData.append('position', admin.position || '');
    formData.append('password', admin.password || '');
    formData.append('salt', admin.salt || '');
    formData.append('email', (admin.email || '').toString().trim());
    formData.append('start_barcode', (admin.start_barcode || '').toString().trim());
    formData.append('status', String(admin.status ?? 1));
    formData.append('phone', (admin.phone || '').toString().trim());
    formData.append('full_name', (admin.full_name || '').toString().trim());
    formData.append('department_id', admin.department_id || '');

    // 🔹 Nếu có file upload
    if (admin.photo instanceof File) {
      formData.append('photo', admin.photo);
    }

    if (admin.digital_signature instanceof File) {
      formData.append('digital_signature', admin.digital_signature);
    }

    return new Promise((resolve, reject) => {
      this.http.post(`${this.basePath}`, formData).subscribe(resolve, reject);
    });
  }

  update(admin: any): Promise<any> {
    if (!admin || !admin.id) {
      return Promise.reject(new Error('Admin ID is required for update'));
    }

    const formData = new FormData();
    
    // 🔹 Append tất cả field text với xử lý an toàn cho null/undefined
    formData.append('user_name', (admin.user_name || '').toString().trim());
    formData.append('work_area_id', admin.work_area_id || '');
    formData.append('position', admin.position || '');
    formData.append('start_barcode', (admin.start_barcode || '').toString().trim());
    formData.append('password', admin.password || '');
    formData.append('salt', admin.salt || '');
    formData.append('email', (admin.email || '').toString().trim());
    formData.append('status', String(admin.status ?? 1));
    formData.append('phone', (admin.phone || '').toString().trim());
    formData.append('full_name', (admin.full_name || '').toString().trim());
    formData.append('department_id', admin.department_id || '');

    if (admin.photo instanceof File) {
      formData.append('photo', admin.photo);
    }
    if (admin.photo == null) {
      formData.append('clear_photo', 'true');
    }
    if (admin.digital_signature instanceof File) {
      formData.append('digital_signature', admin.digital_signature);
    }
    if (admin.digital_signature == null) {
      formData.append('clear_digital_signature', 'true');
    }

    return new Promise((resolve, reject) => {
      this.http.put(`${this.basePath}/${admin.id}`, formData).subscribe(resolve, reject);
    });
  }

  changeStatus(admin: Administrator): Promise<Administrator> {
    return new Promise((resolve, reject) => {
      this.http.put<any>(`${this.basePath}/${admin.id}/change-status`, admin)
        .subscribe((response: Administrator) => resolve(response), reject)
    });
  }
  getRolesOfAdmin(id: number): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.http.get(`${this.basePath}/${id}/roles`).subscribe((res: any[]) => resolve(res), reject);
    });
  }

  getPositions(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.http.get(`${this.basePath}/positions`).subscribe((res: any[]) => resolve(res), reject);
    });
  }

  setRoles(id: number, roleIds: number[]): Promise<any> {
    return new Promise((resolve, reject) => {
      this.http.put(`${this.basePath}/${id}/roles`, { ids: roleIds }).subscribe(res => resolve(res), reject);
    });
  }


}


