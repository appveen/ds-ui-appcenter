import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { VersionComponent } from 'src/app/utils/version/version.component';

@NgModule({
  imports: [
    CommonModule,
    RouterModule
  ],
  declarations: [VersionComponent],
  exports: [VersionComponent]
})
export class VersionModule { }
