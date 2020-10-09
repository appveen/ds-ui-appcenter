import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ListLongtxtViewComponent } from './list-longtxt-view.component';

describe('ListLongtxtViewComponent', () => {
  let component: ListLongtxtViewComponent;
  let fixture: ComponentFixture<ListLongtxtViewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ListLongtxtViewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ListLongtxtViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
