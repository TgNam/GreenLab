import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, Router, RouterStateSnapshot } from '@angular/router';

import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from 'environments/environment';
import { BaseService } from 'app/main/services/base.service';

export interface Permission {
  id: number;
  name: string;
  uri: string;
  method: string;
  create_time: number;
  update_time: number;
  parent_id: number;
  skip: boolean;
}

@Injectable()
export class PermissionService extends BaseService<any> implements Resolve<any> {
  constructor(http: HttpClient, router: Router) {
    super(router, http, `${environment.apiUrl}/permissions`);
  }

  /**
   * Resolver
   *
   * @param {ActivatedRouteSnapshot} route
   * @param {RouterStateSnapshot} state
   * @returns {Observable<any> | Promise<any> | any}
   */
  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<any> | Promise<any> | any {
    return Promise.resolve();
  }

  /**
   * Get rows
   */
  buildParams(page?: number, size?: number, name?: string, uri?: string) {
    const params: any = {};
    if (page != null) params.page = page;
    if (size != null) params.size = size;
    if (name) params.name = name;
    if (uri) params.uri = uri;

    const query = Object.keys(params)
      .map(key => `${key}=${encodeURIComponent(params[key])}`)
      .join('&');

    return query ? `?${query}` : '';
  }
  
  getDataTableRows(body): any {
    return new Promise((resolve, reject) => {
      this.http.post(this.basePath, body).subscribe((response: any) => {
        this.rows = response;
        this.onListChange.next(this.rows);
        
        // Push query params to URL - page is 0-based, pushQueryParam will convert to 1-based
        const urlParams: any = {};
        if (body.page != null) urlParams.page = body.page; // Keep 0-based, pushQueryParam will convert
        if (body.size != null) urlParams.size = body.size;
        if (body.name) urlParams.name = body.name;
        if (body.uri) urlParams.uri = body.uri;
        if (body.hidden != null) urlParams.hidden = body.hidden;
        if (body.skip != null) urlParams.skip = body.skip;
        if (body.filterParent != null) urlParams.filterParent = body.filterParent;
        if (body.adminId) urlParams.adminId = body.adminId;
        this.pushQueryParam(urlParams);
        
        resolve(this.rows);
      }, reject);
    });
  }

  getPermissionUnmap(page?: number, size?: number, name?: string, uri?: string): any {
    const params = this.buildParams(page, size, name, uri);
    return new Promise((resolve, reject) => {
      this.http.get(`${this.basePath}/unmap${params}`).subscribe((response: Permission) => {
        resolve(response);
      }, reject);
    });
  }


  getPermissionScanUri(uri?: string): any {
    return new Promise((resolve, reject) => {
      this.http.get(`${this.basePath}/scan-by-uri-unmapped?uri=${encodeURIComponent(uri)}`).subscribe((response: Permission) => {
        resolve(response);
      }, reject);
    });
  }

  /**
   * Get Permission by ID
   */
  getPermissionById(id: number): Promise<Permission> {
    return new Promise((resolve, reject) => {
      this.http.get(`${this.basePath}/${id}`).subscribe((response: Permission) => {
        resolve(response);
      }, reject);
    });
  }

  mapPermission(body): any {
    return new Promise((resolve, reject) => {
      this.http.post(`${this.basePath}/map`, body).subscribe((response: Permission) => {
        resolve(response);
      }, reject);
    });
  }

  /**
   * Create Permission
   */
  createPermission(permission: Permission): Promise<Permission> {
    return new Promise((resolve, reject) => {
      this.http.post(this.basePath, permission).subscribe((response: Permission) => {
        resolve(response);
      }, reject);
    });
  }

  /**
   * Update Permission
   */
  updatePermission(permission: Permission): Promise<Permission> {
    return new Promise((resolve, reject) => {
      this.http.put(`${this.basePath}/${permission.id}`, permission).subscribe((response: Permission) => {
        resolve(response);
      }, reject);
    });
  }

  /**
   * Delete Permission
   */
  deletePermission(id: number): any {
    return new Promise((resolve, reject) => {
      this.http.delete(`${this.basePath}/${id}`).subscribe((response) => {
        resolve(response);
      }, reject);
    });
  }

  /**
   * Get administrators by permission ID
   */
  getAdministratorsByPermission(permissionId: number): Promise<any> {
    return new Promise((resolve, reject) => {
      this.http.get(`${this.basePath}/administrators?permissionId=${permissionId}`).subscribe((response: any) => {
        resolve(response);
      }, reject);
    });
  }

  /**
   * Get roles by permission ID
   */
  getRolesByPermission(permissionId: number): Promise<any> {
    return new Promise((resolve, reject) => {
      this.http.get(`${this.basePath}/roles-by-permission?permissionId=${permissionId}`).subscribe((response: any) => {
        resolve(response);
      }, reject);
    });
  }

  /**
   * Add permission to role
   */
  addPermissionToRole(permissionId: number, roleId: number): Promise<any> {
    return new Promise((resolve, reject) => {
      this.http.post(`${this.basePath}/add-permission-to-role`, {
        permissionId: permissionId,
        roleId: roleId
      }).subscribe((response: any) => {
        resolve(response);
      }, reject);
    });
  }

  /**
   * Remove permission from role
   */
  removePermissionFromRole(permissionId: number, roleId: number): Promise<any> {
    return new Promise((resolve, reject) => {
      this.http.post(`${this.basePath}/remove-permission-from-role`, {
        permissionId: permissionId,
        roleId: roleId
      }).subscribe((response: any) => {
        resolve(response);
      }, reject);
    });
  }

  /**
   * Get administrators by role ID
   */
  getAdminByRoles(roleId: number): Promise<any> {
    return new Promise((resolve, reject) => {
      this.http.get(`${this.basePath}/admin-by-roles?roleId=${roleId}`).subscribe((response: any) => {
        resolve(response);
      }, reject);
    });
  }

  /**
   * Get all roles
   */
  getAllRoles(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.http.get(`${this.basePath}/roles`).subscribe((response: any) => {
        resolve(response);
      }, reject);
    });
  }
}
