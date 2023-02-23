import { NgModule } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FlowsInteractionComponent } from './flows-interaction.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AgGridModule } from 'ag-grid-angular';

import { FlowsInteractionViewComponent } from './flows-interaction-view/flows-interaction-view.component';
import { PipesModule } from 'src/app/pipes/pipes.module';
import { FlowsInteractionService } from './flows-interaction.service';
import { FlowNodeViewComponent } from './flows-interaction-view/flow-node-view/flow-node-view.component';
import { FlowsFiltersComponent } from './flows-filters/flows-filters.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { ClickOutsideModule } from 'src/app/directive/click-outside/click-outside.module';
import { SortablejsModule } from 'ngx-sortablejs';
import { DatePickerModule } from 'src/app/utils/date-picker/date-picker.module';
import { DataGridModule } from 'src/app/utils/directives/data-grid/data-grid.module';
import { RoundCheckModule } from 'src/app/utils/round-check/round-check.module';
import { OnChangeModule } from 'src/app/directive/on-change/on-change.module';
import { TruncatedModule } from 'src/app/utils/truncated/truncated.module';
import { LoadingPlaceholderModule } from 'src/app/utils/loading-placeholder/loading-placeholder.module';
import { AutoFocusModule } from 'src/app/utils/directives/auto-focus/auto-focus.module';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { ListAgGridModule } from '../services/list/list-ag-grid/list-ag-grid.module';
import { SwitchModule } from 'src/app/utils/switch/switch.module';
import { SearchForComponent } from './flows-filters/search-for/search-for.component';
import { SearchForFieldComponent } from './flows-filters/search-for/search-for-field/search-for-field.component';
import { DatePickerComponent } from 'src/app/utils/date-picker/date-picker.component';
import { FileViewModule } from 'src/app/utils/file-view/file-view.module';
import { UserViewModule } from 'src/app/utils/user-view/user-view.module';
import { RelationViewModule } from 'src/app/utils/relation-view/relation-view.module';

const routes: Routes = [
  { path: ':flowId', pathMatch: 'full', component: FlowsInteractionComponent },
  { path: ':flowId/:interactionId', component: FlowsInteractionViewComponent }
];

@NgModule({
  declarations: [
    FlowsInteractionComponent,
    FlowsInteractionViewComponent,
    FlowNodeViewComponent,
    SearchForComponent,
    SearchForFieldComponent,
    FlowsFiltersComponent
  ],
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
    SwitchModule,
    AgGridModule,
    FileViewModule,
    UserViewModule,
    RelationViewModule
  ],
  providers: [FlowsInteractionService,DatePipe],
  exports: [
    RouterModule
  ]
})
export class FlowsInteractionModule { }
