import { Injectable } from '@angular/core';
import * as _ from 'lodash';
import * as moment from 'moment';

@Injectable({
  providedIn: 'root'
})
export class FlowsInteractionService {

  constructor() { }

  getContentType(contentType: string) {
    if (!contentType) {
      return 'JSON'
    }
    if (contentType.startsWith('multipart/form-data')) {
      return 'File'
    }
    if (contentType.startsWith('application/json') || contentType.startsWith('text/json')) {
      return 'JSON'
    }
    if (contentType.startsWith('application/xml') || contentType.startsWith('text/xml')) {
      return 'XML'
    }
  }

  getStatusClass(item: any) {
    if (_.lowerCase(item.status) == 'pending') {
      return 'text-warning'
    } else if (_.lowerCase(item.status) == 'success') {
      return 'text-success'
    } else if (_.lowerCase(item.status) == 'error') {
      return 'text-danger'
    } else {
      return 'text-warning'
    }
  }

  getStatusBadgeClass(item: any) {
    if (_.lowerCase(item.status) == 'pending') {
      return 'badge-warning'
    } else if (_.lowerCase(item.status) == 'success') {
      return 'badge-success'
    } else if (_.lowerCase(item.status) == 'error') {
      return 'badge-danger'
    } else {
      return 'badge-warning'
    }
  }

  getStatusClassSuffix(item: any) {
    if (_.lowerCase(item.status) == 'pending') {
      return 'warning'
    } else if (_.lowerCase(item.status) == 'success') {
      return 'success'
    } else if (_.lowerCase(item.status) == 'error') {
      return 'danger'
    } else {
      return 'warning'
    }
  }

  getDuration(startTime: string, endTime: string) {
    let text = '';
    if (startTime && endTime) {
      let startT = new Date(startTime).getTime();
      let endT = new Date(endTime).getTime();
      const duration = moment.duration(endT - startT);
      text = duration.minutes() + ' min, ' + duration.seconds() + ' sec, ' + duration.milliseconds() + ' ms';
      if (duration.hours() > 0) {
        text = `${duration.hours()} hr, ` + text;
      }
      return text;
    }
    return '-';
  }
}
