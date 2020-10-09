import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AgGridCellComponent } from './ag-grid-cell.component';

describe('AgGridCellComponent', () => {
  let component: AgGridCellComponent;
  let fixture: ComponentFixture<AgGridCellComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AgGridCellComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AgGridCellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
