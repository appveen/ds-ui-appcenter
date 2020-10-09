import { TestBed, async, inject } from '@angular/core/testing';

import { ManageGuard } from './manage.guard';

describe('ManageGuard', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ManageGuard]
    });
  });

  it('should ...', inject([ManageGuard], (guard: ManageGuard) => {
    expect(guard).toBeTruthy();
  }));
});
