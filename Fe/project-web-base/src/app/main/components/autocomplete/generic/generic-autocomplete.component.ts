import { Component, Input, Output, EventEmitter, HostListener, ElementRef, SimpleChanges, ViewChild, ChangeDetectorRef } from "@angular/core"
import { CommonModule } from "@angular/common"
import { FormsModule } from "@angular/forms"
import { Subject } from "rxjs"
import { NgSelectComponent, NgSelectModule } from "@ng-select/ng-select"
import { debounceTime, distinctUntilChanged, tap } from "rxjs/operators"
import { SharedPipesModule } from "../../pipe/shared-pipes.module"

export interface GenericItem {
    id: string | number
    [key: string]: any
}

export interface SearchResult {
    data: GenericItem[]
    total: number
    page: number
    pageSize: number
    hasMore: boolean
}

@Component({
    selector: "app-generic-autocomplete",
    standalone: true,
    imports: [CommonModule, FormsModule, NgSelectModule, SharedPipesModule],
    templateUrl: "./generic-autocomplete.component.html",
    styleUrls: ["./generic-autocomplete.component.css"],
})
export class GenericAutocompleteComponent {
    @Input() searchFunction!: (searchText: string, page: number) => Promise<SearchResult>
    @Input() onSelect!: (item: any) => void
    @Input() labelField: string = 'label' // Field name for label (e.g., 'full_name')
    @Input() labelRightField: string = '' // Field name for label (e.g., 'full_name')
    @Input() labelRightType: string = ''
    @Input() valueField: string = 'value' // Field name for value (e.g., 'user_name')
    @Input() bindLabel: string = 'label' // Field to bind for ng-select label
    @Input() bindValue: string = 'id' // Field to bind for ng-select value
    @Input() appendBody: boolean = false;
    /** Giống app-form-input: truyền appendTo="body" thay vì appendBody — panel gắn vào body, tránh lệch vị trí trong tab/scroll. */
    @Input() appendTo: string | null = null;

    // Label hiển thị bên trên input + dấu * nếu bắt buộc (giống app-form-input)
    @Input() label: string = '';
    @Input() labelType: 'required' | 'optional' | '' = '';

    @Output() itemSelected = new EventEmitter<GenericItem>()
    @Input() searchText = ""
    @Input() loading = false
    @Input() size: string = 'normal';
    @Input() removeAfterSearch = false
    @Input() placeholder: string = 'Tìm kiếm...';
    @Output() onEnter = new EventEmitter<Event>();
    results: GenericItem[] = []
    selectedItem: GenericItem | null = null
    selectedItemObj: GenericItem | null = null // Store the full object for display
    isOpen = true
    isLoading = false
    hasMore = false
    currentPage = 1
    pageSize = 10

    // Placeholder texts
    public searchPlaceholderText = 'Nhập để tìm kiếm...';
    public loadingText = 'Đang tải...';
    public noDataText = 'Không có dữ liệu';

    @Output() searchTextChange = new EventEmitter<string>();
    @Output() listItemsChange = new EventEmitter<any[]>();

    @Input() selectOpen: () => void;
    @Input() selectClose: () => void;
    /** true khi panel cần append vào document.body (appendBody hoặc appendTo === 'body'). */
    get shouldAppendDropdownToBody(): boolean {
        return this.appendBody || this.appendTo === 'body';
    }

    getTitleFromOptions(selectedItem: any): string {
        return this.selectedItemObj ? this.selectedItemObj.label : '';
    }

    onSelectOpen() {
        this.isOpen = true;
        this.selectOpen?.();
        // Sau khi mở ng-select khác (vd. bác sĩ), auto-position có thể tính sai — ép adjust khi append body.
        if (this.shouldAppendDropdownToBody && this.ngSelect?.dropdownPanel) {
            setTimeout(() => this.ngSelect.dropdownPanel.adjustPosition(), 0);
        }
    }

    onSelectClose() {
        this.isOpen = false;
        this.selectClose?.();
    }

    public setSearchText(value: string) {
        this.searchText = value;
    }

    handleEnter(event: Event) {
        this.onEnter.emit(event);
    }

    handleSelectKeydown(event: KeyboardEvent) {
        // Chỉ xử lý khi nhấn Enter
        if (event.key === 'Enter' || event.keyCode === 13) {
            this.handleSelectEnter(event);
        }
    }

    handleSelectEnter(event: KeyboardEvent) {

        // Nếu đã có giá trị, chuyển sang input tiếp theo luôn
        if (this.selectedItem !== null && this.selectedItem !== undefined) {
            if (this.ngSelect && this.ngSelect.isOpen) {
                this.ngSelect.close();
                this.isOpen = false;
            }
            setTimeout(() => {
                this.onEnter.emit(event);
            }, 50);
            return;
        }

        // Chưa có giá trị: Enter lần 1 mở dropdown, Enter lần 2 đóng và chuyển sang input khác
        if (!this.selectedItem && this.ngSelect && this.ngSelect.isOpen) {
            // Dropdown đang mở, Enter lần 2: đóng và chuyển sang input khác

            // this.ngSelect.close();
            // this.isOpen = false;
            // this.unbindDocumentClick();
            // setTimeout(() => {
            //   this.onEnter.emit(event);
            // }, 150);
        } else {
            // Dropdown chưa mở, Enter lần 1: mở dropdown (KHÔNG emit Enter event)
            event.preventDefault();
            event.stopPropagation();
            if (this.ngSelect) {
                this.ngSelect.open();
                this.isOpen = true;
            }
            // Không emit Enter event ở đây, chỉ mở dropdown
        }
    }
    focusInput() {
        if (this.ngSelect) {
            this.ngSelect.focus(); // focus đúng cho ng-select
        }
    }

    async ngOnChanges(changes: SimpleChanges) {
        if (changes['searchText']) {
            console.log('changes[searchText]', changes['searchText']);
            const newValue = changes['searchText'].currentValue || '';
            this.searchText = newValue;

            if (newValue.trim() !== '') {
                // Parent [(searchText)] đồng bộ lại label sau khi chọn — không gọi API trùng
                if (this.shouldSkipSearchAsRedundantSync(newValue)) {
                    this.ensureSelectedItemInResults();
                    this.cdRef.detectChanges();
                    return;
                }
                const result = await this.searchFunction(this.searchText, this.currentPage)

                // Transform data to add computed label field
                const transformedData = result.data.map(item => ({
                    ...item,
                    [this.bindLabel]: this.getItemDisplayText(item)
                }));

                if (this.currentPage === 1) {
                    this.results = transformedData
                } else {
                    this.results = [...this.results, ...transformedData]
                }

                // Ensure selectedItem is still in results
                this.ensureSelectedItemInResults();

                // Try to find selectedItem by display text
                const foundItem = this.results.find(item => this.getItemDisplayText(item) === newValue);
                if (foundItem) {
                    this.selectedItemObj = foundItem;
                    this.selectedItem = foundItem[this.bindValue] || foundItem.id;
                }

                this.hasMore = result.hasMore
                this.isOpen = true;
            } else {
                this.results = [];
                this.isOpen = false;
            }
            console.log('this.results', this.results);
            this.listItemsChange.emit(this.results);
            this.cdRef.detectChanges();
        }
    }

    onSearchTextChanged(value: string) {
        this.searchText = value;
    }

    private searchSubject = new Subject<string>()
    private lastSearchText = ""
    public searchText$ = new Subject<string>();
    private ignoreScroll = false
    private isProcessingSelection = false
    constructor(private elementRef: ElementRef, private cdRef: ChangeDetectorRef) {
        this.searchText$
            .pipe(
                debounceTime(500),
                distinctUntilChanged(),
                tap(text => {
                    this.currentPage = 1;
                    this.lastSearchText = text;
                    // ng-select typeahead thường emit lại đúng label sau khi chọn — bỏ qua gọi API
                    if (this.shouldSkipSearchAsRedundantSync(text)) {
                        return;
                    }
                    this.performSearch(text);
                    this.scrollToTop();
                })
            )
            .subscribe();
    }

    private searchTimeout: any;

    @ViewChild('ngSelect', { static: false }) ngSelect: NgSelectComponent;
    @ViewChild('ngSelect', { static: false, read: ElementRef }) ngSelectRef!: ElementRef;

    scrollToTop() {
        setTimeout(() => {
            if (!this.ngSelectRef) return;

            const panel = this.ngSelectRef.nativeElement.querySelector('.scroll-host');
            if (panel) {
                panel.scrollTop = 0;
            }
        }, 0);
    }

    onSearchChange(searchText: string): void {
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }
        this.searchTextChange.emit(this.searchText);
        this.searchTimeout = setTimeout(() => {
            this.currentPage = 1;
            this.lastSearchText = this.searchText
            this.performSearch(searchText);
            this.scrollToTop()
        }, 500);
    }

    onSearchInput(event: Event): void {
        const input = event.target as HTMLInputElement
        this.searchText = input.value
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }

        this.searchTimeout = setTimeout(() => {
            this.currentPage = 1;
            this.lastSearchText = this.searchText
            this.ignoreScroll = true;
            this.performSearch(this.searchText);
            this.scrollToTop()
        }, 500);
    }

    // Helper to ensure selectedItem is in results
    private ensureSelectedItemInResults() {
        if (this.selectedItemObj) {
            const idValue = this.selectedItemObj[this.bindValue] || this.selectedItemObj.id;

            const existsInResults = this.results.some(item => {
                const itemValue = item[this.bindValue] || item.id;
                return itemValue === idValue || item.id === idValue;
            });

            if (!existsInResults) {
                // Add selected item to results if not present
                if (!this.selectedItemObj[this.bindLabel]) {
                    this.selectedItemObj[this.bindLabel] = this.getItemDisplayText(this.selectedItemObj);
                }
                this.results = [this.selectedItemObj, ...this.results];
            }
        }
    }

    /**
     * true khi chuỗi tìm kiếm trùng label bản ghi đang chọn (đồng bộ từ parent / ng-select), không cần gọi API lại.
     */
    private shouldSkipSearchAsRedundantSync(searchText: string): boolean {
        const trimmed = (searchText ?? "").trim();
        if (!trimmed || !this.selectedItemObj) {
            return false;
        }
        return this.getItemDisplayText(this.selectedItemObj) === trimmed;
    }

    public async performSearch(searchText: string): Promise<void> {
        console.log('performSearch', searchText);
        if (!this.searchFunction) {
            console.warn("[generic-autocomplete] searchFunction not provided")
            return
        }
        if (!searchText) {
            return;
        }
        if (this.shouldSkipSearchAsRedundantSync(searchText)) {
            return;
        }

        try {
            this.isLoading = true
            const result = await this.searchFunction(searchText, this.currentPage)

            // Transform data to add computed label field
            const transformedData = result.data.map(item => ({
                ...item,
                [this.bindLabel]: this.getItemDisplayText(item)
            }));

            if (this.currentPage === 1) {
                this.results = transformedData
            } else {
                this.results = [...this.results, ...transformedData]
            }
            // Ensure selectedItem is still in results
            this.ensureSelectedItemInResults();

            this.hasMore = result.hasMore
            this.isOpen = true
        } catch (error) {
            console.error("[generic-autocomplete] Search error:", error)
            this.results = []
        } finally {
            this.isLoading = false
            this.listItemsChange.emit(this.results);
            this.cdRef.detectChanges();
        }
    }

    loadMore(): void {
        if (this.hasMore && !this.isLoading) {
            this.currentPage++
            this.performSearch(this.lastSearchText)
        }
    }

    public onSelectedItemChange(itemId: any) {
        // This is called when ngModel changes (two-way binding)
        // Only update if not already processing selection (to avoid duplicate calls)
        if (this.isProcessingSelection) {
            return;
        }

        if (itemId) {
            this.updateSearchTextFromSelectedItem(itemId);
        } else {
            this.searchText = '';
            this.searchTextChange.emit('');
            this.searchText$.next('');
        }
    }

    onItemSelect(itemId: any) {
        // Prevent duplicate processing
        if (this.isProcessingSelection) {
            return;
        }
        this.isProcessingSelection = true;

        // This is called when user selects an item from dropdown
        if (itemId) {
            // Find the full item object from results first
            let selectedItemObj: any;
            if (typeof itemId === 'number' || typeof itemId === 'string') {
                selectedItemObj = this.results.find(item => {
                    const itemValue = item[this.bindValue] || item.id;
                    return itemValue === itemId || item.id === itemId;
                });

                // If not found in results, try to get from selectedItemObj (might be set from previous selection)
                if (!selectedItemObj && this.selectedItemObj) {
                    const currentIdValue = this.selectedItemObj[this.bindValue] || this.selectedItemObj.id;
                    if (currentIdValue === itemId) {
                        selectedItemObj = this.selectedItemObj;
                    }
                }
            } else {
                selectedItemObj = itemId;
            }
            if (selectedItemObj) {
                // Store the full object for later use
                this.selectedItemObj = selectedItemObj;

                // Ensure the selected item has the computed label property
                if (!selectedItemObj[this.bindLabel]) {
                    selectedItemObj[this.bindLabel] = this.getItemDisplayText(selectedItemObj);
                }

                // Ensure selected item is in results so ng-select can display it
                const idValue = selectedItemObj[this.bindValue] || selectedItemObj.id;
                const existsInResults = this.results.some(item => {
                    const itemValue = item[this.bindValue] || item.id;
                    return itemValue === idValue || item.id === idValue;
                });

                if (!existsInResults) {
                    // Add selected item to results if not present (ng-select needs it to display label)
                    this.results = [selectedItemObj, ...this.results];
                }

                // Set selectedItem to the id value (for ng-select model)
                this.selectedItem = idValue;

                // Update searchText for parent component FIRST (before closing dropdown)
                const displayText = this.getItemDisplayText(selectedItemObj);
                this.searchText = displayText;
                this.searchTextChange.emit(displayText);

                // Close dropdown
                if (this.ngSelect) {
                    this.ngSelect.close();
                    this.isOpen = false;
                }

                // Clear searchText$ AFTER closing to stop typeahead search
                // Use setTimeout to ensure ng-select has time to update its display
                setTimeout(() => {
                    this.searchText$.next('');
                    this.cdRef.detectChanges();
                }, 0);

                // Emit the full object to parent component
                if (this.onSelect) {
                    this.onSelect(selectedItemObj);
                }
            } else {
                // If item not found, still try to emit the id to parent
                if (this.onSelect) {
                    this.onSelect(itemId);
                }
            }
        } else {
            // Clear selection
            this.selectedItem = null;
            this.selectedItemObj = null;
            this.searchText = '';
            this.searchTextChange.emit('');
            this.searchText$.next('');
            if (this.onSelect) {
                this.onSelect(null);
            }
        }

        // Reset processing flag after a short delay
        setTimeout(() => {
            this.isProcessingSelection = false;
        }, 100);
    }

    private updateSearchTextFromSelectedItem(itemId: any) {
        if (!itemId) {
            this.searchText = '';
            this.searchTextChange.emit('');
            return;
        }

        // Try to find item in results
        let selectedItemObj: any;
        if (typeof itemId === 'number' || typeof itemId === 'string') {
            selectedItemObj = this.results.find(item => {
                const itemValue = item[this.bindValue] || item.id;
                return itemValue === itemId || item.id === itemId;
            });

            // If not found in results, use previously stored selectedItemObj
            if (!selectedItemObj && this.selectedItemObj) {
                const currentIdValue = this.selectedItemObj[this.bindValue] || this.selectedItemObj.id;
                if (currentIdValue === itemId) {
                    selectedItemObj = this.selectedItemObj;
                    // Add it back to results so ng-select can display it
                    if (!this.results.some(item => {
                        const itemValue = item[this.bindValue] || item.id;
                        return itemValue === itemId || item.id === itemId;
                    })) {
                        this.results = [selectedItemObj, ...this.results];
                    }
                }
            }
        } else {
            selectedItemObj = itemId;
        }

        if (selectedItemObj) {
            // Ensure the selected item has the computed label property for ng-select
            if (!selectedItemObj[this.bindLabel]) {
                selectedItemObj[this.bindLabel] = this.getItemDisplayText(selectedItemObj);
            }

            // Ensure item is in results so ng-select can display it
            const idValue = selectedItemObj[this.bindValue] || selectedItemObj.id;
            const existsInResults = this.results.some(item => {
                const itemValue = item[this.bindValue] || item.id;
                return itemValue === idValue || item.id === idValue;
            });

            if (!existsInResults) {
                // Add selected item to results if not present (ng-select needs it to display label)
                this.results = [selectedItemObj, ...this.results];
            }

            // Set selectedItem to the id value (for ng-select model)
            this.selectedItem = idValue;

            const displayText = this.getItemDisplayText(selectedItemObj);
            this.searchText = displayText;
            this.searchTextChange.emit(displayText);
            this.selectedItemObj = selectedItemObj;

            // Clear searchText$ to stop typeahead search
            this.searchText$.next('');
        }
    }

    selectItem(item: GenericItem): void {
        this.selectedItemObj = item;
        const idValue = item[this.bindValue] || item.id;
        this.selectedItem = idValue;
        this.isOpen = false
        this.searchText = this.getItemDisplayText(item);
        // Keep item in results so ng-select can display it
        this.results = [item];
        if (this.onSelect) {
            this.onSelect(item)
        }
    }

    clearSelection(): void {
        this.selectedItem = null
        this.selectedItemObj = null;
        this.searchText = ""
        this.results = []
        this.isOpen = false
    }

    clearSearch(): void {
        this.searchText = ""
        this.results = []
        this.isOpen = false
        this.currentPage = 1
        this.searchText$.next('');
        this.selectedItem = null
        this.selectedItemObj = null;
        this.onSelect(null)
    }

    // Public method to clear all selection and cache
    public clear(): void {
        this.selectedItem = null;
        this.selectedItemObj = null;
        this.searchText = "";
        this.results = [];
        this.isOpen = false;
        this.currentPage = 1;
        this.hasMore = false;
        this.searchText$.next('');
        this.searchTextChange.emit('');
        if (this.ngSelect) {
            this.ngSelect.clearModel();
        }
    }

    // Public method to set selected item from outside (for edit mode)
    public setSelectedItem(item: GenericItem | null): void {
        if (!item) {
            this.clear();
            return;
        }

        // Ensure the item has the computed label property
        if (!item[this.bindLabel]) {
            item[this.bindLabel] = this.getItemDisplayText(item);
        }

        // Store the full object
        this.selectedItemObj = item;

        // Set selectedItem to the id value (for ng-select model)
        const idValue = item[this.bindValue] || item.id;
        this.selectedItem = idValue;

        // Set searchText to display text
        const displayText = this.getItemDisplayText(item);
        this.searchText = displayText;
        this.searchTextChange.emit(displayText);

        // Add item to results so ng-select can display it
        const existsInResults = this.results.some(resultItem => {
            const resultValue = resultItem[this.bindValue] || resultItem.id;
            return resultValue === idValue || resultItem.id === idValue;
        });

        if (!existsInResults) {
            this.results = [item, ...this.results];
        }

        // Clear searchText$ to stop typeahead search
        this.searchText$.next('');
        this.isOpen = false;
        this.cdRef.detectChanges();
    }

    onInputFocus(): void {
        if (this.searchText.trim().length > 0 && this.results.length > 0) {
            this.isOpen = true
        }
    }

    onScroll(event: Event) {
        if (this.ignoreScroll) {
            this.ignoreScroll = false;
            return;
        }
        const target = event.target as HTMLElement;
        const threshold = 50;
        const position = target.scrollTop + target.clientHeight;
        const height = target.scrollHeight;

        if (position > height - threshold && this.hasMore && !this.isLoading) {
            this.loadMore();
        }
    }

    onInputBlur(): void {
        setTimeout(() => {
            this.isOpen = false
        }, 200)
    }

    arrowKeyDownFn = (event: KeyboardEvent): boolean => {
        if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') {
            return true;
        }
        const ns: any = this.ngSelect;
        if (!ns?.isOpen || !ns?.itemsList) {
            return true;
        }
        event.preventDefault();
        event.stopPropagation();

        if (event.key === 'ArrowDown') {
            ns.itemsList.markNextItem();
        } else {
            ns.itemsList.markPreviousItem();
        }
        ns.detectChanges?.();
        setTimeout(() => this.keepMarkedOptionInViewport(ns), 0);
        return false;
    };

    private keepMarkedOptionInViewport(ns: any): void {
        const panelEl: HTMLElement | null =
            ns?.dropdownPanel?._dropdown ??
            ns?.dropdownPanel?.elementRef?.nativeElement ??
            document.querySelector('.ng-dropdown-panel.ng-select-bottom, .ng-dropdown-panel.ng-select-top');
        if (!panelEl) return;
        const scrollHost = panelEl.querySelector('.scroll-host') as HTMLElement | null;
        const markedEl = panelEl.querySelector('.ng-option.ng-option-marked') as HTMLElement | null;
        if (!scrollHost || !markedEl) return;

        const markedTop = markedEl.offsetTop;
        const markedBottom = markedTop + markedEl.offsetHeight;
        const viewTop = scrollHost.scrollTop;
        const viewBottom = viewTop + scrollHost.clientHeight;
        if (markedBottom > viewBottom) {
            scrollHost.scrollTop = markedBottom - scrollHost.clientHeight;
        } else if (markedTop < viewTop) {
            scrollHost.scrollTop = markedTop;
        }
    }

    @HostListener("document:click", ["$event"])
    onDocumentClick(event: MouseEvent): void {
        if (!this.elementRef.nativeElement.contains(event.target)) {
            this.isOpen = false
        }
    }

    // Helper methods to get label and value from item
    getItemLabel(item: GenericItem): string {
        return item[this.labelField] || '';
    }

    formatCurrency(value: number): string {
        return new Intl.NumberFormat('vi-VN').format(value);
    }

    getItemRightLabel(item: GenericItem): string {
        if (this.labelRightType === 'price') {
            return this.formatCurrency(item[this.labelRightField]) + 'đ' || '';
        }
        return item[this.labelRightField] || '';
    }

    getItemValue(item: GenericItem): string {
        return item[this.valueField] || '';
    }

    getItemDisplayText(item: GenericItem): string {
        if (!item) {
            return '';
        }
        const label = this.getItemLabel(item);
        const value = this.getItemValue(item);
        return `${value} - ${label}`;
    }

    getItemTitle(item: any): string {
        if (!item) {
            return '';
        }
        const label = item.label;
        const value = item.value;
        return `${value} - ${label}`;
    }
}

