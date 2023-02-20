import { Injectable } from '@angular/core';
import * as _ from 'lodash';
import * as moment from 'moment';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FlowsInteractionService {
  filterSubject: Subject<any> = new Subject()
  filter: any;
  sortModel: any;
  inlineFilterActive: any;
  selectedSavedView: any;

  constructor() { }

  onFloatingFilterChange(filter) {
    this.filter = filter;
    this.filterSubject.next(this.filter)
  }

  getSelect(definition) {
    const self = this;
    let key = '';
    let tempArr = [];
    definition.filter(e1 => e1.show && e1.key !== '_checkbox').forEach(e2 => {
      if (e2.type === 'Relation' || e2.type === 'User') {
        let temp = [];
        temp.push(e2.key + '._id');
        temp.push(e2.key + '.' + e2.properties.relatedSearchField);
        e2.properties.relatedViewFields.forEach(item => {
          if (item.key !== '_id' && item.key !== e2.properties.relatedSearchField) {
            temp.push(e2.key + '.' + item.key);
          }
        });
        temp = _.uniq(temp);
        key = temp.join(',');
      } else if (e2.type === 'Geojson') {
        key = e2.key + '.formattedAddress,' + e2.key + '.userInput';
      } else if (e2.type === 'File') {
        key = e2.key + '.metadata.filename,' + e2.key + '._id,' + e2.key + '.filename,' + e2.key + '.contentType';
      } else if (e2.type === 'Object') {
        tempArr = tempArr.concat(self.getSelect(e2.definition));
      } else if (e2.type === 'Array' && e2.definition && e2.definition.length > 0) {
        const def = e2.definition;
        def.forEach((element, index) => {
          def[index].key = element.dataKey.replace('._self', '');
        });
        tempArr = tempArr.concat(self.getSelect(def));
      } else {
        key = e2.key;
      }
      tempArr.push(key);
    });
    tempArr.push('_metadata.workflow');
    return _.uniq(tempArr);
  }

  setSortModel(model) {
    this.sortModel == model
  }

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
