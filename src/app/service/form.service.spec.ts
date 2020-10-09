import { TestBed, inject } from '@angular/core/testing';

import { FormService } from 'src/app/service/form.service';

describe('FormService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [FormService]
    });
  });

  it('should be created', inject([FormService], (service: FormService) => {
    expect(service).toBeTruthy();
  }));
});
