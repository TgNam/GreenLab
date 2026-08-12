import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { CoreCommonModule } from '@core/common.module';
import { ContentHeaderModule } from 'app/layout/components/content-header/content-header.module';
import { SharedModule } from '../../shared.module';
import { SharedPipesModule } from 'app/main/components/pipe/shared-pipes.module';
import { DynamicTableModule } from 'app/main/components/dynamic-table/dynamic-table.module';
import { AdvancedSearchFilterModule } from 'app/main/components/advanced-search-filter/advanced-search-filter.module';

import { PanelsListComponent } from './panels-list/panels-list.component';
import { PanelService } from '../../services/lab-tests/panel.service';
import { PanelCategoryService } from '../../services/lab-tests/panel-category.service';
import { DiscountTypeService } from '../../services/lab-tests/discount-type.service';

const routes: Routes = [
  { path: '', component: PanelsListComponent }
];

@NgModule({
  declarations: [PanelsListComponent],
  imports: [
    CommonModule, RouterModule.forChild(routes), CoreCommonModule,
    ContentHeaderModule, FormsModule, NgbModule, SharedModule,
    SharedPipesModule, DynamicTableModule, AdvancedSearchFilterModule
  ],
  providers: [PanelService, PanelCategoryService, DiscountTypeService]
})
export class PanelsModule { }
