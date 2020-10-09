import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { OdpSelectDdComponent } from './odp-select-dd.component';

describe('OdpSelectDdComponent', () => {
  let component: OdpSelectDdComponent;
  let fixture: ComponentFixture<OdpSelectDdComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ OdpSelectDdComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OdpSelectDdComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
