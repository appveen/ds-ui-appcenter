import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ListLocationViewComponent } from './list-location-view.component';

describe('ListLocationViewComponent', () => {
  let component: ListLocationViewComponent;
  let fixture: ComponentFixture<ListLocationViewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ListLocationViewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ListLocationViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
