import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { BookmarkFrameComponent } from './bookmark-frame.component';
import { TruncatedModule } from 'src/app/utils/truncated/truncated.module';
import { FormsModule } from '@angular/forms';

const routes: Routes = [
  { path: '', pathMatch: 'full', component: BookmarkFrameComponent },
  { path: ':id', component: BookmarkFrameComponent },
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    TruncatedModule,
    NgbModule,
    FormsModule
  ],
  declarations: [BookmarkFrameComponent],
  exports: [RouterModule]
})
export class BookmarkFrameModule { }
