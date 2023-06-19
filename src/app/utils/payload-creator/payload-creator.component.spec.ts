import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PayloadCreatorComponent } from './payload-creator.component';

describe('PayloadCreatorComponent', () => {
  let component: PayloadCreatorComponent;
  let fixture: ComponentFixture<PayloadCreatorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PayloadCreatorComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PayloadCreatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
