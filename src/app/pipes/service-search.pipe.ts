import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'serviceSearch'
})
export class ServiceSearchPipe implements PipeTransform {

  transform(value: any, args?: any): any {
    if (!args) {
      return value;
    }
    return value.filter(_e => {
      for (const _i in _e) {
        if (_e.name && _e.name.toLowerCase().indexOf(args.toLowerCase()) > -1) {
          return _e;
        }
      }
    });
  }

}
