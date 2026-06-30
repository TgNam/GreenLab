import { Component, Input, OnInit, OnDestroy, ViewEncapsulation, ElementRef, ViewChild, AfterViewInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-split-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './split-panel.component.html',
  styleUrls: ['./split-panel.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class SplitPanelComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() leftPanelMinWidth: number = 300; // Minimum width for left panel in pixels
  @Input() rightPanelMinWidth: number = 300; // Minimum width for right panel in pixels
  @Input() defaultLeftWidth: number = 50; // Default left panel width in percentage
  @Input() storageKey?: string; // Key for localStorage to persist width
  
  @ViewChild('leftPanel', { static: false }) leftPanel!: ElementRef<HTMLElement>;
  @ViewChild('rightPanel', { static: false }) rightPanel!: ElementRef<HTMLElement>;
  @ViewChild('divider', { static: false }) divider!: ElementRef<HTMLElement>;
  @ViewChild('container', { static: false }) container!: ElementRef<HTMLElement>;
  
  public leftWidth: number = 50; // Percentage
  private isResizing: boolean = false;
  private startX: number = 0;
  private startLeftWidth: number = 0;
  
  // Mobile panel state
  public activeMobilePanel: 'left' | 'right' = 'left'; // Default to left panel
  public leftPanelExpanded: boolean = true; // Left panel expanded state on mobile
  public rightPanelExpanded: boolean = true; // Right panel expanded state on mobile
  
  ngOnInit(): void {
    // Load saved width from localStorage if key provided
    if (this.storageKey) {
      const savedWidth = localStorage.getItem(this.storageKey);
      if (savedWidth) {
        this.leftWidth = parseFloat(savedWidth);
      } else {
        this.leftWidth = this.defaultLeftWidth;
      }
    } else {
      this.leftWidth = this.defaultLeftWidth;
    }
  }
  
  ngAfterViewInit(): void {
    this.updatePanelWidths();
  }
  
  ngOnDestroy(): void {
    // Clean up event listeners
    this.stopResize();
  }
  
  @HostListener('window:resize', ['$event'])
  onWindowResize(): void {
    // On mobile, update panel visibility
    if (window.innerWidth < 1400) {
      this.updatePanelWidths();
    } else {
      // Reset to desktop mode
      this.updatePanelWidths();
    }
  }
  
  // Toggle between left and right panel on mobile
  toggleMobilePanel(): void {
    if (this.isMobile()) {
      this.activeMobilePanel = this.activeMobilePanel === 'left' ? 'right' : 'left';
      this.updatePanelWidths();
    }
  }
  
  // Switch to specific panel on mobile
  switchToPanel(panel: 'left' | 'right'): void {
    if (this.isMobile()) {
      this.activeMobilePanel = panel;
      this.updatePanelWidths();
    }
  }

  // Toggle expand/collapse for left panel on mobile
  toggleLeftPanel(): void {
    if (this.isMobile()) {
      this.leftPanelExpanded = !this.leftPanelExpanded;
      this.updatePanelWidths();
    }
  }

  // Toggle expand/collapse for right panel on mobile
  toggleRightPanel(): void {
    if (this.isMobile()) {
      this.rightPanelExpanded = !this.rightPanelExpanded;
      this.updatePanelWidths();
    }
  }
  
  onDividerMouseDown(event: MouseEvent): void {
    // Only allow resize on desktop (>= 1400px)
    if (window.innerWidth < 1400) {
      return;
    }
    
    event.preventDefault();
    this.isResizing = true;
    this.startX = event.clientX;
    this.startLeftWidth = this.leftWidth;
    
    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('mouseup', this.onMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }
  
  private onMouseMove = (event: MouseEvent): void => {
    if (!this.isResizing || !this.container) {
      return;
    }
    
    const containerWidth = this.container.nativeElement.offsetWidth;
    const dividerWidth = this.divider ? this.divider.nativeElement.offsetWidth : 4;
    const availableWidth = containerWidth - dividerWidth;
    
    const deltaX = event.clientX - this.startX;
    const deltaPercent = (deltaX / availableWidth) * 100;
    
    let newLeftWidth = this.startLeftWidth + deltaPercent;
    
    // Calculate min/max percentages based on min widths
    const minLeftPercent = (this.leftPanelMinWidth / availableWidth) * 100;
    const minRightPercent = (this.rightPanelMinWidth / availableWidth) * 100;
    const maxLeftPercent = 100 - minRightPercent;
    
    // Clamp the width
    newLeftWidth = Math.max(minLeftPercent, Math.min(maxLeftPercent, newLeftWidth));
    
    this.leftWidth = newLeftWidth;
    this.updatePanelWidths();
  };
  
  private onMouseUp = (): void => {
    this.stopResize();
  };
  
  private stopResize(): void {
    if (this.isResizing) {
      this.isResizing = false;
      document.removeEventListener('mousemove', this.onMouseMove);
      document.removeEventListener('mouseup', this.onMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      
      // Save to localStorage if key provided
      if (this.storageKey) {
        localStorage.setItem(this.storageKey, this.leftWidth.toString());
      }
    }
  }
  
  private updatePanelWidths(): void {
    if (!this.leftPanel || !this.rightPanel) {
      return;
    }
    
    // On mobile, show panels with expand/collapse capability
    if (window.innerWidth < 1400) {
      // Show both panels, but allow expand/collapse
      this.leftPanel.nativeElement.style.display = this.leftPanelExpanded ? 'flex' : 'none';
      this.rightPanel.nativeElement.style.display = this.rightPanelExpanded ? 'flex' : 'none';
      
      // Set width to 100% when expanded
      if (this.leftPanelExpanded) {
        this.leftPanel.nativeElement.style.width = '100%';
        this.leftPanel.nativeElement.style.minWidth = '100%';
        this.leftPanel.nativeElement.style.maxWidth = '100%';
        this.leftPanel.nativeElement.style.flexShrink = '0';
      }
      
      if (this.rightPanelExpanded) {
        this.rightPanel.nativeElement.style.width = '100%';
        this.rightPanel.nativeElement.style.minWidth = '100%';
        this.rightPanel.nativeElement.style.maxWidth = '100%';
        this.rightPanel.nativeElement.style.flexShrink = '0';
      }
      
      if (this.divider) {
        this.divider.nativeElement.style.display = 'none';
      }
    } else {
      // Desktop: show both panels and reset display
      this.leftPanel.nativeElement.style.display = 'flex';
      this.rightPanel.nativeElement.style.display = 'flex';
      // Desktop: side by side - use fixed pixel width instead of percentage for better control
      const containerWidth = this.container.nativeElement.offsetWidth;
      const dividerWidth = this.divider ? this.divider.nativeElement.offsetWidth : 4;
      const availableWidth = containerWidth - dividerWidth;
      
      const leftWidthPx = (availableWidth * this.leftWidth) / 100;
      const rightWidthPx = availableWidth - leftWidthPx;
      
      // Set width and min-width to ensure proper sizing
      // Don't set maxWidth to allow resizing
      this.leftPanel.nativeElement.style.width = `${leftWidthPx}px`;
      this.leftPanel.nativeElement.style.minWidth = `${this.leftPanelMinWidth}px`;
      this.leftPanel.nativeElement.style.maxWidth = 'none';
      this.leftPanel.nativeElement.style.flexShrink = '0';
      this.leftPanel.nativeElement.style.flexGrow = '0';
      
      this.rightPanel.nativeElement.style.width = `${rightWidthPx}px`;
      this.rightPanel.nativeElement.style.minWidth = `${this.rightPanelMinWidth}px`;
      this.rightPanel.nativeElement.style.maxWidth = 'none';
      this.rightPanel.nativeElement.style.flexShrink = '0';
      this.rightPanel.nativeElement.style.flexGrow = '0';
      
      if (this.divider) {
        this.divider.nativeElement.style.display = 'flex';
      }
      
      // Trigger resize event to update tables inside panels
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 0);
    }
  }
  
  isMobile(): boolean {
    return window.innerWidth < 1400;
  }
}

