import { TestBed, async, inject } from '@angular/core/testing';

import { WorkflowGuard } from './workflow.guard';

describe('WorkflowGuard', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [WorkflowGuard]
    });
  });

  it('should ...', inject([WorkflowGuard], (guard: WorkflowGuard) => {
    expect(guard).toBeTruthy();
  }));
});
