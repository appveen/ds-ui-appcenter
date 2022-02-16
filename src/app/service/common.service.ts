import { Injectable, EventEmitter } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders, HttpRequest } from '@angular/common/http';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Observable, timer, interval, of } from 'rxjs';
import { Subject } from 'rxjs';
import { delayWhen, filter, flatMap, map, switchMap, take } from 'rxjs/operators';
import * as sh from 'shorthash';
import * as uuid from 'uuid/v1';
import * as io from 'socket.io-client';
import * as _ from 'lodash';

import { environment } from 'src/environments/environment';
import { UserDetails } from 'src/app/interfaces/userDetails';
import { App } from 'src/app/interfaces/app';
import { Role } from '../interfaces/role';
import { AppService } from './app.service';
import { SessionService } from './session.service';
import { Theme, ThemeService } from './theme.service';

@Injectable()
export class CommonService {
  private sessionWarningRoutine: any;
  private subscriptions: any;
  private lastAppPrefId: string;
  private extendApi: () => Observable<any>;
  private fetchUserRolesApi: () => Observable<any>;
  private isAuthenticatedApi: () => Observable<any>;
  upload: (type, url, data, fileMapper?) => Observable<any>;
  request: (type, url, options?) => Observable<any>;
  refreshToken: () => Observable<any>;
  sendHeartBeat: () => Observable<any>;
  get: (type, url, options?: GetOptions) => Observable<any>;
  put: (type, url, data, srvcID?) => Observable<any>;
  post: (type, url, data, srvcID?) => Observable<any>;
  delete: (type, url, data?, srvcID?) => Observable<any>;
  sheetSelection: (type, url, sheet, headers, filetype, srvcID) => Observable<any>;
  isFilePreviewModalOpen: boolean;
  apiCalls: any;
  userDetails: UserDetails;
  app: App;
  appList: App[];
  sessionExpired: EventEmitter<void>;
  sessionTimeoutWarning: EventEmitter<number>;
  noAccess: boolean;
  loginComponent: boolean;
  permissions: Array<Role>;
  connectionDetails: any;
  filterQueryUpdated: Subject<any>;
  filterQueryCleared: Subject<boolean>;
  clickTrack: number;
  socket: SocketIOClient.Socket;
  interaction: {
    new: EventEmitter<any>;
    update: EventEmitter<any>;
  };
  notification: {
    fileImport: EventEmitter<any>;
    fileExport: EventEmitter<any>;
  };
  searchChar: string;
  workflowfilterQuery: Subject<any>;
  workflowClearfilterQuery: Subject<any>;
  userMap: {
    [key: string]: Promise<any>;
  };
  userMapFilter: {
    [key: string]: Promise<any>;
  };
  serviceMap: {
    [key: string]: Promise<any>;
  };
  documentCountMap: {
    [key: string]: Promise<any>;
  };
  fewDocumentsMap: {
    [key: string]: Promise<any>;
  };
  documentMap: {
    [key: string]: Promise<any>;
  };
  stallRequests: boolean;
  private stallTime: number;
  private stallCount = 0;

  constructor(
    private http: HttpClient,
    private router: Router,
    private appService: AppService,
    private ts: ToastrService,
    private sessionService: SessionService,
    private themeService: ThemeService
  ) {
    const self = this;
    self.apiCalls = {};
    self.appList = [];
    self.permissions = [];
    self.sessionExpired = new EventEmitter<void>();
    self.sessionTimeoutWarning = new EventEmitter();
    self.subscriptions = {};
    self.sessionWarningRoutine = {};
    self.filterQueryUpdated = new Subject<any>();
    self.workflowfilterQuery = new Subject<any>();
    self.workflowClearfilterQuery = new Subject<any>();
    // self.filterQueryString = [];
    self.filterQueryCleared = new Subject<boolean>();
    // self.editFilterData = '';
    self.clickTrack = 1;
    self.interaction = {
      new: new EventEmitter<any>(),
      update: new EventEmitter<any>()
    };
    self.notification = {
      fileImport: new EventEmitter<any>(),
      fileExport: new EventEmitter<any>()
    };
    self.searchChar = '';
    self.userMap = {};
    self.userMapFilter = {};
    self.serviceMap = {};
    self.documentMap = {};
    self.documentCountMap = {};
    self.fewDocumentsMap = {};
    [
      'extendApi',
      'upload',
      'request',
      'refreshToken',
      'sendHeartBeat',
      'fetchUserRolesApi',
      'get',
      'put',
      'post',
      'delete',
      'isAuthenticatedApi',
      'sheetSelection'
    ].forEach(method => {
      this[method] = (...args) => {
        let user = this.sessionService.getUser();
        if (!!user && typeof user === 'string') {
          user = JSON.parse(user);
        }
        if (!!user?.rbacUserToSingleSession) {
          this.stallCount += this.stallRequests ? 1 : 0;
          return of(true).pipe(
            map(() => (!!this.stallTime ? Date.now() - this.stallTime : 0)),
            delayWhen(() =>
              timer(0, 50).pipe(
                filter(() => !this.stallRequests),
                take(1)
              )
            ),
            switchMap(val => {
              if (!val || !this.stallCount) {
                return this['_' + method + '_'](...args);
              }
              this.stallCount -= 1;
              return timer(new Date(Date.now() + val)).pipe(
                take(1),
                switchMap(() => this['_' + method + '_'](...args))
              );
            })
          );
        } else {
          return this['_' + method + '_'](...args);
        }
      };
    });
  }

  afterAuthentication(): Promise<any> {
    const self = this;
    return new Promise((resolve, reject) => {
      // if (!self.userDetails.isSuperAdmin) {
      self.fetchUserRoles().then(
        res1 => {
          if (res1.status != 401) {
            self.apiCalls.afterAuthentication = true;
            self.fetchLastActiveApp().then(
              app => {
                self
                  .getAppDetails(self.app)
                  .then(() => {
                    self.loadTheme(self.app);
                  })
                  .catch(console.error);
                self.apiCalls.afterAuthentication = false;
                resolve(res1);
              },
              err => {
                self.apiCalls.afterAuthentication = false;
                reject(err);
              }
            );
          } else {
            self.apiCalls.afterAuthentication = false;
            resolve(res1);
          }
        },
        err => {
          self.apiCalls.afterAuthentication = false;
          reject(err);
        }
      );
      // } else {
      //   self.apiCalls.afterAuthentication = true;

      //   const arr = [];
      //   // self.appList.forEach(app => {
      //   //   arr.push(self.getAppDetails(app));
      //   // });
      //   arr.push(self.fetchAllApps());
      //   // arr.push(self.getAppsDetails(self.appList));
      //   Promise.all(arr).then(
      //     r => {
      //       self.fetchLastActiveApp().then(
      //         app => {
      //           self
      //             .getAppDetails(self.app)
      //             .then(() => {
      //               self.loadTheme(self.app);
      //             })
      //             .catch(console.error);
      //           self.apiCalls.afterAuthentication = false;
      //           resolve({ status: 200 });
      //         },
      //         err => {
      //           self.apiCalls.afterAuthentication = false;
      //           reject(err);
      //         }
      //       );
      //     },
      //     err => {
      //       self.apiCalls.afterAuthentication = false;
      //       reject(err);
      //     }
      //   );
      // }
    });
  }

  fetchAllApps() {
    const self = this;
    const options: GetOptions = {
      count: -1,
      noApp: true,
      select: 'description,logo.thumbnail',
      sort: '_id'
    };
    return new Promise<any>((resolve, reject) => {
      self.subscriptions['getAllApps'] = self.get('user', '/app', options).subscribe(
        res => {
          self.appList = res;
          self.app = self.appList[0];
          resolve(res);
        },
        (err: any) => {
          reject(err);
        }
      );
    });
  }

  private _fetchUserRolesApi_() {
    const URL = environment.url.user + `/usr/${this.userDetails._id}/allRoles`;
    const filterObj: any = {
      'roles.type': 'appcenter'
    };
    let httpParams = new HttpParams();
    httpParams = httpParams.set('filter', JSON.stringify(filterObj));
    return this.http.get(URL, {
      headers: this._getHeaders(false),
      params: httpParams
    });
  }

  fetchUserRoles() {
    const self = this;
    self.noAccess = false;
    if (self.subscriptions.fetchUserRoles) {
      self.subscriptions.fetchUserRoles.unsubscribe();
    }
    return new Promise<any>((resolve, reject) => {
      self.subscriptions.fetchUserRoles = self.fetchUserRolesApi()
        .subscribe(
          (data: any) => {
            self.permissions = [];
            if (data && data.roles && data.roles.length > 0) {
              self.permissions = data.roles.filter(e => e.type === 'appcenter');
            }
            const apps: Array<App> = self.permissions
              .map(e => e.app)
              .filter((e, i, a) => a.indexOf(e) === i)
              .map(e => Object.defineProperty({}, '_id', { value: e }));
            if (!self.userDetails.accessControl.apps) {
              self.userDetails.accessControl.apps = [];
            }
            self.userDetails.apps = apps
              .concat(self.userDetails.accessControl.apps)
              .filter((e, i, a) => a.findIndex(x => x._id === e._id) === i);
            self.appList = self.userDetails.apps;
            if (self.appList && self.appList.length > 0) {
              self.app = self.appList[0];
              const arr = [];
              if (self.permissions.length > 0) {
                arr.push(self.getRolesDetails(self.permissions));
              }
              arr.push(self.getAppsDetails(self.appList));
              Promise.all(arr).then(
                r => {
                  resolve({ status: 200 });
                },
                err => {
                  reject(err);
                }
              );
            } else {
              self.noAccess = true;
              resolve({ status: 401, message: "You don't have enough permissions" });
            }
          },
          err => {
            reject(err);
          }
        );
    });
  }

  getRoleDetails(role: Role): Promise<any> {
    const self = this;
    const options: GetOptions = {};
    options.filter = {
      app: role.app,
      entity: role.entity,
      'roles.id': role.id
    };
    // if (self.subscriptions['getRoleDetails_' + role.id]) {
    //   self.subscriptions['getRoleDetails_' + role.id].unsubscribe();
    // }
    return new Promise<any>((resolve, reject) => {
      self.subscriptions['getRoleDetails_' + role.id + '_' + role.app] = self.get('user', '/role', options).subscribe(
        res => {
          if (res && res.length > 0) {
            const temp = res[0].roles.find(r => r.id === role.id);
            role.operations = temp.operations;
            role.fields = JSON.parse(res[0].fields);
          }
          resolve(res);
        },
        err => {
          resolve(err);
        }
      );
    });
  }

  getAppDetails(app: App): Promise<any> {
    const self = this;
    if (self.subscriptions['getAppDetails_' + app._id]) {
      self.subscriptions['getAppDetails_' + app._id].unsubscribe();
    }
    return new Promise((resolve, reject) => {
      self.subscriptions['getAppDetails_' + app._id] = self.get('user', '/app/' + app._id).subscribe(
        (res: any) => {
          delete res._id;
          Object.assign(app, res);
          resolve(res);
        },
        (err: any) => {
          if (err.status === 404) {
            if (!self.appList) {
              self.appList = [];
            }
            const index = self.appList.findIndex(e => e._id === app._id);
            if (index > -1) {
              self.appList.splice(index, 1);
            }
          }
          resolve(err);
        }
      );
    });
  }

  getRolesDetails(roleList: Array<Role>): Promise<any> {
    const self = this;
    if (self.subscriptions['getRolesDetails']) {
      self.subscriptions['getRolesDetails'].unsubscribe();
    }
    if (!roleList) {
      roleList = [];
    }
    roleList.forEach(e => {
      e.operations = [];
    });
    const appGroup = {};
    roleList
      .filter(e => e.id && !e.id.startsWith('PN'))
      .forEach(e => {
        if (!appGroup[e.app]) {
          appGroup[e.app] = [];
        }
        appGroup[e.app].push(e.entity);
      });
    const promises = [];
    Object.keys(appGroup).forEach(app => {
      fetch(app, appGroup[app]);
    });
    function fetch(app: string, serviceIds: Array<string>) {
      promises.push(
        new Promise<any>((resolve, reject) => {
          self.subscriptions['getRolesDetails'] = self.get('sm', '/service?app=' + app, {
            count: -1,
            select: 'role',
            filter: {
              _id: { $in: serviceIds }
            }
          }).subscribe(
            (res: Array<any>) => {
              let resList = res.map(e => {
                return e.role.roles.map(r => {
                  r.fields = e.role.fields;
                  r.app = e.role.app;
                  r.entity = e.role.entity;
                  return r;
                });
              });
              resList = [].concat.apply([], resList);
              roleList.forEach(role => {
                const temp = resList.find(r => r.id === role.id && r.entity === role.entity && r.app === role.app);
                if (temp) {
                  role.operations = temp.operations;
                  if (typeof temp.fields === 'string') {
                    role.fields = JSON.parse(temp.fields);
                  } else {
                    role.fields = self.appService.cloneObject(temp.fields);
                  }
                }
              });
              resolve(res);
            },
            err => {
              resolve(err);
            }
          );
        })
      );
    }
    return Promise.all(promises);
  }

  // getRolesDetails(roleList: Array<Role>): Promise<any> {
  //   const self = this;
  //   if (self.subscriptions['getRolesDetails']) {
  //     self.subscriptions['getRolesDetails'].unsubscribe();
  //   }
  //   if (!roleList) {
  //     roleList = [];
  //   }
  //   roleList.forEach(e => {
  //     e.operations = [];
  //   });
  //   const options: GetOptions = {};
  //   const ids = roleList
  //     .filter(e => e.id && !e.id.startsWith('PN'))
  //     .map(e => {
  //       const temp: any = {};
  //       temp['roles.id'] = e.id;
  //       temp.app = e.app;
  //       temp.entity = e.entity;
  //       return temp;
  //     });
  //   const promises = [];
  //   if (ids.length > 20) {
  //     while (ids.length > 0) {
  //       fetch(ids.splice(0, 20));
  //     }
  //   } else {
  //     fetch(ids);
  //   }
  //   function fetch(idList: Array<any>) {
  //     promises.push(
  //       new Promise<any>((resolve, reject) => {
  //         self.subscriptions['getRolesDetails'] = self.get('user', '/role', {
  //           count: -1,
  //           filter: {
  //             $or: idList
  //           }
  //         }).subscribe(
  //           (res: Array<any>) => {
  //             let resList = res.map(e => {
  //               return e.roles.map(r => {
  //                 r.fields = e.fields;
  //                 r.app = e.app;
  //                 r.entity = e.entity;
  //                 return r;
  //               });
  //             });
  //             resList = [].concat.apply([], resList);
  //             roleList.forEach(role => {
  //               const temp = resList.find(r => r.id === role.id && r.entity === role.entity && r.app === role.app);
  //               if (temp) {
  //                 role.operations = temp.operations;
  //                 if (typeof temp.fields === 'string') {
  //                   role.fields = JSON.parse(temp.fields);
  //                 } else {
  //                   role.fields = self.appService.cloneObject(temp.fields);
  //                 }
  //               }
  //             });
  //             resolve(res);
  //           },
  //           err => {
  //             resolve(err);
  //           }
  //         );
  //       })
  //     );
  //   }
  //   return Promise.all(promises);
  // }

  getAppsDetails(appList: Array<App>): Promise<any> {
    const self = this;
    if (self.subscriptions['getAppsDetails']) {
      self.subscriptions['getAppsDetails'].unsubscribe();
    }
    if (!appList) {
      appList = [];
    }
    const promises = [];
    const ids = appList.map(e => e._id);
    if (ids.length > 40) {
      while (ids.length > 0) {
        fetch(ids.splice(0, 20));
      }
    } else {
      fetch(ids);
    }
    function fetch(idList: Array<string>) {
      promises.push(
        new Promise((resolve, reject) => {
          self.subscriptions['getAppsDetails'] = self
            .get('user', '/app/', {
              noApp: true,
              count: -1,
              select: 'description,logo.thumbnail',
              sort: '_id',
              filter: {
                _id: {
                  $in: idList
                }
              }
            })
            .subscribe(
              (res: Array<App>) => {
                self.appList.forEach(app => {
                  const temp = res.find(e => e._id === app._id);
                  if (temp) {
                    app.logo = temp.logo;
                    app.appCenterStyle = temp.appCenterStyle;
                    app.description = temp.description;
                  }
                });
                resolve(res);
              },
              (err: any) => {
                resolve(err);
              }
            );
        })
      );
    }
    return Promise.all(promises);
  }

  fetchLastActiveApp(): Promise<any> {
    const self = this;
    if (self.subscriptions.fetchLastActiveApp) {
      self.subscriptions.fetchLastActiveApp.unsubscribe();
    }
    return new Promise<any>((resolve, reject) => {
      const options: GetOptions = {
        filter: {
          userId: self.userDetails._id,
          type: 'last-app',
          key: 'appcenter'
        }
      };
      self.lastAppPrefId = null;
      self.subscriptions.fetchLastActiveApp = self.get('user', '/preferences', options).subscribe(
        prefRes => {
          if (prefRes && prefRes.length > 0) {
            self.lastAppPrefId = prefRes[0]._id;
            if (prefRes[0].value) {
              const temp = self.appList.find(e => e._id === prefRes[0].value);
              if (temp) {
                self.app = temp;
              } else {
                self.app = self.appList[0];
                self.deleteLastActiveApp().then(
                  res => { },
                  err => { }
                );
              }
            }
            resolve(prefRes[0].value);
          } else {
            self.app = self.appList[0];
            resolve(null);
          }
        },
        err => {
          self.app = self.appList[0];
          resolve(null);
        }
      );
    });
  }

  saveLastActiveApp(): Promise<any> {
    const self = this;
    if (self.subscriptions.saveLastActiveApp) {
      self.subscriptions.saveLastActiveApp.unsubscribe();
    }
    return new Promise<any>((resolve, reject) => {
      const payload = {
        userId: self.userDetails._id,
        type: 'last-app',
        key: 'appcenter',
        value: self.app._id
      };
      let response: Observable<any>;
      if (self.lastAppPrefId) {
        response = self.put('user', '/preferences/' + self.lastAppPrefId, payload);
      } else {
        response = self.post('user', '/preferences', payload);
      }
      self.subscriptions.saveLastActiveApp = response.subscribe(
        res => {
          self.lastAppPrefId = res._id;
          resolve(res._id);
        },
        err => {
          resolve(null);
        }
      );
    });
  }

  deleteLastActiveApp(): Promise<any> {
    const self = this;
    if (self.subscriptions.deleteLastActiveApp) {
      self.subscriptions.deleteLastActiveApp.unsubscribe();
    }
    return new Promise<any>((resolve, reject) => {
      if (self.lastAppPrefId) {
        self.subscriptions.deleteLastActiveApp = self.delete('user', '/preferences/' + self.lastAppPrefId).subscribe(
          res => {
            self.lastAppPrefId = null;
            resolve(null);
          },
          err => {
            resolve(null);
          }
        );
      } else {
        resolve(null);
      }
    });
  }

  loadTheme(app: App) {
    const self = this;
    const themes = Theme.getDefault();
    if (app.appCenterStyle) {
      themes.shift();
      themes.shift();
      themes.unshift({
        color: self.themeService.darken(app.appCenterStyle.primaryColor, 10),
        textColor: '#' + app.appCenterStyle.textColor,
        name: 'primary-dark'
      });
      themes.unshift({
        color: '#' + app.appCenterStyle.primaryColor,
        textColor: '#' + app.appCenterStyle.textColor,
        name: 'primary'
      });
    }
    self.themeService.reCompileCSS(themes);
  }

  login(credentials: Credentials): Promise<any> {
    const self = this;
    if (self.subscriptions.login) {
      self.subscriptions.login.unsubscribe();
    }
    return new Promise<any>((resolve, reject) => {
      self.subscriptions.login = self.http.post(environment.url.user + '/login', credentials).subscribe(
        (response: any) => {
          self.resetUserDetails(response);
          resolve(response);
        },
        err => {
          reject(err);
        }
      );
    });
  }

  ldapLogin(credentials: Credentials): Promise<any> {
    const self = this;
    if (self.subscriptions.login) {
      self.subscriptions.login.unsubscribe();
    }
    return new Promise<any>((resolve, reject) => {
      self.subscriptions.login = self.http.post(environment.url.user + '/ldap/login', credentials)
        .subscribe((response: any) => {
          self.resetUserDetails(response);
          resolve(response);
        }, (err) => {
          reject(err);
        });
    });
  }

  private _extendApi_(): Observable<any> {
    const token = this.sessionService.getToken();
    if (!token) {
      this.ts.error('Invalid Session');
      this.logout();
      return;
    }
    const httpHeaders = new HttpHeaders()
      .set('Content-Type', 'application/json')
      .set('Authorization', 'JWT ' + token);
    return this.http.get(environment.url.user + '/extend', { headers: httpHeaders });
  }

  extend(): Promise<any> {
    const self = this;
    if (self.subscriptions.extend) {
      self.subscriptions.extend.unsubscribe();
    }
    return new Promise<any>((resolve, reject) => {
      self.subscriptions.extend = this.extendApi().subscribe(
        (response: any) => {
          self.clearData();
          self.resetUserDetails(response);
          self.afterAuthentication().then(
            res => {
              resolve(response);
            },
            err => {
              reject(err);
            }
          );
        },
        err => {
          reject(err);
        }
      );
    });
  }

  clearActiveSessionsAndLogin(credentials: any) {
    const self = this;
    if (self.subscriptions.clearActiveSessionsAndLogin) {
      self.subscriptions.clearActiveSessionsAndLogin.unsubscribe();
    }
    return new Promise<any>((resolve, reject) => {
      self.subscriptions.clearActiveSessionsAndLogin = self.delete('user', '/closeAllSessions', credentials).subscribe(
        res => {
          resolve(res);
        },
        err => {
          reject(err);
        }
      );
    });
  }

  randomStr(len) {
    let str = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < len; i++) {
      str += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return str;
  }
  resetUserDetails(response: UserDetails) {
    const self = this;
    if (!response.auth) {
      response.auth = {
        authType: 'local'
      };
    }
    if (response.token) {
      self.userDetails = JSON.parse(JSON.stringify(response));
      self.sessionService.saveSessionData(response);
    } else {
      self.noAccess = true;
    }
    if (response.apps && response.apps.length > 0) {
      self.appList = response.apps;
      self.app = self.appList[0];
    }
    if (self.userDetails.rbacUserToSingleSession || self.userDetails.rbacUserCloseWindowToLogout) {
      sessionStorage.setItem('bc-uuid', self.userDetails.uuid);
      self.createHeartBeatRoutine();
    }
    if (self.userDetails.rbacUserTokenRefresh) {
      self.createAutoRefreshRoutine();
    } else {
      self.enableSessionTimoutWarning();
    }
    if (self.userDetails.googleApiKey) {
      const script1 = document.createElement('script');
      const script2 = document.createElement('script');
      script1.setAttribute('src', `https://maps.googleapis.com/maps/api/js?key=${self.userDetails.googleApiKey}&libraries=places`);
      script1.setAttribute('async', 'true');
      script2.setAttribute(
        'src',
        'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/markerclusterer.js'
      );
      document.body.appendChild(script1);
      document.body.appendChild(script2);
    }
    // '<script async
    // defer src="https://maps.googleapis.com/maps/api/js?key=AIzaSyBwBasAd5CHqFiCYugo-09SAhUEAh9S3mw&libraries=places"></script>'
    // '<script src="https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/markerclusterer.js"></script>'
  }

  private _getHeaders(skipAuth: boolean, srvcID?): any {
    const self = this;
    const httpHeaders = new HttpHeaders()
      .set('Content-Type', 'application/json')
      .set('Access-Control-Allow-Methods', 'POST, GET, OPTIONS, DELETE, PUT')
      .set('Access-Control-Allow-Origin', '*')
      .set('txnId', sh.unique(uuid() + '-' + self.randomStr(5)));
    if (!skipAuth) {
      const token = self.sessionService.getToken();
      if (!token) {
        this.ts.error('Invalid Session');
        this.logout();
        return;
      } else {
        httpHeaders.set('Authorization', 'JWT ' + token)
      }
    }
    return httpHeaders;
  }

  private _get_(type, url, options?: GetOptions): Observable<any> {
    const self = this;
    const URL = environment.url[type] + url;
    let urlParams = new HttpParams();
    if (!options) {
      options = {};
    }
    if (options.sort && typeof options.sort !== 'object') {
      urlParams = urlParams.set('sort', options.sort);
    }
    else if (options.sort && typeof options.sort === 'object') {
      urlParams = urlParams.set('sort', JSON.stringify(options.sort));
    }
    if (options.page) {
      urlParams = urlParams.set('page', options.page.toString());
    }
    if (options.count) {
      urlParams = urlParams.set('count', options.count.toString());
    }
    if (options.select) {
      urlParams = urlParams.set('select', options.select);
    }
    if (options.filter) {
      urlParams = urlParams.set('filter', JSON.stringify(options.filter));
    }
    if (options.project) {
      let columns: any = Object.keys(options.project).filter(key => options.project[key] == 1);
      columns = columns + ['_metadata.createdAt', '_metadata.lastUpdated'];
      urlParams = urlParams.set('select', columns);
    }
    if (options.expand) {
      urlParams = urlParams.set('expand', options.expand.toString());
    }
    if (options.expandKeys) {
      urlParams = urlParams.set('expandKeys', options.expandKeys);
    }
    if (options.serviceId) {
      urlParams = urlParams.set('serviceId', options.serviceId);
    }
    return self.http.get(URL, { params: urlParams, headers: self._getHeaders(options.skipAuth, options.srvcID) });
  }

  private _put_(type, url, data, srvcID?): Observable<any> {
    const self = this;
    const URL = environment.url[type] + url;
    return self.http.put(URL, data, { headers: self._getHeaders(false, srvcID) });
  }

  private _post_(type, url, data, srvcID?): Observable<any> {
    const self = this;
    const URL = environment.url[type] + url;
    return self.http.post(URL, data, { headers: self._getHeaders(false, srvcID) });
  }

  private _delete_(type, url, data?, srvcID?): Observable<any> {
    const self = this;
    const URL = environment.url[type] + url;
    const options = {
      headers: self._getHeaders(false, srvcID),
      body: data
    };
    return self.http.delete(URL, options);
  }

  private _isAuthenticatedApi_() {
    const URL = environment.url.user + '/check';
    return this.http.get(URL, { headers: this._getHeaders(false) });
  }

  isAuthenticated() {
    const self = this;
    if (self.subscriptions.isAuthenticated) {
      self.subscriptions.isAuthenticated.unsubscribe();
    }
    return new Promise<any>((resolve, reject) => {
      self.subscriptions.isAuthenticated = self.isAuthenticatedApi().subscribe(
        (val: any) => {
          self.resetUserDetails(val);
          self.checkAuthType().then(
            res => {
              resolve(val);
            },
            err => {
              reject(err);
            }
          );
        },
        err => {
          reject(err);
        }
      );
    });
  }

  checkAuthType() {
    const self = this;
    const URL = environment.url.user + '/authType/' + self.userDetails._id;
    if (self.subscriptions.checkAuthType) {
      self.subscriptions.checkAuthType.unsubscribe();
    }
    return new Promise((resolve, reject) => {
      self.subscriptions.checkAuthType = self.http.get(URL).subscribe(
        (val: any) => {
          if (val && val.auth) {
            self.connectionDetails = val.auth.connectionDetails;
          }
          resolve(val);
        },
        err => {
          reject(err);
        }
      );
    });
  }

  private _upload_(type, url, data, fileMapper?) {
    const self = this;
    const token = self.sessionService.getToken();
    if (!token) {
      this.ts.error('Invalid Session');
      this.logout();
      return;
    }
    const httpHeaders = new HttpHeaders()
      .set('Authorization', 'JWT ' + token)
      .set('Access-Control-Allow-Methods', 'POST, GET, OPTIONS, DELETE, PUT')
      .set('Access-Control-Allow-Origin', '*')
      .set('txnId', sh.unique(uuid() + '-' + self.randomStr(5)));
    url = environment.url[type] + url + '/utils' + (fileMapper ? '/fileMapper/upload' : '/file/upload');
    return self.http.request(
      new HttpRequest('POST', url, data, {
        reportProgress: true,
        headers: httpHeaders
      })
    );
  }

  private _request_(type, url, options?) {
    const self = this;
    const token = self.sessionService.getToken();
    if (!token) {
      this.ts.error('Invalid Session');
      this.logout();
      return;
    }
    const httpHeaders = new HttpHeaders()
      .set('Authorization', 'JWT ' + token)
      .set('Access-Control-Allow-Methods', 'POST, GET, OPTIONS, DELETE, PUT')
      .set('Access-Control-Allow-Origin', '*')
      .set('txnId', sh.unique(uuid() + '-' + self.randomStr(5)));
    url = environment.url[type] + url;
    if (!options) {
      options = {};
    }
    if (!options.method) {
      options.method = 'GET';
    }
    if (!options.responseType) {
      options.responseType = 'text';
    }
    return self.http.request(
      new HttpRequest(options.method, url, options.data, {
        responseType: options.responseType,
        reportProgress: true,
        headers: httpHeaders
      })
    );
  }

  private _sheetSelection_(type, url, sheet, headers, filetype, srvcID) {
    const self = this;
    let urlParams = new HttpParams();
    if (sheet) {
      urlParams = urlParams.set('sheet', sheet);
    }
    if (headers) {
      urlParams = urlParams.set('headers', headers);
    }
    if (filetype) {
      urlParams = urlParams.set('type', filetype);
    }
    const URL = environment.url[type] + url;
    return self.http.get(URL, { params: urlParams, headers: self._getHeaders(false, srvcID) });
  }

  clearData(notCurrentApp?: boolean) {
    const self = this;
    self.sessionService.clearSession();
    if (self.subscriptions['sendHeartBeat']) {
      self.subscriptions['sendHeartBeat'].unsubscribe();
    }
    if (self.subscriptions['refreshToken']) {
      self.subscriptions['refreshToken'].unsubscribe();
    }
    Object.keys(self.sessionWarningRoutine).forEach(key => {
      if (self.sessionWarningRoutine[key]) {
        clearTimeout(self.sessionWarningRoutine[key]);
      }
    });
    if (!notCurrentApp) {
      self.app = null;
      self.appList = null;
    }
    self.userDetails = {};
    self.apiCalls = {};
    self.noAccess = false;
    self.ts.clear();
    Object.keys(self.subscriptions).forEach(key => {
      if (self.subscriptions[key]) {
        self.subscriptions[key].unsubscribe();
      }
    });
    if (document.body.contains(document.getElementById('customStyle'))) {
      document.getElementById('customStyle').remove();
    }
    self.disconnectSocket();
  }

  logout(noRedirect?) {
    const self = this;
    self.stallRequests = false;
    self.stallCount = 0;
    self.stallTime = null;
    if (self.subscriptions.logout) {
      self.subscriptions.logout.unsubscribe();
    }
    if (self.sessionService.getUser()) {
      self.subscriptions.logout = self.delete('user', '/logout').subscribe(
        res => {
          self.clearData();
          self.appService.setFocus.emit('username');
          if (!noRedirect) {
            // self.ts.success('You are logged out successfully');
            self.router.navigate(['/auth']);
          }
        },
        err => {
          console.error(err.message, 'Unable to logout');
        }
      );
    } else {
      self.clearData();
      self.appService.setFocus.emit('username');
      self.router.navigate(['/auth']);
    }
  }

  errorToast(err, message?) {
    console.error(err.status, err.message, message);
    const self = this;
    if (!err.error || !err.error.message) {
      message = message ? message : 'Oops, something went wrong! Please try again later';
    } else {
      message = err.error.message;
    }
    self.ts.error(message);
  }

  private _refreshToken_() {
    const self = this;
    const token = self.sessionService.getToken();
    if (!token) {
      this.ts.error('Invalid Session');
      this.logout();
      return;
    }
    let user = self.sessionService.getUser();
    if (typeof user === 'string') {
      user = JSON.parse(user);
    }
    if (!!user?.rbacUserToSingleSession) {
      this.stallRequests = true;
      this.stallTime = Date.now();
    }
    const httpHeaders = new HttpHeaders()
      .set('Content-Type', 'application/json')
      .set('Authorization', 'JWT ' + token)
      .set('rToken', 'JWT ' + self.sessionService.getRefreshToken())
      .set('txnId', sh.unique(uuid() + '-' + self.randomStr(5)));
    const URL = environment.url.user + '/refresh';
    return self.http.get(URL, { headers: httpHeaders });
  }

  private _sendHeartBeat_() {
    const self = this;
    const token = self.sessionService.getToken();
    if (!token) {
      this.ts.error('Invalid Session');
      this.logout();
      return;
    }
    const httpHeaders = new HttpHeaders()
      .set('Content-Type', 'application/json')
      .set('Authorization', 'JWT ' + token)
      .set('txnId', sh.unique(uuid() + '-' + self.randomStr(5)));
    const URL = environment.url.user + '/usr/hb';
    const payload = {
      uuid: sessionStorage.getItem('bc-uuid')
    };
    return self.http.put(URL, payload, { headers: httpHeaders });
  }

  createAutoRefreshRoutine() {
    const resolveIn = this.userDetails.expiresIn - new Date(this.userDetails.serverTime).getTime() - 300000;
    const intervalValue =
      ((this.userDetails.bot ? this.userDetails.rbacBotTokenDuration : this.userDetails.rbacUserTokenDuration) - 5 * 60) * 1000;
    this.handleRefreshToken(timer(resolveIn), 'firstRefresh', () => {
      this.handleRefreshToken(interval(intervalValue), 'subsequentRefresh');
    });
  }

  handleRefreshToken(onEvent: Observable<any>, subscriptionId: string, callback?: () => void) {
    if (!!subscriptionId && !!this.subscriptions[subscriptionId]) {
      this.subscriptions[subscriptionId].unsubscribe();
    }
    if (!!subscriptionId && subscriptionId === 'firstRefresh' && !!this.subscriptions['subsequentRefresh']) {
      this.subscriptions['subsequentRefresh'].unsubscribe();
    }

    const newSubscription = onEvent.pipe(switchMap(e => this.refreshToken())).subscribe(
      (res: any) => {
        this.userDetails.expiresIn = res.expiresIn;
        let userData = this.appService.cloneObject(this.userDetails);
        userData.token = res.token;
        userData.rToken = res.rToken;
        userData.uuid = res.uuid;
        this.sessionService.saveSessionData(userData);
        this.stallRequests = false;
        if (!!callback) {
          callback();
        }
      },
      err => this.logout()
    );

    if (!!subscriptionId) {
      this.subscriptions[subscriptionId] = newSubscription;
    }
  }

  createHeartBeatRoutine() {
    const self = this;
    const resolveIn = self.userDetails.rbacHbInterval * 1000 - 1000;
    if (!!self.subscriptions && !!self.subscriptions['sendHeartBeat']) {
      self.subscriptions['sendHeartBeat'].unsubscribe();
    }
    self.subscriptions['sendHeartBeat'] = self
      .sendHeartBeat()
      .pipe(
        switchMap(data => interval(resolveIn)),
        flatMap(e => self.sendHeartBeat())
      )
      .subscribe(
        (res2: any) => { },
        err => {
          self.sessionExpired.emit();
          self.logout();
        }
      );
  }

  enableSessionTimoutWarning() {
    const self = this;
    const resolveIn = self.userDetails.expiresIn - new Date(self.userDetails.serverTime).getTime() - 300000;
    // return new Observable<number>(observer => {
    if (resolveIn > 0) {
      self.sessionWarningRoutine['5min'] = setTimeout(() => {
        self.sessionTimeoutWarning.emit(5);
        // observer.next(5);
      }, resolveIn);
    }
    if (resolveIn + 120000 > 0) {
      self.sessionWarningRoutine['3min'] = setTimeout(() => {
        self.sessionTimeoutWarning.emit(3);
        // observer.next(3);
      }, resolveIn + 120000);
    }
    if (resolveIn + 240000 > 0) {
      self.sessionWarningRoutine['1min'] = setTimeout(() => {
        self.sessionTimeoutWarning.emit(1);
        // observer.next(1);
      }, resolveIn + 240000);
    }
    // });
  }

  getDocumentVersion(serviceId: string, documentId: string) {
    const self = this;
    if (self.subscriptions['getServiceDetails_' + serviceId]) {
      self.subscriptions['getServiceDetails_' + serviceId].unsubscribe();
    }
    return new Promise((resolve, reject) => {
      self.subscriptions['getServiceDetails_' + serviceId] = self.get('sm', '/service/' + serviceId, { select: 'api app', filter: { app: this.app._id } }).subscribe(
        service => {
          if (self.subscriptions['getDocumentVersion_' + serviceId + '_' + documentId]) {
            self.subscriptions['getDocumentVersion_' + serviceId + '_' + documentId].unsubscribe();
          }
          self.subscriptions['getDocumentVersion_' + serviceId + '_' + documentId] = self
            .get('api', `/${service.app}${service.api}/${documentId}`, {
              select: '_metadata.version.document'
            })
            .subscribe(
              doc => {
                resolve(doc._metadata.version.document);
              },
              err => {
                if (err.status === 404) {
                  reject(true);
                } else {
                  reject(false);
                }
              }
            );
        },
        err => {
          reject(false);
        }
      );
    });
  }

  getURLParams(options: GetOptions, defn) {
    const self = this;
    let urlParams = new HttpParams();
    let temp;
    if (!options) {
      options = {};
    }
    if (options.select) {
      temp = options.select.split(',');
      defn.forEach(def => {
        self.checkForNestedArr(def, temp);
      });
      const index = temp.findIndex(e => e.trim() === '_metadata.workflow');
      if (index > -1) {
        temp.splice(index, 1);
      }
    }
    if (options.sort) {
      urlParams = urlParams.set('sort', options.sort);
    }
    if (options.select) {
      urlParams = urlParams.set('select', temp.join(','));
    }
    if (options.filter) {
      urlParams = urlParams.set('filter', JSON.stringify(options.filter));
    }
    return urlParams;
  }

  checkForNestedArr(def, selectedCol) {
    const self = this;
    const i = selectedCol.findIndex(e => e === def.key);
    if (i > -1 && def.type === 'Checkbox') {
      selectedCol.splice(i, 1);
    } else if (def.type === 'Object' && def.definition.length > 0) {
      def.definition.forEach((d: any) => {
        self.checkForNestedArr(d, selectedCol);
      });
    }
  }

  getViewFieldsList(serviceId: string): any {
    const self = this;
    return self.permissions.filter(p => p.entity === serviceId && p.app === this.app._id);
  }


  hasPermission(serviceId: string, permissions: any, method?: string): boolean {
    const self = this;
    /**
     * Super Admin Check
     */
    if (self.userDetails.isSuperAdmin) {
      return true;
    }

    /**
     * App Admin Check
     */
    if (this.isAppAdmin()) {
      return true;
    }

    /**
     * Data Servie Admin Check
     */
    if (self.isDataServiceAdmin(serviceId)) {
      return true;
    }
    /**
     * Normal User Permission Check
     */
    if (method) {
      return Boolean(self.permissions.find(p => p.entity === serviceId && Boolean(p.operations.find(o => o.method === method))));
    } else {
      return Boolean(self.permissions.find(p => p.entity === serviceId));
    }
  }

  hasPermissionOld(serviceId: string, method?: string): boolean {
    const self = this;
    /**
     * Super Admin Check
     */
    if (self.userDetails.isSuperAdmin) {
      return true;
    }

    /**
     * App Admin Check
     */
    if (this.isAppAdmin()) {
      return true;
    }

    /**
     * Data Servie Admin Check
     */
    if (self.isDataServiceAdmin(serviceId)) {
      return true;
    }
    /**
     * Normal User Permission Check
     */
    if (method) {
      return Boolean(self.permissions.find(p => p.entity === serviceId && Boolean(p.operations.find(o => o.method === method))));
    } else {
      return Boolean(self.permissions.find(p => p.entity === serviceId));
    }
  }

  isDataServiceAdmin(serviceId: string): boolean {
    if (this.permissions.find(p => p.entity === serviceId && p.id === `ADMIN_${serviceId}`)) {
      return true;
    }
    return false;
  }

  isAppAdmin(): boolean {
    if (!this.userDetails) {
      this.userDetails = {};
    }
    if (!this.userDetails.accessControl) {
      this.userDetails.accessControl = {};
    }
    if (!this.userDetails.accessControl.apps) {
      this.userDetails.accessControl.apps = [];
    }
    const index = this.userDetails.accessControl.apps.findIndex(a => a._id === this.app._id);
    if (index > -1) {
      return true;
    }
    return false;
  }

  canRespondToWF(service: any, stepName: string): boolean {
    if (!service.workflowConfig || !service.workflowConfig.makerCheckers || service.workflowConfig.makerCheckers.length == 0) {
      return false;
    }
    let wfStepIds = service.workflowConfig.makerCheckers[0].steps.filter(s => s.name === stepName).map(s => s.id);
    wfStepIds = _.flatten(wfStepIds);
    if (_.intersection(this.permissions.map(p => p.id), wfStepIds).length > 0) {
      return true;
    }
    return false;
  }

  hasWorkflow(service: any) {
    if (service && service.workflowConfig) {
      return service.workflowConfig.enabled && !this.isDataServiceAdmin(service._id);
    }
    return false;
  }

  get servicesWithAccess() {
    const self = this;
    if (self.permissions && self.permissions.length > 0) {
      const permission = self.permissions
        .filter(e => e.app === self.app._id)
        .map(e => e.entity);
      return _.uniq(permission);
    }
    return [];
  }

  get bookmarksWithAccess() {
    const self = this;
    if (self.permissions && self.permissions.length > 0) {
      return self.permissions
        .filter(e => e.app === self.app._id)
        .map(e => e.entity)
        .filter(e => e.match(/^BM_.*$/))
        .map(e => e.split('_')[1])
        .filter((e, i, a) => a.indexOf(e) === i);
    }
    return [];
  }

  get interationsWithAccess() {
    const self = this;
    if (self.permissions && self.permissions.length > 0) {
      return self.permissions
        .filter(e => e.app === self.app._id)
        .map(e => e.entity)
        .filter(e => e.match(/^INTR_.*$/))
        .map(e => e.split('_'[1]))
        .filter((e, i, a) => a.indexOf(e) === i);
    }
    return [];
  }

  get loading(): boolean {
    const self = this;
    if (Object.values(self.apiCalls).length === 0) {
      return false;
    } else {
      return Boolean(Math.max.apply(null, Object.values(self.apiCalls)));
    }
  }

  azureLogin() {
    try {
      const self = this;
      const windowHeight = 500;
      const windowWidth = 620;
      const windowLeft = (window.outerWidth - windowWidth) / 2 + window.screenLeft;
      const windowTop = (window.outerHeight - windowHeight) / 2 + window.screenTop;
      const url = '/api/a/rbac/azure/login';
      const windowOptions = [];
      windowOptions.push(`height=${windowHeight}`);
      windowOptions.push(`width=${windowWidth}`);
      windowOptions.push(`left=${windowLeft}`);
      windowOptions.push(`top=${windowTop}`);
      windowOptions.push(`toolbar=no`);
      windowOptions.push(`resizable=no`);
      windowOptions.push(`menubar=no`);
      windowOptions.push(`location=no`);
      const childWindow = document.open(url, '_blank', windowOptions.join(',')) as any;
      return self.appService.listenForChildClosed(childWindow);
    } catch (e) {
      throw e;
    }
  }

  connectSocket() {
    const self = this;
    if (!self.socket && self.app && self.app._id) {
      const socketConfig = {
        query: {
          app: self.app._id,
          userId: self.userDetails._id,
          portal: 'appcenter'
        }
      };
      self.socket = io.connect(environment.production ? '/' : 'http://localhost', socketConfig);

      self.socket.on('connected', data => {
        self.socket.emit('authenticate', { token: self.userDetails.token });
      });

      self.socket.on('interactionUpdated', data => {
        if (data.app === self.app._id) {
          self.interaction.update.emit(data);
        }
      });

      self.socket.on('interactionCreated', data => {
        if (data.app === self.app._id) {
          self.interaction.new.emit(data);
        }
      });

      self.socket.on('file-import', data => {
        self.notification.fileImport.emit(data);
      });

      self.socket.on('file-export', data => {
        self.notification.fileExport.emit(data);
      });
    }
  }

  disconnectSocket() {
    const self = this;
    if (self.socket) {
      self.socket.close();
      self.socket = null;
    }
  }

  getUser(userId: string): Promise<UserDetails> {
    const self = this;
    if (!self.userMap[userId]) {
      let path = `/usr/app/${this.app._id}/${userId}`;
      if (this.userDetails.isSuperAdmin) {
        path = `/usr/${userId}`
      }
      self.userMap[userId] = self
        .get('user', path, {
          select: '_id,isSuperAdmin,username,basicDetails,lastLogin,attributes'
        })
        .toPromise();
    }
    return self.userMap[userId];
  }

  getUserByFilter(userId: string): Promise<Array<UserDetails>> {
    const self = this;
    if (!self.userMapFilter[userId]) {
      const filter = {};
      filter['$or'] = [{ _id: userId }, { '_metadata.oldUserId': userId }];
      let path = `/usr/app/${this.app._id}`;
      if (this.userDetails.isSuperAdmin) {
        path = `/usr`
      }
      self.userMapFilter[userId] = self
        .get('user', path, {
          select: '_id,isSuperAdmin,username,basicDetails,lastLogin,attributes',
          filter,
          count: 2
        })
        .toPromise();
    }
    return self.userMapFilter[userId];
  }

  getService(serviceId: string): Promise<any> {
    const self = this;
    if (!self.serviceMap[serviceId]) {
      self.serviceMap[serviceId] = self
        .get('sm', '/service/' + serviceId, {
          select: '_id,name,app,api,definition,attributeList,workflowConfig,role',
          filter: { app: this.app._id }
        })
        .toPromise();
    }
    return self.serviceMap[serviceId];
  }

  getDocument(docId: string, api: string, serviceId: string): Promise<any> {
    const self = this;
    // if (api) {
    api = api.replace('api/c/', '');
    if (!self.documentMap[docId + serviceId]) {
      self.documentMap[docId + serviceId] = self.get('api', api).toPromise();
    }
    return self.documentMap[docId + serviceId];
    // }
  }

  getDocumentCount(api: string): Promise<any> {
    const self = this;
    if (!self.documentCountMap[api]) {
      self.documentCountMap[api] = self.get('api', api + '/utils/count').toPromise();
    }
    return self.documentCountMap[api];
  }

  getFewDocument(api: string, options?: any): Promise<any> {
    const self = this;
    if (!self.fewDocumentsMap[api]) {
      if (!options) {
        options = {};
      }
      if (!options.count) {
        options.count = -1;
      }
      if (typeof options.expand !== 'boolean') {
        options.expand = true;
      }
      self.fewDocumentsMap[api] = self.get('api', api, options).toPromise();
    }
    return self.fewDocumentsMap[api];
  }

  getCurrentAppId() {
    if (!this.app && !this.appList && !this.appList.length) {
      return '';
    }

    return this.app._id || this.appList[0]._id || '';
  }
}

export interface GetOptions {
  noApp?: boolean;
  page?: number;
  count?: number;
  select?: string;
  filter?: any;
  sort?: string;
  project?: string;
  srvcID?: string;
  expand?: boolean;
  expandKeys?: string;
  serviceId?: string;
  skipAuth?: boolean;
}

export interface Credentials {
  username?: string;
  password?: string;
}
