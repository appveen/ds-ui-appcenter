import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { PdfViewerModule } from 'ng2-pdf-viewer';

import { ViewControlComponent } from 'src/app/utils/view-control/view-control.component';
import { ViewArrayComponent } from 'src/app/utils/view-control/view-array/view-array.component';
import { VersionModule } from 'src/app/utils/version/version.module';
import { MapModule } from 'src/app/utils/map/map.module';
import { PipesModule } from 'src/app/pipes/pipes.module';
import { DatePickerModule } from 'src/app/utils/date-picker/date-picker.module';
import { ViewTextComponent } from './view-text/view-text.component';
import { ViewNumberComponent } from './view-number/view-number.component';
import { ViewBooleanComponent } from './view-boolean/view-boolean.component';
import { ViewDateComponent } from './view-date/view-date.component';
import { ViewFileComponent } from './view-file/view-file.component';
import { ViewLongTextComponent } from './view-long-text/view-long-text.component';
import { ViewRichTextComponent } from './view-rich-text/view-rich-text.component';
import { ViewRelationComponent } from './view-relation/view-relation.component';
import { ViewMapComponent } from './view-map/view-map.component';
import { ViewSeparatorComponent } from './view-separator/view-separator.component';
import { ArrayVersionComponent } from './array-version/array-version.component';
import { ViewUserComponent } from './view-user/view-user.component';
import { ViewSecureTextComponent } from './view-secure-text/view-secure-text.component';
import { ViewRelationDataComponent } from './view-relation-data/view-relation-data.component';
import { ViewColOfObjsComponent } from '../collection-of-objects/view-col-of-objs/view-col-of-objs.component';
import { ColOfObjsGridCellModule } from '../collection-of-objects/col-of-objs-grid-cell/col-of-objs-grid-cell.module';
import { GridColumnFilterModule } from '../collection-of-objects/grid-column-filter/grid-column-filter.module';
import { ViewCollectionOfObjectsGridModule } from '../collection-of-objects/view-collection-of-objects-grid/view-collection-of-objects-grid.module';

@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    NgbModule,
    VersionModule,
    MapModule,
    PipesModule,
    DatePickerModule,
    PdfViewerModule,
    ColOfObjsGridCellModule,
    GridColumnFilterModule,
    ViewCollectionOfObjectsGridModule
  ],
  declarations: [
    ViewControlComponent,
    ViewArrayComponent,
    ViewTextComponent,
    ViewNumberComponent,
    ViewBooleanComponent,
    ViewDateComponent,
    ViewFileComponent,
    ViewLongTextComponent,
    ViewRichTextComponent,
    ViewRelationComponent,
    ViewMapComponent,
    ViewSeparatorComponent,
    ArrayVersionComponent,
    ViewUserComponent,
    ViewSecureTextComponent,
    ViewRelationDataComponent,
    ViewColOfObjsComponent
  ],
  exports: [
    ViewControlComponent,
    ViewArrayComponent
  ]
})
export class ViewControlModule { }
