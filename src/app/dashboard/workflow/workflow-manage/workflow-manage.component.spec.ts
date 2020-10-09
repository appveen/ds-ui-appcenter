import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkflowManageComponent } from './workflow-manage.component';

describe('WorkflowManageComponent', () => {
  let component: WorkflowManageComponent;
  let fixture: ComponentFixture<WorkflowManageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WorkflowManageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WorkflowManageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
