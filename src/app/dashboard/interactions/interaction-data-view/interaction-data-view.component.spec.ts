import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { InteractionDataViewComponent } from './interaction-data-view.component';

describe('InteractionDataViewComponent', () => {
  let component: InteractionDataViewComponent;
  let fixture: ComponentFixture<InteractionDataViewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ InteractionDataViewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InteractionDataViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
