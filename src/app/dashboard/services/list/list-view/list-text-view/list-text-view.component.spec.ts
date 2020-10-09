import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ListTextViewComponent } from './list-text-view.component';

describe('ListTextViewComponent', () => {
  let component: ListTextViewComponent;
  let fixture: ComponentFixture<ListTextViewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ListTextViewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ListTextViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
