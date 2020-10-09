import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ColOfObjsGridCellComponent } from './col-of-objs-grid-cell.component';

describe('ColOfObjsGridCellComponent', () => {
  let component: ColOfObjsGridCellComponent;
  let fixture: ComponentFixture<ColOfObjsGridCellComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ColOfObjsGridCellComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ColOfObjsGridCellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
