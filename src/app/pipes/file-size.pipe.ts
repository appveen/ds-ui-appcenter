import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filesize'
})
export class FileSizePipe implements PipeTransform {

  transform(value: any, args?: any): any {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    let temp = value;
    if (typeof value === 'string') {
      temp = parseInt(value, 10);
    }
    if (temp === 0) {
      return '0 Byte';
    }
    let index = 0;
    if (temp) {
      while (temp > 1024) {
        index++;
        temp = parseFloat(temp.toPrecision(4)) / 1024;
      }
    }

    return temp ? temp.toPrecision(4) + ' ' + sizes[index] : '';
  }

}
