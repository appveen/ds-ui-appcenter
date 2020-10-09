import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { SortablejsModule } from 'ngx-sortablejs';

import { WorkflowComponent } from 'src/app/dashboard/workflow/workflow.component';
import { ViewControlModule } from 'src/app/utils/view-control/view-control.module';
import { PipesModule } from 'src/app/pipes/pipes.module';
import { MapModule } from 'src/app/utils/map/map.module';
import { VersionModule } from 'src/app/utils/version/version.module';
import { ClickOutsideModule } from 'src/app/directive/click-outside/click-outside.module';
import { DataGridModule } from 'src/app/utils/directives/data-grid/data-grid.module';
import { WorkflowViewComponent } from './workflow-view/workflow-view.component';
import { RoundCheckModule } from 'src/app/utils/round-check/round-check.module';
import { WorkflowDetailViewComponent } from './workflow-detail-view/workflow-detail-view.component';
import { WorkflowFilterComponent } from './workflow-filter/workflow-filter.component';
import { RadioBtnModule } from 'src/app/utils/radio-btn/radio-btn.module';
import { SearchForComponent } from './workflow-filter/search-for/search-for.component';
import { DatePickerModule } from 'src/app/utils/date-picker/date-picker.module';
import { SearchBoxModule } from 'src/app/utils/search-box/search-box.module';
import { TruncatedModule } from 'src/app/utils/truncated/truncated.module';
import { ManageControlModule } from 'src/app/utils/manage-control/manage-control.module';
import { FindAxisModule } from 'src/app/directive/find-axis/find-axis.module';
import { OnChangeModule } from 'src/app/directive/on-change/on-change.module';
import { WorkflowRespondViewModule } from 'src/app/utils/workflow-respond-view/workflow-respond-view.module';
import { RelationViewComponent } from './workflow-view/relation-view/relation-view.component';
import { UserViewComponent } from './workflow-view/user-view/user-view.component';
import { FileViewComponent } from './workflow-view/file-view/file-view.component';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { WorkflowListComponent } from './workflow-list/workflow-list.component';
import { WorkflowAgGridModule } from './workflow-list/workflow-ag-grid/workflow-ag-grid.module';
import { WorkflowManageComponent } from './workflow-manage/workflow-manage.component';

const routes: Routes = [
  {
    path: '', component: WorkflowComponent, children: [
     { path: ':serviceId', component: WorkflowListComponent },
     { path: ':serviceId/:recordId', component: WorkflowManageComponent }
    ]
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild(routes),
    NgbModule,
    ViewControlModule,
    ReactiveFormsModule,
    PipesModule,
    MapModule,
    VersionModule,
    ClickOutsideModule,
    DataGridModule,
    RoundCheckModule,
    RadioBtnModule,
    SortablejsModule,
    DatePickerModule,
    SearchBoxModule,
    TruncatedModule,
    ManageControlModule,
    FindAxisModule,
    OnChangeModule,
    WorkflowRespondViewModule,
    PdfViewerModule,
    WorkflowAgGridModule



  ],
  declarations: [
    WorkflowComponent,
    WorkflowViewComponent,
    WorkflowDetailViewComponent,
    WorkflowFilterComponent,
    SearchForComponent,
    RelationViewComponent,
    UserViewComponent,
    FileViewComponent,
    WorkflowListComponent,
    WorkflowManageComponent,
    
  ],
  exports: [
    RouterModule
  ]
})
export class WorkflowModule { }
