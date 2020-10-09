import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'orderBy'
})
export class OrderByPipe implements PipeTransform {

  transform(value: Array<any>, args?: any): any {
    if (value) {
      if (args) {
        return value.sort((a, b) => {
          if (a[args] > b[args]) {
            return 1;
          } else if (a[args] < b[args]) {
            return -1;
          } else {
            return 0;
          }
        });
      } else {
        return value.sort();
      }
    }
    return [];
  }

}
