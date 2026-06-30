import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from 'environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DoctorSelectService {
  private readonly STORAGE_KEY = 'doctorSelect';
  private readonly API_URL = `${environment.apiUrl}/common/doctor-select`;
  private doctorsCache$ = new BehaviorSubject<any[]>([]);

  constructor(private http: HttpClient) {
    this.loadDoctorsFromStorage();
  }

  /**
   * Get doctor select list from API
   */
  getDoctorSelect(): Observable<any> {
    return this.http.get<any>(this.API_URL).pipe(
      map((response: any) => {
        const list = response?.data ?? [];
        // Cache to localStorage
        if (list.length > 0) {
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(list));
          this.ensureDoctorsLoaded();
          this.doctorsCache$.next(list);
        }
        return response;
      })
    );
  }

  /**
   * Load doctors from localStorage
   */
  private loadDoctorsFromStorage(): void {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      try {
        const list = JSON.parse(stored);
        this.doctorsCache$.next(list);
      } catch (e) {
        console.error('Error parsing doctor list from localStorage:', e);
      }
    }
  }

  getDoctorDetailConfig(id: number): any {
    return new Promise((resolve, reject) => {
      this.http.get<any>(`${environment.apiUrl}/config/doctor-config/detail/${id}`).subscribe(
        (response) => {
          if (response && response.success && response.data) {
            // Ensure data is an object, not null/undefined
            resolve(response.data || {});
          } else {
            console.warn('getActionTypes: No data in response, returning empty object');
            resolve({});
          }
        },
        (error) => {
          console.error('Error loading action types:', error);
          // Don't reject, resolve with empty object to prevent breaking the UI
          resolve({});
        }
      );
    });
  }

  getDoctorComment(id: number): any {
    return new Promise((resolve, reject) => {
      this.http.get<any>(`${environment.apiUrl}/config/doctor-config/comment/${id}`).subscribe(
        (response) => {
          resolve(response.data || {});
        }
      );
    });
  }

  /**
   * Get all doctors from cache
   */
  getAllDoctors(): any[] {
    return this.doctorsCache$.value;
  }


  /**
   * Format doctor list with label for select-search
   */
  formatDoctorList(list: any[]): any[] {
    return (list || []).map(d => ({
      ...d,
      label: `${String(d.code || '').padStart(5, '0')} - ${d.doctorName || ''}`,
      value: d.id
    }));
  }

  /**
   * Search doctors from localStorage by keyword
   * @param keyword Search keyword
   * @param cityId Optional city ID to filter by
   */
  private cachedDoctors: any[] = [];

  // Gọi hàm này một lần khi khởi tạo service hoặc khi reload cache
  ensureDoctorsLoaded() {
    if (this.cachedDoctors.length > 0) return;
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      try {
        const rawData = JSON.parse(stored) as any[];
        this.cachedDoctors = rawData.map(d => ({
          ...d,
          // Tạo một chuỗi duy nhất chứa cả Code (gốc), Code (đã pad), và Tên (lower case)
          _searchStr: `${String(d.code || '')} ${String(d.code || '').padStart(5, '0')} ${(d.doctorName || '').toLowerCase()}`.trim(),
          // Chuẩn hóa CityId để so sánh cho nhanh
          _cityIdStr: String(d.city_id || d.cityId || ''),
          // Chuẩn bị sẵn chuỗi search để không phải làm lại trong vòng lặp
          _sCode: String(d.code || ''),
          _sCodePad: String(d.code || '').padStart(5, '0'),
          _sName: (d.doctorName || '').toLowerCase(),
          _sCityId: String(d.city_id || d.cityId || ''),
          _sId: String(d.id || ''),
        }));
      } catch (e) {
        this.cachedDoctors = [];
      }
    }
  }

  searchDoctors(keyword: string, cityId?: number | string | null): any[] {
    if (this.cachedDoctors.length === 0) {
      this.ensureDoctorsLoaded();
    }

    const results = [];
    const searchTerm = keyword ? keyword.toLowerCase().trim() : '';
    const cityIdStr = (cityId !== null && cityId !== undefined && cityId !== '') ? String(cityId) : null;

    for (const d of this.cachedDoctors) {
      if (cityIdStr && d._cityIdStr !== cityIdStr) {
        continue;
      }

      if (searchTerm) {
        if (d._searchStr.includes(searchTerm)) {
          results.push(d);
        }
      } else {
        if (cityIdStr) {
          results.push(d);
        }
      }
      if (results.length >= 50) {
        break;
      }
    }

    // Nếu không có keyword cũng không có cityId thì trả về mảng rỗng
    if (!searchTerm && !cityIdStr) return [];

    return this.formatDoctorList(results);
  }

  searchDoctorsV2(keyword: string, cityId?: number | string | null): any[] {
    try {
      if (this.cachedDoctors.length === 0) {
        this.ensureDoctorsLoaded();
      }
  
      const results = [];
      const searchTerm = keyword ? keyword.toLowerCase().trim() : '';
      const cityIdStr = (cityId !== null && cityId !== undefined && cityId !== '') ? String(cityId) : null;
  
      // Sử dụng vòng lặp for...of để có thể dùng 'break'
      for (const d of this.cachedDoctors) {
        
        // 1. Kiểm tra CityId trước (Nhanh nhất, loại bỏ sớm các bản ghi không khớp)
        if (cityIdStr && d._sCityId !== cityIdStr) {
          continue;
        }
  
        // 2. Kiểm tra Keyword
        if (searchTerm) {
          // Kiểm tra mã gốc OR mã đã pad OR tên
          const match = d._sCode.includes(searchTerm) || 
                        d._sCodePad.includes(searchTerm) ||
                        d._sId == searchTerm ||
                        d._sName.includes(searchTerm);
          
          if (!match) continue;
        } else {
          if (!cityIdStr) continue;
        }
  
        results.push(d);
        if (results.length >= 50) break;
      }
  
      return this.formatDoctorList(results);
    } catch (e) {
      console.error('Error searching doctors:', e);
      return [];
    }
  }

  /**
   * Find doctor by ID from localStorage
   */
  findDoctorById(doctorId: number): any {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (!stored) return null;

    try {
      const allDoctors = JSON.parse(stored) as any[];
      const doctor = allDoctors.find(d => d.id === doctorId);
      if (doctor) {
        return {
          ...doctor,
          label: `${String(doctor.code || '').padStart(5, '0')} - ${doctor.doctorName || ''}`,
          value: doctor.id
        };
      }
    } catch (e) {
      console.error('Error finding doctor:', e);
    }
    return null;
  }

  /**
   * Clear cache (useful for testing or refresh)
   */
  clearCache(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    this.doctorsCache$.next([]);
  }

  /**
   * Reload doctors from API and update cache
   * This will clear localStorage first, then fetch fresh data
   */
  reloadDoctors(): Observable<any> {
    // Clear cache first
    this.clearCache();
    // Fetch fresh data from API
    return this.getDoctorSelect();
  }
}

