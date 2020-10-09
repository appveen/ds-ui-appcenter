import { Component, Input, OnInit } from '@angular/core';
import { Definition } from 'src/app/interfaces/definition';
import { AppService } from 'src/app/service/app.service';

@Component({
  selector: 'odp-list-location-view',
  templateUrl: './list-location-view.component.html',
  styleUrls: ['./list-location-view.component.scss']
})
export class ListLocationViewComponent implements OnInit {

  @Input() value;
  @Input() definition: Definition;
  formattedAddress: string;
  url: string;
  constructor(private appService: AppService) {
    const self = this;
    self.formattedAddress = 'N.A.';
  }

  ngOnInit() {
    const self = this;
    if (self.value && self.value.formattedAddress) {
      self.formattedAddress = self.value.formattedAddress;
    } else if (self.value && self.value.userInput) {
      self.formattedAddress = self.value.userInput;
    }
    if (self.value && self.value.geometry && self.value.geometry.coordinates) {
      self.url = `https://www.google.co.in/maps?q=MyLoc@${self.value.geometry.coordinates[1]},${self.value.geometry.coordinates[0]}`;
    }
  }

  toolTipDir(dataKey) {
    const self = this;
    const col = self.appService.dataGridColumns.find(e => e.dataKey === dataKey);
    if (col.sequenceNo === 2) {
      return 'top';
    } else {
      return 'left';
    }
  }
}
