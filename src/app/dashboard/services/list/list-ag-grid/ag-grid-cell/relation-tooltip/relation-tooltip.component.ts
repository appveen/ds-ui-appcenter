import { Component, OnInit } from '@angular/core';
import { ITooltipAngularComp } from 'ag-grid-angular';
import { ITooltipParams } from 'ag-grid-community';

import { AppService } from 'src/app/service/app.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'odp-relation-tooltip',
  templateUrl: './relation-tooltip.component.html',
  styleUrls: ['./relation-tooltip.component.scss']
})
export class RelationTooltipComponent implements OnInit, ITooltipAngularComp {

  params: ITooltipParams;
  data: any;
  relatedViewFields: Array<any>;
  dataKey: string;
  isSecuredField: boolean;
  constructor(private appService: AppService) {
    const self = this;
    self.relatedViewFields = [];
  }

  ngOnInit() {
    const self = this;

  }

  agInit(params: ITooltipParams): void {
    try {
      const self = this;
      self.params = params;
      self.data = params.api.getDisplayedRowAtIndex(params.rowIndex).data;
      const definition = params.colDef.refData;
      self.dataKey = definition.dataKey;
      self.relatedViewFields = definition.properties.relatedViewFields;
      if (self.relatedViewFields && self.relatedViewFields.length > 0) {
        self.relatedViewFields.forEach((e) => {
          e.value = self.appService.getValue(self.dataKey + '.' + e.key, self.data);
          if (typeof e.value === 'object') {
            if (e.value.checksum) {
              e.value = e.value.value
              e.isSecuredField = true;
            }
            else if (e.value.metadata) {
              e.value = e.value.metadata.file
            }
            else if (e.value.userInput || e.value.formattedAddress) {
              e.value = e.value.userInput ? e.value.userInput : e.value.formattedAddress
            }

          };
        });
      }
    } catch (e) {
      console.error(e);
    }
  }

}
