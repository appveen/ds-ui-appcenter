import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkflowRespondViewComponent } from './workflow-respond-view.component';

describe('WorkflowRespondViewComponent', () => {
  let component: WorkflowRespondViewComponent;
  let fixture: ComponentFixture<WorkflowRespondViewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WorkflowRespondViewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WorkflowRespondViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
