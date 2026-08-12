import { DOCUMENT } from '@angular/common';
import { Router } from '@angular/router';
import { Component, ElementRef, HostListener, Inject, OnInit, ViewChild } from '@angular/core';

import { SearchService } from 'app/layout/components/navbar/navbar-search/search.service';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { MenuService } from 'app/menu/menu.service';

@Component({
  selector: 'app-navbar-search',
  templateUrl: './navbar-search.component.html'
})
export class NavbarSearchComponent implements OnInit {
  // Public
  public searchText = '';
  public openSearchRef = false;
  public apiData;
  public pages = [];
  public files = [];
  public contacts = [];
  public pageSearchLimit;

  // Decorators
  @ViewChild('openSearch') private _inputElement: ElementRef;
  @ViewChild('pageList') private _pageListElement: ElementRef;

  @HostListener('keydown.escape') fn() {
    this.removeOverlay();
    this.openSearchRef = false;
    this.searchText = '';
  }
  @HostListener('document:click', ['$event']) clickout(event) {
    if (event.target.className === 'content-overlay') {
      this.removeOverlay();
      this.openSearchRef = false;
      this.searchText = '';
    }
  }
  private searchSubject = new Subject<string>();
  /**
   *
   * @param document
   * @param router
   * @param _searchService
   */
  constructor(
    @Inject(DOCUMENT) private document,
    private _elementRef: ElementRef,
    private router: Router,
    public _searchService: SearchService,
    public _menuService: MenuService
  ) {
    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(text => {
        this.performSearch(text);
      });
  }

  // Public Methods
  // -----------------------------------------------------------------------------------------------------

  /**
   * Next Active Match
   */
  nextActiveMatch() {
    this.activeIndex = this.activeIndex < this.pageSearchLimit - 1 ? ++this.activeIndex : this.activeIndex;
  }

  /**
   * Previous Active Match
   */
  prevActiveMatch() {
    this.activeIndex = this.activeIndex > 0 ? --this.activeIndex : 0;
  }

  /**
   * Remove Overlay
   */
  removeOverlay() {
    this.document.querySelector('.app-content').classList.remove('show-overlay');
  }

  /**
   * Auto Suggestion
   *
   * @param event
   */
  autoSuggestion(event) {
    if (38 === event.keyCode) {
      return this.prevActiveMatch();
    }
    if (40 === event.keyCode) {
      return this.nextActiveMatch();
    }
    if (13 === event.keyCode) {
      // Navigate to activeIndex
      // ! Todo: Improve this code
      let current_item = this._pageListElement.nativeElement.getElementsByClassName('current_item');
      current_item[0]?.children[0].click();
    }
  }

  /**
   * Toggle Search
   */
  toggleSearch() {
    this._searchService.onIsBookmarkOpenChange.next(false);
    this.removeOverlay();
    this.openSearchRef = !this.openSearchRef;
    this.activeIndex = 0;
    setTimeout(() => {
      this._inputElement.nativeElement.focus();
    });
    this.document.querySelector('.app-content').classList.add('show-overlay');
    if (this.openSearchRef === false) {
      this.document.querySelector('.app-content').classList.remove('show-overlay');
      this.searchText = '';
    }
  }

  /**
   * Search Update
   *
   * @param event
   */
  searchUpdate(event) {
    const val = event.target.value.toLowerCase();
    if (val !== '') {
      this.document.querySelector('.app-content').classList.add('show-overlay');
    } else {
      this.document.querySelector('.app-content').classList.remove('show-overlay');
    }
    this.autoSuggestion(event);
  }

  activeIndex = -1; // Không chọn gì ban đầu

  onKeyDown(event: KeyboardEvent) {
    const length = this.pages.length;

    // Arrow Down
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (length > 0) {
        this.activeIndex = (this.activeIndex + 1) % length;
        this.scrollToActiveItem();
      }
    }

    // Arrow Up
    else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (length > 0) {
        this.activeIndex = (this.activeIndex - 1 + length) % length;
        this.scrollToActiveItem();
      }
    }

    // Enter → navigate item
    else if (event.key === 'Enter' && this.activeIndex >= 0) {
      const page = this.pages[this.activeIndex];
      this.navigate(page.uri)
    }
  }
  navigate(uri) {
    this.router.navigateByUrl(uri.replace('/api/admin', ''));

    this.toggleSearch()

  }

  scrollToActiveItem() {
    setTimeout(() => {
      const list = this._pageListElement?.nativeElement;
      if (!list) return;

      const items = list.querySelectorAll('li.auto-suggestion');
      if (!items || !items[this.activeIndex]) return;

      const activeItem = items[this.activeIndex] as HTMLElement;

      const itemTop = activeItem.offsetTop;
      const itemBottom = itemTop + activeItem.offsetHeight;

      const viewTop = list.scrollTop;
      const viewBottom = viewTop + list.clientHeight;

      if (itemTop < viewTop) {
        list.scrollTop = itemTop;
      } else if (itemBottom > viewBottom) {
        list.scrollTop = itemBottom - list.clientHeight;
      }
    });
  }


  onSearchChange(text: string) {

    this.searchSubject.next(text);
  }

  async performSearch(text: string) {
    try {

      const response = await this._menuService.findPermissionsForAdmin(text);
      this.pages = response.data;
    } catch (ex) {
      console.log(ex)
    }
    // Gọi API hoặc filter tại đây
  }
  // Lifecycle Hooks
  // -----------------------------------------------------------------------------------------------------

  /**
   * On init
   */
  ngOnInit(): void {

  }
}
