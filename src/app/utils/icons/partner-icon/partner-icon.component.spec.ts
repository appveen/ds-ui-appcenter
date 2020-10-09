import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PartnerIconComponent } from './partner-icon.component';

describe('PartnerIconComponent', () => {
  let component: PartnerIconComponent;
  let fixture: ComponentFixture<PartnerIconComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PartnerIconComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PartnerIconComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
