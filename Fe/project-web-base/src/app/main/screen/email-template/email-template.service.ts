import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, Router, RouterStateSnapshot } from '@angular/router';

import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from 'environments/environment';
import { BaseService } from 'app/main/services/base.service';

export interface EmailTemplate {
  id?: number;
  name: string;
  content: string;
  active: boolean;
  type: string;
  createTime?: number;
  updateTime?: number;
  [key: string]: any;
}

@Injectable()
export class EmailTemplateService extends BaseService<EmailTemplate> implements Resolve<any> {
  public emailTemplates: any[] = []; // This is still needed for direct access in component
  public onEmailTemplateListChange: BehaviorSubject<any>;
  // totalCount và totalPage được kế thừa từ BaseService

  constructor(http: HttpClient, router: Router) {
    super(router, http, `${environment.apiUrl}/email-templates`);
    this.onEmailTemplateListChange = new BehaviorSubject<any[]>([]);

    // Map onListChange từ BaseService sang onEmailTemplateListChange để tương thích
    this.onListChange.subscribe(rows => {
      this.emailTemplates = rows; // Keep this for direct access
      this.onEmailTemplateListChange.next(rows);
    });
  }

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<any> | Promise<any> | any {
    return Promise.resolve();
  }

  override getList(paramsObj: any = {}, isPush: boolean = false, url: string = ""): Promise<EmailTemplate[]> {
    return super.getList(paramsObj, isPush, url ? url : `${this.basePath}`);
  }

  getDataTableRows(
    page?: number,
    size?: number,
    id?: number,
    from_time?: string | number | null,
    to_time?: string | number | null,
    name?: string,
    type?: string,
    active?: boolean | null
  ): Promise<any[]> {
    const trimmedName = name ? name.trim() : name;
    const trimmedType = type ? type.trim() : type;

    return this.getList(
      {
        page,
        size,
        id,
        from_time: this.normalizeDateParam(from_time),
        to_time: this.normalizeDateParam(to_time),
        name: trimmedName,
        type: trimmedType,
        active: active === null || active === undefined ? undefined : active
      },
      false
    );
  }

  private normalizeDateParam(val: string | number | null | undefined): string | undefined {
    if (val == null || val === '') return undefined;
    if (typeof val === 'number') return new Date(val).toISOString().split('T')[0];
    return String(val).trim() || undefined;
  }

  getEmailTemplateById(id: number): Promise<EmailTemplate> {
    return new Promise((resolve, reject) => {
      this.http.get<any>(`${this.basePath}/${id}`).subscribe((res) => {
        resolve(res?.success && res?.data ? res.data : res);
      }, reject);
    });
  }

  createEmailTemplate(emailTemplate: EmailTemplate): any {
    return new Promise((resolve, reject) => {
      this.http.post<any>(`${this.basePath}`, emailTemplate).subscribe(
        (res) => {
          resolve(res?.success && res?.data ? res.data : res);
        },
        (error: any) => {
          // Handle error response with message
          if (error?.error) {
            resolve(error.error);
          } else {
            reject(error);
          }
        }
      );
    });
  }

  updateEmailTemplate(emailTemplate: EmailTemplate): any {
    return new Promise((resolve, reject) => {
      this.http.put<any>(`${this.basePath}/${emailTemplate.id}`, emailTemplate).subscribe(
        (res) => {
          resolve(res?.success && res?.data ? res.data : res);
        },
        (error: any) => {
          // Handle error response with message
          if (error?.error) {
            resolve(error.error);
          } else {
            reject(error);
          }
        }
      );
    });
  }

  toggleEmailTemplateStatus(id: number, active: boolean): any {
    return new Promise((resolve, reject) => {
      this.http.patch<any>(`${this.basePath}/${id}/active?active=${active}`, {}).subscribe(
        (res) => {
          resolve(res?.success && res?.data ? res.data : res);
        },
        (error: any) => {
          // Handle error response with message
          if (error?.error) {
            resolve(error.error);
          } else {
            reject(error);
          }
        }
      );
    });
  }

  deleteEmailTemplate(id: number): any {
    return new Promise((resolve, reject) => {
      this.http.delete(`${this.basePath}/${id}`).subscribe(
        (response) => {
          resolve(response);
        },
        (error: any) => {
          // Handle error response with message
          if (error?.error) {
            resolve(error.error);
          } else {
            reject(error);
          }
        }
      );
    });
  }

  getEmailTemplateTypes(): Promise<{ label: string; value: string }[]> {
    return new Promise((resolve, reject) => {
      this.http.get<any>(`${this.basePath}/types`).subscribe((res) => {
        if (res?.success && Array.isArray(res?.data)) {
          resolve(res.data);
          return;
        }
        resolve([]);
      }, reject);
    });
  }
}