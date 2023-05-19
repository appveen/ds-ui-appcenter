import { Component, OnInit, Input } from '@angular/core';
import * as moment from 'moment';
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
  dateString: string;
  timezone: string;
  constructor(private appService: AppService) {
  }

  ngOnInit() {
    if (this.value && this.value.rawData) {
      this.dateString = this.appService.getUTCString(this.value.rawData, this.value.tzInfo)
      this.timezone = this.value.tzInfo;
    }
    if (this.definition.value && this.definition.value.rawData) {
      this.dateString = this.appService.getUTCString(this.definition.value.rawData, this.definition.value.tzInfo)
      this.timezone = this.definition.value.tzInfo;
    }
    if (this.value && this.definition.type === 'Date') {
      this.dateString = this.appService.getUTCString(this.value, this.definition?.properties?.defaultTimezone)
      this.timezone = this.definition?.properties?.defaultTimezone;
    }
    if (this.definition.value && this.definition.type === 'Date') {
      this.dateString = this.appService.getUTCString(this.definition.value, this.definition?.properties?.defaultTimezone)
      this.timezone = this.definition?.properties?.defaultTimezone;
    }
  }


  get isCreated() {
    let retValue = false;
    if (this.newVal && !this.oldVal) {
      retValue = true;
    }
    return retValue;
  }

  get isUpdated() {
    let retValue = false;
    if (this.newVal && this.oldVal && this.newVal !== this.oldVal) {
      retValue = true;
    } else if (!this.newVal && this.oldVal) {
      retValue = true;
    }
    return retValue;
  }
  get oldVal() {
    return this.appService.getValue(this.definition.path, this.oldValue);
  }
  get newVal() {
    return this.appService.getValue(this.definition.path, this.newValue);
  }

  formatDate(value) {
    return moment(value).format('dddd, LL')
  }

}
