import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { AppService } from 'src/app/service/app.service';
import { Definition } from 'src/app/interfaces/definition';

@Component({
  selector: 'odp-view-control',
  templateUrl: './view-control.component.html',
  styleUrls: ['./view-control.component.scss']
})
export class ViewControlComponent implements OnInit {

  @Input() definition: Definition;
  @Input() data: any;
  @Input() originalData: any;
  @Input() isOriginalData: boolean;
  currencyType: string;
  showPassword: boolean;
  @Output() emitData: EventEmitter<any>;
  constructor(private appService: AppService) {
    const self = this;
    self.emitData = new EventEmitter();

  }

  ngOnInit() {
    const self = this;
  }

  selectRecord(data) {
    const self = this;
    self.emitData.emit({
      data: data,
      isOriginalData: self.isOriginalData,
      originalData: self.originalData
    });
  }

  getValue(key, obj) {
    const self = this;
    return self.appService.getValue(key, obj);
  }

  get searchFieldValue() {
    const self = this;
    let retVal;
    retVal = self.appService.getValue(self.definition.dataKey + '.' + self.definition.properties.relatedSearchField, self.data);
    return retVal;
  }
  get serviceId() {
    const self = this;
    return self.appService.serviceId;
  }

  get value() {
    const self = this;
    return self.appService.getValue(self.definition.dataKey, self.data);
  }

  get relSrvc() {
    const self = this;
    return self.definition.properties.relatedTo;
  }

  get currency() {
    const self = this;
    const props = Object.keys(self.definition.properties);
    const i = props.findIndex(e => e === 'currency');
    if (i > -1) {
      self.currencyType = self.definition.properties.currency;
    }
    return i > -1;
  }

  get type() {
    const self = this;
    return self.definition.type;
  }

  get longText() {
    const self = this;
    const props = Object.keys(self.definition.properties);
    const i = props.findIndex(e => e === 'longText');
    if (i > -1) {

    }
    return i > -1 && self.definition.properties.longText;
  }

  get richText() {
    const self = this;
    const props = Object.keys(self.definition.properties);
    const i = props.findIndex(e => e === 'richText');
    if (i > -1) {

    }
    return i > -1 && self.definition.properties.richText;
  }

  get checkbox() {
    const self = this;
    return self.definition.type === 'Checkbox';
  }

  get objectKeys() {
    const self = this;
    const temp = self.appService.getValue(self.definition.dataKey, self.data);
    if (typeof temp === 'object') {
      return Object.keys(temp).length;
    }
    return 0;
  }

  get dateType() {
    const self = this;
    return self.definition.properties.dateType;
  }

  get secureText() {
    const self = this;
    return self.definition.properties.password;
  }
}
