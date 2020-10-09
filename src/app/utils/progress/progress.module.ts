import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProgressComponent } from 'src/app/utils/progress/progress.component';

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [ProgressComponent],
  exports: [ProgressComponent]
})
export class ProgressModule { }
