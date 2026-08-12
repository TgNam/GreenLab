import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy, ChangeDetectorRef, HostListener, Renderer2, NgZone } from '@angular/core';
import { FlatpickrOptions } from 'ng2-flatpickr';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import flatpickr from 'flatpickr';

// Vietnamese locale for flatpickr
const vietnameseLocale = {
  weekdays: {
    shorthand: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'],
    longhand: ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy']
  },
  months: {
    shorthand: ['Th1', 'Th2', 'Th3', 'Th4', 'Th5', 'Th6', 'Th7', 'Th8', 'Th9', 'Th10', 'Th11', 'Th12'],
    longhand: ['Tháng một', 'Tháng hai', 'Tháng ba', 'Tháng tư', 'Tháng năm', 'Tháng sáu', 'Tháng bảy', 'Tháng tám', 'Tháng chín', 'Tháng mười', 'Tháng mười một', 'Tháng mười hai']
  },
  firstDayOfWeek: 1,
  rangeSeparator: ' đến ',
  weekAbbreviation: 'Tu',
  scrollTitle: 'Cuộn để tăng',
  toggleTitle: 'Nhấp để chuyển',
  amPM: ['AM', 'PM'],
  yearAriaLabel: 'Năm',
  monthAriaLabel: 'Tháng',
  hourAriaLabel: 'Giờ',
  minuteAriaLabel: 'Phút',
  time_24hr: true
};

@Component({
  selector: 'app-datetime-adapter',
  template: `
   <div *ngIf="!floating" class="input-group" [ngClass]="size ? 'flatpickr-size-' + size.replace('form-control-', '') : ''" [class.disabled]="disabled">
     <div class="calendar-input-wrapper">
       <ng2-flatpickr
         #flatpickr
         [(ngModel)]="flatpickrValue"
         [config]="flatpickrConfig"
         [placeholder]="placeholder"
         [disabled]="disabled"
         (keydown.enter)="handleEnter($event)">
       </ng2-flatpickr>
       <button class="calendar-icon-btn" [class.calendar-icon-btn-sm]="size === 'form-control-sm'" (click)="!disabled && openFlatpickr()" type="button" [disabled]="disabled">
         <i class="fa fa-calendar-o"></i>
       </button>
     </div>
   </div>

  <div *ngIf="floating" class="input-group custom-floating-calendar"  [ngClass]="size ? 'flatpickr-size-' + size.replace('form-control-', '') : ''"
     [class.is-active]="isFocused || (timestamp && !timestamp.includes('undefined') && !timestamp.includes('NaN'))">
  
  <div class="field-wrapper calendar-input-wrapper">
    <!-- Nhãn bay -->
    <label class="floating-label">{{ label }}</label>

    <ng2-flatpickr
      #flatpickr
      style="width: 100%;"
      [(ngModel)]="flatpickrValue"
      [config]="flatpickrConfig"
      [placeholder]="''" 
      (focusin)="isFocused = true"
      (focusout)="isFocused = false"
      [disabled]="disabled">
    </ng2-flatpickr>

    <!-- Nút icon lịch (Input Group giả) -->
    <button class="calendar-icon-btn calendar-icon-btn-sm" (click)="!disabled && openFlatpickr()">
      <i class="fa fa-calendar"></i>
    </button>
  </div>
</div>
  `,
  styleUrls: ['./form-input.component.scss']
})
export class DatetimeAdapterComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
  @Input() mode: 'datetime' | 'date' = 'datetime'; // Mode: 'datetime' for datetime, 'date' for date only
  @Input() timestamp: any | null = null; // Format: YYYY-MM-dd HH:mm
  @Input() placeholder: string = 'HH:mm dd-mm-yyyy';
  /** Format hiển thị (flatpickr altFormat). Ví dụ: 'H:i d/m' = hh:mm dd/mm, 'H:i d/m/Y' = hh:mm dd/mm/yyyy. Mặc định rỗng = dùng format theo mode. */
  @Input() displayFormat: string = '';
  @Input() disabled: boolean = false;
  @Input() label: string = '';
  @Input() floating: boolean = false;

  @Input() size: string | null = null; // Size class (e.g., 'form-control-sm'), if null uses 'form-control'
  @Output() timestampChange = new EventEmitter<string | null>(); // Emit string format YYYY-MM-dd HH:mm
  @Output() enterKey = new EventEmitter<Event>();
  @Output() blur = new EventEmitter<void>(); // Emit when datetime picker loses focus
  isFocused = false;
  @ViewChild('flatpickr') flatpickrElement: any;

  flatpickrValue: Date | null = null;
  private flatpickrInstance: any = null;
  private isDatepickerOpen = false;
  private hasEmittedFromOnChange = false; // Track if onChange has emitted to avoid duplicate emissions
  private langChangeSubscription: Subscription;
  private clickHandlers: { altFocus?: () => void; input?: () => void; altInput?: () => void; todayButton?: () => void; altInputClick?: (e: MouseEvent) => void; altInputMouseDown?: (e: MouseEvent) => void } = {}; // Store click handlers for cleanup
  private focusHandlers: { altFocus?: () => void; altInput?: (e: KeyboardEvent) => void; altInputBlur?: () => void; altInputInput?: (e: Event) => void; altInputKeydown?: (e: KeyboardEvent) => void; altInputDblclick?: (e: MouseEvent) => void } = {}; // Store focus handlers for cleanup
  private currentLang: string = 'en';
  private todayButtonElement: HTMLElement | null = null;
  private isInitialFocus = true; // Track if this is the first focus
  private originalValueOnFocus: string = ''; // Store original value when focus to revert on blur if invalid
  private previousInputValue: string = ''; // Track previous input value to detect new input
  private isClickEvent: boolean = false; // Track if focus was caused by click event
  private clickedCursorPosition: number = -1; // Store cursor position from click
  private isMouseDraggingSelection: boolean = false; // Track drag selection to avoid overriding user highlight
  private escapeKeydownListener: ((e: KeyboardEvent) => void) | null = null; // ESC khi calendar mở → đóng + blur, không để focus nhảy vào input

  /** Gõ số liên tiếp trên alt input: gom buffer, flush sau 150ms im lặng (hoặc flush ngay khi gặp phím điều khiển / : /). */
  private alt_input_keydown_digit_buffer = '';
  /** Browser: setTimeout trả về number (tránh xung đột kiểu với NodeJS.Timeout). */
  private alt_input_keydown_debounce_timer: number | null = null;
  private alt_input_keydown_flush_playback = false;
  private static readonly ALT_INPUT_KEYDOWN_DEBOUNCE_MS = 20;

  flatpickrConfig: FlatpickrOptions;

  constructor(private translate: TranslateService, private cdr: ChangeDetectorRef, private ngZone: NgZone, private renderer: Renderer2) {
    // Initialize current language
    this.currentLang = this.translate.currentLang || 'en';

    // Initialize flatpickr config
    this.flatpickrConfig = {
      ignoredFocusElements: [window.document.body],
      altInput: true,
      enableTime: this.mode === 'date' ? false : true,
      closeOnSelect: false, // Always false - let user click outside to close for consistent UX
      time_24hr: this.mode === 'date' ? false : true,
      // Giá trị thực (bind vào model) - format: YYYY-MM-dd HH:mm
      dateFormat: this.mode === 'date' ? 'Y-m-d' : 'Y-m-d H:i',
      // Giá trị hiển thị: dùng displayFormat nếu có, không thì mặc định theo mode
      altFormat: this.getAltFormat(),
      allowInput: !this.disabled, // Disable input when disabled
      clickOpens: !this.disabled, // Disable click to open when disabled
      disableMobile: true,
      locale: this.getLocale(),
      onChange: (selectedDates: Date[], dateStr: string, instance: any) => {
        this.flatpickrInstance = instance;
        if (selectedDates.length > 0) {
          this.isDatepickerOpen = false;
        }
        // Mark that onChange has emitted to prevent safeClose from emitting duplicate
        this.hasEmittedFromOnChange = true;
        this.onDateTimeChange(selectedDates);
        // Reset flag after a short delay
        setTimeout(() => {
          this.hasEmittedFromOnChange = false;
        }, 100);
      },
      onOpen: () => {
        this.ignoreNextDocumentClick = true;
        this.isDatepickerOpen = true;
        this.attachEscapeHandler();
        // Add today button when calendar opens
        this.addTodayButton();

      },
      onClose: () => {
        this.isDatepickerOpen = false;
        this.removeEscapeHandler();
        // Remove today button when calendar closes
        this.removeTodayButton();
      },
      onReady: (selectedDates: Date[], dateStr: string, instance: any) => {
        this.flatpickrInstance = instance;
        // Add today button when calendar is ready
        this.addTodayButton();

      }
    };

    // Listen to language changes
    this.langChangeSubscription = this.translate.onLangChange.subscribe(event => {
      this.currentLang = event.lang;
      this.updateLocale();
    });
  }

  ngOnInit(): void {
    // Track datepicker open/close state
    this.currentLang = this.translate.currentLang || 'en';
    this.updateLocale();
  }

  ngOnDestroy(): void {
    this.clearAltInputKeydownDigitDebounce();
    this.detachAltInputDocumentSelectionListener();

    if (this.langChangeSubscription) {
      this.langChangeSubscription.unsubscribe();
    }
    // Clean up click event listeners
    if (this.flatpickrInstance) {
      if (this.flatpickrInstance.input && this.clickHandlers.input) {
        this.flatpickrInstance.input.removeEventListener('click', this.clickHandlers.input);
      }
      if (this.flatpickrInstance.altInput && this.clickHandlers.altInput) {
        this.flatpickrInstance.altInput.removeEventListener('click', this.clickHandlers.altInput);
      }
      // Clean up focus handlers
      if (this.flatpickrInstance.altInput) {
        const altInputEl = this.flatpickrInstance.altInput as HTMLInputElement;
        if (this.focusHandlers.altInput) {
          altInputEl.removeEventListener('focus', this.focusHandlers.altInput);
        }
        if (this.focusHandlers.altInputBlur) {
          altInputEl.removeEventListener('blur', this.focusHandlers.altInputBlur);
        }
        if (this.focusHandlers.altInputInput) {
          altInputEl.removeEventListener('input', this.focusHandlers.altInputInput);
        }
        if (this.focusHandlers.altInputKeydown) {
          altInputEl.removeEventListener('keydown', this.focusHandlers.altInputKeydown);
          altInputEl.removeEventListener('keydown', this.focusHandlers.altInputKeydown, true);
        }
        if (this.clickHandlers.altInputClick) {
          altInputEl.removeEventListener('click', this.clickHandlers.altInputClick);
        }
        if (this.clickHandlers.altInputMouseDown) {
          altInputEl.removeEventListener('mousedown', this.clickHandlers.altInputMouseDown);
        }
        if (this.focusHandlers.altInputDblclick) {
          altInputEl.removeEventListener('dblclick', this.focusHandlers.altInputDblclick);
        }
      }
    }
    // Remove today button and ESC handler
    this.removeTodayButton();
    this.removeEscapeHandler();
    this.clickHandlers = {};
    this.focusHandlers = {};
  }

  /** Trả về altFormat: dùng displayFormat nếu có (khác rỗng), không thì mặc định theo mode. */
  private getAltFormat(): string {
    if (this.displayFormat != null && this.displayFormat.trim() !== '') {
      return this.displayFormat.trim();
    }
    return this.mode === 'date' ? 'd/m/Y' : 'H:i d/m/Y';
  }

  private getLocale(): any {
    if (this.currentLang === 'vn' || this.currentLang === 'vi') {
      return vietnameseLocale;
    }
    // English default - use flatpickr's default locale
    try {
      return flatpickr.l10ns?.default || {};
    } catch {
      return {};
    }
  }

  private updateLocale(): void {
    if (this.flatpickrInstance) {
      const newLocale = this.getLocale();
      this.flatpickrInstance.set('locale', newLocale);
      this.flatpickrConfig.locale = newLocale;
      // Update today button text if it exists
      if (this.todayButtonElement) {
        this.todayButtonElement.textContent = this.currentLang === 'vn' || this.currentLang === 'vi' ? 'Hôm nay' : 'Today';
      }
    }
  }

  private documentClickUnlistener: (() => void) | null = null;

  ngAfterViewInit(): void {
    // Get flatpickr instance after view init
    if (this.flatpickrElement && this.flatpickrElement.flatpickr) {
      this.flatpickrInstance = this.flatpickrElement.flatpickr;
      this.updateLocale();
      // Add today button if calendar is open
      if (this.flatpickrInstance && this.flatpickrInstance.isOpen) {
        setTimeout(() => {
          this.addTodayButton();
        }, 100);
      }
      // Apply disabled state if needed
      if (this.disabled && this.flatpickrInstance) {
        // Set input as disabled
        setTimeout(() => {
          if (this.flatpickrInstance) {
            if (this.flatpickrInstance.input) {
              const inputEl = this.flatpickrInstance.input as HTMLInputElement;
              inputEl.disabled = true;
              inputEl.setAttribute('tabindex', '-1');
              inputEl.style.pointerEvents = 'none';
              inputEl.style.backgroundColor = '#e9ecef'; // Force background color
              inputEl.style.color = '#6c757d'; // Force text color
              inputEl.style.cursor = 'not-allowed'; // Force cursor
            }
            if (this.flatpickrInstance.altInput) {
              const altInputEl = this.flatpickrInstance.altInput as HTMLInputElement;
              altInputEl.disabled = true;
              altInputEl.setAttribute('tabindex', '-1');
              altInputEl.style.pointerEvents = 'none';
              altInputEl.style.backgroundColor = '#e9ecef'; // Force background color
              altInputEl.style.color = '#6c757d'; // Force text color
              altInputEl.style.cursor = 'not-allowed'; // Force cursor
            }
          }
        }, 0);
      } else if (!this.disabled && this.flatpickrInstance) {
        // Add click event listener to open flatpickr when clicking on input
        if (this.flatpickrInstance.altInput) {
          const altInputEl = this.flatpickrInstance.altInput as HTMLInputElement;
          // Remove existing listener if any
          if (this.clickHandlers.altInput) {
            altInputEl.removeEventListener('click', this.clickHandlers.altInput);
          }
          // Create and store new handler
          this.clickHandlers.altInput = () => {
            if (!this.disabled && this.flatpickrInstance && !this.flatpickrInstance.isOpen) {
              this.flatpickrInstance.open();
            }
          };
          altInputEl.addEventListener('click', this.clickHandlers.altInput);

          // Add click handler to highlight the part being clicked (after flatpickr opens)
          this.setupClickHandler(altInputEl);

          // Add focus handler for smart input navigation
          this.setupFocusHandlers(altInputEl);
        }
        // Also add to main input if it exists
        if (this.flatpickrInstance.input) {
          const inputEl = this.flatpickrInstance.input as HTMLInputElement;
          // Remove existing listener if any
          if (this.clickHandlers.input) {
            inputEl.removeEventListener('click', this.clickHandlers.input);
          }
          // Create and store new handler
          this.clickHandlers.input = () => {
            if (!this.disabled && this.flatpickrInstance && !this.flatpickrInstance.isOpen) {
              this.flatpickrInstance.open();
            }
          };
          inputEl.addEventListener('click', this.clickHandlers.input);
        }
      }
    }
    this.ngZone.runOutsideAngular(() => {
      this.documentClickUnlistener = this.renderer.listen('document', 'click', (event: MouseEvent) => {
        this.handleDocumentClick(event);
      });
    });

  }

  private handleDocumentClick(event: MouseEvent): void {
    if (!this.flatpickrInstance) return;

    const target = event.target as Node;
    if (!target) return;

    const inputEl = this.flatpickrInstance.altInput as HTMLInputElement;
    if (this.ignoreNextDocumentClick) {
      this.ignoreNextDocumentClick = false;
      return;
    }
    const calendarEl = this.flatpickrInstance.calendarContainer as HTMLElement;
    // Kiểm tra xem calendar có đang mở không
    if (!calendarEl || !calendarEl.classList.contains('open')) {
      return;
    }


    // Kiểm tra click có trong input không
    const clickInsideInput = inputEl && inputEl.contains(target);

    // Kiểm tra click có trong calendar container không
    // Cần kiểm tra cả calendarEl và các phần tử con của nó
    let clickInsideCalendar = false;
    if (calendarEl) {
      clickInsideCalendar = calendarEl.contains(target);
      // Fallback: kiểm tra bằng class name nếu contains không hoạt động
      if (!clickInsideCalendar) {
        // const flatpickrElements = document.querySelectorAll('.flatpickr-calendar, .flatpickr-calendar *');
        // for (let i = 0; i < flatpickrElements.length; i++) {
        //   if (flatpickrElements[i].contains(target)) {
        //     clickInsideCalendar = true;
        //     break;
        //   }
        // }
        if (calendarEl.contains(target)) {
          clickInsideCalendar = true;
        }
      }
    }

    // Chỉ đóng calendar nếu click ở ngoài cả input và calendar
    if (!clickInsideInput && !clickInsideCalendar) {
      calendarEl.classList.remove('open');
      this.safeClose();
    }
  }

  private ignoreNextDocumentClick = false;

  private getSmartSegment(value: string, pos: number): { start: number, end: number } {
    // Các ký tự phân cách định dạng date/time
    const delimiters = ['/', ':', ' '];

    // Tìm ranh giới bên trái (vị trí dấu phân cách gần nhất trước con trỏ)
    let start = 0;
    for (let i = pos - 1; i >= 0; i--) {
      if (delimiters.includes(value[i])) {
        start = i + 1;
        break;
      }
    }

    // Tìm ranh giới bên phải (vị trí dấu phân cách gần nhất sau con trỏ)
    let end = value.length;
    for (let i = pos; i < value.length; i++) {
      if (delimiters.includes(value[i])) {
        end = i;
        break;
      }
    }

    return { start, end };
  }

  /** DEBUG: log mọi lần chỉnh selection — gỡ hoặc comment khi không debug. */
  private debugSetSelectionRange(input: HTMLInputElement, start: number, end: number, tag: string): void {
    const val = input.value || '';
    input.setSelectionRange(start, end);
  }

  public isSelectionChange = false;

  /** Chỉ gắn khi alt input đang focus — tránh HostListener document chạy mọi lúc / mọi input. */
  private alt_input_document_selection_attached = false;
  private readonly on_alt_input_document_selection_change = (): void => {
    const inst = this.flatpickrInstance;
    if (!inst) {
      return;
    }
    const alt_el = inst.altInput as HTMLInputElement | undefined;
    if (!alt_el || document.activeElement !== alt_el) {
      return;
    }
    // Đang kéo chuột để bôi đen: không ép segment — tránh chặn chọn cả dòng / xóa hết.
    if (this.isMouseDraggingSelection) {
      return;
    }
    const input = alt_el;
    const value_len = (input.value || '').length;
    const current_start = input.selectionStart ?? 0;
    const current_end = input.selectionEnd ?? 0;
    const selection_length = current_end - current_start;

    if ((value_len > 0 && current_start === 0 && current_end >= value_len) || (value_len == current_start && current_end == value_len)) {
      return;
    }

    if (selection_length <= 1 && input.value && this.numberInput < 2) {
      const { start, end } = this.getSmartSegment(input.value, current_start);
      if (start !== current_start || end !== current_end) {
        this.debugSetSelectionRange(input, start, end, 'selectionchange:getSmartSegment');
      }
    }
  };

  /**
   * Đóng calendar khi click ra ngoài — chỉ đăng ký document trong lúc picker mở (onOpen),
   * gỡ ở onClose / destroy; đúng instance qua flatpickrInstance + altInput.
   */
  private calendar_outside_click_attached = false;
  private readonly on_calendar_outside_click = (event: MouseEvent): void => {
    if (!this.flatpickrInstance) {
      return;
    }
    const target = event.target as Node | null;
    if (!target) {
      return;
    }
    if (this.ignoreNextDocumentClick) {
      this.ignoreNextDocumentClick = false;
      return;
    }
    const inst = this.flatpickrInstance;
    const calendar_el = inst.calendarContainer as HTMLElement | undefined;
    if (!calendar_el || !calendar_el.classList.contains('open')) {
      return;
    }
    const input_el = inst.input as HTMLInputElement | undefined;
    const alt_el = inst.altInput as HTMLInputElement | undefined;
    const click_inside_input =
      (input_el && input_el.contains(target)) || (alt_el && alt_el.contains(target));
    const click_inside_calendar = calendar_el.contains(target);
    if (!click_inside_input && !click_inside_calendar) {
      calendar_el.classList.remove('open');
      this.safeClose();
    }
  };


  private attachAltInputDocumentSelectionListener(): void {
    if (this.alt_input_document_selection_attached) {
      return;
    }
    // document.addEventListener('selectionchange', this.on_alt_input_document_selection_change);
    this.alt_input_document_selection_attached = true;
  }

  private detachAltInputDocumentSelectionListener(): void {
    if (!this.alt_input_document_selection_attached) {
      return;
    }
    // document.removeEventListener('selectionchange', this.on_alt_input_document_selection_change);
    this.alt_input_document_selection_attached = false;
  }


  private safeClose(): void {
    const altInput = this.flatpickrInstance?.altInput as HTMLInputElement | undefined;
    if (this.last_value && !String(this.last_value).includes('m') && !String(this.last_value).includes('d') && !String(this.last_value).includes('H') && !String(this.last_value).includes('M')) {
      altInput.value = this.last_value;
      this.normalizeYearWhenLeavePart(altInput, this.mode === 'date');
      this.timestamp = this.convertDateStringToTimestamp(altInput.value);
      this.timestampChange.emit(this.timestamp);
    }
    // Only emit if onChange hasn't already emitted (to avoid duplicate emissions)
    // This typically happens when user manually edits the input without selecting from calendar
    if (this.flatpickrValue instanceof Date && !this.hasEmittedFromOnChange) {
      const emitValue = this.dateToString(this.flatpickrValue);
      this.timestampChange.emit(emitValue);
    }

    setTimeout(() => {
      this.flatpickrInstance?.close();
      this.enterKey.emit(null);
      this.blur.emit(); // Emit blur event khi đóng calendar
    }, 0);
  }



  public instance: any = null;



  ngOnChanges(changes: SimpleChanges): void {
    if (changes['displayFormat']) {
      this.displayFormat = (changes['displayFormat'].currentValue ?? '').toString();
      this.flatpickrConfig.altFormat = this.getAltFormat();
      if (this.flatpickrInstance) {
        this.flatpickrInstance.set('altFormat', this.flatpickrConfig.altFormat);
      }
      this.cdr.detectChanges();
    }
    if (changes['mode']) {
      this.mode = changes['mode'].currentValue;

      this.flatpickrConfig = {
        ignoredFocusElements: [window.document.body],
        altInput: true,
        enableTime: this.mode === 'date' ? false : true,
        closeOnSelect: false, // Always false - let user click outside to close for consistent UX
        time_24hr: this.mode === 'date' ? false : true,
        // Giá trị thực (bind vào model) - format: YYYY-MM-dd HH:mm
        dateFormat: this.mode === 'date' ? 'Y-m-d' : 'Y-m-d H:i',
        // Giá trị hiển thị: dùng displayFormat nếu có
        altFormat: this.getAltFormat(),
        allowInput: !this.disabled, // Disable input when disabled
        clickOpens: !this.disabled, // Disable click to open when disabled
        disableMobile: true,
        locale: this.getLocale(),
        onChange: (selectedDates: Date[], dateStr: string, instance: any) => {
          if (!selectedDates || selectedDates.length === 0) {
            return;
          }
          this.flatpickrInstance = instance;
          if (selectedDates.length > 0) {
            this.isDatepickerOpen = false;
          }
          // Mark that onChange has emitted to prevent safeClose from emitting duplicate
          this.hasEmittedFromOnChange = true;
          this.onDateTimeChange(selectedDates);
          // Reset flag after a short delay
          setTimeout(() => {
            this.hasEmittedFromOnChange = false;
          }, 100);
        },
        onOpen: (selectedDates, dateStr, instance) => {

          this.ignoreNextDocumentClick = true;
          this.isDatepickerOpen = true;
          this.instance = instance;
          this.attachEscapeHandler();
          // Add today button when calendar opens
          this.addTodayButton();
        },
        onClose: (selectedDates, dateStr, instance) => {
          this.isDatepickerOpen = false;
          this.removeEscapeHandler();
          // Remove today button when calendar closes
          this.removeTodayButton();
        },
        onReady: (selectedDates: Date[], dateStr: string, instance: any) => {
          this.flatpickrInstance = instance;
          // Add today button when calendar is ready
          this.addTodayButton();
        }
      };
      this.cdr.detectChanges();
    }
    // Handle disabled change
    else if (changes['disabled']) {
      // Update flatpickr config
      this.flatpickrConfig.clickOpens = !this.disabled;
      this.flatpickrConfig.allowInput = !this.disabled;
      // Note: flatpickr's disable option expects an array of dates or functions, 
      // but we want to disable the entire picker, so we'll use instance methods

      // Update flatpickr instance if available
      if (this.flatpickrInstance) {
        // Update config on instance
        if (this.flatpickrInstance.config) {
          this.flatpickrInstance.config.clickOpens = !this.disabled;
          this.flatpickrInstance.config.allowInput = !this.disabled;
        }

        if (this.disabled) {
          // Disable flatpickr - close if open and disable input
          if (this.flatpickrInstance.isOpen) {
            this.flatpickrInstance.close();
          }
          // Remove click event listeners
          if (this.flatpickrInstance.input && this.clickHandlers.input) {
            const inputEl = this.flatpickrInstance.input as HTMLInputElement;
            inputEl.removeEventListener('click', this.clickHandlers.input);
            delete this.clickHandlers.input;
          }
          if (this.flatpickrInstance.altInput && this.clickHandlers.altInput) {
            const altInputEl = this.flatpickrInstance.altInput as HTMLInputElement;
            altInputEl.removeEventListener('click', this.clickHandlers.altInput);
            delete this.clickHandlers.altInput;
          }
          // Set input as disabled
          setTimeout(() => {
            if (this.flatpickrInstance) {
              if (this.flatpickrInstance.input) {
                const inputEl = this.flatpickrInstance.input as HTMLInputElement;
                inputEl.disabled = true;
                inputEl.setAttribute('tabindex', '-1'); // Prevent tab focus
                inputEl.style.pointerEvents = 'none'; // Prevent click
                inputEl.style.backgroundColor = '#e9ecef'; // Force background color
                inputEl.style.color = '#6c757d'; // Force text color
                inputEl.style.cursor = 'not-allowed'; // Force cursor
              }
              if (this.flatpickrInstance.altInput) {
                const altInputEl = this.flatpickrInstance.altInput as HTMLInputElement;
                altInputEl.disabled = true;
                altInputEl.setAttribute('tabindex', '-1'); // Prevent tab focus
                altInputEl.style.pointerEvents = 'none'; // Prevent click
                altInputEl.style.backgroundColor = '#e9ecef'; // Force background color
                altInputEl.style.color = '#6c757d'; // Force text color
                altInputEl.style.cursor = 'not-allowed'; // Force cursor
              }
            }
          }, 0);
        } else {
          // Enable flatpickr
          setTimeout(() => {
            if (this.flatpickrInstance) {
              if (this.flatpickrInstance.input) {
                const inputEl = this.flatpickrInstance.input as HTMLInputElement;
                inputEl.disabled = false;
                inputEl.removeAttribute('tabindex');
                inputEl.style.pointerEvents = '';
                inputEl.style.backgroundColor = ''; // Reset background color
                inputEl.style.color = ''; // Reset text color
                inputEl.style.cursor = ''; // Reset cursor
                // Re-add click listener if not already added
                if (!this.clickHandlers.input) {
                  this.clickHandlers.input = () => {
                    if (!this.disabled && this.flatpickrInstance && !this.flatpickrInstance.isOpen) {
                      this.flatpickrInstance.open();
                    }
                  };
                  inputEl.addEventListener('click', this.clickHandlers.input);
                }
              }
              if (this.flatpickrInstance.altInput) {
                const altInputEl = this.flatpickrInstance.altInput as HTMLInputElement;
                altInputEl.disabled = false;
                altInputEl.removeAttribute('tabindex');
                altInputEl.style.pointerEvents = '';
                altInputEl.style.backgroundColor = ''; // Reset background color
                altInputEl.style.color = ''; // Reset text color
                altInputEl.style.cursor = ''; // Reset cursor
                // Re-add click listener if not already added
                if (!this.clickHandlers.altInput) {
                  this.clickHandlers.altInput = () => {
                    if (!this.disabled && this.flatpickrInstance && !this.flatpickrInstance.isOpen) {
                      this.flatpickrInstance.open();
                    }
                  };
                  altInputEl.addEventListener('click', this.clickHandlers.altInput);
                }
                // Re-add click and focus handlers
                this.setupClickHandler(altInputEl);
                this.setupFocusHandlers(altInputEl);
              }
            }
          }, 0);
        }
      }
    }

    if (changes['timestamp'] && this.timestamp != null && this.timestamp !== '') {
      this.syncFromString(this.timestamp);
      if (this.timestamp instanceof String && (this.timestamp.includes('undefined') || this.timestamp.includes('NaN'))) {
        this.isFocused = false;
      }
      else {
        this.isFocused = true;
      }
      this.isDatepickerOpen = false; // Reset state when value changes
    } else {
      this.isFocused = false;
      this.flatpickrValue = null;
      this.isDatepickerOpen = false;
      // Reset flatpickr instance value
      if (this.flatpickrInstance) {
        setTimeout(() => {
          this.flatpickrInstance.setDate(null, false);
        });
      }
    }
  }

  onDateTimeChange(selectedDates: Date[]): void {

    if (selectedDates && selectedDates.length > 0) {
      const date = selectedDates[0];
      const dateString = this.dateToString(date);
      this.timestampChange.emit(dateString);
      this.isDatepickerOpen = false; // Close datepicker after selection
    } else {
      this.timestampChange.emit(null);
    }
  }

  openFlatpickr(): void {
    // Don't open if disabled
    if (this.disabled) {
      return;
    }
    // Get instance if not already set
    if (!this.flatpickrInstance && this.flatpickrElement && this.flatpickrElement.flatpickr) {
      this.flatpickrInstance = this.flatpickrElement.flatpickr;
    }
    if (this.flatpickrInstance && !this.disabled) {
      this.flatpickrInstance.open();
    }
  }

  handleEnter(event: KeyboardEvent): void {
    // Don't handle enter if disabled
    if (this.disabled) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();

    // Get flatpickr instance if not already set
    if (!this.flatpickrInstance && this.flatpickrElement && this.flatpickrElement.flatpickr) {
      this.flatpickrInstance = this.flatpickrElement.flatpickr;
    }

    // Enter cũng chuẩn hóa year theo cùng rule khi rời part year.
    const alt_input = this.flatpickrInstance?.altInput as HTMLInputElement | undefined;
    if (alt_input) {
      this.normalizeYearWhenLeavePart(alt_input, this.mode === 'date');
      this.timestamp = this.convertDateStringToTimestamp(alt_input.value);
      this.timestampChange.emit(this.timestamp);
    }

    // Nếu đã có giá trị, chuyển sang input tiếp theo luôn
    if (this.timestamp !== null && this.timestamp !== undefined && this.timestamp !== '') {
      if (this.flatpickrInstance && this.isDatepickerOpen) {
        if (this.flatpickrInstance.close) {
          this.flatpickrInstance.close();
        }
        this.isDatepickerOpen = false;
      }
      setTimeout(() => {
        this.enterKey.emit(event);
      }, 50);
      return;
    }

    // Chưa có giá trị: Enter lần 1 mở datepicker, Enter lần 2 đóng và chuyển sang input khác
    if (this.isDatepickerOpen) {
      // Datepicker đang mở, Enter lần 2: đóng và chuyển sang input khác
      if (this.flatpickrInstance && this.flatpickrInstance.close) {
        this.flatpickrInstance.close();
      }
      this.isDatepickerOpen = false;
      setTimeout(() => {
        this.enterKey.emit(event);
      }, 150);
    } else {
      // Datepicker chưa mở, Enter lần 1: mở datepicker
      if (this.flatpickrInstance && this.flatpickrInstance.open) {
        this.flatpickrInstance.open();
      }
      this.isDatepickerOpen = true;
    }
  }

  private dateToString(date: Date): string {
    if (date != null) {
      const year = date.getFullYear().toString();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');

      if (this.mode === 'date') {
        // Format as YYYY-MM-dd for date mode
        return `${year}-${month}-${day}`;
      } else {
        // Format as YYYY-MM-dd HH:mm for datetime mode
        const hour = date.getHours().toString().padStart(2, '0');
        const minute = date.getMinutes().toString().padStart(2, '0');
        return `${year}-${month}-${day} ${hour}:${minute}`;
      }
    }
    return null;
  }

  /**
   * Validate phần vừa nhập xong trước khi chuyển sang part kế tiếp.
   * - Day chỉ hợp lệ 1..31, Month chỉ hợp lệ 1..12 (sai thì giữ part cũ).
   * - Khi chuyển month -> year và gặp 31/02 thì reset day = 28 (mặc định khi chưa có năm).
   */
  private validatePartBeforeAdvance(
    input: HTMLInputElement,
    isDateMode: boolean,
    partIndex: number,
    partText: string
  ): void {
    if (isDateMode) {
      const dayPartIndex = 0;
      const monthPartIndex = 1;
      if (partIndex === dayPartIndex) {
        const dayText = input.value.substring(0, 2);
        const dayValue = parseInt(dayText, 10);
        if (isNaN(dayValue) || dayValue <= 0 || dayValue > 31) {
          const restored = partText.replace(/\D/g, '').padStart(2, '0').substring(0, 2);
          input.value = restored + input.value.substring(2);
        }
      } else if (partIndex === monthPartIndex) {
        const monthText = input.value.substring(3, 5);
        const monthValue = parseInt(monthText, 10);
        if (isNaN(monthValue) || monthValue <= 0 || monthValue > 12) {
          const restoredMonth = partText.replace(/\D/g, '').padStart(2, '0').substring(0, 2);
          input.value = input.value.substring(0, 3) + restoredMonth + input.value.substring(5);
        }
        const dayAfterMonth = parseInt(input.value.substring(0, 2), 10);
        const monthAfterFix = parseInt(input.value.substring(3, 5), 10);
        if (!isNaN(dayAfterMonth) && !isNaN(monthAfterFix) && dayAfterMonth === 31 && monthAfterFix === 2) {
          input.value = '28' + input.value.substring(2);
        }
      }
    } else {
      const hourPartIndex = 0;
      const minutePartIndex = 1;
      const dayPartIndex = 2;
      const monthPartIndex = 3;
      if (partIndex === hourPartIndex) {
        const hourText = input.value.substring(0, 2);
        const hourValue = parseInt(hourText, 10);
        if (isNaN(hourValue) || hourValue < 0 || hourValue > 23) {
          const restoredHour = partText.replace(/\D/g, '').padStart(2, '0').substring(0, 2);
          input.value = restoredHour + input.value.substring(2);
        }
      } else if (partIndex === minutePartIndex) {
        const minuteText = input.value.substring(3, 5);
        const minuteValue = parseInt(minuteText, 10);
        if (isNaN(minuteValue) || minuteValue < 0 || minuteValue > 59) {
          const restoredMinute = partText.replace(/\D/g, '').padStart(2, '0').substring(0, 2);
          input.value = input.value.substring(0, 3) + restoredMinute + input.value.substring(5);
        }
      } else if (partIndex === dayPartIndex) {
        const dayText = input.value.substring(6, 8);
        const dayValue = parseInt(dayText, 10);
        if (isNaN(dayValue) || dayValue <= 0 || dayValue > 31) {
          const restored = partText.replace(/\D/g, '').padStart(2, '0').substring(0, 2);
          input.value = input.value.substring(0, 6) + restored + input.value.substring(8);
        }
      } else if (partIndex === monthPartIndex) {
        const monthText = input.value.substring(9, 11);
        const monthValue = parseInt(monthText, 10);
        if (isNaN(monthValue) || monthValue <= 0 || monthValue > 12) {
          const restoredMonth = partText.replace(/\D/g, '').padStart(2, '0').substring(0, 2);
          input.value = input.value.substring(0, 9) + restoredMonth + input.value.substring(11);
        }
        const dayAfterMonth = parseInt(input.value.substring(6, 8), 10);
        const monthAfterFix = parseInt(input.value.substring(9, 11), 10);
        if (!isNaN(dayAfterMonth) && !isNaN(monthAfterFix) && dayAfterMonth === 31 && monthAfterFix === 2) {
          input.value = input.value.substring(0, 6) + '28' + input.value.substring(8);
        }
      }
    }
  }

  private ensureYearFallbackAfterDelete(input: HTMLInputElement, isDateMode: boolean): void {
    const year_start = isDateMode ? 6 : 12;
    const current_value = input.value || '';
    const prefix = current_value.length >= year_start ? current_value.substring(0, year_start) : current_value;
    const year_text = current_value.length > year_start ? current_value.substring(year_start) : '';
    const year_digits = year_text.replace(/\D/g, '');
    if (year_digits.length === 0) {
      input.value = `${prefix}0`;
    }
  }

  private parseAndEmitDateValue(value: string): void {
    const formatRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    const match = value.match(formatRegex);

    if (match) {
      const day = parseInt(match[1], 10);
      const month = parseInt(match[2], 10);
      const year = parseInt(match[3], 10);

      // Validate date
      const date = new Date(year, month - 1, day);
      if (date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day) {
        // Valid date - format as YYYY-MM-dd and emit
        const dateString = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        if (this.timestamp !== dateString) {
          this.timestamp = dateString;
          this.timestampChange.emit(dateString);
        }
      }
    }
  }

  /**
   * Normalize date value: handle overflow values (e.g., 35/03 -> 05/04, 15/15 -> 03/03 next year)
   * @param value Input value in format "dd/mm/yyyy"
   * @returns Normalized value string
   */
  private normalizeDateValue(value: string): string {
    // Check if value matches the expected format
    const formatRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    const match = value.match(formatRegex);

    if (!match) {
      return value; // Return as-is if format doesn't match
    }

    let day = parseInt(match[1], 10);
    let month = parseInt(match[2], 10);
    let year = parseInt(match[3], 10);

    // Normalize months: if > 12, add to years
    if (month > 12) {
      const extraYears = Math.floor((month - 1) / 12);
      year += extraYears;
      month = ((month - 1) % 12) + 1;
    }

    // Normalize days: check valid days for the month
    const daysInMonth = new Date(year, month, 0).getDate();
    if (day > daysInMonth) {
      const extraMonths = Math.floor((day - 1) / daysInMonth);
      month += extraMonths;
      day = ((day - 1) % daysInMonth) + 1;

      // Re-check if month overflow after adding days
      if (month > 12) {
        const extraYears = Math.floor((month - 1) / 12);
        year += extraYears;
        month = ((month - 1) % 12) + 1;
      }
    }

    // Format back to string
    const dayStr = day.toString().padStart(2, '0');
    const monthStr = month.toString().padStart(2, '0');
    const yearStr = year.toString();

    return `${dayStr}/${monthStr}/${yearStr}`;
  }

  /**
   * Normalize datetime value: handle overflow values (e.g., 22:69 -> 23:09, 13/15 -> 01/03 next year)
   * @param value Input value in format "HH:MM dd/mm/yyyy"
   * @returns Normalized value string
   */
  private normalizeDateTimeValue(value: string): string {
    // Check if value matches the expected format
    const formatRegex = /^(\d{2}):(\d{2}) (\d{2})\/(\d{2})\/(\d{4})$/;
    const match = value.match(formatRegex);

    if (!match) {
      return value; // Return as-is if format doesn't match
    }

    let hour = parseInt(match[1], 10);
    let minute = parseInt(match[2], 10);
    let day = parseInt(match[3], 10);
    let month = parseInt(match[4], 10);
    let year = parseInt(match[5], 10);

    // Normalize minutes: if > 59, add to hours
    if (minute > 59) {
      const extraHours = Math.floor(minute / 60);
      hour += extraHours;
      minute = minute % 60;
    }

    // Normalize hours: if > 23, add to days
    if (hour > 23) {
      const extraDays = Math.floor(hour / 24);
      day += extraDays;
      hour = hour % 24;
    }

    // Normalize months: if > 12, add to years
    if (month > 12) {
      const extraYears = Math.floor((month - 1) / 12);
      year += extraYears;
      month = ((month - 1) % 12) + 1;
    }

    // Normalize days: check valid days for the month
    const daysInMonth = new Date(year, month, 0).getDate();
    if (day > daysInMonth) {
      const extraMonths = Math.floor((day - 1) / daysInMonth);
      month += extraMonths;
      day = ((day - 1) % daysInMonth) + 1;

      // Re-check if month overflow after adding days
      if (month > 12) {
        const extraYears = Math.floor((month - 1) / 12);
        year += extraYears;
        month = ((month - 1) % 12) + 1;
      }
    }

    // Format back to string
    const hourStr = hour.toString().padStart(2, '0');
    const minuteStr = minute.toString().padStart(2, '0');
    const dayStr = day.toString().padStart(2, '0');
    const monthStr = month.toString().padStart(2, '0');
    const yearStr = year.toString();

    return `${hourStr}:${minuteStr} ${dayStr}/${monthStr}/${yearStr}`;
  }

  private syncFromString(dateTimeString: string | number | null): void {
    if (dateTimeString != null) {
      // Handle number (timestamp) - convert to Date directly
      if (typeof dateTimeString === 'number') {
        this.flatpickrValue = new Date(dateTimeString);
        setTimeout(() => {
          if (this.flatpickrInstance) {
            this.flatpickrInstance.setDate(this.flatpickrValue, false);
          }
        });
        return;
      }

      // Handle string
      if (this.mode === 'date') {
        // Parse YYYY-MM-dd format for date mode
        const datePart = dateTimeString.split('-');
        if (datePart.length === 3) {
          const year = parseInt(datePart[0], 10);
          const month = parseInt(datePart[1], 10) - 1; // JavaScript months are 0-indexed
          const day = parseInt(datePart[2], 10);

          this.flatpickrValue = new Date(year, month, day);
          setTimeout(() => {
            if (this.flatpickrInstance) {
              this.flatpickrInstance.setDate(this.flatpickrValue, false);
            }
          });
          return;
        }
      } else {
        // Parse YYYY-MM-dd HH:mm format for datetime mode
        const parts = dateTimeString.split(' ');
        if (parts.length === 2) {
          const datePart = parts[0].split('-');
          const timePart = parts[1].split(':');

          if (datePart.length === 3 && timePart.length >= 2) {
            const year = parseInt(datePart[0], 10);
            const month = parseInt(datePart[1], 10) - 1; // JavaScript months are 0-indexed
            const day = parseInt(datePart[2], 10);
            const hour = parseInt(timePart[0], 10);
            const minute = parseInt(timePart[1], 10);

            this.flatpickrValue = new Date(year, month, day, hour, minute);
            setTimeout(() => {
              if (this.flatpickrInstance) {
                this.flatpickrInstance.setDate(this.flatpickrValue, false);
              }
            });
            return;
          }
        }
      }

      // Fallback: try to parse as timestamp string (for backward compatibility)
      const ts = parseInt(dateTimeString.toString(), 10);
      if (!isNaN(ts)) {
        this.flatpickrValue = new Date(ts);
        setTimeout(() => {
          if (this.flatpickrInstance) {
            this.flatpickrInstance.setDate(this.flatpickrValue, false);
          }
        });
      } else {
        this.flatpickrValue = null;
      }
    } else {
      this.flatpickrValue = null;
    }
  }

  /**
   * Add "Today" button to flatpickr calendar
   */
  private addTodayButton(): void {
    if (!this.flatpickrInstance || !this.flatpickrInstance.calendarContainer) {
      return;
    }

    // Remove existing button if any
    this.removeTodayButton();

    const calendarContainer = this.flatpickrInstance.calendarContainer;

    // Check if button already exists
    if (calendarContainer.querySelector('.flatpickr-today-button')) {
      return;
    }

    // Create today button
    const todayButton = document.createElement('div');
    todayButton.className = 'flatpickr-today-button';
    todayButton.textContent = this.currentLang === 'vn' || this.currentLang === 'vi' ? 'Hôm nay' : 'Today';

    // Check for dark mode
    const isDarkMode = document.body.classList.contains('dark') ||
      document.body.classList.contains('dark-layout') ||
      document.documentElement.classList.contains('dark') ||
      document.documentElement.classList.contains('dark-layout');

    // Set styles based on dark mode
    if (isDarkMode) {
      todayButton.style.cssText = `
        text-align: center;
        padding: 8px;
        cursor: pointer;
        border-top: 1px solid #161d31;
        background-color: #161d31;
        color: #b4b7bd;
        font-size: 0.875rem;
        transition: background-color 0.2s;
      `;

      // Add hover effect for dark mode
      todayButton.addEventListener('mouseenter', () => {
        todayButton.style.backgroundColor = '#283046';
      });
      todayButton.addEventListener('mouseleave', () => {
        todayButton.style.backgroundColor = '#161d31';
      });
    } else {
      todayButton.style.cssText = `
        text-align: center;
        padding: 8px;
        cursor: pointer;
        border-top: 1px solid #e6e6e6;
        background-color: #f8f9fa;
        color: #495057;
        font-size: 0.875rem;
        transition: background-color 0.2s;
      `;

      // Add hover effect for light mode
      todayButton.addEventListener('mouseenter', () => {
        todayButton.style.backgroundColor = '#e9ecef';
      });
      todayButton.addEventListener('mouseleave', () => {
        todayButton.style.backgroundColor = '#f8f9fa';
      });
    }

    // Add click handler
    this.clickHandlers.todayButton = () => {
      if (!this.disabled && this.flatpickrInstance) {
        const today = new Date();
        // Set current time (hours and minutes from current time)
        const now = new Date();
        today.setHours(now.getHours());
        today.setMinutes(now.getMinutes());
        today.setSeconds(0);
        today.setMilliseconds(0);

        // Set date in flatpickr
        this.flatpickrInstance.setDate(today, true);

        // Emit change
        this.onDateTimeChange([today]);

        // Close calendar after selection

      }
    };

    todayButton.addEventListener('click', this.clickHandlers.todayButton);

    // Append to calendar container
    calendarContainer.appendChild(todayButton);
    this.todayButtonElement = todayButton;
  }


  private isTyping = false;


  private getSegmentRange(value: string, cursorPosition: number): { start: number, end: number } {
    // Tìm vị trí các dấu '/'
    const firstSlash = value.indexOf('/');
    const lastSlash = value.lastIndexOf('/');

    if (cursorPosition <= firstSlash) {
      return { start: 0, end: firstSlash }; // Vùng DD
    } else if (cursorPosition <= lastSlash) {
      return { start: firstSlash + 1, end: lastSlash }; // Vùng MM
    } else {
      return { start: lastSlash + 1, end: value.length }; // Vùng YYYY
    }
  }


  /**
   * Remove "Today" button from flatpickr calendar
   */
  /**
   * Setup click handler to highlight the part being clicked
   */
  private setupClickHandler(altInputEl: HTMLInputElement): void {
    // Remove existing handlers if any
    if (this.clickHandlers.altInputClick) {
      altInputEl.removeEventListener('click', this.clickHandlers.altInputClick);
    }
    if (this.clickHandlers.altInputMouseDown) {
      altInputEl.removeEventListener('mousedown', this.clickHandlers.altInputMouseDown);
    }

    // Use mousedown to capture click position before focus event fires
    this.clickHandlers.altInputMouseDown = (e: MouseEvent) => {
      // console.log('mousedown: ', e);
      if (this.disabled) return;

      // Mark that this is a click event
      this.isClickEvent = true;
      this.isMouseDraggingSelection = false;

      const input = e.target as HTMLInputElement;
      const startX = e.clientX;
      const startY = e.clientY;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        // Nếu người dùng kéo chuột đủ xa, coi như đang bôi đen thủ công
        const movedX = Math.abs(moveEvent.clientX - startX);
        const movedY = Math.abs(moveEvent.clientY - startY);
        if (movedX > 3 || movedY > 3) {
          this.isMouseDraggingSelection = true;
        }
      };
      const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove, true);
        this.isMouseDraggingSelection = false;
      };
      document.addEventListener('mousemove', handleMouseMove, true);
      document.addEventListener('mouseup', handleMouseUp, { capture: true, once: true });

      // Tính toán cursor position từ tọa độ click
      const clickX = e.clientX;
      const inputRect = input.getBoundingClientRect();
      const relativeX = clickX - inputRect.left;

      // Ước tính cursor position dựa trên vị trí click
      const isDateMode = this.mode === 'date';
      const value = input.value || '';
      // Format length: date mode = 10 (dd/mm/yyyy), datetime mode = 17 (HH:mm dd/mm/yyyy)
      const expectedLength = isDateMode ? 10 : 17;
      const inputWidth = input.offsetWidth;
      const charWidth = inputWidth / Math.max(value.length || expectedLength, expectedLength);
      const estimatedPos = Math.round(relativeX / charWidth);
      const clampedPos = Math.max(0, Math.min(estimatedPos, value.length || expectedLength));

      // Set cursor position ngay trong mousedown
      this.clickedCursorPosition = clampedPos;
      this.numberInput = 0;
      if (this.disabled) return;

      const placeholder = isDateMode ? 'dd/mm/yyyy' : 'HH:mm dd/mm/yyyy';

      // Check if value is placeholder or empty
      const isPlaceholderValue = value === placeholder ||
        value === (isDateMode ? 'DD/MM/YYYY' : 'hh:mm dd/mm/yyyy') ||
        (!value || value.trim() === '');
      // If value is placeholder/empty AND is initial focus, don't process click - let focus handler handle it
      // If already focused (isInitialFocus = false), process click normally to allow clicking on different parts


      // Get cursor position from click - use requestAnimationFrame để đảm bảo browser đã set selectionStart
      setTimeout(() => {
        if (this.isMouseDraggingSelection) {
          return;
        }
        const cursorPos = input.selectionStart || 0;
        const selectionEnd = input.selectionEnd || 0;
        // if (selectionEnd - cursorPos > 1) {
        //   console.log('selectionEnd - cursorPos > 1: ', selectionEnd - cursorPos);
        //   return;
        // }
        // Cập nhật clickedCursorPosition với giá trị chính xác từ browser
        this.clickedCursorPosition = cursorPos;
        this.highlightPartAtPosition(input, cursorPos, value);

        // Reset flag sau một khoảng thời gian để focus handler có thể sử dụng
        setTimeout(() => {
          this.isClickEvent = false;
          this.clickedCursorPosition = -1;
        }, 0); // Tăng thời gian để focus handler có thể sử dụng
      }, 0);
    };

    // Use click to get accurate cursor position after browser sets it
    this.clickHandlers.altInputClick = (e: MouseEvent) => {
      // this.numberInput = 0;
      // if (this.disabled) return;

      // const input = e.target as HTMLInputElement;
      // const value = input.value || '';
      // const isDateMode = this.mode === 'date';
      // const placeholder = isDateMode ? 'dd/mm/yyyy' : 'HH:mm dd/mm/yyyy';

      // // Check if value is placeholder or empty
      // const isPlaceholderValue = value === placeholder ||
      //   value === (isDateMode ? 'DD/MM/YYYY' : 'hh:mm dd/mm/yyyy') ||
      //   (!value || value.trim() === '');

      // // If value is placeholder/empty AND is initial focus, don't process click - let focus handler handle it
      // // If already focused (isInitialFocus = false), process click normally to allow clicking on different parts
      // if (isPlaceholderValue && this.isInitialFocus) {
      //   console.log('isPlaceholderValue: ', isPlaceholderValue, this.isInitialFocus);
      //   // Reset flag
      //   setTimeout(() => {
      //     this.isClickEvent = false;
      //     this.clickedCursorPosition = -1;
      //   }, 200);
      //   return;
      // }

      // // Get cursor position from click - use requestAnimationFrame để đảm bảo browser đã set selectionStart
      // requestAnimationFrame(() => {
      //   const cursorPos = input.selectionStart || 0;
      //   // Cập nhật clickedCursorPosition với giá trị chính xác từ browser
      //   this.clickedCursorPosition = cursorPos;

      //   // Highlight phần được click ngay lập tức
      //   this.highlightPartAtPosition(input, cursorPos, value);

      //   // Reset flag sau một khoảng thời gian để focus handler có thể sử dụng
      //   setTimeout(() => {
      //     this.isClickEvent = false;
      //     this.clickedCursorPosition = -1;
      //   }, 200); // Tăng thời gian để focus handler có thể sử dụng
      // });
    };

    // Add both handlers with capture to run before other handlers
    altInputEl.addEventListener('mousedown', this.clickHandlers.altInputMouseDown, { capture: true });
    altInputEl.addEventListener('click', this.clickHandlers.altInputClick, { capture: true });
  }

  /**
   * Highlight the part at the given cursor position
   */
  public isDoubleClicking = false;
  public isHighlighting = false;
  
  highlightPartAtPosition(input: HTMLInputElement, cursorPos: number, value: string): void {
    const isDateMode = this.mode === 'date';
    if (this.isDoubleClicking || this.isHighlighting) {
      return;
    }
    // Define parts based on mode
    let parts: Array<{ start: number; end: number; name: string }>;
    let targetPartIndex = -1;
    this.isHighlighting = true;
    const altInput = this.flatpickrInstance?.altInput as HTMLInputElement | undefined;
    if (this.last_value && !String(this.last_value).includes('m') && !String(this.last_value).includes('d') && !String(this.last_value).includes('H') && !String(this.last_value).includes('M')) {
      altInput.value = this.last_value;
      this.normalizeYearWhenLeavePart(altInput, this.mode === 'date');
      this.timestamp = this.convertDateStringToTimestamp(altInput.value);
      this.timestampChange.emit(this.timestamp);
    }
    if (isDateMode) {
      // Format: dd/mm/yyyy (10 ký tự)
      // Positions: 0123456789
      //            dd/mm/yyyy
      parts = [
        { start: 0, end: 1, name: 'dd' },
        { start: 3, end: 4, name: 'mm' },
        { start: 6, end: 9, name: 'yyyy' }
      ];

      // Find which part the cursor is in
      if (cursorPos >= 0 && cursorPos <= 2) {
        targetPartIndex = 0; // dd
      } else if (cursorPos >= 3 && cursorPos <= 5) {
        targetPartIndex = 1; // mm
      } else if (cursorPos >= 6 && cursorPos <= 10) {
        targetPartIndex = 2; // yyyy
      }
    } else {
      // Format: HH:mm dd/mm/yyyy (17 ký tự)
      // Positions: 0123456789012345
      //            HH:mm dd/mm/yyyy
      parts = [
        { start: 0, end: 1, name: 'HH' },
        { start: 3, end: 4, name: 'MM' },
        { start: 6, end: 7, name: 'dd' },
        { start: 9, end: 10, name: 'mm' },
        { start: 12, end: 15, name: 'yyyy' }
      ];

      // Find which part the cursor is in
      if (cursorPos >= 0 && cursorPos <= 2) {
        targetPartIndex = 0; // HH
      } else if (cursorPos >= 3 && cursorPos <= 5) {
        targetPartIndex = 1; // MM
      } else if (cursorPos >= 6 && cursorPos <= 8) {
        targetPartIndex = 2; // dd
      } else if (cursorPos >= 9 && cursorPos <= 11) {
        targetPartIndex = 3; // mm
      } else if (cursorPos >= 12 && cursorPos <= 16) {
        targetPartIndex = 4; // yyyy
      }
    }

    if (targetPartIndex >= 0) {
      const part = parts[targetPartIndex];
      // Find the actual start position (skip separators)
      let partStart = part.start;
      while (partStart < value.length && partStart <= part.end && !/\d/.test(value[partStart])) {
        partStart++;
      }

      // If no digit found, use the expected start
      if (partStart > part.end) {
        partStart = part.start;
      }
      // Select the part to highlight it
      const partEnd = Math.min(part.end + 1, value.length);
      setTimeout(() => {
        if (this.isMouseDraggingSelection) {
          return;
        }
        // const selectionStart = input.selectionStart || 0;
        // const selectionEnd = input.selectionEnd || 0;
        // if (selectionEnd - selectionStart <= 1) {

        //   return;
        // }
        this.debugSetSelectionRange(input, partStart, partEnd, 'highlightPartAtPosition');
      }, 0);
      setTimeout(() => {
        this.isHighlighting = false;
      }, 200);
    }
  }

  /**
   * Setup focus handlers for smart input navigation
   * Format: hh:mm dd/mm/yyyy
   * - hh: position 0-2
   * - mm: position 3-5
   * - dd: position 6-8
   * - mm: position 9-11
   * - yyyy: position 12-16
   */
  private lastRun = 0;
  public numberInput = 0;

  private clearAltInputKeydownDigitDebounce(): void {
    if (this.alt_input_keydown_debounce_timer != null) {
      clearTimeout(this.alt_input_keydown_debounce_timer);
      this.alt_input_keydown_debounce_timer = null;
    }
    this.alt_input_keydown_digit_buffer = '';
  }

  private makeSyntheticDigitKeyEvent(original: KeyboardEvent, target: HTMLInputElement, digit: string): KeyboardEvent {
    return {
      key: digit,
      target,
      bubbles: original.bubbles,
      cancelable: original.cancelable,
      ctrlKey: false,
      metaKey: false,
      altKey: false,
      preventDefault: () => {
        /* playback: đã prevent ở lần gõ thật */
      },
      stopPropagation: () => {
        /* no-op */
      }
    } as unknown as KeyboardEvent;
  }

  /**
   * Áp dụng buffer số đã gom: gọi lại keydown từng ký tự (playback) để tái sử dụng logic hiện có.
   */
  private flushAltInputKeydownDigitBufferIfNeeded(base_event: KeyboardEvent, input_el: HTMLInputElement): void {
    if (this.alt_input_keydown_debounce_timer != null) {
      clearTimeout(this.alt_input_keydown_debounce_timer);
      this.alt_input_keydown_debounce_timer = null;
    }
    const buf = this.alt_input_keydown_digit_buffer;
    this.alt_input_keydown_digit_buffer = '';
    if (!buf.length) {
      return;
    }
    const replay_fn = this.focusHandlers.altInputKeydown;
    if (!replay_fn) {
      return;
    }
    this.alt_input_keydown_flush_playback = true;
    try {
      for (let i = 0; i < buf.length; i++) {
        replay_fn(this.makeSyntheticDigitKeyEvent(base_event, input_el, buf.charAt(i)));
      }
    } finally {
      this.alt_input_keydown_flush_playback = false;
    }
  }



  last_value = '';
  private setupFocusHandlers(altInputEl: HTMLInputElement): void {
    // Remove existing handlers if any
    if (this.focusHandlers.altFocus) {
      altInputEl.removeEventListener('focus', this.focusHandlers.altFocus);
    }
    if (this.focusHandlers.altInput) {
      altInputEl.removeEventListener('keyup', this.focusHandlers.altInput);
    }
    if (this.focusHandlers.altInputBlur) {
      altInputEl.removeEventListener('blur', this.focusHandlers.altInputBlur);
    }
    if (this.focusHandlers.altInputInput) {
      altInputEl.removeEventListener('input', this.focusHandlers.altInputInput);
    }
    if (this.focusHandlers.altInputKeydown) {
      altInputEl.removeEventListener('keydown', this.focusHandlers.altInputKeydown);
      altInputEl.removeEventListener('keydown', this.focusHandlers.altInputKeydown, true);
    }
    // if (this.focusHandlers.altInputDblclick) {
    //   altInputEl.removeEventListener('dblclick', this.focusHandlers.altInputDblclick);
    // }
    this.clearAltInputKeydownDigitDebounce();
    this.detachAltInputDocumentSelectionListener();

    this.focusHandlers.altFocus = () => {
      if (this.disabled) return;
      this.last_value = null;
      const isDateMode = this.mode === 'date';
      const currentValue = altInputEl.value || '';

      // Store original value for revert on blur
      this.originalValueOnFocus = currentValue;

      // Nếu là click event, KHÔNG set previousInputValue ngay - để input handler có thể detect thay đổi
      // Chỉ set previousInputValue khi là programmatic focus
      // Nếu là click event, để input handler tự set previousInputValue khi có input event
      if (!this.isClickEvent) {
        // Reset previous input value tracking chỉ khi programmatic focus
        this.previousInputValue = currentValue;
      }
      // Nếu là click event, giữ nguyên previousInputValue để input handler có thể so sánh

      // Define placeholder and first part based on mode
      const placeholder = isDateMode ? 'dd/mm/yyyy' : 'HH:mm dd/mm/yyyy';
      const firstPartStart = 0;
      const firstPartEnd = isDateMode ? 1 : 1; // dd (0-1) or HH (0-1)

      // Check if value is placeholder or empty
      const isPlaceholderValue = currentValue === placeholder ||
        currentValue === (isDateMode ? 'DD/MM/YYYY' : 'hh:mm dd/mm/yyyy') ||
        (!currentValue || currentValue.trim() === '' || currentValue.includes('yyyy') || currentValue.includes('NaN') || currentValue.includes('undefined'));

      // Nếu là click event, xử lý khác nhau:
      // - Nếu value là placeholder/rỗng VÀ là lần đầu focus: focus vào phần đầu (dd hoặc HH)
      // - Nếu đã focus rồi hoặc value có giá trị: để click handler xử lý highlight phần được click
      if (this.isClickEvent) {
        // Click event: set placeholder nếu cần
        if ((!currentValue || currentValue.trim() === '')) {
          altInputEl.value = placeholder;
          this.isInitialFocus = true;
        }

        // Chỉ focus vào phần đầu nếu là lần đầu focus (isInitialFocus = true) và value là placeholder/rỗng
        // Nếu đã focus rồi (isInitialFocus = false), để click handler xử lý highlight phần được click
        if (isPlaceholderValue && this.isInitialFocus) {
          setTimeout(() => {
            altInputEl.setSelectionRange(firstPartStart, firstPartEnd + 1);
            // Set isInitialFocus = false sau khi đã focus vào phần đầu để các lần click sau có thể xử lý bình thường
          }, 150);
        } else if (!isPlaceholderValue) {
          // Nếu value có giá trị, set isInitialFocus = false để click handler có thể xử lý
        }
        // Nếu đã focus rồi hoặc value có giá trị, để click handler xử lý highlight
        return;
      }

      // Programmatic focus (không phải click): luôn focus vào phần đầu (dd hoặc HH)
      setTimeout(() => {
        // If no value, set placeholder format
        if ((!currentValue || currentValue.trim() === '' || currentValue.includes('yyyy') || currentValue.includes('NaN') || currentValue.includes('undefined'))) {
          // Set placeholder value
          altInputEl.value = placeholder;
          // Programmatic focus: always focus on first part
          altInputEl.setSelectionRange(firstPartStart, firstPartEnd + 1);
          this.isInitialFocus = true;
        } else {
          // No value but has placeholder - programmatic focus: focus on first part
          altInputEl.setSelectionRange(firstPartStart, firstPartEnd + 1);
        }
      }, 150);
    };
    altInputEl.addEventListener('focus', this.focusHandlers.altFocus);

    // Focus handler: set placeholder value if empty and focus on first part
    this.focusHandlers.altInput = (e: KeyboardEvent) => {
      const input = e.target as HTMLInputElement;
      const isDateMode = this.mode === 'date';
      ; const parts = isDateMode
        ? [
          { start: 0, end: 1, defaultValue: '01' }, // dd
          { start: 3, end: 4, defaultValue: '01' }, // mm
          { start: 6, end: 9, defaultValue: '1900' } // yyyy
        ]
        : [
          { start: 0, end: 1, defaultValue: '00' }, // HH
          { start: 3, end: 4, defaultValue: '00' }, // MM
          { start: 6, end: 7, defaultValue: '01' }, // dd
          { start: 9, end: 10, defaultValue: '01' }, // mm
          { start: 12, end: 15, defaultValue: '1900' } // yyyy
        ];
      const start = input.selectionStart || 0;
      const end = input.selectionEnd || 0;
      const currentPart = parts.find(part =>
        start >= part.start && start <= part.end
      );
      this.last_value = input.value;
      // setTimeout(() => {
      //   this.isTyping = false;
      // }, 300);
    };
    altInputEl.addEventListener('keyup', this.focusHandlers.altInput);

    // Blur handler: clear placeholder or revert if invalid
    this.focusHandlers.altInputBlur = () => {
      if(this.isInitialFocus) {
        return;
      }
      let currentValue = null;
      if (this.last_value) {
        currentValue = this.last_value;
        altInputEl.value = currentValue;
      }
      this.normalizeYearWhenLeavePart(altInputEl, this.mode === 'date');
      currentValue = altInputEl.value;
      this.timestamp = this.convertDateStringToTimestamp(currentValue);
      this.timestampChange.emit(this.timestamp);
      this.detachAltInputDocumentSelectionListener();
      this.numberInput = 0;
      const isDateMode = this.mode === 'date';

      // Sử dụng delay để kiểm tra xem blur có phải do click vào calendar không
      // Nếu click vào calendar, activeElement sẽ là element trong calendar
      setTimeout(() => {
        const calendarEl = this.flatpickrInstance?.calendarContainer;
        const activeElement = document.activeElement;

        // Kiểm tra xem có đang click vào calendar không
        const isClickingCalendar = calendarEl && activeElement && (
          calendarEl.contains(activeElement) ||
          calendarEl === activeElement ||
          (activeElement.closest && activeElement.closest('.flatpickr-calendar'))
        );

        // Chỉ đóng calendar nếu không phải đang click vào calendar
        if (this.flatpickrInstance && this.flatpickrInstance.isOpen && !isClickingCalendar) {
          this.flatpickrInstance.close();
          this.isDatepickerOpen = false;
        }
      }, 100); // Delay để đảm bảo activeElement đã được set nếu click vào calendar

      // Define placeholder values based on mode
      const placeholderValue = isDateMode ? 'dd/mm/yyyy' : 'HH:mm dd/mm/yyyy';
      const placeholderValueAlt = isDateMode ? 'DD/MM/YYYY' : 'hh:mm dd/mm/yyyy';

      // Clear placeholder if it's still the placeholder value
      if (currentValue === placeholderValue || currentValue === placeholderValueAlt) {
        // Sử dụng setTimeout để đảm bảo flatpickr đã xử lý xong blur event
        // và không set lại placeholder
        setTimeout(() => {
          // Kiểm tra lại value để đảm bảo không bị flatpickr set lại
          const checkValue = altInputEl.value || '';
          if (checkValue === placeholderValue || checkValue === placeholderValueAlt) {
            altInputEl.value = '';
          }
          this.originalValueOnFocus = '';
        }, 10);
        return;
      }

      const isValidFormat = isDateMode
        ? /^\d{2}\/\d{2}\/\d{4}$/.test(currentValue)
        : /^\d{2}:\d{2} \d{2}\/\d{2}\/\d{4}$/.test(currentValue);
      const isPartialFormat = isDateMode
        ? /^\d{2}\/\d{2}$/.test(currentValue)
        : false;
      const hasYearPlaceholder = isDateMode
        ? /^\d{2}\/\d{2}\/yyyy$/.test(currentValue)
        : /^\d{2}:\d{2} \d{2}\/\d{2}\/yyyy$/.test(currentValue);

      // For date mode, check for partial formats with placeholders (e.g., 04/mm/yyyy, dd/04/yyyy)
      let hasPartialWithPlaceholder = false;
      let normalizedPartialValue = currentValue;
      if (isDateMode) {
        // Pattern: dd/mm/yyyy where some parts are placeholders
        const partialPattern = /^(\d{2}|dd|DD)\/(\d{2}|mm|MM)\/(\d{4}|yyyy|YYYY)$/i;
        const match = currentValue.match(partialPattern);
        if (match) {
          const ddPart = match[1];
          const mmPart = match[2];
          const yyyyPart = match[3];

          // Check if any part is placeholder
          const isDDPlaceholder = /^dd$/i.test(ddPart);
          const isMMPlaceholder = /^mm$/i.test(mmPart);
          const isYYYYPlaceholder = /^yyyy$/i.test(yyyyPart);

          if (isDDPlaceholder || isMMPlaceholder || isYYYYPlaceholder) {
            hasPartialWithPlaceholder = true;
            // Reset placeholder parts to default values
            const defaultDD = isDDPlaceholder ? '01' : ddPart;
            const defaultMM = isMMPlaceholder ? '01' : mmPart;
            const defaultYYYY = isYYYYPlaceholder ? new Date().getFullYear().toString() : yyyyPart;
            normalizedPartialValue = `${defaultDD}/${defaultMM}/${defaultYYYY}`;
          }
        }
      }

      // If we had an original value and current value is invalid/incomplete, revert
      // Nhưng không revert nếu value là empty và timestamp đã được clear (xóa toàn bộ)
      if (this.originalValueOnFocus && this.originalValueOnFocus !== '') {
        // Nếu value là empty và timestamp là null, không revert (đã xóa toàn bộ)
        if (currentValue === '' && (this.timestamp === null || this.timestamp === '')) {
          // Không revert, giữ nguyên empty
          this.originalValueOnFocus = '';
          return;
        }

        if (!isValidFormat && !isPartialFormat && !hasYearPlaceholder && !hasPartialWithPlaceholder) {
          // Revert to original value if format is invalid
          altInputEl.value = this.originalValueOnFocus;
          this.normalizeYearWhenLeavePart(altInputEl, this.mode === 'date');

        } else {
          // Normalize and parse valid value for date mode - ALWAYS normalize and emit
          if (isDateMode) {
            let valueToEmit = currentValue;
            if (isValidFormat) {
              // Full format dd/mm/yyyy - normalize first
              valueToEmit = this.normalizeDateValue(currentValue);
              altInputEl.value = valueToEmit;
              this.normalizeYearWhenLeavePart(altInputEl, this.mode === 'date');
              this.parseAndEmitDateValue(altInputEl.value || valueToEmit);
            } else if (isPartialFormat) {
              // Partial format dd/mm - append current year and normalize
              const currentYear = new Date().getFullYear();
              const fullValue = currentValue + '/' + currentYear;
              valueToEmit = this.normalizeDateValue(fullValue);
              altInputEl.value = valueToEmit;
              this.normalizeYearWhenLeavePart(altInputEl, this.mode === 'date');
              this.parseAndEmitDateValue(altInputEl.value || valueToEmit);
            } else if (hasYearPlaceholder) {
              // Format with yyyy placeholder - replace with current year and normalize
              const currentYear = new Date().getFullYear();
              const fullValue = currentValue.replace(/yyyy$/, currentYear.toString());
              valueToEmit = this.normalizeDateValue(fullValue);
              altInputEl.value = valueToEmit;
              this.normalizeYearWhenLeavePart(altInputEl, this.mode === 'date');
              this.parseAndEmitDateValue(altInputEl.value || valueToEmit);
            } else if (hasPartialWithPlaceholder) {
              // Format with partial placeholders (e.g., 04/mm/yyyy) - reset to defaults and normalize
              valueToEmit = this.normalizeDateValue(normalizedPartialValue);
              altInputEl.value = valueToEmit;
              this.normalizeYearWhenLeavePart(altInputEl, this.mode === 'date');
              this.parseAndEmitDateValue(altInputEl.value || valueToEmit);
            }
          }
        }
      } else {
        // No original value, but check if current value is valid and emit it
        if (isValidFormat || isPartialFormat || hasYearPlaceholder || hasPartialWithPlaceholder) {
          // Normalize and parse valid value for date mode - ALWAYS normalize and emit
          if (isDateMode) {
            let valueToEmit = currentValue;
            if (isValidFormat) {
              // Full format dd/mm/yyyy - normalize first
              valueToEmit = this.normalizeDateValue(currentValue);
              altInputEl.value = valueToEmit;
              this.normalizeYearWhenLeavePart(altInputEl, this.mode === 'date');
              this.parseAndEmitDateValue(altInputEl.value || valueToEmit);
            } else if (isPartialFormat) {
              // Partial format dd/mm - append current year and normalize
              const currentYear = new Date().getFullYear();
              const fullValue = currentValue + '/' + currentYear;
              valueToEmit = this.normalizeDateValue(fullValue);
              altInputEl.value = valueToEmit;
              this.normalizeYearWhenLeavePart(altInputEl, this.mode === 'date');
              this.parseAndEmitDateValue(altInputEl.value || valueToEmit);
            } else if (hasYearPlaceholder) {
              // Format with yyyy placeholder - replace with current year and normalize
              const currentYear = new Date().getFullYear();
              const fullValue = currentValue.replace(/yyyy$/, currentYear.toString());
              valueToEmit = this.normalizeDateValue(fullValue);
              altInputEl.value = valueToEmit;

              this.normalizeYearWhenLeavePart(altInputEl, this.mode === 'date');
              this.parseAndEmitDateValue(altInputEl.value || valueToEmit);
            } else if (hasPartialWithPlaceholder) {
              // Format with partial placeholders (e.g., 04/mm/yyyy) - reset to defaults and normalize
              valueToEmit = this.normalizeDateValue(normalizedPartialValue);
              altInputEl.value = valueToEmit;
              this.normalizeYearWhenLeavePart(altInputEl, this.mode === 'date');
              this.parseAndEmitDateValue(altInputEl.value || valueToEmit);
            }
          }
        }
      }

      this.isInitialFocus = false;
      this.originalValueOnFocus = '';
    };
    altInputEl.addEventListener('blur', this.focusHandlers.altInputBlur);

    // Input handler: auto-advance to next part when current part is complete
    this.focusHandlers.altInputInput = (e: Event) => {

      const input = e.target as HTMLInputElement;
      let value = input.value;

      const cursorPos = input.selectionStart || 0;
      const isDateMode = this.mode === 'date';
      // Normalize value - handle both placeholder and actual values
      const placeholder = isDateMode ? 'dd/mm/yyyy' : 'HH:mm dd/mm/yyyy';
      const isPlaceholder = value === placeholder || value === (isDateMode ? 'DD/MM/YYYY' : 'hh:mm dd/mm/yyyy');
      // If value is placeholder, don't process further - just update previousInputValue and return
      if (isPlaceholder) {
        this.previousInputValue = value;
        return;
      }

      // Track if this is a new input (value changed)
      const isNewInput = value !== this.previousInputValue;
      const previousValue = this.previousInputValue;
      this.previousInputValue = value;
      // Use common function to handle input and auto-advance for both date and datetime modes
      // this.handleInputAndAdvance(input, value, previousValue, cursorPos, isDateMode, isNewInput);
    };
    altInputEl.addEventListener('input', this.focusHandlers.altInputInput);

    // Keydown handler: handle arrow keys and auto-advance
    this.focusHandlers.altInputKeydown = (e: KeyboardEvent) => {
      const input = e.target as HTMLInputElement;
      const isDateMode = this.mode === 'date';
      const parts = isDateMode
        ? [
          { start: 0, end: 1, defaultValue: '01' }, // dd
          { start: 3, end: 4, defaultValue: '01' }, // mm
          { start: 6, end: 9, defaultValue: '1900' } // yyyy
        ]
        : [
          { start: 0, end: 1, defaultValue: '00' }, // HH
          { start: 3, end: 4, defaultValue: '00' }, // MM
          { start: 6, end: 7, defaultValue: '01' }, // dd
          { start: 9, end: 10, defaultValue: '01' }, // mm
          { start: 12, end: 15, defaultValue: '1900' } // yyyy
        ];
      // Lấy vị trí bắt đầu và kết thúc
      let value = input.value;
      const start = input.selectionStart || 0;
      const end = input.selectionEnd || 0;
      const currentPart = parts.find(part =>
        start >= part.start && start <= part.end
      );
      if (end - start <= 1) {
        if (currentPart && currentPart.start && currentPart.end) {
          input.setSelectionRange(currentPart?.start, currentPart?.end + 1);
        } else {
          this.highlightPartAtPosition(input, start, value);
        }
      }

      // if (selectionLength <= 1) {
      //   e.preventDefault();
      //   return;
      // }
      const cursorPos = input.selectionStart || 0;
      const selectionEnd = input.selectionEnd || 0;

      // Only allow digits 0-9, allow control keys (Backspace, Delete, Arrow keys, Tab, etc.)
      const isControlKey = e.key === 'Backspace' || e.key === 'Delete' ||
        e.key === 'ArrowLeft' || e.key === 'ArrowRight' ||
        e.key === 'ArrowUp' || e.key === 'ArrowDown' ||
        e.key === 'Tab' || e.key === 'Enter' ||
        e.ctrlKey || e.metaKey || e.altKey;

      // Phím điều khiển: áp dụng buffer số đang chờ trước (ví dụ gõ 12 rồi ngay Backspace)
      if (isControlKey && this.alt_input_keydown_digit_buffer.length > 0) {
        this.flushAltInputKeydownDigitBufferIfNeeded(e, input);
      }

      // Debounce 150ms: gom chuỗi số gõ nhanh, flush sau khi ngừng gõ hoặc khi gặp control (ở trên)
      if (!this.alt_input_keydown_flush_playback && !isControlKey && /^\d$/.test(e.key) && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        this.alt_input_keydown_digit_buffer += e.key;
        if (this.alt_input_keydown_debounce_timer != null) {
          clearTimeout(this.alt_input_keydown_debounce_timer);
        }
        this.alt_input_keydown_debounce_timer = window.setTimeout(() => {
          this.alt_input_keydown_debounce_timer = null;
          this.flushAltInputKeydownDigitBufferIfNeeded(e, input);
        }, DatetimeAdapterComponent.ALT_INPUT_KEYDOWN_DEBOUNCE_MS);
        return;
      }

      this.numberInput++;
      if (e.key === 'Delete' || e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'Enter') {
        this.numberInput = 0;
      }

      // Block non-digit characters (except control keys and separators which are handled separately)
      if (!isControlKey && e.key.length === 1 && !/^\d$/.test(e.key) &&
        e.key !== ':' && e.key !== '/' && e.key !== ' ') {
        e.preventDefault();
        return;
      }

      // Handle placeholder replacement when user types
      const placeholder = 'HH:MM dd/mm/yyyy';
      const isPlaceholder = value === placeholder || value === 'hh:mm dd/mm/yyyy';

      // Handle Backspace and Delete: reset part to default value when focused
      if ((e.key === 'Backspace' || e.key === 'Delete') && !isPlaceholder) {
        this.numberInput--;
        // Check if entire value is selected (xóa toàn bộ) - ưu tiên xử lý trước year fallback.
        const isEntireValueSelected = (cursorPos === 0 && selectionEnd >= value.length) ||
          (selectionEnd - cursorPos >= value.length - 1 && cursorPos <= 1);
        // If entire value is selected, reset to placeholder
        if (isEntireValueSelected) {
          e.preventDefault();
          const placeholderValue = 'HH:MM dd/mm/yyyy';

          // Update previousInputValue to prevent input handler from changing it
          this.previousInputValue = '';
          // Clear originalValueOnFocus để blur handler không revert
          this.originalValueOnFocus = '';
          // Clear timestamp when xóa toàn bộ
          this.timestamp = null;
          this.timestampChange.emit(null);
          input.value = '';
          // Focus on HH (position 0-2)
          setTimeout(() => {
            this.debugSetSelectionRange(input, 0, 2, 'keydown:backspace:entireValueCleared');
          }, 0);
          return;
        }

        // Otherwise, handle xóa từng phần (giữ nguyên hành vi hiện tại)


        // Find which part cursor is in
        let currentPartIndex = -1;
        for (let i = 0; i < parts.length; i++) {
          const part = parts[i];
          if (cursorPos >= part.start && cursorPos <= part.end + 1) {
            currentPartIndex = i;
            break;
          }
        }

        // Also check if selection is within a part
        if (currentPartIndex === -1) {
          for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            if (selectionEnd > cursorPos && cursorPos >= part.start && selectionEnd <= part.end + 1) {
              currentPartIndex = i;
              break;
            }
          }
        }
        if (currentPartIndex >= 0) {
          const year_part_index = isDateMode ? 2 : 4;
          if (currentPartIndex === year_part_index) {
            // Year: đơn giản hóa theo rule mới - bấm xóa thì reset year về 0 và giữ focus tại year.
            e.preventDefault();
            this.numberInput = 0;
            const year_part = parts[currentPartIndex];
            const new_value = value.substring(0, year_part.start) + '0' + value.substring(year_part.end + 1);
            input.value = new_value;
            setTimeout(() => {
              this.debugSetSelectionRange(input, year_part.start, year_part.end + 1, 'keydown:backspace:yearPartReset');
            }, 0);
            return;
          }

          e.preventDefault();
          const part = parts[currentPartIndex];

          // Replace the part with default value
          const newValue = value.substring(0, part.start) + part.defaultValue + value.substring(part.end + 1);

          input.value = newValue;

          // Highlight the entire part after reset
          setTimeout(() => {
            this.debugSetSelectionRange(input, part.start, part.end + 1, 'keydown:backspace:partDefaultHighlight');

          }, 0);

          return;
        }
      }
      // Handle when entire part is selected and user types a digit
      // This makes all parts (including year) work the same way:
      // - Focus entire part → type digit → digit fills first position, remaining positions highlighted
      // BUT: Don't prevent default for year part - let input handler deal with it
      if (!isPlaceholder && /^\d$/.test(e.key) && e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
        if (this.numberInput > 4) {
          this.numberInput = 1;
          if (isDateMode) {
            this.debugSetSelectionRange(input, 6, 10, 'keydown:digit:numberInput_gt4:date→year');
          } else {
            this.debugSetSelectionRange(input, 12, 16, 'keydown:digit:numberInput_gt4:datetime→year');
          }
          return;
        }
        const parts = isDateMode
          ? [
            { start: 0, end: 1 }, // dd
            { start: 3, end: 4 }, // mm
            { start: 6, end: 9 }  // yyyy
          ]
          : [
            { start: 0, end: 1 }, // HH
            { start: 3, end: 4 }, // MM
            { start: 6, end: 7 }, // dd
            { start: 9, end: 10 }, // mm
            { start: 12, end: 15 } // yyyy
          ];

        // Check if entire part is selected
        let oldPart = null;
        for (let i = 0; i < parts.length; i++) {
          const part = parts[i];
          const yearPartIndex = isDateMode ? 2 : 4;

          // Check if selection covers the entire part
          // Only handle if cursor is at the start AND selection covers entire part
          // This prevents resetting when typing into a partially selected part
          const isEntirePartSelected = cursorPos === part.start && selectionEnd >= part.end + 1;
          // Also handle if selection spans entire part but cursor might be slightly off due to separators
          const isEntirePartSelectedWithTolerance = cursorPos <= part.start && selectionEnd >= part.end + 1 &&
            (selectionEnd - cursorPos) >= (part.end - part.start);

          if (isEntirePartSelected || isEntirePartSelectedWithTolerance) {
            const partText = value.substring(part.start, part.end + 1);
            const partDigits = partText.replace(/\D/g, '');

            // For year part, don't prevent default - let normal input handler deal with it
            // This ensures input event is triggered properly


            e.preventDefault();

            let newPartValue = e.key;
            const numberAdd = (i == yearPartIndex) ? 4 : 2;
            // 2-digit parts: insert at start, keep separator, add placeholder for second digit
            if (partText.includes(':') || partText.includes('/') || partText.includes(' ')) {
              const separator = partText.match(/[:\/ ]/)?.[0] || '';
              const secondChar = partDigits.length > 1 ? partDigits.charAt(1) : '0';
              newPartValue = secondChar + e.key + separator;
            } else {
              if (this.numberInput < numberAdd) {
                if (i != yearPartIndex) {
                  newPartValue = '0' + e.key;
                } else {
                  if (this.numberInput == 1) {
                    newPartValue = 'yyy' + e.key
                  } else if (this.numberInput == 2) {
                    newPartValue = 'yy' + partText.charAt(partText.length - 1) + e.key
                  } else if (this.numberInput == 3) {
                    newPartValue = 'y' + partText.substring(partText.length - 2) + e.key
                  }
                }
              } else {
                if (i != yearPartIndex) {
                  const secondChar = partText.length > 1 ? partText.charAt(1) : '0';
                  newPartValue = secondChar + e.key;
                } else {
                  newPartValue = partText.substring(partText.length - 3) + e.key

                }
              }
            }

            const newValue = value.substring(0, part.start) + newPartValue + value.substring(part.end + 1);
            input.value = newValue;
            // Highlight remaining positions for continuous typing
            setTimeout(() => {
              // 2-digit parts: highlight second position
              if (this.numberInput < numberAdd) {
                input.setSelectionRange(part.start, part.end + 1);
              } else {
                this.numberInput = 0;
                if (i === yearPartIndex) {
                  input.setSelectionRange(part.start, part.end + 1);
                } else {
                  this.validatePartBeforeAdvance(input, isDateMode, i, partText);

                  if (isDateMode && (part.start + 2 == 5) && (part.end + 4 == 8)) {
                    input.setSelectionRange(6, value.length);
                  } else if (!isDateMode && (part.start == 9) && (part.end == 10)) {
                    input.setSelectionRange(12, 16);
                  } else {
                    input.setSelectionRange(part.start + 3, part.end + 4);
                  }
                }
              }
            }, 0);

            return;
          }
        }
      }



      if (isPlaceholder) {
        if (/\d/.test(e.key) && !e.ctrlKey && !e.metaKey && e.key.length === 1) {
          e.preventDefault();

          // Determine which part we're in based on cursor position
          let newValue = value;
          let newCursorPos = cursorPos;

          if (cursorPos >= 0 && cursorPos <= 2) {
            // In HH part (0-1)
            newValue = value.substring(0, cursorPos) + e.key + value.substring(cursorPos + 1);
            newCursorPos = Math.min(cursorPos + 1, 1);
          } else if (cursorPos >= 3 && cursorPos <= 5) {
            // In MM part (3-4)
            newValue = value.substring(0, cursorPos) + e.key + value.substring(cursorPos + 1);
            newCursorPos = Math.min(cursorPos + 1, 4);
          } else if (cursorPos >= 6 && cursorPos <= 8) {
            // In dd part (6-7)
            newValue = value.substring(0, cursorPos) + e.key + value.substring(cursorPos + 1);
            newCursorPos = Math.min(cursorPos + 1, 7);
          } else if (cursorPos >= 9 && cursorPos <= 11) {
            // In mm part (9-10)
            newValue = value.substring(0, cursorPos) + e.key + value.substring(cursorPos + 1);
            newCursorPos = Math.min(cursorPos + 1, 10);
          } else if (cursorPos >= 12 && cursorPos <= 15) {
            // In yyyy part (12-15)
            newValue = value.substring(0, cursorPos) + e.key + value.substring(cursorPos + 1);
            newCursorPos = Math.min(cursorPos + 1, 15);
          }

          input.value = newValue;
          setTimeout(() => {
            this.debugSetSelectionRange(input, newCursorPos, newCursorPos + 1, 'keydown:placeholderHHMM:firstDigit');
          }, 0);
          return;
        }
      }

      if (isPlaceholder) {
        if (/\d/.test(e.key) && !e.ctrlKey && !e.metaKey && e.key.length === 1) {
          e.preventDefault();

          // Determine which part we're in based on cursor position
          let newValue = value;
          let newCursorPos = cursorPos;

          if (cursorPos >= 0 && cursorPos <= 2) {
            // In HH part (0-1)
            newValue = value.substring(0, cursorPos) + e.key + value.substring(cursorPos + 1);
            newCursorPos = Math.min(cursorPos + 1, 1);
          } else if (cursorPos >= 3 && cursorPos <= 5) {
            // In MM part (3-4)
            newValue = value.substring(0, cursorPos) + e.key + value.substring(cursorPos + 1);
            newCursorPos = Math.min(cursorPos + 1, 4);
          } else if (cursorPos >= 6 && cursorPos <= 8) {
            // In dd part (6-7)
            newValue = value.substring(0, cursorPos) + e.key + value.substring(cursorPos + 1);
            newCursorPos = Math.min(cursorPos + 1, 7);
          } else if (cursorPos >= 9 && cursorPos <= 11) {
            // In mm part (9-10)
            newValue = value.substring(0, cursorPos) + e.key + value.substring(cursorPos + 1);
            newCursorPos = Math.min(cursorPos + 1, 10);
          } else if (cursorPos >= 12 && cursorPos <= 15) {
            // In yyyy part (12-15)
            newValue = value.substring(0, cursorPos) + e.key + value.substring(cursorPos + 1);
            newCursorPos = Math.min(cursorPos + 1, 15);
          }

          input.value = newValue;
          setTimeout(() => {
            input.setSelectionRange(newCursorPos, newCursorPos + 1);
          }, 0);
          return;
        }
      }

      // Handle colon, slash, space - auto-advance to next part
      if (e.key === ':' || e.key === '/' || e.key === ' ') {
        if (this.alt_input_keydown_digit_buffer.length > 0) {
          this.flushAltInputKeydownDigitBufferIfNeeded(e, input);
        }
        e.preventDefault();
        const parts = [
          { start: 0, end: 2 },
          { start: 3, end: 5 },
          { start: 6, end: 8 },
          { start: 9, end: 11 },
          { start: 12, end: 15 }
        ];

        // Find next part
        for (let i = 0; i < parts.length; i++) {
          if (cursorPos < parts[i].start) {
            let nextStart = parts[i].start;
            while (nextStart < value.length && !/\d/.test(value[nextStart])) {
              nextStart++;
            }
            input.setSelectionRange(nextStart, parts[i].end + 1);
            break;
          }
        }
      }

      // Handle arrow keys for navigation between parts
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        const parts = [
          { start: 0, end: 2 },
          { start: 3, end: 5 },
          { start: 6, end: 8 },
          { start: 9, end: 11 },
          { start: 12, end: 15 }
        ];

        let currentPartIndex = -1;
        for (let i = 0; i < parts.length; i++) {
          if (cursorPos >= parts[i].start && cursorPos <= parts[i].end) {
            currentPartIndex = i;
            break;
          }
        }
        if (currentPartIndex >= 0) {
          if (e.key === 'ArrowRight' && currentPartIndex == 4 && parts.length == 5 && !isDateMode) {
            e.preventDefault();
            this.normalizeYearWhenLeavePart(input, isDateMode);
            input.setSelectionRange(0, 2);
            return;
          }
          else if (e.key === 'ArrowRight' && currentPartIndex < parts.length - 1) {
            e.preventDefault();
            const nextPart = parts[currentPartIndex + 1];
            let nextStart = nextPart.start;
            while (nextStart < value.length && !/\d/.test(value[nextStart])) {
              nextStart++;
            }
            if ((nextStart == 10 && nextPart.end + 1 == 6) || (nextStart == 16 && nextPart.end + 1 == 6)) {
              input.setSelectionRange(3, 6);
            } else if ((nextStart == 16 && nextPart.end + 1 == 9)) {
              input.setSelectionRange(6, 9);
            } else if ((nextStart == 16 && nextPart.end + 1 == 12)) {
              input.setSelectionRange(9, 12);
            } else if ((nextStart == 16 && nextPart.end + 1 == 16)) {
              input.setSelectionRange(12, 16);
            } else if (isDateMode && (nextPart.start == 6) && (nextPart.end + 1 == 9)) {
              input.setSelectionRange(6, 10);
            } else if (isDateMode && (nextPart.start == 9) && (nextPart.end + 1 == 12)) {
              this.normalizeYearWhenLeavePart(input, isDateMode);
              input.setSelectionRange(0, 2);
            } else if (!isDateMode && (nextPart.start == 16) && (nextPart.end + 1 == 16)) {
              input.setSelectionRange(12, 16);
            }
            else {
              if ((this.mode == 'date' && nextPart.start == 9) || (this.mode == 'datetime' && nextPart.start == 12)) {
                input.setSelectionRange(nextStart, nextPart.end + 1);
              } else {
                input.setSelectionRange(nextStart, nextPart.end);

              }
            }
          } else if (e.key === 'ArrowLeft' && currentPartIndex >= 0) {
            e.preventDefault();
            const prevPart = parts[currentPartIndex - 1];
            let prevStart = prevPart.start;
            if (cursorPos == 2 && currentPartIndex == 0) {
              input.setSelectionRange(0, 2);
            } else {
              if (isDateMode && prevPart.start == 3 && prevPart.end + 1 == 6) {
                this.normalizeYearWhenLeavePart(input, isDateMode);
              }
              if (!isDateMode && prevPart.start == 9 && prevPart.end + 1 == 12) {
                this.normalizeYearWhenLeavePart(input, isDateMode);
              }
              if (isDateMode && prevPart.start == 6 && prevPart.end + 1 == 9) {
                this.normalizeYearWhenLeavePart(input, isDateMode);
                input.setSelectionRange(3, 6);
              }

              else {
                if ((this.mode == 'date' && prevPart.start == 9) || (this.mode == 'datetime' && prevPart.start == 12)) {
                  input.setSelectionRange(prevStart, prevPart.end + 1);
                } else {
                  input.setSelectionRange(prevStart, prevPart.end);

                }
              }
            }
          }
        }
      }
    };
    // Dùng capture để bắt ArrowLeft/ArrowRight trước khi flatpickr/internal handler chặn bubbling.
    altInputEl.addEventListener('keydown', this.focusHandlers.altInputKeydown, true);

    // Double-click chọn cả chuỗi — chỉ trên alt input của instance này (không HostListener template).
    this.focusHandlers.altInputDblclick = (ev: MouseEvent) => {
      if (this.disabled) {
        return;
      }
      if (this.flatpickrInstance?.altInput !== altInputEl) {
        return;
      }
      const t = ev.target as Node | null;
      if (!t || !altInputEl.contains(t)) {
        return;
      }
      this.isDoubleClicking = true;
      window.setTimeout(() => {
        this.isDoubleClicking = false;
      }, 180);
      this.debugSetSelectionRange(altInputEl, 0, altInputEl.value.length, 'dblclick-alt');
    };
    altInputEl.addEventListener('dblclick', this.focusHandlers.altInputDblclick);
  }



  /**
   * Chuẩn hóa năm khi rời part yyyy bằng điều hướng trái/phải.
   * - 1 số  => thêm 200 phía trước (vd: 9 -> 2009)
   * - 2 số  => nếu > (2 số cuối năm hiện tại + 23) thì dùng 19xx, ngược lại 20xx
   * - 4 số  => giữ nguyên
   */
  private normalizeYearWhenLeavePart(input: HTMLInputElement, isDateMode: boolean): void {
    const year_start = isDateMode ? 6 : 12;
    const year_end_exclusive = isDateMode ? 10 : 16;
    const current_value = input.value || '';

    const year_text = current_value.substring(year_start, year_end_exclusive);
    const year_digits = year_text.replace(/\D/g, '');
    if (!year_digits) {
      return;
    }

    let normalized_year = year_digits;
    if (year_digits.length === 1) {
      normalized_year = `200${year_digits}`;
    } else if (year_digits.length === 2) {
      const year_two_digits = Number(year_digits);
      const current_year_tail = new Date().getFullYear() % 100;
      const cutoff = current_year_tail + 23;
      normalized_year = year_two_digits > cutoff ? `19${year_digits}` : `20${year_digits}`;
    } else if (year_digits.length === 3) {
      normalized_year = `2${year_digits}`;
    }
    else if (year_digits.length > 4) {
      normalized_year = year_digits.substring(0, 4);
    }

    if (normalized_year.length === 4 && normalized_year !== year_text) {
      input.value = current_value.substring(0, year_start) + normalized_year + current_value.substring(year_end_exclusive);
    }

  }

  /** Bắt ESC khi calendar mở (capture phase) → đóng calendar + blur input để focus không nhảy vào input (đặc biệt mode date). */
  private attachEscapeHandler(): void {
    this.removeEscapeHandler();
    const listener = (e: KeyboardEvent) => {
      if (!this.flatpickrInstance?.isOpen) return;

      // ESC: chỉ đóng calendar + blur
      if (e.key === 'Escape' || e.keyCode === 27) {
        e.preventDefault();
        e.stopPropagation();
        this.flatpickrInstance.close();
        const altInput = this.flatpickrInstance?.altInput as HTMLInputElement | undefined;
        if (altInput) {
          this.normalizeYearWhenLeavePart(altInput, this.mode === 'date');
          altInput.blur();
        }
        this.removeEscapeHandler();
        return;
      }

      // ENTER: nếu đã có giá trị thì đóng calendar + emit enterKey (giống handleEnter)
      if (e.key === 'Enter' || e.keyCode === 13) {
        const altInput = this.flatpickrInstance?.altInput as HTMLInputElement | undefined;
        if (altInput) {
          this.normalizeYearWhenLeavePart(altInput, this.mode === 'date');
          this.timestamp = this.convertDateStringToTimestamp(altInput.value);
          this.timestampChange.emit(this.timestamp);
        }
        // Không xử lý khi component disabled
        if (this.disabled) {
          return;
        }
        e.preventDefault();
        e.stopPropagation();

        if (this.flatpickrInstance && this.flatpickrInstance.close) {
          this.flatpickrInstance.close();
        }
        this.isDatepickerOpen = false;

        // Emit enterKey để form nhảy sang input tiếp theo
        setTimeout(() => {
          this.enterKey.emit(e);
        }, 100);

        this.removeEscapeHandler();
        return;
      }
    };
    this.escapeKeydownListener = listener;
    document.addEventListener('keydown', listener, true);
  }

  private removeEscapeHandler(): void {
    if (this.escapeKeydownListener) {
      document.removeEventListener('keydown', this.escapeKeydownListener, true);
      this.escapeKeydownListener = null;
    }
  }

  private convertDateStringToTimestamp(dateString: string): string {
    if (this.mode === 'date') {
      const day = dateString.split('/')[0];
      const month = dateString.split('/')[1];
      const year = dateString.split('/')[2];
      return `${year}-${month}-${day}`;
    } else {
      let timeString = dateString.split(' ')[0];
      let dateStr = dateString.split(' ')[1];
      const hour = timeString.split(':')[0];
      const minute = timeString.split(':')[1];
      const day = dateStr.split('/')[0];
      const month = dateStr.split('/')[1];
      const year = dateStr.split('/')[2];
      return `${year}-${month}-${day} ${hour}:${minute}`;
    }
  }

  private removeTodayButton(): void {
    if (this.todayButtonElement && this.clickHandlers.todayButton) {
      this.todayButtonElement.removeEventListener('click', this.clickHandlers.todayButton);
      if (this.todayButtonElement.parentNode) {
        this.todayButtonElement.parentNode.removeChild(this.todayButtonElement);
      }
      delete this.clickHandlers.todayButton;
      this.todayButtonElement = null;
    } else if (this.flatpickrInstance && this.flatpickrInstance.calendarContainer) {
      // Fallback: remove by class name
      const existingButton = this.flatpickrInstance.calendarContainer.querySelector('.flatpickr-today-button');
      if (existingButton) {
        if (this.clickHandlers.todayButton) {
          existingButton.removeEventListener('click', this.clickHandlers.todayButton);
        }
        existingButton.remove();
        delete this.clickHandlers.todayButton;
        this.todayButtonElement = null;
      }
    }
  }
}
