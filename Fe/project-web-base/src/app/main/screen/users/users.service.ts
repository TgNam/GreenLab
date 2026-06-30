import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, Router, RouterStateSnapshot } from '@angular/router';

import { BehaviorSubject } from 'rxjs';
import { environment } from 'environments/environment';
import { BaseService } from 'app/main/services/base.service';

export interface User {
  id?: number;
  email: string;
  fullName: string;
  phone: string;
  address?: string;
  note?: string;
  patientIds?: string;
  photo?: string;
  regSource?: number;
  salt?: string;
  status: boolean;
  type?: number;
  createTime?: string;
  updateTime?: string;
  lastLoginIp?: string;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  lastLoginTime?: string;
}

@Injectable()
export class UsersService extends BaseService<User> implements Resolve<any> {

  public users: User[] = [];
  public onUserListChange: BehaviorSubject<User[]>;

  constructor(http: HttpClient, router: Router) {
    super(router, http, `${environment.apiUrl}/users`);

    this.onUserListChange = new BehaviorSubject<User[]>([]);

    this.onListChange.subscribe(rows => {
      this.users = rows;
      this.onUserListChange.next(rows);
    });
  }

  resolve(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Promise<any> {
    return Promise.resolve();
  }

  override getList(
    paramsObj: any = {},
    isPush: boolean = false,
    url: string = ''
  ): Promise<User[]> {
    return super.getList(
      paramsObj,
      isPush,
      url || this.basePath
    );
  }

  getDataTableRows(
    page?: number,
    size?: number,
    keyword?: string,
    email?: string,
    fullName?: string,
    phone?: string,
    isActive?: boolean | null,
    type?: number,
    regSource?: number,
    createdFrom?: string | number | null,
    createdTo?: string | number | null,
    sortBy?: string,
    sortDir?: string
  ): Promise<User[]> {
    return this.getList(
      {
        page,
        size,
        keyword: keyword?.trim(),
        email: email?.trim(),
        fullName: fullName?.trim(),
        phone: phone?.trim(),
        isActive: isActive == null ? undefined : isActive,
        type,
        regSource,
        createdFrom: this.normalizeDateParam(createdFrom),
        createdTo: this.normalizeDateParam(createdTo),
        sortBy,
        sortDir
      },
      false
    );
  }

  protected normalizeDateParam(
    val: string | number | null | undefined
  ): string | undefined {
    if (val == null || val === '') {
      return undefined;
    }

    if (typeof val === 'number') {
      const date = new Date(val);

      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }

    return String(val).trim() || undefined;
  }

  getUserById(id: number): Promise<User> {
    return new Promise((resolve, reject) => {
      this.http.get<any>(`${this.basePath}/${id}`).subscribe(
        res => resolve(res?.data ?? res),
        reject
      );
    });
  }

  createUser(user: User): Promise<any> {
    return new Promise((resolve, reject) => {
      this.http.post<any>(this.basePath, user).subscribe(
        res => resolve(res?.data ?? res),
        error => error?.error ? resolve(error.error) : reject(error)
      );
    });
  }

  updateUser(user: User): Promise<any> {
    return new Promise((resolve, reject) => {
      this.http.put<any>(`${this.basePath}/${user.id}`, user).subscribe(
        res => resolve(res?.data ?? res),
        error => error?.error ? resolve(error.error) : reject(error)
      );
    });
  }

  deleteUser(id: number): Promise<any> {
    return new Promise((resolve, reject) => {
      this.http.delete(`${this.basePath}/${id}`).subscribe(
        response => resolve(response),
        error => error?.error ? resolve(error.error) : reject(error)
      );
    });
  }
}