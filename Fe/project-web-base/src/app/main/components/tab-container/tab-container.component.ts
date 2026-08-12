import { Component, Input, Output, EventEmitter, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface TabConfig {
  id: string;
  label: string;
  icon?: string; // Icon class (e.g., 'fa fa-list', 'fa fa-user-md')
  disabled?: boolean;
}

@Component({
  selector: 'app-tab-container',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tab-container.component.html',
  styleUrls: ['./tab-container.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class TabContainerComponent implements OnInit {
  @Input() tabs: TabConfig[] = [];
  @Input() activeTabId: string = '';
  @Input() onTabClick?: (tabId: string) => void;
  
  @Output() tabChange = new EventEmitter<string>();
  
  ngOnInit(): void {
    // Set first tab as active if no activeTabId provided
    if (!this.activeTabId && this.tabs.length > 0) {
      this.activeTabId = this.tabs[0].id;
    }
  }
  
  onTabClickHandler(tabId: string, disabled?: boolean): void {
    if (disabled) {
      return;
    }
    
    this.activeTabId = tabId;
    this.tabChange.emit(tabId);
    
    // Call custom handler if provided
    if (this.onTabClick) {
      this.onTabClick(tabId);
    }
  }
  
  isActive(tabId: string): boolean {
    return this.activeTabId === tabId;
  }
}

