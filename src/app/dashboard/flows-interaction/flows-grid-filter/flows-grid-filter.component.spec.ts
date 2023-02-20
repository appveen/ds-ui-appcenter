import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FlowsGridFilterComponent } from './flows-grid-filter.component';

describe('FlowsGridFilterComponent', () => {
  let component: FlowsGridFilterComponent;
  let fixture: ComponentFixture<FlowsGridFilterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FlowsGridFilterComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FlowsGridFilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
