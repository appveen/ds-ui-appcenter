import { Injectable, EventEmitter } from '@angular/core';
import * as _ from 'lodash';

@Injectable({
  providedIn: 'root'
})
export class ListAgGridService {

  selectAll: EventEmitter<any>;
  selectedSavedView: any;
  inlineFilterActive: any;
  constructor() {
    const self = this;
    self.selectAll = new EventEmitter();
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
          if (item.key !== '._id' && item.key !== e2.properties.relatedSearchField) {
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
        def.forEach((element,index) => {
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
}
