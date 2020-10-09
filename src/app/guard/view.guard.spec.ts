import { TestBed, async, inject } from '@angular/core/testing';

import { ViewGuard } from './view.guard';

describe('ViewGuard', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ViewGuard]
    });
  });

  it('should ...', inject([ViewGuard], (guard: ViewGuard) => {
    expect(guard).toBeTruthy();
  }));
});
