import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, ViewEncapsulation, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FormInputModule } from '../form-input/form-input.module';

export interface QuickAssignmentItem {
  id: string | number;
  label: string;
  code?: string;
  [key: string]: any;
}

@Component({
  selector: 'app-quick-assignment',
  standalone: true,
  imports: [CommonModule, FormsModule, FormInputModule],
  templateUrl: './quick-assignment.component.html',
  styleUrls: ['./quick-assignment.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class QuickAssignmentComponent implements OnInit, OnChanges {
  @Input() items: QuickAssignmentItem[] = [];
  @Input() selectedItems: (string | number)[] = [];
  @Input() columns: number = 3; // Số cột hiển thị
  @Input() buttonText: string = 'Chọn';
  @Input() buttonClass: string = 'btn-primary';
  @Input() searchPlaceholder: string = 'Tìm kiếm...';
  @Input() showSearch: boolean = true;
  @Input() showSelectAll: boolean = true;
  
  @Output() selectedItemsChange = new EventEmitter<(string | number)[]>();
  @Output() itemChange = new EventEmitter<{ item: QuickAssignmentItem; selected: boolean }>();
  @Output() selectAll = new EventEmitter<boolean>();
  @Output() onButtonClick = new EventEmitter<(string | number)[]>();
  
  public filteredItems: QuickAssignmentItem[] = [];
  public searchText: string = '';
  public allSelected: boolean = false;
  
  constructor(private cdr: ChangeDetectorRef) {}
  
  ngOnInit(): void {
    this.filteredItems = [...this.items];
    this.updateSelectAllState();
  }
  
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['items']) {
      this.filteredItems = [...this.items];
      this.applySearch();
    }
    if (changes['selectedItems']) {
      this.updateSelectAllState();
    }
  }
  
  onSearchChange(searchValue: string): void {
    this.searchText = searchValue;
    this.applySearch();
  }
  
  applySearch(): void {
    if (!this.searchText.trim()) {
      this.filteredItems = [...this.items];
    } else {
      const searchLower = this.searchText.toLowerCase();
      this.filteredItems = this.items.filter(item => 
        item.label.toLowerCase().includes(searchLower) ||
        (item.code && item.code.toLowerCase().includes(searchLower))
      );
    }
    this.updateSelectAllState();
  }
  
  isSelected(itemId: string | number): boolean {
    return this.selectedItems.includes(itemId);
  }
  
  toggleItem(item: QuickAssignmentItem): void {
    const newSelectedItems = [...this.selectedItems];
    const index = newSelectedItems.indexOf(item.id);
    if (index > -1) {
      newSelectedItems.splice(index, 1);
    } else {
      newSelectedItems.push(item.id);
    }
    this.selectedItemsChange.emit(newSelectedItems);
    this.updateSelectAllState();
    this.itemChange.emit({ item, selected: !this.isSelected(item.id) });
    this.cdr.detectChanges();
  }
  
  toggleSelectAll(): void {
    this.allSelected = !this.allSelected;
    const newSelectedItems = [...this.selectedItems];
    
    if (this.allSelected) {
      // Select all filtered items
      this.filteredItems.forEach(item => {
        if (!newSelectedItems.includes(item.id)) {
          newSelectedItems.push(item.id);
        }
      });
    } else {
      // Deselect all filtered items
      this.filteredItems.forEach(item => {
        const index = newSelectedItems.indexOf(item.id);
        if (index > -1) {
          newSelectedItems.splice(index, 1);
        }
      });
    }
    this.selectedItemsChange.emit(newSelectedItems);
    this.selectAll.emit(this.allSelected);
    this.cdr.detectChanges();
  }
  
  updateSelectAllState(): void {
    if (this.filteredItems.length === 0) {
      this.allSelected = false;
      return;
    }
    this.allSelected = this.filteredItems.every(item => this.selectedItems.includes(item.id));
  }
  
  onButtonClickHandler(): void {
    this.onButtonClick.emit([...this.selectedItems]);
  }
  
  getSelectedCount(): number {
    return this.selectedItems.length;
  }
  
  getColumnClass(): string {
    const colMap: { [key: number]: string } = {
      2: 'col-6',
      3: 'col-4',
      4: 'col-3',
      5: 'col-12 col-md-6 col-lg-4 col-xl-2-4',
      6: 'col-12 col-md-6 col-lg-4'
    };
    return colMap[this.columns] || 'col-12 col-md-6 col-lg-4 col-xl-2-4';
  }
  
  trackByItemId(index: number, item: QuickAssignmentItem): string | number {
    return item.id;
  }
}

