import { Component, OnInit, Input } from '@angular/core';
import { AppService } from 'src/app/service/app.service';

@Component({
  selector: 'odp-view-date',
  templateUrl: './view-date.component.html',
  styleUrls: ['./view-date.component.scss']
})
export class ViewDateComponent implements OnInit {

  @Input() definition: any;
  @Input() value: any;
  @Input() oldValue: any;
  @Input() newValue: any;
  @Input() workflowDoc: any;


  constructor(private appService: AppService) {
    const self = this;
  }

  ngOnInit() {
  }


  get isCreated() {
    const self = this;
    let retValue = false;
    if (self.newVal && !self.oldVal) {
      retValue = true;
    }
    return retValue;
  }

  get isUpdated() {
    const self = this;
    let retValue = false;
    if (self.newVal && self.oldVal && self.newVal !== self.oldVal) {
      retValue = true;
    } else if (!self.newVal && self.oldVal) {
      retValue = true;
    }
    return retValue;
  }
  get oldVal() {
    const self = this;
    return self.appService.getValue(self.definition.path, self.oldValue);
  }
  get newVal() {
    const self = this;
    return self.appService.getValue(self.definition.path, self.newValue);
  }

}
