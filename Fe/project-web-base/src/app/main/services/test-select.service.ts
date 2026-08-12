import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from 'environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TestSelectService {
  private readonly STORAGE_KEY = 'testSelect';
  private readonly API_URL = `${environment.apiUrl}/price-policies/tests`;
  private testsCache$ = new BehaviorSubject<any[]>([]);

  constructor(private http: HttpClient) {
    this.loadTestsFromStorage();
  }

  /**
   * Get test select list from API
   */
  getTestSelect(): Observable<any> {
    return this.http.get<any>(this.API_URL).pipe(
      map((response: any) => {
        const list = response?.data ?? [];
        // Cache to localStorage
        if (list.length > 0) {
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(list));
          this.testsCache$.next(list);
        }
        return response;
      })
    );
  }

  /**
   * Load tests from localStorage
   */
  private loadTestsFromStorage(): void {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      try {
        const list = JSON.parse(stored);
        this.testsCache$.next(list);
      } catch (e) {
        console.error('Error parsing test list from localStorage:', e);
      }
    }
  }

  /**
   * Get all tests from cache
   */
  getAllTests(): any[] {
    return this.testsCache$.value;
  }

  /**
   * Ensure test data is loaded (fetch if not in localStorage)
   */
  ensureTestsLoaded(): Promise<any> {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (!stored) {
      return this.getTestSelect().toPromise();
    }
    return Promise.resolve({ data: this.getAllTests() });
  }

  /**
   * Format test list with label for select-search
   */
  formatTestList(list: any[]): any[] {
    return (list || []).map(t => ({
      ...t,
      label: `${t.test_code || ''} - ${t.test_name || ''}`,
      value: t.id
    }));
  }

  /**
   * Search tests from localStorage by keyword
   */
  searchTests(keyword: string): any[] {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (!stored) {
      return [];
    }

    try {
      const allTests = JSON.parse(stored) as any[];
      if (!keyword || keyword.trim() === '') {
        return [];
      }

      const searchTerm = keyword.toLowerCase().trim();
      const filtered = allTests.filter(t => {
        const code = (t.test_code || '').toLowerCase();
        const name = (t.test_name || '').toLowerCase();
        return code.includes(searchTerm) || name.includes(searchTerm);
      });

      return this.formatTestList(filtered);
    } catch (e) {
      console.error('Error searching tests:', e);
      return [];
    }
  }

  /**
   * Find test by ID from localStorage
   */
  findTestById(testId: number): any {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (!stored) return null;

    try {
      const allTests = JSON.parse(stored) as any[];
      const test = allTests.find(t => t.id === testId);
      if (test) {
        return {
          ...test,
          label: `${test.test_code || ''} - ${test.test_name || ''}`,
          value: test.id
        };
      }
    } catch (e) {
      console.error('Error finding test:', e);
    }
    return null;
  }

  /**
   * Get tests from localStorage (synchronous)
   * This is useful when you need data immediately without async/await
   */
  getTestsFromLocalStorage(): any[] {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (!stored) return [];

    try {
      return JSON.parse(stored) as any[];
    } catch (e) {
      console.error('Error parsing test list from localStorage:', e);
      return [];
    }
  }

  /**
   * Clear cache (useful for testing or refresh)
   */
  clearCache(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    this.testsCache$.next([]);
  }

  /**
   * Reload tests from API and update cache
   * This will clear localStorage first, then fetch fresh data
   */
  reloadTests(): Observable<any> {
    // Clear cache first
    this.clearCache();
    // Fetch fresh data from API
    return this.getTestSelect();
  }
}
