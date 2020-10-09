import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ListUserViewComponent } from './list-user-view.component';

describe('ListUserViewComponent', () => {
  let component: ListUserViewComponent;
  let fixture: ComponentFixture<ListUserViewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ListUserViewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ListUserViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
