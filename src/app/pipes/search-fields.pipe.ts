import { Pipe, PipeTransform } from '@angular/core';
import * as _ from 'lodash';

@Pipe({
  name: 'searchFields'
})
export class SearchFieldsPipe implements PipeTransform {

  transform(value: any, ...args: unknown[]): unknown {
    const searchTerm: string = args[0] as string;
    if (!value) {
      return [];
    }
    if (!searchTerm || !searchTerm.trim()) {
      return value;
    }
    return value.filter((e: any) => {
      let flag = false;
      if (e.properties.name) {
        flag = _.lowerCase(e.properties.name).indexOf(searchTerm) > -1;
      }
      if (e.properties.label && !flag) {
        flag = _.lowerCase(e.properties.label).indexOf(searchTerm) > -1;
      }
      return flag;
    });
  }

}
