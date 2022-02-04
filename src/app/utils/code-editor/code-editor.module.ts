import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';

import { CodeEditorComponent } from './code-editor.component';



@NgModule({
  declarations: [CodeEditorComponent],
  imports: [
    CommonModule,
    HttpClientModule
  ],
  exports: [
    CodeEditorComponent
  ]
})
export class CodeEditorModule { }
