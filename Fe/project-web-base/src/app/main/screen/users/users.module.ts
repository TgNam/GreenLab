import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { CoreCommonModule } from '@core/common.module';
import { CoreDirectivesModule } from '@core/directives/directives';
import { CorePipesModule } from '@core/pipes/pipes.module';
import { ContentHeaderModule } from 'app/layout/components/content-header/content-header.module';
import { AdvancedSearchFilterModule } from 'app/main/components/advanced-search-filter/advanced-search-filter.module';
import { SharedModule } from '../../shared.module';
import { SharedPipesModule } from 'app/main/components/pipe/shared-pipes.module';
import { DynamicTableModule } from 'app/main/components/dynamic-table/dynamic-table.module';

import { UsersListComponent } from '../users/users-list/users-list.component';
import { UsersService } from './users.service';

const routes: Routes = [
  {
    path: '',
    component: UsersListComponent,
    data: { animation: 'UsersListComponent' }
  }
];

@NgModule({
  declarations: [UsersListComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    CoreCommonModule,
    ContentHeaderModule,
    FormsModule,
    NgbModule,
    CorePipesModule,
    CoreDirectivesModule,
    SharedModule,
    SharedPipesModule,
    DynamicTableModule,
    AdvancedSearchFilterModule
  ],
  providers: [UsersService]
})
export class UsersModule { }
