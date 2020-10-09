import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UserViewComponent } from "./user-view.component";

@NgModule({
  declarations: [UserViewComponent],
  imports: [
    CommonModule
  ],
  exports: [UserViewComponent]
})
export class UserViewModule { }
