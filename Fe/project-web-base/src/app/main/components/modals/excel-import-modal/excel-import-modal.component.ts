import { Component, EventEmitter, Input, Output, ViewChild, ElementRef, TemplateRef, ChangeDetectorRef, OnChanges, SimpleChanges } from '@angular/core';

export interface ExcelImportResult<T> {
  totalRows: number;
  successCount: number;
  errorCount: number;
  results: RowResult<T>[];
  globalErrors: string[];
  fieldToColumnNameMap?: { [fieldName: string]: string }; // Map field name -> column name (VD: "patientName" -> "HỌ VÀ TÊN")
}

export interface RowResult<T> {
  rowNumber: number;
  data: T;
  success: boolean;
  errors: string[];
}

export interface ExcelImportRowAction {
  actionKey: string;
  label: string;
  buttonType?: string;
  buttonClass?: string;
  isVisible?: (row: any, isPreview: boolean) => boolean;
}

export interface SampleFile {
  url?: string; // URL to sample file (deprecated, use downloadCallback instead)
  fileName: string;
  label?: string; // Optional label to display on button
  downloadCallback?: () => Promise<void> | void; // Callback function to download sample file
}

@Component({
  selector: 'app-excel-import-modal',
  templateUrl: './excel-import-modal.component.html',
  styleUrls: ['./excel-import-modal.component.scss']
})
export class ExcelImportModalComponent implements OnChanges {
  private readonly duplicate_phone_error = 'Đã có hồ sơ với sđt này trong hệ thống';
  @Input() visible = false;
  @Input() title = 'Import Excel';
  @Input() loading = false;
  @Input() acceptedFileTypes = '.xlsx,.xls';
  @Input() sampleFileUrl: string | null = null; // URL to sample Excel file (deprecated, use sampleFiles instead)
  @Input() sampleFileName = 'File_mau_import.xlsx'; // Sample file name to display (deprecated, use sampleFiles instead)
  @Input() sampleFiles: SampleFile[] = []; // Array of sample files to download
  @Input() defaultColumnWidth?: number; // Width mặc định cho các cột dữ liệu (từ component cha)
  @Input() columnConfig?: { [key: string]: { name?: string, width?: number, minWidth?: number } }; // Cấu hình columns từ component cha (key là field name)
  @Input() rowActions: ExcelImportRowAction[] = [];
  @Input() additionalAllowedRowNumbers: number[] = [];
  @Input() selectedPidByRowNumber: { [row_number: number]: string } = {};
  @Input() showActionColumn = true;
  @Input() renderRowActionsInStatus = false;

  @Output() onClose = new EventEmitter<void>();
  @Output() onImport = new EventEmitter<File>(); // Emit khi cần import (cả preview và confirm)
  @Output() onConfirmImport = new EventEmitter<{ file: File; allowedRowNumbers: number[] }>(); // Emit khi user confirm import từ preview
  @Output() onImportResult = new EventEmitter<ExcelImportResult<any>>();
  @Output() onRowAction = new EventEmitter<{ actionKey: string; row: any; isPreview: boolean }>();

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('rowNumberTemplate') rowNumberTemplate!: TemplateRef<any>;
  @ViewChild('statusTemplate') statusTemplate!: TemplateRef<any>;
  @ViewChild('errorsTemplate') errorsTemplate!: TemplateRef<any>;
  @ViewChild('dataTemplate') dataTemplate!: TemplateRef<any>;
  @ViewChild('actionTemplate') actionTemplate!: TemplateRef<any>;

  selectedFile: File | null = null;
  importResult: ExcelImportResult<any> | null = null;
  showResult = false;
  showPreview = false; // Hiển thị preview mode
  public rowClassFN: (row: any) => string;

  previewData: ExcelImportResult<any> | null = null; // Data từ preview
  // Trạng thái lọc và tổng dòng đang hiển thị ở preview
  public previewFilterStatus: 'all' | 'success' | 'error' = 'all';
  public previewTotalCnt = 0;

  // Trạng thái lọc và tổng dòng đang hiển thị ở kết quả import
  public resultFilterStatus: 'all' | 'success' | 'error' = 'all';
  public resultTotalCnt = 0;

  // Lưu lại dữ liệu gốc để áp dụng lọc mà không làm mất tổng quan
  public originalPreviewData: ExcelImportResult<any> | null = null;
  public originalImportResult: ExcelImportResult<any> | null = null;

  constructor(private cdr: ChangeDetectorRef) {
    this.rowClassFN = this.getRowClass.bind(this);

  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['additionalAllowedRowNumbers'] || changes['selectedPidByRowNumber']) {
      this.refreshCurrentTableData();
    }
  }

  getRowClass(row: any): string {
    if (this.isAdditionalAllowed(row?.rowNumber)) {
      return 'highlight-info';
    }
    if (!row.success) {
      return 'highlight-red';
    }
    return '';
  }
  // Table columns cho dynamic-table
  tableColumns: any[] = [];
  tableRows: any[] = [];

  handleClose() {
    this.reset();
    this.onClose.emit();
  }

  handleImportClick() {
    this.fileInput?.nativeElement?.click();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      this.importFile();
    }
  }

  importFile() {
    if (this.selectedFile) {
      this.loading = true;
      // Emit file để parent component gọi preview API
      this.onImport.emit(this.selectedFile);
    }
  }
  // Set preview data (từ parent component sau khi gọi preview API)
  setPreviewData(previewData: ExcelImportResult<any>) {
    this.previewData = previewData;
    this.originalPreviewData = previewData;
    this.previewFilterStatus = 'all';
    this.previewTotalCnt = previewData?.totalRows || 0;
    setTimeout(() => {
      this.showPreview = true;
      this.showResult = false;
      this.loading = false;
      this.buildTableData(previewData, true);
      this.cdr.markForCheck();
    }, 100);

  }

  // Xác nhận import sau khi preview
  confirmImport() {
    if (this.selectedFile) {
      const allowedRowNumbers = this.getAllowedRowNumbers();
      this.loading = true;
      this.showPreview = false;
      // Emit event để parent component gọi import API thực sự, chỉ với các dòng hợp lệ
      this.onConfirmImport.emit({
        file: this.selectedFile,
        allowedRowNumbers
      });
    }
  }

  // Hủy import, quay lại chọn file
  cancelImport() {
    this.reset();
  }

  setImportResult(result: ExcelImportResult<any>) {
    this.importResult = result;
    this.originalImportResult = result;
    this.resultFilterStatus = 'all';
    this.resultTotalCnt = result?.totalRows || 0;
    setTimeout(() => {
      this.showResult = true;
      this.loading = false;
      this.buildTableData(result, false);
      this.onImportResult.emit(result);
      this.cdr.markForCheck();
    }, 100);
  }

  setGlobalErrors(errors: string[]) {
    if (!this.importResult) {
      this.importResult = {
        totalRows: 0,
        successCount: 0,
        errorCount: 0,
        results: [],
        globalErrors: errors
      };
    } else {
      this.importResult.globalErrors = errors;
    }
    this.showResult = true;
    this.loading = false;
  }
  
  public filteredPreviewData: ExcelImportResult<any> | null = null;
  public filterStatusPreview(status: 'all' | 'success' | 'error'): void {
    if (!this.originalPreviewData) {
      return;
    }

    this.previewFilterStatus = status;

    if (status === 'all') {
      this.previewTotalCnt = this.originalPreviewData.totalRows || 0;
      this.buildTableData(this.originalPreviewData, true);
    } else {
      const isSuccess = status === 'success';
      const filtered: ExcelImportResult<any> = {
        ...this.originalPreviewData,
        results: this.originalPreviewData.results.filter(row => isSuccess ? row.success : !row.success)
      };
      this.previewTotalCnt = filtered.results.length;
      this.buildTableData(filtered, true);
    }

    this.cdr.markForCheck();
  }

  public filterStatusResult(status: 'all' | 'success' | 'error'): void {
    if (!this.originalImportResult) {
      return;
    }

    this.resultFilterStatus = status;

    if (status === 'all') {
      this.resultTotalCnt = this.originalImportResult.totalRows || 0;
      this.buildTableData(this.originalImportResult, false);
    } else {
      const isSuccess = status === 'success';
      const filtered: ExcelImportResult<any> = {
        ...this.originalImportResult,
        results: this.originalImportResult.results.filter(row => isSuccess ? row.success : !row.success)
      };
      this.resultTotalCnt = filtered.results.length;
      this.buildTableData(filtered, false);
    }

    this.cdr.markForCheck();
  }

  /**
   * Lấy danh sách STT (rowNumber) của các dòng hợp lệ trong dữ liệu preview.
   * Dùng để FE gửi lên backend khi xác nhận import để bỏ qua các dòng lỗi.
   */
  private getAllowedRowNumbers(): number[] {
    if (!this.originalPreviewData || !this.originalPreviewData.results) {
      return [];
    }
    const allowedRowNumbers = this.originalPreviewData.results
      .filter((row: RowResult<any>) => row.success)
      .map((row: RowResult<any>) => row.rowNumber);
    const mergedAllowedRows = new Set<number>([
      ...allowedRowNumbers,
      ...(this.additionalAllowedRowNumbers || [])
    ]);
    return Array.from(mergedAllowedRows);
  }

  /**
   * Chỉ disable nút xác nhận khi thực sự không còn dòng nào được phép import.
   * Bao gồm cả các dòng lỗi đã được user "chọn hồ sơ" (additionalAllowedRowNumbers).
   */
  get isConfirmImportDisabled(): boolean {
    if (!this.showPreview || !this.previewData) {
      return true;
    }
    return this.getAllowedRowNumbers().length === 0;
  }

  private buildTableData(result: ExcelImportResult<any>, isPreview: boolean = false) {
    if (!result || !result.results || result.results.length === 0) {
      this.tableColumns = [];
      this.tableRows = [];
      return;
    }

    const firstRow = result.results[0];
    if (firstRow && firstRow.data) {
      const data = firstRow.data;
      const keys = Object.keys(data);

      // Cột cố định (sticky) đặt đầu: STT, Trạng thái, Lỗi — scroll ngang giống Excel
      const fixedKeys = ['rowNumber', 'status', 'errors'];
      const fixedCols = [
        { key: 'rowNumber', name: 'STT', width: 80, minWidth: 80, cellTemplate: this.rowNumberTemplate, visible: true, fixed: true },
        { key: 'status', name: 'Trạng thái', minWidth: 120, width: 120, cellTemplate: this.statusTemplate, visible: true, fixed: true },
      ];
      const dataCols = keys.filter(k => !fixedKeys.includes(k)).map(key => {
        const column: any = {
          key: key,
          name: this.getColumnName(key, result),
          cellTemplate: this.dataTemplate,
          visible: true
        };
        if (this.columnConfig && this.columnConfig[key]) {
          const config = this.columnConfig[key];
          if (config.name) column.name = config.name;
          if (config.width !== undefined && config.width !== null) column.width = config.width;
          if (config.minWidth !== undefined && config.minWidth !== null) column.minWidth = config.minWidth;
        } else if (this.defaultColumnWidth !== undefined && this.defaultColumnWidth !== null) {
          column.minWidth = this.defaultColumnWidth;
        }
        return column;
      });
      const actionCol = this.showActionColumn && this.rowActions?.length
        ? [{ key: 'actions', name: 'Hành động', minWidth: 160, width: 160, cellTemplate: this.actionTemplate, visible: true }]
        : [];
      this.tableColumns = [...fixedCols, ...dataCols, ...actionCol];

      // Preview: dòng hợp lệ hiển thị "Sẵn sàng import"; Import xong: dòng thành công hiển thị "Thành công"
      const successLabel = isPreview ? 'Sẵn sàng import' : 'Thành công';
      this.tableRows = result.results.map((row: RowResult<any>) => ({
        ...row.data,
        rowNumber: row.rowNumber,
        status: row.success ? successLabel : '',
        statusClass: row.success ? 'text-success' : '',
        success: row.success,
        errors: row.errors && row.errors.length > 0 ? row.errors : [],
        _isPreview: isPreview
      }));
    }
  }

  canShowAction(action: ExcelImportRowAction, row: any): boolean {
    if (!action) {
      return false;
    }
    if (!action.isVisible) {
      return true;
    }
    return !!action.isVisible(row, !!row?._isPreview);
  }

  handleRowAction(action: ExcelImportRowAction, row: any): void {
    if (!action || !row) {
      return;
    }
    this.onRowAction.emit({
      actionKey: action.actionKey,
      row,
      isPreview: !!row._isPreview
    });
  }

  isAdditionalAllowed(row_number: any): boolean {
    const row_number_num = Number(row_number);
    if (Number.isNaN(row_number_num)) {
      return false;
    }
    return Array.isArray(this.additionalAllowedRowNumbers) && this.additionalAllowedRowNumbers.includes(row_number_num);
  }

  getSelectedPid(row_number: any): string {
    const row_number_num = Number(row_number);
    if (Number.isNaN(row_number_num)) {
      return '';
    }
    return String(this.selectedPidByRowNumber?.[row_number_num] || '').trim();
  }

  getDisplayErrors(row: any): string[] {
    const errors = Array.isArray(row?.errors) ? row.errors : [];
    if (!errors.length) {
      return [];
    }
    const is_row_resolved = this.isAdditionalAllowed(row?.rowNumber) || !!this.getSelectedPid(row?.rowNumber);
    if (!is_row_resolved) {
      return errors;
    }
    return errors.filter((error_text: string) => String(error_text || '').trim() !== this.duplicate_phone_error);
  }

  private refreshCurrentTableData(): void {
    if (this.showPreview) {
      this.filterStatusPreview(this.previewFilterStatus);
      return;
    }
    if (this.showResult) {
      this.filterStatusResult(this.resultFilterStatus);
    }
  }

  /**
   * Lấy tên cột từ fieldToColumnNameMap hoặc format tự động
   */
  private getColumnName(fieldName: string, result: ExcelImportResult<any>): string {
    // Ưu tiên dùng fieldToColumnNameMap từ backend
    if (result.fieldToColumnNameMap && result.fieldToColumnNameMap[fieldName]) {
      return result.fieldToColumnNameMap[fieldName];
    }

    // Fallback: format tự động từ field name
    return this.formatColumnName(fieldName);
  }

  private formatColumnName(key: string): string {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  private reset() {
    this.selectedFile = null;
    this.importResult = null;
    this.previewData = null;
    this.showResult = false;
    this.showPreview = false;
    this.tableColumns = [];
    this.tableRows = [];
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  resetAndImportAnother() {
    this.reset();
    // Trigger file input click to select another file
    setTimeout(() => {
      this.handleImportClick();
    }, 100);
  }

  get hasGlobalErrors(): boolean {
    return this.importResult?.globalErrors && this.importResult.globalErrors.length > 0;
  }

  get hasResults(): boolean {
    return this.importResult?.results && this.importResult.results.length > 0;
  }

  // Empty handlers for dynamic-table (not used in import modal)
  onPageChange(): void {
    // No-op: pagination not needed in import result view
  }

  onPageSizeChange(): void {
    // No-op: pagination not needed in import result view
  }

  async downloadSampleFile(sampleFile?: SampleFile): Promise<void> {
    // Support both old API (single file) and new API (multiple files)
    if (sampleFile) {
      // New API: use callback if provided, otherwise use URL
      if (sampleFile.downloadCallback) {
        try {
          await sampleFile.downloadCallback();
        } catch (error) {
          console.error('Error downloading sample file:', error);
        }
      } else if (sampleFile.url) {
        // Fallback to URL if callback not provided
        const link = document.createElement('a');
        link.href = sampleFile.url;
        link.download = sampleFile.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } else if (this.sampleFileUrl) {
      // Old API: backward compatibility
      const link = document.createElement('a');
      link.href = this.sampleFileUrl;
      link.download = this.sampleFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  // Get all sample files (combine old and new API for backward compatibility)
  getSampleFiles(): SampleFile[] {
    const files: SampleFile[] = [];

    // Add files from new API (sampleFiles array)
    if (this.sampleFiles && this.sampleFiles.length > 0) {
      files.push(...this.sampleFiles);
    }

    // Add file from old API if exists (for backward compatibility)
    if (this.sampleFileUrl && !files.some(f => f.url === this.sampleFileUrl)) {
      files.push({
        url: this.sampleFileUrl,
        fileName: this.sampleFileName
      });
    }

    return files;
  }
}