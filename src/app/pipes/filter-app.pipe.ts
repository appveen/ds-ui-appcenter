import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filterApp'
})
export class FilterAppPipe implements PipeTransform {

  transform(value: any, args?: any): any {
    if (args && Array.isArray(value)) {
      const filterKeys = args.toLowerCase();
      return value.filter(item => item._id.toLowerCase().includes(filterKeys));
    } else {
      return value;
    }
  }

}
