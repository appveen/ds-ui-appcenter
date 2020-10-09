import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { FieldTypeComponent } from './field-type.component';



@NgModule({
  declarations: [FieldTypeComponent],
  imports: [
    CommonModule,
    NgbModule
  ],
  exports: [
    FieldTypeComponent
  ],
})
export class FieldTypeModule { }
