import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoadingPlaceholderComponent } from './loading-placeholder.component';

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [LoadingPlaceholderComponent],
  exports: [LoadingPlaceholderComponent]
})
export class LoadingPlaceholderModule { }
