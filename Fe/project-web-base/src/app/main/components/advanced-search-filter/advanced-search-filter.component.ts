import { Component, Input, Output, EventEmitter, ViewEncapsulation, OnInit, AfterViewInit, OnDestroy, ViewChild, ElementRef, Renderer2, HostListener } from '@angular/core';

@Component({
  selector: 'app-advanced-search-filter',
  templateUrl: './advanced-search-filter.component.html',
  styleUrls: ['./advanced-search-filter.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class AdvancedSearchFilterComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() showAdvanced: boolean = false;
  @Output() toggleAdvanced = new EventEmitter<void>();

  @ViewChild('basicFilters', { static: false }) basicFiltersRef!: ElementRef;
  @ViewChild('advancedFilters', { static: false }) advancedFiltersRef!: ElementRef;

  isMobile = false;
  hasAdvancedFilters = false;
  private resizeListener?: () => void;

  constructor(private renderer: Renderer2) {}

  ngOnInit(): void {
    this.checkMobile();
    this.resizeListener = () => {
      const wasMobile = this.isMobile;
      this.checkMobile();
      // Nếu thay đổi giữa mobile và desktop, cần reorganize lại
      if (wasMobile !== this.isMobile) {
        setTimeout(() => this.organizeFilters(), 0);
      }
    };
    window.addEventListener('resize', this.resizeListener);
  }

  ngAfterViewInit(): void {
    // Đợi view render xong rồi mới organize
    setTimeout(() => this.organizeFilters(), 0);
  }

  ngOnDestroy(): void {
    if (this.resizeListener) {
      window.removeEventListener('resize', this.resizeListener);
    }
  }

  private checkMobile(): void {
    this.isMobile = window.innerWidth < 768;
  }

  private organizeFilters(): void {
    if (!this.basicFiltersRef) {
      return;
    }

    const basicContainer = this.basicFiltersRef.nativeElement;
    
    // Tìm row container trong basic-filters
    const basicRow = basicContainer.querySelector('.row');

    if (!basicRow) {
      return;
    }

    // Kiểm tra xem có elements nào có attribute advanced-filter không trong basicRow
    const advancedElementsInBasic = basicRow.querySelectorAll('[advanced-filter]');
    this.hasAdvancedFilters = advancedElementsInBasic.length > 0;

    // Nếu không có advanced filters, không cần xử lý thêm
    if (!this.hasAdvancedFilters) {
      return;
    }

    // Chỉ xử lý advancedFiltersRef nếu có advanced filters
    if (!this.advancedFiltersRef) {
      return;
    }

    const advancedContainer = this.advancedFiltersRef.nativeElement;
    const advancedRow = advancedContainer.querySelector('.row');

    if (!advancedRow) {
      return;
    }

    // Kiểm tra thêm trong advancedRow (trường hợp đã di chuyển)
    const advancedElementsInAdvanced = advancedRow.querySelectorAll('[advanced-filter]');
    if (advancedElementsInAdvanced.length > 0 && !this.hasAdvancedFilters) {
      this.hasAdvancedFilters = true;
    }

    if (this.isMobile) {
      // Mobile: Di chuyển các elements có advanced-filter từ basic-filters vào advanced-filters row
      const advancedElements = basicRow.querySelectorAll('[advanced-filter]');
      advancedElements.forEach((element: HTMLElement) => {
        // Chỉ di chuyển nếu element chưa ở trong advanced-filters row
        if (element.parentElement !== advancedRow) {
          this.renderer.appendChild(advancedRow, element);
        }
      });
    } else {
      // Desktop: Di chuyển các elements có advanced-filter từ advanced-filters về lại basic-filters row
      const elementsInAdvanced = Array.from(advancedRow.children) as HTMLElement[];
      elementsInAdvanced.forEach((element: HTMLElement) => {
        // Chỉ di chuyển nếu element có attribute advanced-filter
        if (element.hasAttribute('advanced-filter')) {
          this.renderer.appendChild(basicRow, element);
        }
      });
    }
  }

  onToggleAdvanced(): void {
    this.showAdvanced = !this.showAdvanced;
    this.toggleAdvanced.emit();
  }
}

