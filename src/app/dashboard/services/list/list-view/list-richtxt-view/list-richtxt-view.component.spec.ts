import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ListRichtxtViewComponent } from './list-richtxt-view.component';

describe('ListRichtxtViewComponent', () => {
  let component: ListRichtxtViewComponent;
  let fixture: ComponentFixture<ListRichtxtViewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ListRichtxtViewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ListRichtxtViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
