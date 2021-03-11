import { Component, Input, OnInit } from '@angular/core';
import { Definition } from 'src/app/interfaces/definition';

@Component({
  selector: 'odp-interaction-data-view',
  templateUrl: './interaction-data-view.component.html',
  styleUrls: ['./interaction-data-view.component.scss']
})
export class InteractionDataViewComponent implements OnInit {

  @Input() definition: Definition;
  @Input() data: any;
  inputType: string;
  outputType: string;
  flowDirection: string;

  constructor() { }

  ngOnInit() {
    const self = this;
    self.typeVal();
  }

  get type() {
    const self = this;
    return self.definition.type;
  }

  typeVal() {
    const self = this;
    self.inputType = self.data.flowData.inputType;
    self.outputType = self.data.flowData.outputType ? self.data.flowData.outputType : 'API';
  }

  get dataStackTxnId() {
    const self = this;
    return self.data.dataStackTxnId;
  }

  get remoteTxnId() {
    const self = this;
    return self.data.remoteTxnId;
  }

  get partner() {
    const self = this;
    return self.data.flowData.partnerName;
  }

  get flowName() {
    const self = this;
    self.flowDirection = self.data.flowData.direction;
    return  self.data.flowData.flowName;
  }

  get flowStatus() {
    const self = this;
    return self.data.status;
  }

  get createdTime() {
    const self = this;
    return self.data.createTimestamp;
  }

  get duration() {
    const self = this;
    let createdTime;
    let completedTime;
    if (self.data.createTimestamp) {
      createdTime = new Date(self.data.createTimestamp).getTime();
    }
    if (self.data.completedTimestamp) {
      completedTime = new Date(self.data.completedTimestamp).getTime();
    }
    if (createdTime && completedTime) {
      const interval = Math.abs(completedTime - createdTime);
      if (interval < 1000) {
        return `${interval} ms`;
      } else if (interval > 1000) {
        return `${interval / 1000} secs`;
      }
    }
  }
}
