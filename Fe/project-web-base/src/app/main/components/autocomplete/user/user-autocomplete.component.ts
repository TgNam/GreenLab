import { Component, Input, Output, EventEmitter, type OnInit, HostListener, ElementRef, SimpleChanges, ViewChild, ChangeDetectorRef } from "@angular/core"
import { CommonModule } from "@angular/common"
import { FormsModule } from "@angular/forms"
import { Subject } from "rxjs"
import { NgSelectComponent, NgSelectModule } from "@ng-select/ng-select"
import { debounceTime, distinctUntilChanged, switchMap, tap } from "rxjs/operators"
import { SharedPipesModule } from "../../pipe/shared-pipes.module"

export interface User {
    id: string | number
    user_name: string
    email: string
    full_name?: string
}

export interface SearchResult {
    data: User[]
    total: number
    page: number
    pageSize: number
    hasMore: boolean
}

@Component({
    selector: "app-user-autocomplete",
    standalone: true,
    imports: [CommonModule, FormsModule, NgSelectModule, SharedPipesModule],
    templateUrl: "./user-autocomplete.component.html",
    styleUrls: ["./user-autocomplete.component.css"],
})
export class UserAutocompleteComponent {
    @Input() searchFunction!: (searchText: string, page: number) => Promise<SearchResult>
    @Input() onSelect!: (user: any) => void
    /** Nếu true, khi chọn lại cùng một user liên tiếp vẫn trigger onSelect (dùng cho các case cần bắt sự kiện chọn trùng). */
    @Input() onTriggerSameUser: boolean = false;

    @Output() userSelected = new EventEmitter<User>()
    @Input() searchText = ""
    /** Nếu true, input/label hiển thị dạng "user_name - full_name" và match theo chuỗi này. */
    @Input() displayFullname: boolean = false;
    @Input() loading = false
    @Input() removeAfterSearch = false
    @Input() placeholder: string = '';
    @Input() minWidth: string = null;
    @Input() size: string = 'normal';
    @Input() disabled: boolean = false;
    @Input() selectOpen: () => void = null;
    @Input() selectClose: () => void = null;
    results: User[] = []
    selectedUser: User | null = null
    isOpen = true
    isLoading = false
    hasMore = false
    currentPage = 1
    pageSize = 10

    @Output() searchTextChange = new EventEmitter<string>();
    @Output() onEnter = new EventEmitter<Event>();

    public setSearchText(value: string) {
        this.searchText = value;
    }

    private buildDisplayText(user: any): string {
        const userName = (user?.user_name || '').toString();
        const fullName = (user?.full_name || '').toString();
        if (!this.displayFullname) return userName;
        return fullName ? `${userName} - ${fullName}` : userName;
    }

    handleEnter(event: Event) {
        this.onEnter.emit(event);
    }

    defaultAvatar = 'assets/images/avatars/avatar-default.png';

    onAvatarError(event: Event) {
        const img = event.target as HTMLImageElement;
        img.src = this.defaultAvatar;
    }

    handleSelectKeydown(event: KeyboardEvent) {
        // Chỉ xử lý khi nhấn Enter
        if (event.key === 'Enter' || event.keyCode === 13) {
            this.handleSelectEnter(event);
        }
    }

    handleSelectEnter(event: KeyboardEvent) {
        // Nếu đã có giá trị, chuyển sang input tiếp theo luôn
        if (this.selectedUser !== null && this.selectedUser !== undefined) {
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
        if (!this.selectedUser && this.ngSelect && this.ngSelect.isOpen) {
            // Dropdown đang mở, Enter lần 2: đóng và chuyển sang input tiếp theo
            event.preventDefault();
            event.stopPropagation();
            this.ngSelect.close();
            this.isOpen = false;
            setTimeout(() => {
                this.onEnter.emit(event);
            }, 50);
        } else {
            // Dropdown chưa mở, Enter lần 1: mở dropdown (KHÔNG emit Enter event)
            event.preventDefault();
            event.stopPropagation();
            if (this.ngSelect) {
                this.ngSelect.open();
                this.isOpen = true;
            }
        }
    }



    async ngOnChanges(changes: SimpleChanges) {
        if (changes['searchText']) {
            const newValue = changes['searchText'].currentValue || '';
            this.searchText = newValue;

            if (newValue.trim() !== '') {
                try {
                    // Reset state khi bắt đầu search mới
                    this.currentPage = 1;
                    this.hasMore = false
                    this.isLoading = true

                    const result = await this.searchFunction(this.searchText, this.currentPage)
                    if (this.currentPage === 1) {
                        this.results = result.data || []
                    } else {
                        this.results = [...this.results, ...(result.data || [])]
                    }
                    this.selectedUser =
                        this.results.find(u => u.user_name === newValue) ||
                        (this.displayFullname ? this.results.find(u => this.buildDisplayText(u) === newValue) : null) ||
                        null;
                    let userId = this.selectedUser?.id;

                    this.hasMore = result.hasMore || false
                    this.isOpen = true;
                } catch (error) {
                    console.error("[v0] Search error in ngOnChanges:", error)
                    // Reset state khi có lỗi
                    this.results = []
                    this.hasMore = false
                    this.isOpen = true // Vẫn mở để user có thể thử lại
                } finally {
                    this.isLoading = false
                }
            } else {
                this.results = [];
                this.hasMore = false
                this.isOpen = false;
                this.isLoading = false
            }
            this.cdRef.detectChanges();
        }
    }


    onSearchTextChanged(value: string) {
        // gán lại local biến hoặc trigger search
        this.searchText = value;
        // hoặc gọi hàm search
    }


    private searchSubject = new Subject<string>()
    private lastSearchText = ""
    searchText$ = new Subject<string>();
    private ignoreScroll = false
    /** Lưu id user cuối cùng đã emit ra ngoài để xử lý case chọn trùng. */
    private lastEmittedUserId: any = null;
    constructor(private elementRef: ElementRef, private cdRef: ChangeDetectorRef) {
        this.searchText$
            .pipe(
                debounceTime(300),
                distinctUntilChanged(),
                tap(text => {
                    // Reset state khi bắt đầu search mới
                    this.currentPage = 1;
                    this.lastSearchText = text
                    this.hasMore = false
                    // Chỉ clear results nếu có text mới (không phải empty)
                    if (text && text.trim()) {
                        this.performSearch(text);
                        this.scrollToTop();
                    } else {
                        this.results = []
                        this.isLoading = false
                    }
                })
            )
            .subscribe();

    }

    private searchTimeout: any;

    @ViewChild('ngSelect', { static: false }) ngSelect: NgSelectComponent;


    @ViewChild('ngSelect', { static: false, read: ElementRef }) ngSelectRef!: ElementRef;

    private scrollListener: ((event: Event) => void) | null = null;

    scrollToTop() {
        setTimeout(() => {
            if (!this.ngSelectRef) return;

            const panel = this.ngSelectRef.nativeElement.querySelector('.scroll-host');
            if (panel) {
                panel.scrollTop = 0;
            }
        }, 0); // cho Angular render xong
    }

    onDropdownOpen() {
        if (this.selectOpen) this.selectOpen();
        // Attach scroll listener when dropdown opens
        setTimeout(() => {
            if (!this.ngSelectRef) return;

            // Try multiple selectors to find the scroll container
            const panel = this.ngSelectRef.nativeElement.querySelector('.scroll-host') ||
                this.ngSelectRef.nativeElement.querySelector('.ng-dropdown-panel-items') ||
                this.ngSelectRef.nativeElement.querySelector('.ng-option-list') ||
                document.querySelector('.ng-dropdown-panel .scroll-host');

            if (panel) {
                // Remove old listener if exists
                if (this.scrollListener) {
                    panel.removeEventListener('scroll', this.scrollListener);
                }

                // Add new scroll listener
                this.scrollListener = (event: Event) => {
                    this.onScroll(event);
                };
                panel.addEventListener('scroll', this.scrollListener);
                console.log('Scroll listener attached to:', panel.className);
            } else {
                console.warn('Could not find scroll container for ng-select');
            }
        }, 200);
    }

    onDropdownClose() {
        if (this.selectClose) this.selectClose();
        // Remove scroll listener when dropdown closes
        if (this.scrollListener) {
            // Try multiple selectors to find the scroll container
            const panel = this.ngSelectRef?.nativeElement?.querySelector('.scroll-host') ||
                this.ngSelectRef?.nativeElement?.querySelector('.ng-dropdown-panel-items') ||
                this.ngSelectRef?.nativeElement?.querySelector('.ng-option-list') ||
                document.querySelector('.ng-dropdown-panel .scroll-host');

            if (panel) {
                panel.removeEventListener('scroll', this.scrollListener);
            }
            this.scrollListener = null;
        }
    }


    // Hàm được gọi khi người dùng gõ trong ô input
    onSearchChange(searchText: string): void {
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }
        this.searchTextChange.emit(this.searchText);
        this.searchTimeout = setTimeout(() => {
            // Reset state khi bắt đầu search mới
            this.currentPage = 1;
            this.lastSearchText = this.searchText
            this.hasMore = false
            if (searchText && searchText.trim()) {
                this.performSearch(searchText);
                this.scrollToTop()
            } else {
                this.results = []
                this.isLoading = false
            }
        }, 300);
    }


    onSearchInput(event: Event): void {
        const input = event.target as HTMLInputElement
        this.searchText = input.value
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }

        this.searchTimeout = setTimeout(() => {
            // Reset state khi bắt đầu search mới
            this.currentPage = 1;
            this.lastSearchText = this.searchText
            this.hasMore = false
            this.ignoreScroll = true;
            if (this.searchText && this.searchText.trim()) {
                this.performSearch(this.searchText);
                this.scrollToTop()
            } else {
                this.results = []
                this.isLoading = false
            }
        }, 300);
    }

    private async performSearch(searchText: string): Promise<void> {
        if (!this.searchFunction) {
            console.warn("[v0] searchFunction not provided")
            return
        }
        if (!searchText) {
            this.results = []
            this.hasMore = false
            this.isLoading = false
            return;
        }

        try {
            this.isLoading = true
            // Reset results và hasMore khi bắt đầu search mới (page 1)
            if (this.currentPage === 1) {
                this.results = []
                this.hasMore = false
            }

            const result = await this.searchFunction(searchText, this.currentPage)
            console.log('result: ', result)

            if (this.currentPage === 1) {
                this.results = result.data || []
            } else {
                this.results = [...this.results, ...(result.data || [])]
            }

            this.hasMore = result.hasMore || false
            this.isOpen = true
        } catch (error) {
            console.error("[v0] Search error:", error)
            // Reset state khi có lỗi để đảm bảo lần search tiếp theo hoạt động đúng
            if (this.currentPage === 1) {
                this.results = []
            }
            this.hasMore = false
            // Không set isOpen = false vì có thể user muốn thử lại
        } finally {
            this.isLoading = false
            // Force change detection để đảm bảo UI được cập nhật
            this.cdRef.detectChanges()
        }
    }

    loadMore(): void {
        console.log('loadMore:', this.hasMore, 'isLoading:', this.isLoading)
        if (this.hasMore && !this.isLoading && this.lastSearchText) {
            this.currentPage++
            this.performSearch(this.lastSearchText)
        }
    }

    onUserSelect(userId: any) {
        // selectedUser sẽ được gán id (bindValue="id")
        // nếu muốn object đầy đủ thì lấy từ results
        if (userId) {
            this.selectedUser = this.results.find(u => u.id === userId.id) || userId;
            this.searchText = this.buildDisplayText(userId) || '';
            this.searchTextChange.emit(this.searchText);
            this.lastEmittedUserId = userId.id;
            if (this.removeAfterSearch) {
                this.results = this.results.filter(u => u.id !== userId.id);
            }
        } else {
            this.selectedUser = null;
            this.searchText = '';
            this.searchTextChange.emit('');
            this.lastEmittedUserId = null;
        }
        if (this.onSelect) {
            this.onSelect(userId)
        }
    }

    selectUser(user: User): void {
        this.selectedUser = user
        this.isOpen = false
        this.searchText = this.buildDisplayText(user);
        this.searchTextChange.emit(this.searchText);
        this.results = []
        this.lastEmittedUserId = user.id;
        // Emit events
        if (this.onSelect) {
            this.onSelect(user)
        }

    }

    clearSelection(): void {
        this.selectedUser = null
        this.searchText = ""
        this.results = []
        this.isOpen = false
    }

    clearSearch(): void {
        this.searchText = ""
        this.searchTextChange.emit('');
        this.results = []
        this.isOpen = false
        this.currentPage = 1
        this.searchText$.next('');
        this.selectedUser = null
        this.lastEmittedUserId = null;
        this.onSelect(null)
    }

    /** Xử lý khi click chọn một option trong dropdown – dùng để trigger lại cùng user nếu cần. */
    onOptionClick(item: any): void {
        if (!this.onTriggerSameUser || !item) {
            return;
        }
        // Nếu user được click trùng với user đã emit lần trước thì gọi lại onSelect
        if (this.lastEmittedUserId != null && item.id === this.lastEmittedUserId) {
            if (this.onSelect) {
                this.onSelect(item);
            }
            this.userSelected.emit(item);
        }
    }

    onInputFocus(): void {
        if (this.searchText.trim().length > 0 && this.results.length > 0) {
            this.isOpen = true
        }
    }

    onScroll(event: Event) {
        if (this.ignoreScroll) {
            this.ignoreScroll = false;
            return; // bỏ qua scroll nhầm
        }
        const target = event.target as HTMLElement;
        if (!target) return;

        const threshold = 50; // khoảng cách tới đáy tính bằng px để trigger load
        const scrollTop = target.scrollTop || 0;
        const clientHeight = target.clientHeight || 0;
        const scrollHeight = target.scrollHeight || 0;

        const position = scrollTop + clientHeight;
        const distanceToBottom = scrollHeight - position;

        console.log('Scroll - position:', position, 'height:', scrollHeight, 'distanceToBottom:', distanceToBottom, 'hasMore:', this.hasMore, 'isLoading:', this.isLoading);

        if (distanceToBottom <= threshold && this.hasMore && !this.isLoading) {
            console.log('Triggering loadMore');
            this.loadMore();
        }
    }


    onInputBlur(): void {
        // Delay to allow click on dropdown items
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
}
