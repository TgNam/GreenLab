import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, Router, RouterStateSnapshot } from '@angular/router';

import { Observable } from 'rxjs';
import { environment } from 'environments/environment';
import { BaseService } from 'app/main/services/base.service';

export interface Role {
  id: number;
  name: string;
  icon: string;
  description: string;
  position: number;
  active: boolean;
  create_time: number;
  update_time: number;
  permissions: any[];
}

@Injectable()
export class RoleService extends BaseService<any> implements Resolve<any> {
  private permissionPath = `${environment.apiUrl}/permissions`;
  
  constructor(http: HttpClient, router: Router) {
    super(router, http, `${environment.apiUrl}/roles`);
  }

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<any> | Promise<any> | any {
    return Promise.resolve();
  }

  getDataTableRows(page?: number, size?: number, id?: number, createdFrom?: string | null, createdTo?: string | null, name?: string, description?: string, isActive?: boolean, timeType?: number, adminId?: number): Promise<any[]> {
    // Map params to API format - giống admin service
    const paramsObj: any = {};
    if (page != null) paramsObj.page = page;
    if (size != null) paramsObj.size = size;
    if (id) paramsObj.id = id;
    if (createdFrom) paramsObj.createdTimeFrom = createdFrom;
    if (createdTo) paramsObj.createdTimeTo = createdTo;
    if (name) paramsObj.name = name.trim();
    if (description) paramsObj.description = description.trim();
    if (isActive != null) paramsObj.isActive = isActive;
    if (timeType != null && timeType !== undefined) paramsObj.timeType = timeType;
    if (adminId) paramsObj.adminId = adminId;

    // Gọi getList với isPush = true để tự động push query params lên URL
    return this.getList(paramsObj, true);
  }

  getRoleById(id: number): Promise<Role> {
    return new Promise((resolve, reject) => {
      this.http.get(`${this.basePath}/${id}`).subscribe((response: Role) => {
        resolve(response);
      }, reject);
    });
  }

  getPermissions(): any {
    return new Promise((resolve, reject) => {
      this.http.post(`${this.basePath}/permission`, null).subscribe((response: Role) => {
        resolve(response);
      }, reject);
    });
  }

  updatePermission(id, permissions): any {
    return new Promise((resolve, reject) => {
      this.http.put(`${this.basePath}/${id}/permissions`, permissions).subscribe((response: Role) => {
        resolve(response);
      }, reject);
    });
  }

  createRole(role: Role): any {
    return new Promise((resolve, reject) => {
      this.http.post(this.basePath, role).subscribe((response: Role) => {
        this.getDataTableRows();
        resolve(response);
      }, reject);
    });
  }

  changeStatus(role: Role): any {
    return new Promise((resolve, reject) => {
      this.http.put<any>(`${this.basePath}/${role.id}/change-status`, role)
        .subscribe((response: Role) => resolve(response), reject)
    });
  }

  updateRole(role: Role): any {
    return new Promise((resolve, reject) => {
      this.http.put(`${this.basePath}/${role.id}`, role).subscribe((response: Role) => {
        resolve(response);
      }, reject);
    });
  }

  deleteRole(id: number): any {
    return new Promise((resolve, reject) => {
      this.http.delete(`${this.basePath}/${id}`).subscribe((response) => {
        this.getDataTableRows();
        resolve(response);
      }, reject);
    });
  }

  // Permissions mapping helpers
  getRolePermissions(roleId: number): Promise<any> {
    return new Promise((resolve, reject) => {
      this.http.get(`${this.basePath}/${roleId}/permissions`).subscribe((response: any[]) => {
        resolve(response);
      }, reject);
    });
  }

  getAdminInRole(roleId: number): Promise<any> {
    return new Promise((resolve, reject) => {
      this.http.get(`${this.basePath}/${roleId}/get-admin-in-role`).subscribe((response: any[]) => {
        resolve(response);
      }, reject);
    });
  }

  searchAdmin(adminIds, searchText, page): Promise<any> {
    return new Promise((resolve, reject) => {
      this.http.post(`${this.basePath}/search-admin?page=${page}&username=${searchText}`, adminIds).subscribe((response: any[]) => {
        resolve(response);
      }, reject);
    });
  }

  addAdmin(adminId, id): any{
    return new Promise((resolve, reject) => {
      this.http.post(`${this.basePath}/${id}/add-admin?adminId=${adminId}`, null).subscribe((response: any[]) => {
        resolve(response);
      }, reject);
    });
  }

  removeAdmin(adminId, id): any {
    return new Promise((resolve, reject) => {
      this.http.delete(`${this.basePath}/${id}/remove-admin?adminId=${adminId}`).subscribe((response: any[]) => {
        resolve(response);
      }, reject);
    });
  }

  cloneRole(id): any {
    return new Promise((resolve, reject) => {
      this.http.post(`${this.basePath}/${id}/clone`, null).subscribe((response: any[]) => {
        resolve(response);
      }, reject);
    });
  }


  setRolePermissions(roleId: number, permissionIds: number[]): Promise<any> {
    return new Promise((resolve, reject) => {
      this.http.put(`${this.basePath}/${roleId}/permissions`, { ids: permissionIds }).subscribe((response: any) => {
        resolve(response);
      }, reject);
    });
  }

  getAllPermissions(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.http.get(this.permissionPath).subscribe((response: any[]) => {
        resolve(response);
      }, reject);
    });
  }

  /**
   * Lấy thông tin chi tiết của quản trị viên theo ID
   * @param id ID của quản trị viên
   * @returns Promise<AdministratorOutput>
   */
  getAdministratorById(id: number): Promise<any> {
    return new Promise((resolve, reject) => {
      this.http.get(`${this.basePath}/administrator/${id}`).subscribe((response: any) => {
        resolve(response);
      }, reject);
    });
  }
}


