import { Component, OnInit, OnDestroy, AfterViewInit, OnChanges, SimpleChanges, Input, Output, EventEmitter, ViewChild, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { ChangeDetectorRef } from '@angular/core';
import { DoctorSelectService } from 'app/main/services/doctor-select.service';
import { FormInputComponent } from '../form-input/form-input.component';
import { HttpClient } from '@angular/common/http';
import { environment } from 'environments/environment';

@Component({
  selector: 'app-doctor-select',
  templateUrl: './doctor-select.component.html',
  styleUrls: ['./doctor-select.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DoctorSelectComponent),
      multi: true
    }
  ]
})
export class DoctorSelectComponent implements OnInit, AfterViewInit, OnDestroy, OnChanges, ControlValueAccessor {
  @Input() placeholder: string = 'Tìm kiếm theo mã/tên bác sĩ/cơ sở y tế...';
  @Input() label: string = '';
  @Input() disabled: boolean = false;
  @Input() size: string | null = null; // Size class (e.g., 'form-control-sm'), if null uses default
  @Input() focus: boolean = false; // Auto focus input when component initializes
  @Input() cityId: number | string | null = null; // Optional city ID to filter doctors
  @Input() filterCity: boolean = false; // Hiển thị filter city phía trước
  @Input() doctorId: number | null = null; // ID của bác sĩ đã chọn
  /**
   * Khi bật: bấm nút "X" (clear all) trên input doctor sẽ KHÔNG emit ra ngoài (không gọi `_onChange(null)` và không emit `onSelect`).
   * Nếu đang có một doctor trước đó, component sẽ khôi phục lại doctor cũ để tránh lệch state giữa UI và model parent.
   */
  @Input() ignoreClearAllModelChange: boolean = false;
  @Output() onSelect = new EventEmitter<any>();
  @Output() selectOpen = new EventEmitter<void>();
  @Output() selectClose = new EventEmitter<void>();
  @Output() onEnter = new EventEmitter<void>();

  @ViewChild('doctorInput') doctorInput!: FormInputComponent;

  public selectedDoctorId: number | null = null;
  private lastNonNullDoctorId: number | null = null;
  public doctorOptions: { label: string; value: number }[] = [];
  public doctorListSelect: any[] = [];
  public doctorTypeahead$ = new Subject<string>();
  public searchDoctorText = '';
  public reloading: boolean = false;
  public reloadButtonTitle: string = 'Tải lại danh sách';
  
  @Input() loadDetailConfigType: number = 0;

  // City filter properties
  public selectedCityId: string | null = null;
  public cityOptions: { label: string; value: string }[] = [];
  public loadingCities: boolean = false;

  private _unsubscribeAll: Subject<any>;
  private _onChange = (value: any) => { };
  private _onTouched = () => { };

  constructor(
    private doctorSelectService: DoctorSelectService,
    private cdr: ChangeDetectorRef,
    private http: HttpClient
  ) {
    this._unsubscribeAll = new Subject();
  }

  ngOnInit(): void {
    // Setup doctor search with typeahead
    this.doctorTypeahead$.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      takeUntil(this._unsubscribeAll)
    ).subscribe((keyword: string) => {
      this.searchDoctors(keyword);
    });

    // Ensure doctor data is loaded
    this.doctorSelectService.ensureDoctorsLoaded();

    // Load cities if filterCity is enabled
    if (this.filterCity) {
      this.loadCities();
    }
  }

  ngAfterViewInit(): void {
    // Preload doctors only if cityId is not set (original behavior)
    // If cityId is set, wait for user to type keyword
    if (!this.cityId) {
      this.doctorTypeahead$.next('');
    }

    // Auto focus input if focus input is true
    if (this.focus && !this.disabled) {
      // Delay để đảm bảo view đã render xong
      setTimeout(() => {
        this.focusInput();
      }, 100);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    // When cityId changes, trigger search again with current keyword
    if (changes['cityId'] && !changes['cityId'].firstChange) {
      // Update selectedCityId if filterCity is enabled
      if (this.filterCity) {
        this.selectedCityId = this.cityId ? String(this.cityId) : '';
      }
      // Re-search with current search text if available
      const currentKeyword = this.searchDoctorText || '';
      // If cityId is set, show all doctors in that city even without keyword
      // Otherwise, require keyword (original behavior)
      if (currentKeyword || this.cityId) {
        this.searchDoctors(currentKeyword);
      } else {
        // If no keyword and no cityId, clear the list (original behavior)
        this.doctorListSelect = [];
        this.doctorOptions = [];
        this.cdr.detectChanges();
      }
    }

    // Load cities if filterCity is enabled and it's the first time
    if (changes['filterCity'] && changes['filterCity'].currentValue && !changes['filterCity'].previousValue) {
      this.loadCities();
    }

    // Sync selectedCityId with cityId when cityId changes from outside
    if (changes['cityId'] && this.filterCity) {
      this.selectedCityId = this.cityId ? String(this.cityId) : '';
    }

    if (changes['doctorId'] && !changes['doctorId'].firstChange) {
      setTimeout(() => {
        this.setSelectedDoctorV2(Number(this.doctorId));
      }, 200);
    }


  }

  ngOnDestroy(): void {
    this._unsubscribeAll.next();
    this._unsubscribeAll.complete();
    this.doctorTypeahead$.complete();
  }

  /**
   * Search doctors from localStorage
   */
  searchDoctors(keyword: string): void {
    const filtered = this.doctorSelectService.searchDoctors(keyword, this.cityId);
    this.doctorListSelect = filtered;
    this.doctorOptions = filtered;
    this.cdr.detectChanges();
  }

  searchDoctorsV2(keyword: string): void {
    const filtered = this.doctorSelectService.searchDoctorsV2(keyword, this.cityId);
    this.doctorListSelect = filtered;
    this.doctorOptions = filtered;
    this.cdr.detectChanges();
  }

  getTitleFromOptions(doctorId: number): string {
    const doctor = this.doctorSelectService.findDoctorById(doctorId);
    return doctor ? doctor.label : '';
  }

  /**
   * Handle doctor selection from select-search
   */
  async onDoctorSelect(event: any) {
    if (event === null || event === undefined) {
      if (this.ignoreClearAllModelChange && this.lastNonNullDoctorId != null) {
        // Khôi phục lại selection trước đó, không emit change model ra parent.
        const restoreId = this.lastNonNullDoctorId;
        this.selectedDoctorId = restoreId;
        let found = this.doctorListSelect.find(d => d.id === restoreId || d.value === restoreId);
        if (!found) {
          found = this.doctorSelectService.findDoctorById(restoreId);
        }

        if (found) {
          this.searchDoctorText = found.label || `${String(found.id || found.value || '').padStart(5, '0')} - ${found.doctorName || found.name || ''}`;
          this.doctorOptions = [found];
          this.doctorListSelect = [found];
        } else {
          this.searchDoctorText = '';
        }
        this.cdr.detectChanges();
        return;
      }

      this.selectedDoctorId = null;
      this.searchDoctorText = '';
      this._onChange(null);
      this.onSelect.emit(null);
      return;
    }

    // event from select-search is the id value
    const id = typeof event === 'string' ? parseInt(event, 10) : (typeof event === 'number' ? event : event.id || event.value);
    this.selectedDoctorId = id;
    if (id != null && !Number.isNaN(Number(id))) {
      this.lastNonNullDoctorId = Number(id);
    }

    // Find the doctor object from current list or localStorage
    let found = this.doctorListSelect.find(d => d.id === id || d.value === id);
    if (!found) {
      found = this.doctorSelectService.findDoctorById(id);
    }

    if (found) {
      this.searchDoctorText = found.label || `${String(found.id || found.value || '').padStart(5, '0')} - ${found.doctorName || found.name || ''}`;
      if(this.loadDetailConfigType) {
        switch(this.loadDetailConfigType) {

          //loại 1: lấy full config
          case 1:
            let resp = await this.doctorSelectService.getDoctorDetailConfig(id);
            // this.doctorListSelect = this.doctorListSelect.map(d => {
            //   if(d.id === id) {
            //     return {
            //       ...d,
            //       comment: resp.comment
            //     };
            //   }
            //   return d;
            // });
            break;
          // loại 2: chỉ lấy các ghi chú
          case 2:
            let comment = await this.doctorSelectService.getDoctorComment(id);
            found.comment = comment.comment;
            break;
          default:
            break;
        }

       
      }
      this._onChange(id);
      this.onSelect.emit(found);
    } else {
      this._onChange(id);
      this.onSelect.emit({ id });
    }
  }

  /**
   * Handle typeahead search change
   */
  onDoctorSearchChange(searchText: string): void {
    if (searchText) {
      this.doctorTypeahead$.next(searchText);
    } else {
      this.doctorListSelect = [];
      this.doctorOptions = [];
    }
  }

  /**
   * Handle Enter key
   */
  onDoctorEnter(): void {
    this.onEnter.emit();
  }

  /**
   * Clear search - reset to initial state (show placeholder, no clear button)
   */
  clearSearch(): void {
    this.selectedDoctorId = null;
    this.searchDoctorText = '';
    this.doctorListSelect = [];
    this.doctorOptions = [];
    this._onChange(null);
    this.onSelect.emit(null);
    if (this.doctorInput) {
      // This will reset model to null and clear ng-select properly
      this.doctorInput.clearSearchAll();
    }
    this.cdr.detectChanges();
  }

  /**
   * Set selected doctor by ID (useful for loading from URL params)
   */
  setSelectedDoctor(doctorId: number): void {
    if (doctorId) {
      const doctor = this.doctorSelectService.findDoctorById(doctorId);
      if (doctor) {
        this.selectedDoctorId = doctorId;
        this.searchDoctorText = doctor.label;
        this._onChange(doctorId);
        this.onSelect.emit(doctor);
      } else {
        this.selectedDoctorId = doctorId;
        this._onChange(doctorId);
      }
      this.cdr.detectChanges();
    }
  }

  setSelectedDoctorV2(doctorId: number): void {
    if (doctorId) {
      this.searchDoctorsV2(doctorId.toString());
      const doctor = this.doctorSelectService.findDoctorById(doctorId);
      if (doctor) {
        this.selectedDoctorId = doctorId;
        this.searchDoctorText = doctor.label;
        this._onChange(doctorId);
        this.onSelect.emit(doctor);
      } else {
        this.selectedDoctorId = doctorId;
        this._onChange(doctorId);
      }
      this.cdr.detectChanges();
    }
  }

  /**
   * Set selected doctor with explicit label (used when doctor may not be in local cache)
   */
  setSelectedDoctorWithLabel(doctorId: any, label: string): void {
    console.log('[DoctorSelect] setSelectedDoctorWithLabel called', { doctorId, label });
    if (!doctorId && !label) {
      console.log('[DoctorSelect] no doctorId and no label, skipping');
      return;
    }

    const numId = typeof doctorId === 'number' ? doctorId : parseInt(String(doctorId), 10);
    const resolvedId = isNaN(numId) ? doctorId : numId;

    // Try to find in cache first
    const cached = resolvedId ? this.doctorSelectService.findDoctorById(resolvedId) : null;
    console.log('[DoctorSelect] cached doctor:', cached);

    if (cached) {
      // Ensure the option is in the list so ng-select can display the label
      this.doctorOptions = [cached];
      this.doctorListSelect = [cached];
      this.selectedDoctorId = cached.value ?? cached.id;
      this.searchDoctorText = cached.label;
      this._onChange(this.selectedDoctorId);
      this.onSelect.emit(cached);
      console.log('[DoctorSelect] set from cache:', cached.label);
    } else {
      // Build a synthetic option so ng-select can find and display it
      const displayLabel = label || String(doctorId);
      const syntheticDoctor: any = {
        id: resolvedId,
        value: resolvedId,
        label: displayLabel,
        doctorName: label,
        name: label
      };
      this.doctorOptions = [syntheticDoctor];
      this.doctorListSelect = [syntheticDoctor];
      this.selectedDoctorId = resolvedId;
      this.searchDoctorText = displayLabel;
      this._onChange(resolvedId);
      this.onSelect.emit(syntheticDoctor);
      console.log('[DoctorSelect] set from synthetic label:', displayLabel);
    }
    this.cdr.detectChanges();
  }

  // ControlValueAccessor implementation
  writeValue(value: any): void {
    if (value !== null && value !== undefined) {
      this.setSelectedDoctor(typeof value === 'number' ? value : (value.id || value));
    } else {
      this.selectedDoctorId = null;
      this.searchDoctorText = '';
    }
  }

  registerOnChange(fn: any): void {
    this._onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this._onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  /**
   * Focus input
   */
  focusInput(): void {
    if (this.doctorInput) {
      this.doctorInput.focusInput();
    }
  }

  /**
   * Reload cache - clear localStorage and fetch fresh data from API
   */
  reloadCache(): void {
    this.reloading = true;
    this.doctorSelectService.reloadDoctors().subscribe({
      next: () => {
        this.reloading = false;
        // Clear current search results
        this.doctorListSelect = [];
        this.doctorOptions = [];
        // Clear selected value
        this.selectedDoctorId = null;
        this.searchDoctorText = '';
        this._onChange(null);
        this.onSelect.emit(null);
        if (this.doctorInput) {
          this.doctorInput.clearSearchAll();
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error reloading doctors:', error);
        this.reloading = false;
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Load cities from API
   */
  loadCities(): void {
    if (this.loadingCities) {
      return;
    }
    this.loadingCities = true;
    const apiUrl = `${environment.apiUrl}/config/doctor-config/cities-all`;
    this.http.get<any>(apiUrl).subscribe({
      next: (response) => {
        this.loadingCities = false;
        const cities = response?.data || [];
        // Format cities for select: "Tất cả" option + city list
        this.cityOptions = [
          { label: 'Tất cả', value: '' }
        ];
        cities.forEach((city: any) => {
          this.cityOptions.push({
            label: city.name || city.id || '',
            value: city.id || ''
          });
        });
        // Set selectedCityId based on cityId input
        // If cityId is set, use it; otherwise default to "Tất cả"
        if (this.cityId) {
          this.selectedCityId = String(this.cityId);
        } else {
          this.selectedCityId = '';
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading cities:', error);
        this.loadingCities = false;
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Handle city selection change
   */
  onCityChange(cityId: string | null): void {
    this.selectedCityId = cityId;
    // Update cityId input
    this.cityId = cityId && cityId !== '' ? cityId : null;

    // Clear selected doctor when city changes
    this.selectedDoctorId = null;
    this.searchDoctorText = '';
    this._onChange(null);
    this.onSelect.emit(null);
    if (this.doctorInput) {
      this.doctorInput.clearSearchAll();
    }

    // Clear doctor list
    this.doctorListSelect = [];
    this.doctorOptions = [];

    // If city is selected, show all doctors in that city
    if (this.cityId) {
      this.searchDoctors('');
    }

    this.cdr.detectChanges();
  }
}

