import { Component, OnInit } from '@angular/core';
import { ITooltipAngularComp } from 'ag-grid-angular';
import { ITooltipParams } from 'ag-grid-community';
import { Properties } from 'src/app/interfaces/definition';

import { AppService } from 'src/app/service/app.service';
import { CommonService } from 'src/app/service/common.service';

@Component({
  selector: 'odp-relation-tooltip',
  templateUrl: './relation-tooltip.component.html',
  styleUrls: ['./relation-tooltip.component.scss']
})
export class RelationTooltipComponent implements OnInit, ITooltipAngularComp {
  params: ITooltipParams;
  data: any;
  values: Array<any>;
  relatedServiceDefinition: any;
  dataKey: string;
  isSecuredField: boolean;
  definition: any;

  constructor(private appService: AppService, private commonService: CommonService) {
    const self = this;
    self.values = [];
  }

  ngOnInit() { }

  agInit(params: ITooltipParams): void {
    try {
      const self = this;
      self.params = params;
      self.data = params.api.getDisplayedRowAtIndex(params.rowIndex).data;
      self.definition = params.colDef.refData;
      self.dataKey = self.definition.dataKey;
      self.getServiceDetails(`/${self.definition.properties.relatedTo}`);
    } catch (e) {
      console.error(e);
    }
  }

  getServiceDetails(relatedSrvcDef) {
    const self = this;
    self.commonService.getService(relatedSrvcDef).then(
      result => {
        self.relatedServiceDefinition = result;
        const properties: Properties = self.definition.properties;
        if (!!properties.relatedViewFields?.length) {
          const temp = [];
          properties.relatedViewFields.forEach(element => {
            if (!!element.properties.dataPath) {
              const val = self.appService.getValue(element.properties.dataPath, self.params.data[self.params.column.colId]);
              const retVal = self.getValue(val, element.key);
              temp.push(retVal);
            } else {
              temp.push({
                name: element.properties.name,
                value: '**********'
              });
            }
          });
          self.values = [...temp];
        }
      },
      err => { }
    );
  }

  getHtmlContent(val: string) {
    return val.replace(/<\/.*>/g, '').replace(/<.*>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ');
  }

  getValue(value, key) {
    const self = this;
    let retValue;
    const relsrvcDef = self.relatedServiceDefinition.definition.find(e => e.properties.dataPath === key);

    if (!relsrvcDef && typeof value !== 'object') {
      retValue = {
        name: key,
        value
      }
    } else if (relsrvcDef && relsrvcDef.properties && relsrvcDef.properties.password) {
      retValue = {
        name: relsrvcDef.properties.name,
        value: value?.value,
        isSecuredField: true
      };
    } else if (relsrvcDef?.properties?.richText) {
      retValue = {
        name: relsrvcDef.properties.name,
        value: self.getHtmlContent(value)
      };
    } else if (relsrvcDef && relsrvcDef.properties && relsrvcDef.properties.dateType === 'date' && value) {
      let dateString = this.appService.getUTCString(value.rawData, value.tzInfo);
      retValue = {
        name: relsrvcDef.properties.name,
        value: dateString
      };
    } else if (relsrvcDef && relsrvcDef.properties && relsrvcDef.properties.dateType === 'datetime-local' && value) {
      let dateString = this.appService.getUTCString(value.rawData, value.tzInfo);
      retValue = {
        name: relsrvcDef.properties.name,
        value: dateString
      };
    } else if (
      relsrvcDef &&
      relsrvcDef.properties &&
      [relsrvcDef.properties._type, relsrvcDef.properties._typeChanged].includes('Boolean')
    ) {
      retValue = {
        name: relsrvcDef.properties.name,
        value: value
      };
    } else if (relsrvcDef && relsrvcDef.properties && [relsrvcDef.properties._type, relsrvcDef.properties._typeChanged].includes('File')) {
      retValue = {
        name: relsrvcDef.properties.name,
        value: value?.metadata?.filename
      };
    } else if (relsrvcDef && relsrvcDef.type === 'Geojson') {
      retValue = {
        name: relsrvcDef.properties.name,
        value: value?.userInput ? value.userInput : value?.formattedAddress,
      };
    } else if (relsrvcDef && relsrvcDef.type === 'User') {
      retValue = {
        name: relsrvcDef.properties.name,
        value: value?._id ? value._id : value
      };
    } else if (relsrvcDef) {
      retValue = {
        name: relsrvcDef?.properties?.name,
        value: value
      };
    }
    return retValue;
  }
}
