import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PdfViewerModule } from 'ng2-pdf-viewer';

import { FileViewComponent } from "./file-view.component";

@NgModule({
  declarations: [FileViewComponent],
  imports: [
    CommonModule,
    PdfViewerModule
  ],
  exports: [FileViewComponent]
})
export class FileViewModule { }
