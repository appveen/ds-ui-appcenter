import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filterIntegration'
})
export class FilterIntegrationPipe implements PipeTransform {

  transform(value: any, args?: any): any {
    if (!args || args === 'All Integrations') {
      return value;
    }
    return value.filter(_e => {
      if (_e.name && _e.name === args) {
        return _e;
      }
    });
  }
}
