import { HttpClient, HttpResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

export class BaseService<T> {

    public rows: T[] = [];
    public onListChange = new BehaviorSubject<T[]>([]);
    public totalCount = 0;
    public totalPage = 0;

    constructor(private router: Router, protected http: HttpClient, protected basePath: string) { }

    buildParams(paramsObj: any = {}): string {
        const params = Object.entries(paramsObj)
            .filter(([_, v]) => v !== undefined && v !== null && v !== '')
            .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
            .join('&');
        return params ? `?${params}` : '';
    }

    // -------------------------------
    // GET LIST (paging + filter)
    // -------------------------------
    getList(
        paramsObj: any = {},
        isPush: boolean = false,
        url: string = "",
        transform?: (rows: T[]) => T[]
    ): Promise<T[]> {
        
        //check if there's field createdFrom or createdTo, if so, convert to YYYY-mm-dd
        if (paramsObj.createdFrom && typeof paramsObj.createdFrom === 'number') {
            paramsObj.createdFrom = new Date(paramsObj.createdFrom).toISOString().split('T')[0];
        }
        if (paramsObj.createdTo && typeof paramsObj.createdTo === 'number') {
            paramsObj.createdTo = new Date(paramsObj.createdTo).toISOString().split('T')[0];
        }
        const params = this.buildParams(paramsObj); // '' | '?a=b&c=d'

        // Ensure query params are appended correctly even if url already has '?'
        const requestUrl = (() => {
            if (!url) {
                return `${this.basePath}${params}`;
            }
            if (!params) {
                return url;
            }
            if (url.includes('?')) {
                return `${url}&${params.substring(1)}`;
            }
            return `${url}${params}`;
        })();
    
        
        return new Promise((resolve, reject) => {
            this.http.get(requestUrl, { observe: 'response' })
                .subscribe((resp: HttpResponse<any>) => {
                    const res = resp.body;
                    if (res.success) {
                        const response = res.data;

                        this.totalPage = response.totalPages || 0;
                        this.totalCount = response.totalElements || (response.content?.length || 0);
                        const rawRows: T[] = response.content || response;
                        this.rows = transform ? transform(rawRows) : rawRows;

                        this.onListChange.next(this.rows);
                        if (isPush) {
                            this.pushQueryParam(paramsObj)
                        }
                        resolve(this.rows);
                    } else {
                        reject(res.message);
                    }
                }, reject);
        });
    }

    pushQueryParam(params) {
        if (params.page !== undefined && params.page !== null) {
            params.page = Number(params.page);
        }
        this.router.navigate([], {
            queryParams: params,
            replaceUrl: true
        });
    }

}
