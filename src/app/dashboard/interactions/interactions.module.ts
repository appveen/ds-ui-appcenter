import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { AgGridModule } from 'ag-grid-angular';

import { InteractionsComponent } from './interactions.component';
import { InteractionViewComponent } from './interaction-view/interaction-view.component';
import { SearchBoxModule } from 'src/app/utils/search-box/search-box.module';
import { DatePickerModule } from 'src/app/utils/date-picker/date-picker.module';
import { ClickOutsideModule } from 'src/app/directive/click-outside/click-outside.module';
import { IconsModule } from 'src/app/utils/icons/icons.module';
import { InteractionDataViewComponent } from './interaction-data-view/interaction-data-view.component';
import { DataGridModule } from 'src/app/utils/directives/data-grid/data-grid.module';
// import { InteractionGridFilterComponent } from './interaction-grid-filter/interaction-grid-filter.component';
import { LoadingPlaceholderModule } from 'src/app/utils/loading-placeholder/loading-placeholder.module';
import { TruncatedModule } from 'src/app/utils/truncated/truncated.module';
import { PipesModule } from 'src/app/pipes/pipes.module';
import { InteractionLogBlockComponent } from './interaction-log-block/interaction-log-block.component';
import { InteractionsGlobalComponent } from './interactions-global/interactions-global.component';
import { RoundCheckModule } from 'src/app/utils/round-check/round-check.module';
import { NodeInfoComponent } from './node-info/node-info.component';
import { InteractionsAllComponent } from './interactions-all/interactions-all.component';
import { InteractionGridCellComponent } from './interactions-all/interaction-grid-cell/interaction-grid-cell.component';
import { InteractionGridFilterComponent } from './interactions-all/interaction-grid-filter/interaction-grid-filter.component';
import { OnChangeModule } from 'src/app/directive/on-change/on-change.module';
import { DateFilterPickerComponent } from './interactions-all/date-filter-picker/date-filter-picker.component';
import { InteractionsAdvanceFilterComponent } from './interactions-all/interactions-advance-filter/interactions-advance-filter.component';


const routes: Routes = [
    { path: '', pathMatch: 'full', redirectTo: 'all' },
    { path: 'all', component: InteractionsAllComponent },
    { path: ':partnerId', component: InteractionsComponent },
    { path: ':partnerId/:flowId', component: InteractionLogBlockComponent },
    { path: ':partnerId/:flowId/:txnId', component: InteractionViewComponent }
];

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        RouterModule.forChild(routes),
        SearchBoxModule,
        NgbModule,
        DatePickerModule,
        ClickOutsideModule,
        IconsModule,
        DataGridModule,
        TruncatedModule,
        LoadingPlaceholderModule,
        PipesModule,
        RoundCheckModule,
        AgGridModule.withComponents([
            InteractionGridCellComponent,
            InteractionGridFilterComponent
        ]),
        OnChangeModule
    ],
    declarations: [
        InteractionsComponent,
        InteractionViewComponent,
        InteractionDataViewComponent,
        InteractionLogBlockComponent,
        InteractionsGlobalComponent,
        NodeInfoComponent,
        InteractionsAllComponent,
        InteractionGridCellComponent,
        InteractionGridFilterComponent,
        DateFilterPickerComponent,
        InteractionsAdvanceFilterComponent,
    ],
    exports: [RouterModule]
})
export class InteractionsModule { }
