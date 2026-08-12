import { ChangeDetectorRef, Component, HostBinding, Input, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';

import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';

import { CoreMenuItem } from '@core/types';
import { CoreMenuService } from '@core/components/core-menu/core-menu.service';

import { User } from 'app/auth/models';

@Component({
  selector: '[core-menu-vertical-collapsible]',
  templateUrl: './collapsible.component.html'
})
export class CoreMenuVerticalCollapsibleComponent implements OnInit, OnDestroy {
  currentUser: User;

  @Input()
  item: CoreMenuItem;

  @HostBinding('class.open')
  public isOpen = false;

  // Private
  private _unsubscribeAll: Subject<any>;

  /**
   * Constructor
   *
   * @param {Router} _router
   * @param {CoreMenuService} _coreMenuService
   * @param {ChangeDetectorRef} _changeDetectorRef
   */
  constructor(
    private _router: Router,
    private _coreMenuService: CoreMenuService,
    private _changeDetectorRef: ChangeDetectorRef
  ) {
    // Set the private defaults
    this._unsubscribeAll = new Subject();
  }

  // Lifecycle hooks
  // -----------------------------------------------------------------------------------------------------

  /**
   * On init
   */
  ngOnInit(): void {
    // Listen for router events and expand
    this._router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntil(this._unsubscribeAll)
      )
      .subscribe((event: NavigationEnd) => {
        // Confirm if the urlAfterRedirects can be found in one of the children of this item
        if (this.confirmUrlInChildren(this.item, event.urlAfterRedirects)) {
          this.expand();
        } else {
          this.collapse();
        }
      });

    // Subscribe to the current menu changes
    this._coreMenuService.onMenuChanged.pipe(takeUntil(this._unsubscribeAll)).subscribe(() => {
      this.currentUser = this._coreMenuService.currentUser;
    });

    // Listen for collapsing of any menu item
    this._coreMenuService.onItemCollapsed.pipe(takeUntil(this._unsubscribeAll)).subscribe(clickedItem => {
      if (clickedItem && clickedItem.children) {
        // Check if the clicked item is one of the children of this item
        if (this.confirmItemInChildren(this.item, clickedItem)) {
          return;
        }

        // Check if the url can be found in one of the children of this item
        if (this.confirmUrlInChildren(this.item, this._router.url)) {
          return;
        }

        // If the clicked item is not this item, collapse...
        if (this.item !== clickedItem) {
          this.collapse();
        }
      }
    });

    // Check if the url can be found in one of the children of this item
    // Required for onInit case (i.e switching theme customizer menu layout)
    if (this.confirmUrlInChildren(this.item, this._router.url)) {
      this.expand();
    } else {
      this.collapse();
    }
  }

  /**
   * On destroy
   */
  ngOnDestroy(): void {
    // Unsubscribe from all subscriptions
    this._unsubscribeAll.next();
    this._unsubscribeAll.complete();
  }

  // Public methods
  // -----------------------------------------------------------------------------------------------------

  /**
   * Toggle collapse
   *
   * @param e
   */
  toggleOpen(e): void {
    e.preventDefault();

    this.isOpen = !this.isOpen;

    // Menu collapse toggled...
    this._coreMenuService.onItemCollapsed.next(this.item);
    this._coreMenuService.onItemCollapseToggled.next();
  }

  /**
   * Expand the collapsible menu
   */
  expand(): void {
    if (this.isOpen) {
      return;
    }

    this.isOpen = true;

    // Mark for check
    this._changeDetectorRef.markForCheck();

    this._coreMenuService.onItemCollapseToggled.next();
  }

  /**
   * Collapse the collapsible menu
   */
  collapse(): void {
    if (!this.isOpen) {
      return;
    }

    this.isOpen = false;

    // Mark for check
    this._changeDetectorRef.markForCheck();

    this._coreMenuService.onItemCollapseToggled.next();
  }

  /**
   * Check if item is active based on current route
   *
   * @param item
   * @returns {boolean}
   */
  isActiveFunc(item: any): boolean {
    if (item.openInNewTab) return false;

    // Remove query params and fragment
    const currentPath = this._router.url.split('?')[0].split('#')[0];

    return currentPath === item.url;
  }

  /**
   * Confirms if the provided url can be found in one of the given parent's children
   *
   * @param parent
   * @param url
   * @returns {boolean}
   */
  confirmUrlInChildren(parent, url): boolean {
    const children = parent.children;

    // Return false if parent don't have any children
    if (!children) {
      return false;
    }

    // Normalize URLs by removing leading/trailing slashes and query params
    const normalizeUrl = (urlStr: string): string => {
      if (!urlStr) return '';
      // Remove query params and hash
      const cleanUrl = urlStr.split('?')[0].split('#')[0];
      // Remove leading and trailing slashes
      return cleanUrl.replace(/^\/+|\/+$/g, '');
    };

    const normalizedUrl = normalizeUrl(url);

    // Loop all the children
    for (const child of children) {
      // If children has child (Sub to sub item url)
      if (child.children) {
        // Call function again with child
        if (this.confirmUrlInChildren(child, url)) {
          return true;
        }
      }

      if (!child.url) {
        continue;
      }

      const normalizedChildUrl = normalizeUrl(child.url);

      // Exact match
      if (normalizedUrl === normalizedChildUrl) {
        return true;
      }

      // Prefix match: URL starts with child URL followed by '/' or is exactly child URL
      // This prevents false matches like 'system/test-search' matching 'system/test'
      if (normalizedUrl.startsWith(normalizedChildUrl + '/') || 
          normalizedUrl.startsWith(normalizedChildUrl + '?')) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if the provided parent has the provided item in one of its children
   *
   * @param parent
   * @param item
   * @returns {boolean}
   */
  confirmItemInChildren(parent, item): boolean {
    const children = parent.children;

    // Return false if parent don't have any children
    if (!children) {
      return false;
    }

    // Return true parent has the provided item in one of its children
    if (children.indexOf(item) > -1) {
      return true;
    }

    for (const child of children) {
      if (child.children) {
        // Call function again with child (for sub to sub item)
        if (this.confirmItemInChildren(child, item)) {
          return true;
        }
      }
    }

    return false;
  }
}
