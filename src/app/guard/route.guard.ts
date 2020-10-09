import { Injectable } from '@angular/core';
import { CanDeactivate} from '@angular/router';
import { Observable } from 'rxjs';

export interface CanComponentDeactivate {
  canDeactivate: () => Observable<boolean> | Promise<boolean> | boolean;
}
@Injectable()
export class RouteGuard implements CanDeactivate<any> {
  canDeactivate(component: CanComponentDeactivate) {
    if (component) {
      return component.canDeactivate ? component.canDeactivate() : true;
    } else {
      return true;
    }
  }
}
