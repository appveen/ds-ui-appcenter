import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { ViewControlModule } from 'src/app/utils/view-control/view-control.module';
import { VersionModule } from 'src/app/utils/version/version.module';
import { MapModule } from 'src/app/utils/map/map.module';
import { PipesModule } from 'src/app/pipes/pipes.module';
import { DatePickerModule } from 'src/app/utils/date-picker/date-picker.module';
import { ViewGuard } from 'src/app/guard/view.guard';
import { ClickOutsideModule } from 'src/app/directive/click-outside/click-outside.module';
import { WorkflowHistoryComponent } from './workflow-history/workflow-history.component';
import { LoadingPlaceholderModule } from 'src/app/utils/loading-placeholder/loading-placeholder.module';
import { ViewComponent } from './view.component';
import { WorkflowRespondViewModule } from 'src/app/utils/workflow-respond-view/workflow-respond-view.module';
import { HistoryComponent } from './history/history.component';
import { CodeEditorModule } from 'src/app/utils/code-editor/code-editor.module'
import { TreeViewModule } from 'src/app/utils/tree-view/tree-view.module'
const routes: Routes = [
  {
    path: '', pathMatch: 'full', component: ViewComponent, canActivate: [ViewGuard], data: {
      breadcrumb: ['Data Service']
    }
  },
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),
    NgbModule,
    ViewControlModule,
    VersionModule,
    MapModule,
    PipesModule,
    DatePickerModule,
    ClickOutsideModule,
    LoadingPlaceholderModule,
    WorkflowRespondViewModule,
    CodeEditorModule,
    TreeViewModule
  ],
  declarations: [
    ViewComponent,
    WorkflowHistoryComponent,
    HistoryComponent
  ],
  exports: [
    RouterModule
  ]
})
export class ViewModule { }
