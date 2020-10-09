import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewBooleanComponent } from './view-boolean.component';
import { AppService } from 'src/app/service/app.service';

describe('ViewBooleanComponent', () => {
  let component: ViewBooleanComponent;
  let fixture: ComponentFixture<ViewBooleanComponent>;
  let appService: AppService;;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ViewBooleanComponent],
      providers: [AppService],

    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewBooleanComponent);
    component = fixture.componentInstance;  
    appService = TestBed.get(AppService);
    component.definition = {
      camelCase: "booleanAttr",
      key: "booleanAttr",
      level: 0,
      path: "booleanAttr",
      properties: {
        dataKey: "booleanAttr",
        dataPath: "booleanAttr",
        fieldLength: 0,
        name: "booleanAttr",
        _typeChanged: "Boolean"
      },
      type: "Boolean",
      value: true
    };
    component.oldValue = {
      booleanAttr: true
    };
    component.newValue = {
      booleanAttr: false

    }
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  it('should return the old value of the path', () => {
    component.definition.path = 'booleanAttr';
    expect(component.oldVal).toEqual(true);
  })

  it('should return the new value of the path', () => {
    component.definition.path = 'booleanAttr';
    expect(component.newVal).toEqual(false);
  })
});
