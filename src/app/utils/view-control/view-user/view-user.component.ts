import { Component, OnInit, Input } from '@angular/core';
import { AppService } from 'src/app/service/app.service';
import { Properties } from 'src/app/interfaces/definition';

@Component({
  selector: 'odp-view-user',
  templateUrl: './view-user.component.html',
  styleUrls: ['./view-user.component.scss']
})
export class ViewUserComponent implements OnInit {

  @Input() definition: any;
  @Input() value: any;
  @Input() oldValue: any;
  @Input() newValue: any;
  @Input() workflowDoc: any;

  values: Array<any>;
  relationLink: string;
  constructor(private appService: AppService) {
    const self = this;
    self.values = [];
  }

  ngOnInit() {
    const self = this;
    self.getValueToShow();
  }

  getValueToShow() {
    const self = this;
    if (self.definition.value) {
      const properties: Properties = self.definition.properties;
      if (!properties.relatedViewFields || properties.relatedViewFields.length === 0) {
        self.showSearchOnField();
      } else {
        properties.relatedViewFields.forEach((element) => {
          const temp = self.appService
            .getValue(self.definition.key + '.' + element.key, self.definition.value);
          if (temp) {
            self.values.push(temp);
          } else {
            self.values.push(self.appService.getValue(element.key, self.definition.value));
          }
        });
      }
      self.values = self.values.filter(e => e).map(val => {
        return val;
      });
      if (!self.values.length) {
        self.showSearchOnField();
      }
    }
  }

  showSearchOnField() {
    const self = this;
    const properties: Properties = self.definition.properties;
    const temp = self.appService
      .getValue(self.definition.key + '.' + properties.relatedSearchField, self.definition.value);
    if (temp) {
      self.values.push(temp);
    } else {
      self.values.push(self.appService.getValue(properties.relatedSearchField, self.definition.value));
    }
  }

  get isCreated(){
    const self =this;
    let retValue =false;
    if(self.newVal && !self.oldVal){
      retValue =true;
    }
    return retValue;
  }

  get isUpdated(){
    const self =this;
    let retValue =false;
    if(self.newVal && self.oldVal && self.newVal._id &&  self.oldVal._id && self.newVal._id !== self.oldVal._id){
      retValue =true;
    }else if (!self.newVal && self.oldVal) {
      retValue = true;
    }
    return retValue;
  }

  get oldVal() {
    const self = this;
    let oldVal;
    if (self.definition) {
      oldVal = self.appService.getValue(self.definition.path, self.oldValue);
    }
    return oldVal;
  }
  get newVal() {
    const self = this;
    let newVal;
    if (self.definition) {
      newVal = self.appService.getValue(self.definition.path, self.newValue);
    }
    return newVal;

  }
}
