import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, Router, RouterStateSnapshot } from '@angular/router';

import { BehaviorSubject } from 'rxjs';
import { environment } from 'environments/environment';
import { BaseService } from 'app/main/services/base.service';

export interface SmsTemplate {
  id?: number;
  name: string;
  content: string;
  active: boolean;
  type: string;
  recipientType: string;
  createTime?: number;
  updateTime?: number;
  [key: string]: any;
}

@Injectable()
export class SmsTemplateService extends BaseService<SmsTemplate> implements Resolve<any> {
  public smsTemplates: any[] = [];
  public onSmsTemplateListChange: BehaviorSubject<any>;

  constructor(http: HttpClient, router: Router) {
    super(router, http, `${environment.apiUrl}/sms-templates`);
    this.onSmsTemplateListChange = new BehaviorSubject<any[]>([]);

    this.onListChange.subscribe(rows => {
      this.smsTemplates = rows;
      this.onSmsTemplateListChange.next(rows);
    });
  }

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<any> {
    return Promise.resolve();
  }

  override getList(paramsObj: any = {}, isPush: boolean = false, url: string = ''): Promise<SmsTemplate[]> {
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
    recipientType?: string,
    active?: boolean | null
  ): Promise<any[]> {
    const trimmedName = name ? name.trim() : name;
    const trimmedType = type ? type.trim() : type;
    const trimmedRecipientType = recipientType ? recipientType.trim() : recipientType;

    return this.getList(
      {
        page,
        size,
        id,
        from_time: this.normalizeDateParam(from_time),
        to_time: this.normalizeDateParam(to_time),
        name: trimmedName,
        type: trimmedType,
        recipientType: trimmedRecipientType,
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

  getSmsTemplateById(id: number): Promise<SmsTemplate> {
    return new Promise((resolve, reject) => {
      this.http.get<any>(`${this.basePath}/${id}`).subscribe((res) => {
        resolve(res?.success && res?.data ? res.data : res);
      }, reject);
    });
  }

  createSmsTemplate(smsTemplate: SmsTemplate): any {
    return new Promise((resolve, reject) => {
      this.http.post<any>(`${this.basePath}`, smsTemplate).subscribe(
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

  updateSmsTemplate(smsTemplate: SmsTemplate): any {
    return new Promise((resolve, reject) => {
      this.http.put<any>(`${this.basePath}/${smsTemplate.id}`, smsTemplate).subscribe(
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

  toggleSmsTemplateStatus(id: number, active: boolean): any {
    return new Promise((resolve, reject) => {
      this.http.patch<any>(`${this.basePath}/${id}/active?active=${active}`, {}).subscribe(
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

  deleteSmsTemplate(id: number): any {
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

  getSmsTemplateTypes(): Promise<{ label: string; value: string }[]> {
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

  getSmsRecipientTypes(): Promise<{ label: string; value: string }[]> {
    return new Promise((resolve, reject) => {
      this.http.get<any>(`${this.basePath}/recipient-types`).subscribe((res) => {
        if (res?.success && Array.isArray(res?.data)) {
          resolve(res.data);
          return;
        }
        resolve([]);
      }, reject);
    });
  }
}
