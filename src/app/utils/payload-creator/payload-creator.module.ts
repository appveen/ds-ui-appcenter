import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PayloadCreatorComponent } from './payload-creator.component';
import { PayloadObjectComponent } from './payload-object/payload-object.component';
import { PayloadArrayComponent } from './payload-array/payload-array.component';
import { PayloadFieldComponent } from './payload-field/payload-field.component';
import { FormsModule } from '@angular/forms';



@NgModule({
  declarations: [
    PayloadCreatorComponent,
    PayloadObjectComponent,
    PayloadArrayComponent,
    PayloadFieldComponent
  ],
  imports: [
    CommonModule,
    FormsModule
  ],
  exports: [
    PayloadCreatorComponent
  ]
})
export class PayloadCreatorModule { }
