import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ListCurrencyViewComponent } from './list-currency-view.component';

describe('ListCurrencyViewComponent', () => {
  let component: ListCurrencyViewComponent;
  let fixture: ComponentFixture<ListCurrencyViewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ListCurrencyViewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ListCurrencyViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
