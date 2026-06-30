import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { DynamicTableComponent } from './dynamic-table.component';
import { DynamicTableRowComponent } from './dynamic-table-row.component';
import { DynamicTableCellComponent } from './dynamic-table-cell.component';
import { DynamicTableBodyComponent } from './dynamic-table-body.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { FormsModule } from '@angular/forms';
import { SharedPipesModule } from '../pipe/shared-pipes.module';
import { FormInputComponent } from '../form-input/form-input.component';
import { SharedModule } from 'app/main/shared.module';
import { ScrollingModule } from '@angular/cdk/scrolling';

@NgModule({
  declarations: [DynamicTableComponent, DynamicTableRowComponent, DynamicTableCellComponent, DynamicTableBodyComponent],
  imports: [
    CommonModule,
    NgbModule,
    NgSelectModule,
    NgxDatatableModule,
    FormsModule,
    SharedPipesModule,
    SharedModule,
    ScrollingModule
  ],
  exports: [DynamicTableComponent]
})
export class DynamicTableModule {}
