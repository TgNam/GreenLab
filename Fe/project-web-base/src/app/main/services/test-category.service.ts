import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from 'environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TestCategoryService {
  private readonly STORAGE_KEY = 'testCategories';
  private readonly API_URL = `${environment.apiUrl}/test-search/test-categories-all`;
  private categoriesCache$ = new BehaviorSubject<any[]>([]);

  constructor(private http: HttpClient) {
    this.loadCategoriesFromStorage();
  }

  private loadCategoriesFromStorage(): void {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      try {
        const list = JSON.parse(stored);
        this.categoriesCache$.next(list);
      } catch (e) {
        console.error('Error parsing categories from localStorage:', e);
      }
    }
  }

  /** Fetch categories from API and cache to localStorage */
  fetchCategories(): Observable<any> {
    return this.http.get<any>(this.API_URL).pipe(
      map((response: any) => {
        const list = response?.data ?? [];
        if (list && list.length > 0) {
          try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(list));
            this.categoriesCache$.next(list);
          } catch (e) {
            console.error('Error saving categories to localStorage:', e);
          }
        }
        return response;
      })
    );
  }

  /** Ensure categories are loaded: if not in localStorage, fetch from API */
  ensureCategoriesLoaded(): Promise<any> {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (!stored) {
      return this.fetchCategories().toPromise();
    }
    return Promise.resolve({ data: this.getAllCategories() });
  }

  /** Get categories from cache subject */
  getAllCategories(): any[] {
    return this.categoriesCache$.value;
  }

  /** Synchronous read from localStorage */
  getCategoriesFromLocalStorage(): any[] {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (!stored) return [];
    try {
      return JSON.parse(stored) as any[];
    } catch (e) {
      console.error('Error parsing categories from localStorage:', e);
      return [];
    }
  }

  /** Clear cache and localStorage */
  clearCache(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    this.categoriesCache$.next([]);
  }

  /** Reload categories from API */
  reloadCategories(): Observable<any> {
    this.clearCache();
    return this.fetchCategories();
  }
}
