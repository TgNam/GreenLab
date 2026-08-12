import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';

import { CoreCommonModule } from '@core/common.module';
import { CoreDirectivesModule } from '@core/directives/directives';
import { CorePipesModule } from '@core/pipes/pipes.module';


import { SharedModule } from '../../shared.module';
import { SystemConfigService } from './systemconfig.service';
import { SystemConfigListComponent } from './systemconfig-list/systemconfig-list.component';
import { ContentHeaderModule } from 'app/layout/components/content-header/content-header.module';
import { SystemConfigCreateComponent } from './popup/systemconfig-create.component';
import { SystemConfigUpdateComponent } from './popup/systemconfig-update.component';
import { DynamicTableModule } from 'app/main/components/dynamic-table/dynamic-table.module';
import { AdvancedSearchFilterModule } from 'app/main/components/advanced-search-filter/advanced-search-filter.module';

const routes: Routes = [
  {
    path: '',
    component: SystemConfigListComponent,
    resolve: {
      uls: SystemConfigService
    },
    data: { animation: 'SystemConfigListComponent' }, 
  },  
  {
    path: '',
    redirectTo: '',
    pathMatch: 'full'
  }
];

@NgModule({
  declarations: [SystemConfigListComponent, SystemConfigCreateComponent, SystemConfigUpdateComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    CoreCommonModule,
    FormsModule,
    NgbModule,
    NgSelectModule,
    NgxDatatableModule,
    CorePipesModule,
    CoreDirectivesModule,
    SharedModule,
    ContentHeaderModule,
    DynamicTableModule,
    AdvancedSearchFilterModule
  ],
  providers: [SystemConfigService]
})
export class SystemConfigModule { }


