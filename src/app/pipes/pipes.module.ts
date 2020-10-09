import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileSizePipe } from 'src/app/pipes/file-size.pipe';
import { ToArrayPipe } from 'src/app/pipes/to-array.pipe';
import { ServiceSearchPipe } from './service-search.pipe';
import { FilterAppPipe } from 'src/app/pipes/filter-app.pipe';
import { WfFilterPipe } from 'src/app/pipes/wf-filter.pipe';
import { OrderByPipe } from './order-by.pipe';
import { FilterIntegrationPipe } from './filter-integration.pipe';

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [
    FilterAppPipe,
    FileSizePipe,
    ToArrayPipe,
    ServiceSearchPipe,
    WfFilterPipe,
    OrderByPipe,
    FilterIntegrationPipe
  ],
  exports: [
    FilterAppPipe,
    FileSizePipe,
    ToArrayPipe,
    ServiceSearchPipe,
    WfFilterPipe,
    OrderByPipe,
    FilterIntegrationPipe
  ],
  providers: [
    FilterAppPipe,
    FileSizePipe,
    ToArrayPipe,
    ServiceSearchPipe,
    WfFilterPipe,
    OrderByPipe,
    FilterIntegrationPipe
  ]
})
export class PipesModule { }
