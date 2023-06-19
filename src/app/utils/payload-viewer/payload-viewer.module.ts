import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PayloadViewerComponent } from './payload-viewer.component';
import { PayloadViewObjectComponent } from './payload-view-object/payload-view-object.component';
import { PayloadViewFieldComponent } from './payload-view-field/payload-view-field.component';
import { PayloadViewArrayComponent } from './payload-view-array/payload-view-array.component';



@NgModule({
  declarations: [
    PayloadViewerComponent,
    PayloadViewObjectComponent,
    PayloadViewFieldComponent,
    PayloadViewArrayComponent
  ],
  imports: [
    CommonModule
  ],
  exports: [PayloadViewerComponent]
})
export class PayloadViewerModule { }
