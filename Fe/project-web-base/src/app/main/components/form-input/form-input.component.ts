import { Component, Input, Output, EventEmitter, SimpleChanges, ViewEncapsulation, ViewChild, ElementRef, ChangeDetectorRef, ChangeDetectionStrategy, NgZone, OnInit, OnDestroy, AfterViewInit, Renderer2 } from '@angular/core';
import { NgSelectComponent } from '@ng-select/ng-select';
import { FlatpickrOptions } from 'ng2-flatpickr';
import { Lightbox } from 'ngx-lightbox';
import { CoreTranslationService } from '@core/services/translation.service';
import { fromEvent, Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, tap } from 'rxjs/operators';

@Component({
  selector: 'app-form-input',
  templateUrl: './form-input.component.html',
  styleUrls: ['./form-input.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FormInputComponent implements OnInit, AfterViewInit, OnDestroy {
  DAY = 86400000;
  //class gán cho ngb dropdown panel của ng select trong trường hợp muốn dùng css lên dropdown mà bật appendBody true
  @Input() rows: number = 3;
  @Input() typeaheadType: boolean = false;
  @Input() checked: boolean = false;
  @Input() label: string = '';
  @Input() for: string = '';
  @Input() placeholder: string = '';
  @Input() hideLabel: boolean = false;
  /** Bật chạy logic bên ngoài Angular zone để tránh lỗi lag input khi gõ tiếng Việt */
  @Input() runOutsideAngularZone: boolean = true;
  /** Format hiển thị cho datetime2 (flatpickr altFormat). VD: 'H:i d/m' = hh:mm dd/mm. Mặc định rỗng. */
  @Input() dateDisplayFormat: string = '';
  @Input() type: string = 'text';
  @Input() model: any;
  @Input() appendTo: string = null;
  @Input() disabled: boolean = false;
  @Input() auto_focus: boolean = false;
  @Input() marginBottomFormGroup: string = '';
  /** Bật emit change khi clear select (ng-select) */
  @Input() onClearChange: boolean = false;
  @Input() title: string = '';

  //thuộc tính để tránh bị lỗi phải kéo hết div cha mới thấy full select
  @Input() appendBody: boolean = false;
  // For money type - display formatted value
  displayValue: string = '';
  @Input() minDate: any = null; // Optional minDate for date picker, only applied if provided
  @Input() size: string | null = 'normal'; // Size class (e.g., 'form-control-sm'), if null uses 'form-control'
  @Output() modelChange = new EventEmitter<any>();

  @Output() change = new EventEmitter<any>();
  @Output() blur = new EventEmitter<void>();
  private inputSubject = new Subject<any>();

  // Flatpickr config for datetime2 type
  flatpickrConfig: FlatpickrOptions = {
    altInput: true,
    enableTime: true,
    time_24hr: true,

    // Giá trị thực (bind vào model)
    dateFormat: 'Y-m-d H:i',

    // Giá trị hiển thị
    altFormat: 'd/m/Y H:i',

    onChange: (selectedDates: Date[], dateStr: string) => {
      this.emitChange(dateStr);
    }
  };


  @Input() options: any[] = [
    { label: 'Tên', value: 1 }
  ];
  @Input() optionLabel: string = 'label';
  @Input() optionValue: string = 'value';
  @Input() typeahead: any = null; // Observable for typeahead search
  @Output() input = new EventEmitter<Event>();
  @Output() onChange = new EventEmitter<any>();
  @Output() onEnter = new EventEmitter<Event>();
  @Output() onBlur1 = new EventEmitter<Event>();

  /** Loại nhãn — normal, required, hoặc orange */
  @Input() labelType: 'normal' | 'required' | 'orange' = 'normal';

  /** Floating label - hiển thị label dạng floating */
  @Input() floating: boolean = false;

  /** Prefix text - hiển thị text bên trái trong input */
  @Input() prefixText: string = '';

  /** Suffix text - hiển thị text bên phải trong input */
  @Input() suffixText: string = '';

  /** Trạng thái focus của input */
  isFocused = false;

  private checkboxClickListener: ((e: Event) => void) | null = null;
  private documentClickUnlisten: (() => void) | null = null;

  constructor(
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
    private elementRef: ElementRef,
    private renderer: Renderer2,
    private lightbox: Lightbox,
    private translate: CoreTranslationService
  ) {
    // this.cdr.detach();
  }
  /** Giới hạn giá trị hoặc độ dài */
  @Input() min?: number;
  @Input() width?: number;
  @Input() max?: number;
  @Input() step?: number;
  @Input() searchWidth?: number;
  @Input() allowDecimal: boolean = false; // Cho phép nhập số thập phân
  @Input() numericOnly: boolean = false; // Chỉ cho phép nhập số (không có dấu thập phân)
  @Input() selectOpen?: () => void;
  @Input() selectClose?: () => void;

  /** Chỉ dùng khi type === 'image-upload': preview tròn (avatar) hoặc chữ nhật (chữ ký). */
  @Input() imageShape: 'round' | 'rectangle' = 'rectangle';
  /** URL/data URL hiển thị; rỗng thì dùng imageFallbackUrl. */
  @Input() imagePreviewUrl: string | null = null;
  /** Kích thước custom cho preview ảnh. Để null sẽ dùng size mặc định theo imageShape. */
  @Input() imageCustomWidth: number | null = null;
  /** Đơn vị cho imageCustomWidth: px (mặc định) hoặc % (vd chữ ký full cột). */
  @Input() imageCustomWidthUnit: 'px' | '%' = 'px';
  @Input() imageCustomHeight: number | null = null;
  @Input() imageFallbackUrl = 'assets/images/avatars/avatar-default.png';
  @Input() imageAltText = '';
  /** Nút chọn file (ưu tiên hơn placeholder/label). */
  @Input() imageButtonLabel = '';
  @Input() imageAccept = 'image/jpeg,image/jpg,image/png,image/webp';
  /** Danh sách lỗi từ cha (vd errMsg). */
  @Input() imageErrors: Array<{ type: string; label: string }> = [];
  /** Lọc lỗi theo err.type (vd 'photo', 'avatar'). */
  @Input() imageErrorKey = '';
  /** Bật lightbox khi click ảnh xem trước (ngx-lightbox). */
  @Input() imageLightboxEnabled = true;
  /** URL ảnh full trong lightbox; không set thì dùng cùng nguồn hiển thị (preview/fallback). */
  @Input() imageLightboxFullSrc: string | null = null;
  /** Hiện nút xóa ảnh khi hover (chỉ khi đang có ảnh thật, không phải ảnh mặc định). */
  @Input() imageClearEnabled = true;

  @Output() imageFileChange = new EventEmitter<Event>();
  /** Bỏ ảnh đã chọn / preview (cha gán null file + preview). */
  @Output() imageClear = new EventEmitter<void>();
  /** type === 'file-upload' */
  @Input() fileUploadAccept = '*/*';
  @Input() fileUploadIconClass = 'fas fa-cloud-arrow-up';
  @Input() fileUploadBadgeText = 'Xem file';
  /** Hiện nút × góc badge khi có file; tắt nếu màn không cho xóa. */
  @Input() fileUploadClearable = true;
  @Input() fileUploadDisabled = false;
  @Output() fileUploadChange = new EventEmitter<Event>();
  @Output() fileUploadView = new EventEmitter<void>();
  @Output() fileUploadClear = new EventEmitter<void>();

  /** Preview image-upload: bật layout full-width khi dùng imageCustomWidth theo %. */
  get imageUploadUsesPercentWidth(): boolean {
    return this.imageCustomWidthUnit === '%' && this.imageCustomWidth != null;
  }

  get imageUploadWidthPx(): number | null {
    return this.imageCustomWidthUnit === 'px' ? this.imageCustomWidth : null;
  }

  get imageUploadWidthPercent(): number | null {
    return this.imageCustomWidthUnit === '%' ? this.imageCustomWidth : null;
  }

  onSelectOpen() {
    this.isOpen = true;
    this.isFocused = true;
    this.bindDocumentClick();
    if (this.floating) {
      this.scheduleFloatingNotchMeasure();
    }
    if (this.selectOpen && typeof this.selectOpen === 'function') {
      this.selectOpen();
    }
  }

  onSelectClose() {
    this.isOpen = false;
    if (this.model == null || this.model == '' || (Array.isArray(this.model) && this.model.length == 0)) {
      this.isFocused = false;
    }
    this.unbindDocumentClick();
    if (this.floating) {
      this.scheduleFloatingNotchMeasure();
    }
    if (this.selectClose && typeof this.selectClose === 'function') {
      this.selectClose();
    }
  }

  getTitleFromOptions(options: any[], model: any): string {
    const option = options.find(opt => opt.value === model);
    return option ? option.label : '';
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['auto_focus']) {
      if (this.auto_focus) {
        this.focus_if_needed(true);
      } else {
        this.auto_focus_done = false;
      }
    }
    if (this.myInput) {
      this.myInput.nativeElement.value = this.model ?? '';
    }
    if (changes['model']) {
      const newValue = changes['model'].currentValue;
      if (this.type == 'select-search' || this.type == 'multi-select' || this.type == 'text' || this.type == 'email') {
        if (newValue == null || newValue == '' || (Array.isArray(newValue) && newValue.length == 0)) {
          this.isFocused = false;
        } else {
          this.isFocused = true;
        }
      }
      if (this.type == 'select-search') {
        if (!newValue)
          this.searchText = newValue
        // Normalize null/undefined/empty string to null for ng-select to show placeholder
        if (newValue === undefined || newValue === '' || newValue === null) {
          this.model = null;
        }
      }
      // Format money display value
      if (this.type === 'money') {
        this.displayValue = this.formatMoney(newValue);
      }
      // Check floating state when model changes
      if (this.floating) {
        this.checkFloatingState();
      }
      // Mark for check when model changes (especially important for OnPush + checkbox revert)
      this.cdr.markForCheck();
    }
    else if (changes['options']) {
      this.options = [...this.options]; // clone để ng-select refresh
      // this.cdr.markForCheck();
    }
    else if (changes['floating']) {
      // When floating property changes, check state
      if (this.floating) {
        this.checkFloatingState();
      }
    }
    if (changes['label'] || changes['size']) {
      if (this.floating) {
        this.scheduleFloatingNotchMeasure();
      }
    }
    if (
      changes['imagePreviewUrl'] ||
      changes['imageFallbackUrl'] ||
      changes['imageShape'] ||
      changes['imageErrors'] ||
      changes['imageErrorKey'] ||
      changes['imageLightboxEnabled'] ||
      changes['imageLightboxFullSrc'] ||
      changes['imageClearEnabled']
    ) {
      this.cdr.markForCheck();
    }
  }

  get displayImageUploadSrc(): string {
    return this.imagePreviewUrl || this.imageFallbackUrl;
  }

  /** Có URL preview từ cha (đã chọn file hoặc ảnh từ server); không tính ảnh fallback mặc định. */
  get hasCustomImageUploadPreview(): boolean {
    const u = this.imagePreviewUrl;
    return u != null && String(u).trim().length > 0;
  }

  /** Chỉ khi có ảnh thật mới bật lightbox + cursor zoom (không áp dụng cho ảnh mặc định). */
  get imageUploadPreviewInteractive(): boolean {
    return this.imageLightboxEnabled && this.hasCustomImageUploadPreview;
  }

  get imageUploadLightboxTitle(): string {
    const t = this.translate.instant('RESULT_IMAGE.CLICK_TO_VIEW');
    return t && t !== 'RESULT_IMAGE.CLICK_TO_VIEW' ? t : 'Click để xem';
  }

  /** Click vào vùng ảnh: mở lightbox (không kích hoạt chọn file). */
  onImageUploadPreviewClick(event: MouseEvent): void {
    if (!this.imageUploadPreviewInteractive) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    this.openImageUploadLightbox();
  }

  onImageUploadPreviewKeydown(event: KeyboardEvent): void {
    if (!this.imageUploadPreviewInteractive) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    this.openImageUploadLightbox();
  }

  onImageUploadClearClick(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.imageClear.emit();
    this.resetImageFileInput();
  }

  get hasFileUploadValue(): boolean {
    if (this.model == null) {
      return false;
    }
    if (Array.isArray(this.model)) {
      return this.model.length > 0;
    }
    if (typeof this.model === 'string') {
      return this.model.trim().length > 0;
    }
    return true;
  }

  onFileUploadNativeChange(event: Event): void {
    this.fileUploadChange.emit(event);
  }

  onFileUploadViewClick(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.fileUploadView.emit();
  }

  onFileUploadClearClick(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.fileUploadClear.emit();
  }

  openImageUploadLightbox(): void {
    if (!this.imageUploadPreviewInteractive) {
      return;
    }
    const src = this.imageLightboxFullSrc || this.displayImageUploadSrc;
    if (!src) {
      return;
    }
    this.lightbox.open(
      [
        {
          src,
          caption: this.imageAltText || '',
          thumb: this.displayImageUploadSrc
        }
      ],
      0
    );
  }

  onImageFileNativeChange(event: Event): void {
    this.imageFileChange.emit(event);
    const input = event.target as HTMLInputElement;
    if (input) {
      input.value = '';
    }
    this.cdr.markForCheck();
  }

  /** Reset input file (gọi từ cha khi mở lại popup). */
  resetImageFileInput(): void {
    const el = this.imageNativeFileInput?.nativeElement;
    if (el) {
      el.value = '';
    }
    this.cdr.markForCheck();
  }

  @ViewChild(NgSelectComponent) ngSelect!: NgSelectComponent;
  @ViewChild('imageNativeFileInput') imageNativeFileInput?: ElementRef<HTMLInputElement>;

  focusInput() {
    if (this.ngSelect) {
      this.ngSelect.focus(); // focus đúng cho ng-select
    }
  }

  showPassword = false;




  // Allow decimal input (comma and dot)
  allowDecimalInput(event: KeyboardEvent): void {
    const char = event.key;
    const inputElement = event.target as HTMLInputElement;
    let currentValue = inputElement.value || '';

    // Cho phép các phím điều khiển
    if (event.key === 'Backspace' || event.key === 'Delete' ||
      event.key.startsWith('Arrow') || event.key === 'Tab' ||
      event.key === 'Enter' || (event.ctrlKey && ['a', 'c', 'v', 'x'].includes(event.key.toLowerCase()))) {
      return;
    }

    // Cho phép số 0-9
    if (/^[0-9]$/.test(char)) {
      return;
    }

    // Cho phép dấu chấm hoặc phẩy (chỉ một lần)
    if (char === '.' || char === ',') {
      if (!currentValue.includes('.') && !currentValue.includes(',')) {
        return;
      } else {
        event.preventDefault();
        return;
      }
    }

    // Chặn các ký tự khác
    event.preventDefault();
  }

  // Allow numeric only input (no decimal point)
  allowNumericOnly(event: KeyboardEvent): void {
    const char = event.key;

    // Cho phép các phím điều khiển
    if (event.key === 'Backspace' || event.key === 'Delete' ||
      event.key.startsWith('Arrow') || event.key === 'Tab' ||
      event.key === 'Enter' || (event.ctrlKey && ['a', 'c', 'v', 'x'].includes(event.key.toLowerCase()))) {
      return;
    }

    // Chỉ cho phép số 0-9
    if (/^[0-9]$/.test(char)) {
      return;
    }

    // Chặn tất cả các ký tự khác (bao gồm cả chữ, dấu chấm, dấu phẩy, ký tự đặc biệt)
    event.preventDefault();
  }

  // Handle decimal input change
  onDecimalChange(value: any) {
    // Chỉ emit raw value, sẽ normalize khi blur
    this.model = value;
    this.modelChange.emit(value);
  }

  // Handle decimal blur - normalize value
  onDecimalBlur(event: FocusEvent) {
    const inputElement = event.target as HTMLInputElement;
    let value = inputElement.value || '';

    // Trim whitespace
    value = value.trim();

    // Nếu rỗng hoặc chỉ có dấu phẩy/chấm ở cuối, set về null
    if (!value || value === '.' || value === ',') {
      this.model = null;
      this.emitChange(null);
      inputElement.value = '';
      this.cdr.markForCheck();
      this.onBlur(event);
      return;
    }

    // Replace comma with dot
    value = value.replace(',', '.');

    // Validate là số hợp lệ
    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      // Nếu không phải số hợp lệ, reset về giá trị model hiện tại hoặc null
      const currentValue = this.model != null ? String(this.model) : '';
      inputElement.value = currentValue;
      this.onBlur(event);
      return;
    }

    // Check min/max nếu có
    let finalValue = numValue;
    if (this.min != null && numValue < this.min) {
      finalValue = this.min;
    } else if (this.max != null && numValue > this.max) {
      finalValue = this.max;
    }

    // Update model và emit change
    this.model = finalValue;
    this.emitChange(finalValue);

    // Update input value để hiển thị giá trị đã normalize
    inputElement.value = String(finalValue);
    this.cdr.markForCheck();
    this.onBlur(event);
  }

  allowOnlyDigits(event: KeyboardEvent): void {
    const char = event.key;
    const inputElement = event.target as HTMLInputElement;
    let currentValue = inputElement.value || '';

    // Cho phép 0–9 và dấu + (chỉ khi type là phone và chưa có dấu +)
    if (this.type === 'phone' && char === '+' && !currentValue.includes('+')) {
      // Cho phép dấu + ở đầu cho phone
      return;
    }

    // Cho phép dấu chấm/phẩy cho số thập phân (chỉ một lần)
    if (this.allowDecimal && (char === '.' || char === ',')) {
      if (!currentValue.includes('.') && !currentValue.includes(',')) {
        // Cho phép dấu chấm/phẩy lần đầu
        return;
      } else {
        // Đã có dấu chấm/phẩy rồi, không cho nhập thêm
        event.preventDefault();
        return;
      }
    }

    // Cho phép các phím điều khiển (Backspace, Delete, Arrow keys, etc.) - phải check trước
    if (event.key === 'Backspace' || event.key === 'Delete' ||
      event.key.startsWith('Arrow') || event.key === 'Tab' ||
      event.key === 'Enter' || (event.ctrlKey && ['a', 'c', 'v', 'x'].includes(event.key.toLowerCase()))) {
      return;
    }

    // Giới hạn độ dài tối đa cho input type="number" khi gõ
    if (this.type === 'number' && this.max != null) {
      // Loại bỏ ký hiệu scientific notation để tính độ dài chính xác
      const numericValue = currentValue.replace(/[eE\+\-\.]/g, '');

      // Tính toán độ dài sau khi nhập (nếu đang select text thì sẽ thay thế)
      const selection = inputElement.selectionStart !== inputElement.selectionEnd;
      const selectedLength = selection ? (inputElement.selectionEnd - inputElement.selectionStart) : 0;
      const futureNumericLength = numericValue.length - selectedLength + (/^[0-9]$/.test(char) ? 1 : 0);

      // Nếu sẽ vượt quá max length và đang nhập số, chặn nhập
      if (futureNumericLength > this.max && /^[0-9]$/.test(char)) {
        event.preventDefault();
        return;
      }

      // Ngăn chặn nhập 'e', 'E', '+', '-' khi đã đạt max length (để tránh scientific notation)
      if (numericValue.length >= this.max && /^[eE\+\-]$/.test(char)) {
        event.preventDefault();
        return;
      }
    }

    // Giới hạn độ dài tối thiểu cho input type="number" - ngăn xóa khi đã đạt min
    if (this.type === 'number' && this.min != null) {
      // Loại bỏ ký hiệu scientific notation để tính độ dài chính xác
      const numericValue = currentValue.replace(/[eE\+\-\.]/g, '');

      // Tính toán độ dài sau khi xóa
      const selection = inputElement.selectionStart !== inputElement.selectionEnd;
      const selectedLength = selection ? (inputElement.selectionEnd - inputElement.selectionStart) : 0;
      const futureNumericLength = numericValue.length - selectedLength -
        ((event.key === 'Backspace' || event.key === 'Delete') ? 1 : 0);

      // Nếu sẽ nhỏ hơn min length và đang xóa, chặn
      if (futureNumericLength < this.min && (event.key === 'Backspace' || event.key === 'Delete')) {
        event.preventDefault();
        return;
      }
    }

    // Chỉ cho phép 0–9 (không cho phép e, E, +, - để tránh scientific notation)
    if (!/^[0-9]$/.test(char)) {
      event.preventDefault();
    }
  }

  onModelChange(value: any) {
    if (this.type == 'select-search' || this.type == 'multi-select' || this.type == 'text' || this.type == 'email') {
      console.log(value, (value == null || value == '' || (Array.isArray(value) && value.length == 0)));
      if (value == null || value == '' || (Array.isArray(value) && value.length == 0)) {
        this.isFocused = false;
      } else {
        this.isFocused = true;
      }
      if (this.floating) {
        this.scheduleFloatingNotchMeasure();
      }
    }
    if (value === null) {
      // Người dùng bấm nút clear
      if (this.onClearChange) {
        this.onClear();
      }

      if (this.type == 'multi-select') {
        this.modelChange.emit(value);
        this.change.emit(value);
      }
      return;
    }
    if (this.type == 'multi-select') {
      this.modelChange.emit(value);
      this.change.emit(value);
    }
  }

  onClear() {
    // Mặc định: emit null để cha nhận được modelChange
    this.model = null;
    this.modelChange.emit(null);
    this.onChange.emit(null);
    if (this.change)
      this.change.emit(null)
  }


  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  onCheckboxChange(event: Event) {
    const target = event.target as HTMLInputElement;
    const newValue = target.checked;
    this.model = newValue;
    this.emitChange(newValue);
  }

  onCheckboxEnter(event: KeyboardEvent) {
    if (this.type !== 'checkbox' || this.disabled) {
      return;
    }

    event.preventDefault();
    const checkbox = event.target as HTMLInputElement;
    if (checkbox) {
      // Toggle checkbox
      checkbox.checked = !checkbox.checked;
      // Update model và emit change
      this.model = checkbox.checked;
      this.emitChange(this.model);
      this.cdr.markForCheck();
    }
  }

  private inputHandler = (e: any) => {
    this.inputSubject.next(e.target.value);
  };

  private keydownHandler = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      this.ngZone.run(() => {
        this.handleEnter(e);
      });
    }
  };

  private blurHandler = (e: FocusEvent) => {
    this.ngZone.run(() => {
      this.onBlur(e);
    });
  };

  emitChange(value: any) {
    this.executeLogic(value);
  }

  // Format number to VND currency string
  formatMoney(value: any): string {
    if (value === null || value === undefined || value === '') {
      return '';
    }
    const numValue = typeof value === 'string' ? parseFloat(value.replace(/[^\d]/g, '')) : Number(value);
    if (isNaN(numValue)) {
      return '';
    }
    return numValue.toLocaleString('vi-VN') + ' đ';
  }

  // Parse formatted money string to number
  parseMoney(value: any): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }
    // Remove all non-digit characters except decimal point
    const cleaned = String(value).replace(/[^\d]/g, '');
    if (cleaned === '') {
      return null;
    }
    const numValue = parseFloat(cleaned);
    return isNaN(numValue) ? null : numValue;
  }

  // Handle money input - format on blur
  onMoneyBlur(event: FocusEvent) {
    if (this.type === 'money') {
      const inputElement = event.target as HTMLInputElement;
      const numValue = this.parseMoney(inputElement.value);
      this.displayValue = this.formatMoney(numValue);
      if (this.model !== numValue) {
        this.model = numValue;
        this.emitChange(numValue);
      }
      this.isFocused = false;
      this.cdr.markForCheck();
    } else {
      this.onBlur(event);
    }
  }

  // Handle money input change - update display value while typing
  onMoneyInputChange(value: string) {
    if (this.type === 'money') {
      // Store raw input value for display
      this.displayValue = value;
      // Parse and update model immediately for two-way binding
      const numValue = this.parseMoney(value);
      if (this.model !== numValue) {
        this.model = numValue;
        this.emitChange(numValue);
        // Don't emit here, will emit on blur
      }
    }
  }

  // Handle money keypress - only allow digits
  onMoneyKeypress(event: KeyboardEvent) {
    if (this.type === 'money') {
      const char = event.key;
      // Allow control keys
      if (event.key === 'Backspace' || event.key === 'Delete' ||
        event.key.startsWith('Arrow') || event.key === 'Tab' ||
        event.key === 'Enter' || (event.ctrlKey && ['a', 'c', 'v', 'x'].includes(char.toLowerCase()))) {
        return;
      }
      // Only allow digits
      if (!/^[0-9]$/.test(char)) {
        event.preventDefault();
      }
    }
  }

  handleInput(event: Event) {

  }

  handleEnter(event: Event) {
    if (event != null)
      this.onEnter.emit(event);
  }

  /**
   * Select-search: không chặn ArrowUp/ArrowDown để ng-select điều hướng option.
   * Chỉ can thiệp phím Enter để giữ flow mở/chọn/chuyển focus theo handleSelectEnter.
   */
  selectSearchKeyDownFn = (event: KeyboardEvent): boolean => {
    if (event.key !== 'Enter' && event.which !== 13) {
      return true;
    }
    this.handleSelectEnter(event);
    // Đã tự xử lý Enter trong handleSelectEnter
    return false;
  };

  /**
   * Ng-select multiple: mặc định Enter gọi toggleItem → bỏ chọn nếu đã chọn.
   * Trả về false để chặn xử lý nội bộ khi option đang highlight đã selected — chỉ thêm khi chưa chọn.
   */
  multiSelectKeyDownFn = (event: KeyboardEvent): boolean => {
    if (event.key !== 'Enter' && event.which !== 13) {
      return true;
    }
    const ns = this.ngSelect;
    if (!ns?.multiple || !ns.isOpen) {
      return true;
    }
    const marked = ns.itemsList?.markedItem as { selected?: boolean } | undefined;
    if (!marked) {
      return true;
    }
    if (marked.selected) {
      return false;
    }
    return true;
  };

  handleRadioKeydown(event: KeyboardEvent, currentIndex: number) {
    if (this.type !== 'radio' || !this.options || this.options.length === 0) {
      return;
    }

    // Chỉ xử lý arrow left và arrow right
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();

      const direction = event.key === 'ArrowLeft' ? -1 : 1;
      const newIndex = currentIndex + direction;

      // Wrap around: nếu vượt quá thì quay về đầu/cuối
      let targetIndex: number;
      if (newIndex < 0) {
        targetIndex = this.options.length - 1; // Quay về radio cuối cùng
      } else if (newIndex >= this.options.length) {
        targetIndex = 0; // Quay về radio đầu tiên
      } else {
        targetIndex = newIndex;
      }

      // Focus vào radio button mới
      const targetOption = this.options[targetIndex];
      const targetId = `${this.label}-radio-${targetIndex}`;
      const targetRadio = document.getElementById(targetId) as HTMLInputElement;

      if (targetRadio) {
        targetRadio.focus();
        // Select the radio
        targetRadio.checked = true;
        this.model = targetOption[this.optionValue] ?? targetOption;
        this.emitChange(this.model);
        this.cdr.markForCheck();
      }
    }
  }



  handleBlur() {
    this.blur.emit();
  }

  handleSelectKeydown(event: KeyboardEvent) {
    // Chỉ xử lý khi nhấn Enter
    if (event.key === 'Enter' || event.keyCode === 13) {
      this.handleSelectEnter(event);
    }
  }

  handleSelectEnter(event: KeyboardEvent) {
    // Nếu đã có giá trị, chuyển sang input tiếp theo luôn
    if (this.model !== null && this.model !== undefined && this.model !== '') {
      if (this.ngSelect && this.ngSelect.isOpen) {
        const marked = this.ngSelect?.itemsList?.markedItem;

        if (marked && marked.value) {
          const raw = marked.value;
          if (typeof raw === 'string') {
            this.model = JSON.parse(raw).value;
          } else {
            this.model = (raw as any).value;
          }
          this.cdr.markForCheck();
          this.emitChange(this.model);
        }
        this.ngSelect.close();
        this.isOpen = false;
        this.unbindDocumentClick();
      }
      setTimeout(() => {
        this.onEnter.emit(event);
      }, 50);
      return;
    }

    // Chưa có giá trị: Enter lần 1 mở dropdown, Enter lần 2 đóng và chuyển sang input khác
    if (!this.model && this.ngSelect && this.ngSelect.isOpen) {
      // Dropdown đang mở, Enter lần 2: đóng và chuyển sang input khác
      const marked = this.ngSelect?.itemsList?.markedItem;

      if (marked && marked.value) {
        const raw = marked.value;
        if (typeof raw === 'string') {
          this.model = JSON.parse(raw).value;
        } else {
          this.model = (raw as any).value;
        }
        this.cdr.markForCheck();
        this.emitChange(this.model);
      }
      this.ngSelect.close();
      this.isOpen = false;
      this.unbindDocumentClick();
      setTimeout(() => {
        this.onEnter.emit(event);
      }, 150);
    } else {
      // Dropdown chưa mở, Enter lần 1: mở dropdown (KHÔNG emit Enter event)
      event.preventDefault();
      event.stopPropagation();
      if (this.ngSelect) {
        this.ngSelect.open();
        this.isOpen = true;
        this.bindDocumentClick();
      }
      // Không emit Enter event ở đây, chỉ mở dropdown
    }
  }

  onFocus(event: FocusEvent) {
    if (this.floating && (this.type === 'text' || this.type === 'email')) {
      this.isFocused = true;
    }
    if (this.floating) {
      this.scheduleFloatingNotchMeasure();
    }
    this.cdr.markForCheck();
  }

  onBlur(event: FocusEvent) {
    this.onBlur1.emit(event);
    if (this.floating && (this.type === 'text' || this.type === 'email')) {
      const t = event.target as HTMLInputElement;
      if (t.value == null || String(t.value).trim() === '') {
        this.isFocused = false;
      }
    }
    if (this.floating) {
      this.scheduleFloatingNotchMeasure();
    }
    this.cdr.markForCheck();
  }

  checkFloatingState(): void {
    if (this.floating) {
      this.scheduleFloatingNotchMeasure();
    }
    this.cdr.markForCheck();
  }

  /**
   * Đồng bộ mép phải notch clip-path với độ rộng nhãn floating (label + padding),
   * sau layout ổn định (animation 0.2s + frame).
   */
  private scheduleFloatingNotchMeasure(): void {
    if (!this.floating) {
      return;
    }
    if (this.floatingNotchMeasure_timer != null) {
      clearTimeout(this.floatingNotchMeasure_timer);
      this.floatingNotchMeasure_timer = null;
    }
    requestAnimationFrame(() => {
      this.updateFloatingNotchRightPx();
      this.cdr.markForCheck();
    });
    this.floatingNotchMeasure_timer = setTimeout(() => {
      this.floatingNotchMeasure_timer = null;
      this.updateFloatingNotchRightPx();
      this.cdr.markForCheck();
    }, 230);
  }

  private updateFloatingNotchRightPx(): void {
    const notch_left_px = 10;
    const fallback_px = 70;
    const el = this.floatingLabelNotchEl?.nativeElement;
    if (
      !this.floating ||
      !el ||
      !(this.type === 'text' || this.type === 'email' || this.type === 'select-search' || this.type === 'multi-select')
    ) {
      this.floatingNotchRightPx = fallback_px;
      return;
    }
    if (!this.isFloatingActive) {
      this.floatingNotchRightPx = fallback_px;
      return;
    }
    const label_width = Math.ceil(el.getBoundingClientRect().width);
    this.floatingNotchRightPx = Math.max(notch_left_px + 24, notch_left_px + label_width + 5);
  }

  get isFloatingActive(): boolean {
    // Floating label active khi: có giá trị hoặc đang focus
    return this.floating && (this.hasValue() || this.isFocused);
  }

  hasValue(): boolean {
    if (this.model === null || this.model === undefined || (Array.isArray(this.model) && this.model.length == 0)) {
      return false;
    }
    if (typeof this.model === 'string') {
      return this.model.trim().length > 0;
    }
    return true;
  }

  // Get input class based on size - always keep form-control, add size if provided
  get inputClass(): string {
    return this.size ? `form-control ${this.size}` : 'form-control';
  }

  @Input() searchText = '';
  filteredOptions: any[] = [];
  isOpen = false;
  @ViewChild('container') containerRef!: ElementRef;
  @ViewChild('inputEl') inputEl!: ElementRef<HTMLInputElement>;

  /** Nhãn floating dùng đo chiều rộng cho clip-path (--floating-notch-right). */
  @ViewChild('floatingLabelForNotch', { read: ElementRef }) floatingLabelNotchEl?: ElementRef<HTMLElement>;
  floatingNotchRightPx = 70;
  private floatingNotchMeasure_timer: ReturnType<typeof setTimeout> | null = null;

  selectAll() {
    this.inputEl.nativeElement.select();
  }

  @ViewChild('myInput', { static: false }) myInput!: ElementRef<HTMLInputElement | HTMLTextAreaElement>;

  @ViewChild('myInput')
  set inputRef(el: ElementRef<HTMLInputElement | HTMLTextAreaElement> | undefined) {
    if (!el) return;

    this.myInput = el;
    this.focus_if_needed();
    if (['text', 'email', 'textarea'].includes(this.type) && this.runOutsideAngularZone) {
      this.setupInput();
    }
  }

  private initialized = false;
  private auto_focus_done = false;

  private focus_if_needed(force_refocus: boolean = false): void {
    if (!this.auto_focus || !this.myInput?.nativeElement || this.disabled) {
      return;
    }
    if (this.auto_focus_done && !force_refocus) {
      return;
    }
    this.auto_focus_done = true;
    setTimeout(() => {
      if (!this.auto_focus || !this.myInput?.nativeElement || this.disabled) {
        return;
      }
      this.myInput.nativeElement.focus();
    }, 0);
  }

  setupInput() {
    const el = this.myInput.nativeElement;

    // set initial value
    el.value = this.model ?? '';

    // tránh add nhiều lần
    el.removeEventListener('input', this.inputHandler);
    el.removeEventListener('keydown', this.keydownHandler);
    el.removeEventListener('blur', this.blurHandler);

    this.ngZone.runOutsideAngular(() => {
      el.addEventListener('input', this.inputHandler);
      el.addEventListener('keydown', this.keydownHandler);
      el.addEventListener('blur', this.blurHandler);
    });

    if (!this.initialized) {
      this.initialized = true;

      this.inputSubject.pipe(
        debounceTime(50),
        distinctUntilChanged()
      ).subscribe(value => {
        this.ngZone.run(() => {
          this.executeLogic(value);
        });
      });
    }
  }


  ngOnInit() {
    this.filteredOptions = [...this.options];
    // Normalize model to null if it's undefined or empty string for select-search to show placeholder
    if (this.type === 'select-search' && (this.model === undefined || this.model === '' || this.model === 0)) {
      this.model = null;
    }
    // Initialize money display value
    if (this.type === 'money') {
      this.displayValue = this.formatMoney(this.model);
    }
    // Check initial floating state
    if (this.floating) {
      this.checkFloatingState();
    }

    // this.inputSubject.pipe(
    //   debounceTime(100) // Đợi 20ms để bộ gõ ổn định ký tự,
    // ).subscribe(value => {
    //   requestAnimationFrame(() => {
    //     this.executeLogic(value);
    //   });
    // });


  }

  executeLogic(value: any) {
    // Xử lý money type - parse formatted string to number
    if (this.type === 'money') {
      const numValue = this.parseMoney(value);
      this.displayValue = this.formatMoney(numValue);
      value = numValue;
    }

    // Xử lý giới hạn độ dài cho input type="number" khi model thay đổi
    if (this.type === 'number' && value != null && value !== '') {
      const valueStr = value.toString();

      // Giới hạn độ dài tối đa (maxlength)
      if (this.max != null && valueStr.length > this.max) {
        const truncatedValue = valueStr.substring(0, this.max);
        const numValue = truncatedValue ? parseFloat(truncatedValue) : null;
        value = isNaN(numValue) ? null : numValue;
      }

      // Giới hạn độ dài tối thiểu (minlength) - thêm số 0 ở đầu nếu cần
      if (this.min != null && valueStr.length < this.min && valueStr.length > 0) {
        const paddedValue = valueStr.padStart(this.min, '0');
        const numValue = paddedValue ? parseFloat(paddedValue) : null;
        value = isNaN(numValue) ? null : numValue;
      }
    }
    this.modelChange.emit(value);
    this.onChange.emit(value);
    if (this.change)
      this.change.emit(value)
  }

  ngAfterViewInit() {
    // Optimize checkbox click handler for performance after view init
    // if (this.type === 'checkbox') {
    //   setTimeout(() => {
    //     this.setupCheckboxOptimization();
    //   }, 0);
    // }

    if (this.floating) {
      this.scheduleFloatingNotchMeasure();
    }
  }

  ngOnDestroy() {
    // Clean up checkbox listener
    // if (this.checkboxClickListener && this.type === 'checkbox') {
    //   const checkboxElement = this.elementRef.nativeElement.querySelector('input[type="checkbox"]');
    //   if (checkboxElement) {
    //     const nativeRemove = (window as any).__zone_symbol__removeEventListener;
    //     if (nativeRemove) {
    //       checkboxElement.__zone_symbol__removeEventListener('click', this.checkboxClickListener, false);
    //     } else {
    //       checkboxElement.removeEventListener('click', this.checkboxClickListener);
    //     }
    //   }
    //   this.checkboxClickListener = null;
    // }

    if (this.checkboxClickListener && this.type === 'checkbox') {
      const checkboxElement = this.elementRef.nativeElement.querySelector('input[type="checkbox"]');
      if (checkboxElement) {
        const nativeRemove = (window as any).__zone_symbol__removeEventListener;
        if (nativeRemove) {
          checkboxElement.__zone_symbol__removeEventListener('click', this.checkboxClickListener, false);
        } else {
          checkboxElement.removeEventListener('click', this.checkboxClickListener);
        }
      }
      this.checkboxClickListener = null;
    }

    // Clean up document click listener (only bound when dropdown is open)
    this.unbindDocumentClick();

    if (this.floatingNotchMeasure_timer != null) {
      clearTimeout(this.floatingNotchMeasure_timer);
      this.floatingNotchMeasure_timer = null;
    }
  }

  private setupCheckboxOptimization(): void {
    const checkboxElement = this.elementRef.nativeElement.querySelector('input[type="checkbox"]');
    if (checkboxElement) {
      // Handle click event (faster than change, fires earlier)
      const clickHandler = (e: Event) => {
        e.stopPropagation();
        // Browser already toggled checkbox, get new value
        const target = e.target as HTMLInputElement;
        const newValue = target.checked;

        // Update model immediately (local state only)
        this.model = newValue;

        // Emit in Angular zone so parent component can receive and process it
        // Use ngZone.run() to ensure change detection works in parent
        this.ngZone.run(() => {
          this.modelChange.emit(newValue);
          this.onChange.emit(newValue);
          if (this.change) {
            this.change.emit(newValue);
          }
        });
      };

      // Attach click listener bypassing Zone.js completely
      if ((window as any).__zone_symbol__addEventListener) {
        checkboxElement.__zone_symbol__addEventListener('click', clickHandler, false);
      } else {
        // Fallback: run outside angular
        this.ngZone.runOutsideAngular(() => {
          checkboxElement.addEventListener('click', clickHandler);
        });
      }

      this.checkboxClickListener = clickHandler;
    }
  }


  // Mở dropdown khi focus input
  openDropdown() {
    this.isOpen = true;
    this.filteredOptions = [...this.options];
    this.bindDocumentClick();
  }
  @Output() searchTextChange = new EventEmitter<string>();
  // Lọc danh sách theo từ khoá
  filterOptions() {
    const keyword = this.searchText.toLowerCase();
    this.searchTextChange.emit(this.searchText);
    this.filteredOptions = this.options.filter(opt =>
      (opt[this.optionLabel] ?? opt.label ?? '').toLowerCase().includes(keyword)
    );
    this.isOpen = true;
    this.bindDocumentClick();
  }

  clearSearch() {
    this.searchText = '';
    this.modelChange.emit('');
    this.onChange.emit('');
    this.cdr.markForCheck();
  }

  clearSearchAll() {
    this.searchText = '';

    // Close dropdown if open
    if (this.ngSelect && this.ngSelect.isOpen) {
      this.ngSelect.close();
    }

    // Reset model to null - ng-select will handle this through two-way binding [(ngModel)]
    // This is the key: set model to null and ng-select will automatically show placeholder
    this.model = null;

    // Clear ng-select component state
    if (this.ngSelect) {
      // Clear search term
      this.ngSelect.searchTerm = '';
      // Clear model in ng-select - this removes the selected value and clear button
      this.ngSelect.clearModel();
    }

    // Emit changes
    this.modelChange.emit(null);
    this.onChange.emit(null);

    // Force change detection - this ensures ng-select updates
    this.cdr.markForCheck();

    // Use setTimeout to ensure ng-select has processed the model change
    setTimeout(() => {
      // Double-check that model is null and ng-select is cleared
      if (this.model !== null) {
        this.model = null;
      }
      if (this.ngSelect) {
        // Ensure search term is cleared
        if (this.ngSelect.searchTerm) {
          this.ngSelect.searchTerm = '';
        }
        // Force ng-select to detect changes
        this.ngSelect.detectChanges();
      }
      this.cdr.markForCheck();
    }, 0);
  }

  onChange1(value: any) {
    if (value) {
      this.model = value.value;
      this.modelChange.emit(value.value);
      this.onChange.emit(value.value);
    }
    else {
      this.model = null;

      this.modelChange.emit(null);
      this.onChange.emit(null);
    }
  }

  // Chọn item
  selectOption(opt: any) {
    const value = opt[this.optionValue] ?? opt.value ?? opt;
    this.model = value;
    this.searchText = opt.label;
    this.modelChange.emit(value);
    this.onChange.emit(value);
    this.isOpen = false; // ẩn dropdown sau khi chọn
    this.unbindDocumentClick();
  }

  isSelected(opt: any): boolean {
    const value = opt[this.optionValue] ?? opt.value ?? opt;
    return value === this.model;
  }

  private bindDocumentClick(): void {
    if (this.documentClickUnlisten) return;

    // Listen outside Angular so clicks don't trigger global change detection for every FormInputComponent
    this.ngZone.runOutsideAngular(() => {
      this.documentClickUnlisten = this.renderer.listen('document', 'click', (event: MouseEvent) => {
        if (!this.isOpen) return;
        const container = this.containerRef?.nativeElement;
        if (container && !container.contains(event.target as Node)) {
          // Enter Angular only when we actually need to update state
          this.ngZone.run(() => {
            this.isOpen = false;
            this.cdr.markForCheck();
          });
        }
      });
    });
  }

  private unbindDocumentClick(): void {
    if (this.documentClickUnlisten) {
      this.documentClickUnlisten();
      this.documentClickUnlisten = null;
    }
  }

}
