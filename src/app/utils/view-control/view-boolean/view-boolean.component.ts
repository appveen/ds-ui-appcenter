import { Component, OnInit, Input } from '@angular/core';
import { AppService } from 'src/app/service/app.service';

@Component({
  selector: 'odp-view-boolean',
  templateUrl: './view-boolean.component.html',
  styleUrls: ['./view-boolean.component.scss']
})
export class ViewBooleanComponent implements OnInit {

  @Input() definition: any;
  @Input() value: any;
  @Input() oldValue: any;
  @Input() newValue: any;
  @Input() workflowDoc: any;
  hasOldValue: boolean;
  hasNewValue: boolean;
  constructor(private appService: AppService) { }

  ngOnInit() {
    const self = this;
  }

  get isCreated(){
    const self =this;
    let retValue =false;
    if(typeof self.newVal === 'boolean' && typeof self.oldVal !== 'boolean'){
      retValue =true;
    }
    return retValue;
  }

  get isUpdated(){
    const self =this;
    let retValue =false;
    if(typeof self.newVal === 'boolean' && typeof self.oldVal === 'boolean' && self.newVal !== self.oldVal){
      retValue =true;
    }
    return retValue;
  }

  get oldVal() {
    const self = this;
    const temp = self.appService.getValue(self.definition.path, self.oldValue);
    return temp;
  }
  get newVal() {
    const self = this;
    const temp = self.appService.getValue(self.definition.path, self.newValue);
    return temp;
  }
}
