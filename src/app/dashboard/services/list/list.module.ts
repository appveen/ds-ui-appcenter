import { NgModule } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { SortablejsModule } from 'ngx-sortablejs';
import { PdfViewerModule } from 'ng2-pdf-viewer';

import { ListComponent } from 'src/app/dashboard/services/list/list.component';
import { PipesModule } from 'src/app/pipes/pipes.module';
import { ListGuard } from 'src/app/guard/list.guard';
import { ClickOutsideModule } from 'src/app/directive/click-outside/click-outside.module';
import { ListFiltersComponent } from './list-filters/list-filters.component';
import { SearchForComponent } from './list-filters/search-for/search-for.component';
import { DatePickerModule } from 'src/app/utils/date-picker/date-picker.module';
import { DataGridModule } from 'src/app/utils/directives/data-grid/data-grid.module';
import { ListViewComponent } from './list-view/list-view.component';
import { ListTextViewComponent } from './list-view/list-text-view/list-text-view.component';
import { ListRelationViewComponent } from './list-view/list-relation-view/list-relation-view.component';
import { RoundCheckModule } from 'src/app/utils/round-check/round-check.module';
import { ListGridFilterComponent } from './list-grid-filter/list-grid-filter.component';
import { ListCurrencyViewComponent } from './list-view/list-currency-view/list-currency-view.component';
import { ListFileViewComponent } from './list-view/list-file-view/list-file-view.component';
import { ListLocationViewComponent } from './list-view/list-location-view/list-location-view.component';
import { ListLongtxtViewComponent } from './list-view/list-longtxt-view/list-longtxt-view.component';
import { ListRichtxtViewComponent } from './list-view/list-richtxt-view/list-richtxt-view.component';
import { OnChangeModule } from 'src/app/directive/on-change/on-change.module';
import { TruncatedModule } from 'src/app/utils/truncated/truncated.module';
import { LoadingPlaceholderModule } from 'src/app/utils/loading-placeholder/loading-placeholder.module';
import { SearchForFieldComponent } from './list-filters/search-for/search-for-field/search-for-field.component';
import { AutoFocusModule } from 'src/app/utils/directives/auto-focus/auto-focus.module';
import { ListUserViewComponent } from './list-view/list-user-view/list-user-view.component';
import { ListAgGridModule } from './list-ag-grid/list-ag-grid.module';
import { SwitchModule } from '../../../utils/switch/switch.module';

const routes: Routes = [
  { path: '', pathMatch: 'full', component: ListComponent, canActivate: [ListGuard], data: { breadcrumb: ['Data Services'] } },
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),
    NgbModule,
    PipesModule,
    ClickOutsideModule,
    SortablejsModule,
    DatePickerModule,
    DataGridModule,
    RoundCheckModule,
    OnChangeModule,
    TruncatedModule,
    LoadingPlaceholderModule,
    AutoFocusModule,
    PdfViewerModule,
    ListAgGridModule,
    SwitchModule
  ],
  declarations: [
    ListComponent,
    ListFiltersComponent,
    SearchForComponent,
    ListViewComponent,
    ListTextViewComponent,
    ListRelationViewComponent,
    ListGridFilterComponent,
    ListCurrencyViewComponent,
    ListFileViewComponent,
    ListLocationViewComponent,
    ListLongtxtViewComponent,
    ListRichtxtViewComponent,
    SearchForFieldComponent,
    ListUserViewComponent,
  ],
  providers: [
    DatePipe
  ],
  exports: [
    RouterModule
  ]
})
export class ListModule { }
