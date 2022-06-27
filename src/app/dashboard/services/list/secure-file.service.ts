import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SecureFileService {

  private fileIdSource = new BehaviorSubject(null);
  fileId = this.fileIdSource.asObservable();

  constructor() { }

  changeFileId(fileId: string) {
    this.fileIdSource.next(fileId)
  }

}
