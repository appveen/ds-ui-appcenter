import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FlowsFiltersComponent } from './flows-filters.component';

describe('FlowsFiltersComponent', () => {
  let component: FlowsFiltersComponent;
  let fixture: ComponentFixture<FlowsFiltersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FlowsFiltersComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FlowsFiltersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
