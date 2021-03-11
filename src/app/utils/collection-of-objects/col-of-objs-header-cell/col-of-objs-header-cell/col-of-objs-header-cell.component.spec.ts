import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ColOfObjsHeaderCellComponent } from './col-of-objs-header-cell.component';

describe('ColOfObjsHeaderCellComponent', () => {
  let component: ColOfObjsHeaderCellComponent;
  let fixture: ComponentFixture<ColOfObjsHeaderCellComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ColOfObjsHeaderCellComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ColOfObjsHeaderCellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
