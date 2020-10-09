import { Pipe, PipeTransform } from '@angular/core';

@Pipe({name: 'searchFilter'})
export class WfFilterPipe implements PipeTransform {
  transform(value: any, search: any): any {
    if ( !search ) {
      return value;
    }
    const filterName = value.filter(v => {
      if ( !v ) {
        return;
      } else {
        if ( search ) {
          return v.name.toLowerCase().indexOf(search.toLowerCase()) !== -1;
        }
      }
    });
    return filterName;
  }
}
