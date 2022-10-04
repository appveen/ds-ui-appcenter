import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FlowNodeViewComponent } from './flow-node-view.component';

describe('FlowNodeViewComponent', () => {
  let component: FlowNodeViewComponent;
  let fixture: ComponentFixture<FlowNodeViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FlowNodeViewComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FlowNodeViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
