import { TestBed } from '@angular/core/testing';

import { SecureFileService } from './secure-file.service';

describe('SecureFileService', () => {
  let service: SecureFileService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SecureFileService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
