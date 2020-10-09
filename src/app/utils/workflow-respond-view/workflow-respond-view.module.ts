import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkflowRespondViewComponent } from './workflow-respond-view.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { ViewControlModule } from '../view-control/view-control.module';
import { PipesModule } from 'src/app/pipes/pipes.module';
import { MapModule } from '../map/map.module';
import { VersionModule } from '../version/version.module';
import { ClickOutsideModule } from 'src/app/directive/click-outside/click-outside.module';
import { DataGridModule } from '../directives/data-grid/data-grid.module';
import { RoundCheckModule } from '../round-check/round-check.module';
import { RadioBtnModule } from '../radio-btn/radio-btn.module';
import { SortablejsModule } from 'ngx-sortablejs';
import { DatePickerModule } from '../date-picker/date-picker.module';
import { SearchBoxModule } from '../search-box/search-box.module';
import { TruncatedModule } from '../truncated/truncated.module';
import { ManageControlModule } from '../manage-control/manage-control.module';
import { FindAxisModule } from 'src/app/directive/find-axis/find-axis.module';
import { OnChangeModule } from 'src/app/directive/on-change/on-change.module';



@NgModule({
  declarations: [WorkflowRespondViewComponent],
  imports: [
    
    CommonModule,
    FormsModule,
    NgbModule,
    ReactiveFormsModule,
    ViewControlModule,
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
  ],
  exports: [WorkflowRespondViewComponent]

})
export class WorkflowRespondViewModule { }
