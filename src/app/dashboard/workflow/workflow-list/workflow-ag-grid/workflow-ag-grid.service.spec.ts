import { TestBed } from '@angular/core/testing';

import { WorkflowAgGridService } from './workflow-ag-grid.service';

describe('WorkflowAgGridService', () => {
  let service: WorkflowAgGridService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WorkflowAgGridService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
