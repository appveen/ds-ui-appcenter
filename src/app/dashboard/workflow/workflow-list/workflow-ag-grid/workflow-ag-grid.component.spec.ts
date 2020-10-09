import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkflowAgGridComponent } from './workflow-ag-grid.component';

describe('WorkflowAgGridComponent', () => {
  let component: WorkflowAgGridComponent;
  let fixture: ComponentFixture<WorkflowAgGridComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WorkflowAgGridComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WorkflowAgGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
