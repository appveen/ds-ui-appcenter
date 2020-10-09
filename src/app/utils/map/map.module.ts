import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MapComponent } from 'src/app/utils/map/map.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

@NgModule({
  imports: [
    CommonModule,
    NgbModule
  ],
  declarations: [MapComponent],
  exports: [MapComponent]
})
export class MapModule { }
