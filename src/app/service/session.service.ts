import { Injectable } from '@angular/core';
import { UserDetails } from '../interfaces/userDetails';

@Injectable({
  providedIn: 'root'
})
export class SessionService {

  tokenStoredInSession: boolean;
  isUnauthorizedSession = false;

  constructor() {
    const self = this;
    if (sessionStorage.getItem('bc-token')) {
      self.tokenStoredInSession = true;
    }
  }

  saveSessionData(userData: UserDetails) {
    const self = this;
    if (userData.rbacUserCloseWindowToLogout) {
      self.tokenStoredInSession = true;
      sessionStorage.setItem('bc-token', userData.token);
      sessionStorage.setItem('bc-rToken', userData.rToken);
      sessionStorage.setItem('bc-user', JSON.stringify(userData));
    } else {
      self.tokenStoredInSession = false;
      localStorage.setItem('bc-token', userData.token);
      localStorage.setItem('bc-rToken', userData.rToken);
      localStorage.setItem('bc-user', JSON.stringify(userData));
    }
    if (userData.rbacUserToSingleSession || userData.rbacUserCloseWindowToLogout) {
      sessionStorage.setItem('bc-uuid', userData.uuid);
    }

  }

  getToken() {
    const self = this;
    if (self.tokenStoredInSession) {
      return sessionStorage.getItem('bc-token');
    } else {
      return localStorage.getItem('bc-token');
    }
  }

  getRefreshToken() {
    const self = this;
    if (self.tokenStoredInSession) {
      return sessionStorage.getItem('bc-rToken');
    } else {
      return localStorage.getItem('bc-rToken');
    }
  }

  getUser(parsed?: boolean) {
    const self = this;
    if (self.tokenStoredInSession) {
      return parsed ? JSON.parse(sessionStorage.getItem('bc-user')) : sessionStorage.getItem('bc-user');
    } else {
      return parsed ? JSON.parse(localStorage.getItem('bc-user')) : localStorage.getItem('bc-user');
    }
  }

  clearSession() {
    const self = this;
    if (self.tokenStoredInSession) {
      sessionStorage.removeItem('bc-user');
      sessionStorage.removeItem('bc-token');
      sessionStorage.removeItem('bc-rToken');
      sessionStorage.removeItem('bc-apps');
      sessionStorage.removeItem('bc-app');
      sessionStorage.removeItem('bc-uuid');
    } else {
      localStorage.removeItem('bc-user');
      localStorage.removeItem('bc-token');
      localStorage.removeItem('bc-rToken');
      localStorage.removeItem('bc-apps');
      localStorage.removeItem('bc-app');
      localStorage.removeItem('uuid');
    }
  }
}
