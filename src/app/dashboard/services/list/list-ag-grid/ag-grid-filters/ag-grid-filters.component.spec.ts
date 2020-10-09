import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AgGridFiltersComponent } from './ag-grid-filters.component';

describe('AgGridFiltersComponent', () => {
  let component: AgGridFiltersComponent;
  let fixture: ComponentFixture<AgGridFiltersComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AgGridFiltersComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AgGridFiltersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
