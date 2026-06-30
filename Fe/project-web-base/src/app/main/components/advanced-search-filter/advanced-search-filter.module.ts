import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { AdvancedSearchFilterComponent } from './advanced-search-filter.component';

@NgModule({
  declarations: [AdvancedSearchFilterComponent],
  imports: [CommonModule, TranslateModule],
  exports: [AdvancedSearchFilterComponent]
})
export class AdvancedSearchFilterModule { }

