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

import { TestsListComponent } from './tests-list/tests-list.component';
import { TestService } from '../../services/lab-tests/test.service';
import { TestCategoryService } from '../../services/lab-tests/test-category.service';
import { SpecimenTypeService } from '../../services/lab-tests/specimen-type.service';
import { UnitService } from '../../services/lab-tests/unit.service';

const routes: Routes = [
  { path: '', component: TestsListComponent }
];

@NgModule({
  declarations: [TestsListComponent],
  imports: [
    CommonModule, RouterModule.forChild(routes), CoreCommonModule,
    ContentHeaderModule, FormsModule, NgbModule, SharedModule,
    SharedPipesModule, DynamicTableModule, AdvancedSearchFilterModule
  ],
  providers: [TestService, TestCategoryService, SpecimenTypeService, UnitService]
})
export class TestsModule { }
