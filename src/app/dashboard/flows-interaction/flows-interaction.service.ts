import { Injectable } from '@angular/core';
import * as _ from 'lodash';

@Injectable({
  providedIn: 'root'
})
export class FlowsInteractionService {

  constructor() { }

  getContentType(contentType: string) {
    if (contentType.startsWith('multipart/form-data')) {
      return 'File'
    }
    if (contentType.startsWith('application/json') || contentType.startsWith('text/json')) {
      return 'JSON'
    }
    if (contentType.startsWith('application/xml') || contentType.startsWith('text/xml')) {
      return 'XML'
    }
  }

  getStatusClass(item: any) {
    if (_.lowerCase(item.status) == 'pending') {
      return 'text-warning'
    } else if (_.lowerCase(item.status) == 'success') {
      return 'text-success'
    } else if (_.lowerCase(item.status) == 'error') {
      return 'text-danger'
    } else {
      return 'text-warning'
    }
  }
}
