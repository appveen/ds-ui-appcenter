import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'toArray'
})
export class ToArrayPipe implements PipeTransform {

  transform(value: any, args?: any): any {
    const temp = [];
    Object.keys(value).forEach(key => {
      temp.push({
        key: key,
        value: value[key]
      });
    });
    return temp;
  }

}
