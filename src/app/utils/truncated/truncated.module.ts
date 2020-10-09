import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { TruncatedDirective, TruncatedTooltipComponent } from './truncated.directive';

@NgModule({
  imports: [
    CommonModule,
    NgbModule
  ],
  declarations: [
    TruncatedDirective,
    TruncatedTooltipComponent
  ],
  exports: [TruncatedDirective],
  entryComponents: [TruncatedTooltipComponent]
})
export class TruncatedModule { }
