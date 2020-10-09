import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RoundCheckComponent } from './round-check.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule
  ],
  declarations: [RoundCheckComponent],
  exports: [RoundCheckComponent]
})
export class RoundCheckModule { }
