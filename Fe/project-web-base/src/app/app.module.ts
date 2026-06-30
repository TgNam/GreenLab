import {ErrorHandler, NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {RouterModule, Routes} from '@angular/router';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {HttpClientModule, HTTP_INTERCEPTORS} from '@angular/common/http';

import 'hammerjs';
import {NgbDatepickerI18n, NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {ToastrModule} from 'ngx-toastr';
import {TranslateModule} from '@ngx-translate/core';
import {ContextMenuModule} from '@ctrl/ngx-rightclick';

import {CoreModule} from '@core/core.module';
import {CoreCommonModule} from '@core/common.module';
import {CoreSidebarModule, CoreThemeCustomizerModule} from '@core/components';
import {CardSnippetModule} from '@core/components/card-snippet/card-snippet.module';

import {coreConfig} from 'app/app-config';
import {AuthGuard} from 'app/auth/helpers/auth.guards';
import {JwtInterceptor, ErrorInterceptor} from 'app/auth/helpers';
import {AppComponent} from 'app/app.component';
import {LayoutModule} from 'app/layout/layout.module';
import {ContentHeaderModule} from 'app/layout/components/content-header/content-header.module';

import {ContextMenuComponent} from 'app/main/extensions/context-menu/context-menu.component';
import {
    AnimatedCustomContextMenuComponent
} from './main/extensions/context-menu/custom-context-menu/animated-custom-context-menu/animated-custom-context-menu.component';
import {
    BasicCustomContextMenuComponent
} from './main/extensions/context-menu/custom-context-menu/basic-custom-context-menu/basic-custom-context-menu.component';
import {
    SubMenuCustomContextMenuComponent
} from './main/extensions/context-menu/custom-context-menu/sub-menu-custom-context-menu/sub-menu-custom-context-menu.component';
import {LoadingInterceptor} from './main/components/loading-bar/loading.interceptor';
import {LoadingBarComponent} from './main/components/loading-bar/loading-bar.component';
import {LightboxModule} from 'ngx-lightbox';
import {ViDatepickerI18n} from './main/components/form-input/vi-datepicker-i18n';
import {SharedPipesModule} from './main/components/pipe/shared-pipes.module';
import {CustomDatepickerI18n} from './main/components/form-input/custom-datepicker-i18n';
import {ServiceWorkerModule} from '@angular/service-worker';
import {environment} from 'environments/environment';
import {BlockUIModule} from 'ng-block-ui';
import {BlockDuplicateApiInterceptor} from './auth/helpers/block-duplicate-api.interceptor';
import {ChunkErrorHandler} from './auth/helpers/chunk-error-handler';
import {FallbackComponent} from './main/services/fallback.component';


const appRoutes: Routes = [
  {
    path: 'dashboard',
    loadChildren: () => import('./main/dashboard/dashboard.module').then(m => m.DashboardModule)
  },
  {
    path: '',
    redirectTo: '/pages',
    pathMatch: 'full'
  },
  {
    path: '',
    loadChildren: () => import('./main/authentication/authentication.module').then(m => m.AuthenticationModule)
  },
  {
    path: 'permissions',
    loadChildren: () => import('./main/screen/permissions/permission.module').then(m => m.PermissionModule),
    canActivate: [AuthGuard]
  }
  ,
  {
    path: 'roles',
    loadChildren: () => import('./main/screen/roles/role.module').then(m => m.RoleModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'users',
    loadChildren: () => import('./main/screen/users/users.module').then(m => m.UsersModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'departments',
    loadChildren: () => import('./main/screen/departments/departments.module').then(m => m.DepartmentsModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'administrators',
    loadChildren: () => import('./main/screen/administrators/administrator.module').then(m => m.AdministratorModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'email-templates',
    loadChildren: () => import('./main/screen/email-template/email-template.module').then(m => m.EmailTemplateModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'sms-templates',
    loadChildren: () => import('./main/screen/sms-template/sms-template.module').then(m => m.SmsTemplateModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'config/system-configs',
    loadChildren: () => import('./main/screen/system-configs/systemconfig.module').then(m => m.SystemConfigModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'components',
    loadChildren: () => import('./main/components/components.module').then(m => m.ComponentsModule),
    canActivate: [AuthGuard]
  },
  // {
  //   path: 'extensions',
  //   loadChildren: () => import('./main/extensions/extensions.module').then(m => m.ExtensionsModule),
  //   canActivate: [AuthGuard]
  // },
  // {
  //   path: 'forms',
  //   loadChildren: () => import('./main/forms/forms.module').then(m => m.FormsModule),
  //   canActivate: [AuthGuard]
  // },
  {
    path: '**',
    component: FallbackComponent //Error 404 - Page not found
  }
];

@NgModule({
    declarations: [
        AppComponent,
        ContextMenuComponent,
        BasicCustomContextMenuComponent,
        AnimatedCustomContextMenuComponent,
        SubMenuCustomContextMenuComponent,
        LoadingBarComponent
    ],
    imports: [
        BrowserModule,
        LightboxModule,
        BrowserAnimationsModule,
        HttpClientModule,
        RouterModule.forRoot(appRoutes, {
            scrollPositionRestoration: 'enabled',
            relativeLinkResolution: 'legacy',
            onSameUrlNavigation: 'reload'
        }),
        NgbModule,
        ToastrModule.forRoot({
            positionClass: 'toast-top-right',
            closeButton: true,
            progressBar: true,
            timeOut: 3000,
            preventDuplicates: true,
            autoDismiss: true,
            tapToDismiss: false
        }),
        TranslateModule.forRoot(),
        ContextMenuModule,
        CoreModule.forRoot(coreConfig),
        CoreCommonModule,
        CoreSidebarModule,
        CoreThemeCustomizerModule,
        CardSnippetModule,
        LayoutModule,
        ContentHeaderModule,
        BlockUIModule.forRoot(),
        // ServiceWorkerModule.register('ngsw-worker.js', {
        //   enabled: environment.production,
        //   registrationStrategy: 'registerWhenStable:30000'
        // })

    ],
    providers: [
        {provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true},
        {provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true},
        {provide: HTTP_INTERCEPTORS, useClass: BlockDuplicateApiInterceptor, multi: true},
        {
            provide: HTTP_INTERCEPTORS,
            useClass: LoadingInterceptor,
            multi: true
        },
        {provide: ErrorHandler, useClass: ChunkErrorHandler},
        {provide: NgbDatepickerI18n, useClass: CustomDatepickerI18n},
    ],
    bootstrap: [AppComponent]
})
export class AppModule {
}
