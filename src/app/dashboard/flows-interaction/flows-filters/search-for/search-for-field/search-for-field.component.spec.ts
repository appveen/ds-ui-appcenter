import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SearchForFieldComponent } from './search-for-field.component';

describe('SearchForFieldComponent', () => {
  let component: SearchForFieldComponent;
  let fixture: ComponentFixture<SearchForFieldComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SearchForFieldComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SearchForFieldComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
