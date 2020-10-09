import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ListGridFilterComponent } from './list-grid-filter.component';

describe('ListGridFilterComponent', () => {
  let component: ListGridFilterComponent;
  let fixture: ComponentFixture<ListGridFilterComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ListGridFilterComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ListGridFilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
