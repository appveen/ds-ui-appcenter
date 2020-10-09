import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewUserComponent } from './view-user.component';
import { AppService } from 'src/app/service/app.service';
import JasmineExpect from 'jasmine-expect';
describe('ViewUserComponent', () => {
  let component: ViewUserComponent;
  let fixture: ComponentFixture<ViewUserComponent>;
  let appService: AppService;;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ViewUserComponent],
      providers: [AppService],

    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewUserComponent);
    component = fixture.componentInstance;
    appService = TestBed.get(AppService);
    component.definition = {
      camelCase: "usr",
      key: "usr",
      level: 0,
      path: "usr",
      properties: {
        dataKey: "usr",
        dataPath: "usr",
        deleteAction: "restrict",
        fieldLength: 0,
        name: "usr",
        relatedSearchField: "username",
        relatedViewFields: [],
        _typeChanged: "User",
        type: "User"
      },
      value: {
        basicDetails:
        {
          name: "Jugnu",
          phone: null,
          alternateEmail: null
        },
        username: "jugnu@appveen.com",
        _id: "USR1389"
      }
    };
    component.newValue = {
      usr: {
        _id: "USR1380"
      }
    };

    component.oldValue = {
      usr: {
        _id: "USR1381"
      }

    }
    // fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });


  it('should push the relatedSearchField values to the values array', () => {
    component.values = [];

    spyOn(appService, 'getValue').and.returnValue(null);
    component.showSearchOnField();
    expect(component.values.length).toBeGreaterThan(0);
  })


  it('should push the relatedSearchField values to the values array', () => {
    component.values = [];
    component.definition = {
      camelCase: "usr",
      key: "usr",
      level: 0,
      path: "usr",
      properties: {
        dataKey: "usr",
        dataPath: "usr",
        deleteAction: "restrict",
        fieldLength: 0,
        name: "usr",
        relatedSearchField: "username",
        relatedViewFields: [],
        _typeChanged: "User",
        type: "User"
      },
      value: {
        basicDetails:
        {
          name: "Jugnu",
          phone: null,
          alternateEmail: null
        },
        username: "jugnu@appveen.com",
        _id: "USR1389"
      }
    }
    spyOn(appService, 'getValue').and.returnValue('jugnu@appveen.com');
    component.showSearchOnField();
    expect(component.values.length).toBeGreaterThan(0);
  })


  it('should push the relatedViewField values to the values array', () => {
    component.values = [];
    component.definition = {
      camelCase: "usr",
      key: "usr",
      level: 0,
      path: "usr",
      properties: {
        dataKey: "usr",
        dataPath: "usr",
        deleteAction: "restrict",
        fieldLength: 0,
        name: "usr",
        relatedSearchField: "username",
        relatedViewFields: [],
        _typeChanged: "User",
        type: "User"
      },
      value: {
        basicDetails:
        {
          name: "Jugnu",
          phone: null,
          alternateEmail: null
        },
        username: "jugnu@appveen.com",
        _id: "USR1389"
      }
    }
    spyOn(appService, 'getValue').and.returnValue('jugnu@appveen.com');
    component.getValueToShow();
    expect(component.values.length).toBeGreaterThan(0);
  })

  it('should push the relatedViewField values to the values array', () => {
    component.values = [];
    component.definition = {
      camelCase: "usr",
      key: "usr",
      level: 0,
      path: "usr",
      properties: {
        dataKey: "usr",
        dataPath: "usr",
        deleteAction: "restrict",
        fieldLength: 0,
        name: "usr",
        relatedSearchField: "username",
        relatedViewFields: ['name','username'],
        _typeChanged: "User",
        type: "User"
      },
      value: {
        basicDetails:
        {
          name: "Jugnu",
          phone: null,
          alternateEmail: null
        },
        username: "jugnu@appveen.com",
        _id: "USR1389"
      }
    }
    spyOn(appService, 'getValue').and.returnValue('jugnu@appveen.com');
    component.getValueToShow();
    expect(component.values.length).toBeGreaterThan(0);
  })

  it('should return the old value of the path', () => {
    component.definition.path = 'usr._id';
    expect(component.oldVal).toEqual('USR1381'  );
  })
  
  it('should return the new value of the path', () => {
    component.definition.path = 'usr._id';
    expect(component.newVal).toEqual( 'USR1380'  );
  })

  


});
