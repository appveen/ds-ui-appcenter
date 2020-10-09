import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkflowFilterComponent } from './workflow-filter.component';

describe('WorkflowFilterComponent', () => {
  let component: WorkflowFilterComponent;
  let fixture: ComponentFixture<WorkflowFilterComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WorkflowFilterComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WorkflowFilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
