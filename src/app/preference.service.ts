import { Injectable } from '@angular/core';
import { CommonService, GetOptions } from './service/common.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PreferenceService {

  constructor(private commonService: CommonService) { }

  getPrefrences(key: string, type: string[]) {
    const self = this;
    const options: GetOptions = {
      filter: {
        userId: self.commonService.userDetails._id,
        type: { $in: type },
        key
      }
    };
    return self.commonService.get('user', '/data/preferences', options);
  }

  setPrefrences(key: string, type: string, preferenceId: string, data: any) {
    const self = this;
    let response: Observable<any>;
    const payload = {
      userId: self.commonService.userDetails._id,
      type,
      key,
      value: JSON.stringify(data)
    };
    if (preferenceId) {
      response = self.commonService.put('user', '/data/preferences/' + preferenceId, payload);
    } else {
      response = self.commonService.post('user', '/data/preferences/', payload);
    }
    return response;
  }
}
