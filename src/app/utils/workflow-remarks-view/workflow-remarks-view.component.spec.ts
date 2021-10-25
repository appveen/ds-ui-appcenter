import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkflowRemarksViewComponent } from './workflow-remarks-view.component';

describe('WorkflowRemarksViewComponent', () => {
  let component: WorkflowRemarksViewComponent;
  let fixture: ComponentFixture<WorkflowRemarksViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WorkflowRemarksViewComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WorkflowRemarksViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
