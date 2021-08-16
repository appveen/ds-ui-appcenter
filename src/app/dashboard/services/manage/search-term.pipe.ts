import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'searchState'
})
export class SearchTermPipe implements PipeTransform {

  transform(value: Array<any>, ...args: any[]): any {
    if (value && args && args[0]) {
      return value.filter(e => e.toLowerCase().indexOf(args[0].toLowerCase()) > -1);
    }
    return value || [];
  }

}
