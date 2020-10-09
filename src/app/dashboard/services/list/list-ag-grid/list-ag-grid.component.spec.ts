import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ListAgGridComponent } from './list-ag-grid.component';

describe('ListAgGridComponent', () => {
  let component: ListAgGridComponent;
  let fixture: ComponentFixture<ListAgGridComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ListAgGridComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ListAgGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
