import { Injectable, ElementRef, Renderer2 } from '@angular/core';
import { AppService } from 'src/app/service/app.service';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  style: HTMLElement;
  constructor(private appService: AppService) { }

  reCompileCSS(themes: Theme[]) {
    const self = this;
    if (document.body.contains(document.getElementById('customStyle'))) {
      self.style = document.getElementById('customStyle');
    } else {
      self.style = document.createElement('style');
      self.style.setAttribute('id', 'customStyle');
    }
    self.style.innerHTML = self.getStyle(themes);
    document.body.appendChild(self.style);
  }

  lighten(color: string, percent: number) {
    if (color.indexOf('#') === 0) {
      color = color.substr(1, 6);
    }
    const num = parseInt(color, 16),
      amt = Math.round(2.55 * percent),
      R = (num >> 16) + amt,
      G = (num >> 8 & 0x00FF) + amt,
      B = (num & 0x0000FF) + amt;
    return '#' + (0x1000000 +
      (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 + (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
  }
  darken(color: string, percent: number) {
    if (color.indexOf('#') === 0) {
      color = color.substr(1, 6);
    }
    const num = parseInt(color, 16),
      amt = Math.round(2.55 * (-percent)),
      R = (num >> 16) + amt,
      G = (num >> 8 & 0x00FF) + amt,
      B = (num & 0x0000FF) + amt;
    return '#' + (0x1000000 +
      (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 + (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
  }
  rgba(color: string, opacity: number) {
    const result = /^#?([a-fA-F0-9]{2})([a-fA-F0-9]{2})([a-fA-F0-9]{2})$/i.exec(color);
    if (result) {
      const text = 'rgba(' + parseInt(result[1], 16) +
        ',' + parseInt(result[2], 16) + ',' + parseInt(result[3], 16) + ',' + opacity + ')';
      return text;
    }
    return null;
  }


  getStyle(themes: Theme[]) {
    let style = '';
    themes.forEach(theme => {
      style += this.getBasicThemeStyle(theme);
      if (theme.name === 'primary') {
        style += this.getPrimaryStyle(theme);
      }
    });
    return style;
  }

  getBasicThemeStyle(theme: Theme) {
    const name = theme.name;
    const color = '#' + theme.color.replace(/#/g, '');
    const textColor = '#' + theme.textColor.replace(/#/g, '');
    return `.text-${name} {
        color: ${color} !important;
      }
      a.text-${name}:hover, a.text-${name}:focus {
        color: ${this.darken(color, 20)} !important;
      }
      .border-${name} {
        border-color: ${color} !important;
      }
      .border-${name}-hover:hover{
        border-color: ${color} !important;
      }
      .border-${name}-light{
        border-color: ${this.rgba(color, 0.5)} !important;
      }
      .bg-${name} {
        background-color: ${color} !important;
      }
      .bg-${name}-0-4{
        background: ${this.rgba(color, 0.4)} !important;
      }
      .bg-${name}-0-1{
        background: ${this.rgba(color, 0.1)} !important;
      }
      .box-shadow-${name}{
        box-shadow: 0px 3px 6px ${this.rgba(color, 0.3)} !important;
      }
      a.bg-${name}:hover, a.bg-${name}:focus,
      button.bg-${name}:hover,
      button.bg-${name}:focus {
        background-color: ${this.darken(color, 20)} !important;
      }
      .list-group-item-${name} {
        color: ${this.darken(color, 47.5)};
        background-color: ${this.lighten(color, 72.5)};
      }
      .list-group-item-${name}.list-group-item-action:hover, .list-group-item-${name}.list-group-item-action:focus {
        color: ${this.darken(color, 47.5)};
        background-color: ${this.lighten(color, 62.5)};
      }
      .list-group-item-${name}.list-group-item-action.active {
        color: ${textColor};
        background-color: ${this.darken(color, 47.5)};
        border-color: ${this.darken(color, 47.5)};
      }
      .alert-${name} {
        color: ${this.darken(color, 47.5)};
        background-color: ${this.lighten(color, 80)};
        border-color: ${this.lighten(color, 72.5)};
      }
      .alert-${name} hr {
        border-top-color: ${this.lighten(color, 62.5)};
      }
      .alert-${name} .alert-link {
        color: ${this.darken(color, 67.5)};
      }
      .badge-${name} {
        color: ${textColor};
        background-color: ${color};
      }
      .badge-${name}[href]:hover, .badge-${name}[href]:focus {
        color: ${textColor};
        background-color: ${this.darken(color, 20)};
      }
      .btn-outline-${name} {
        color: ${color};
        border-color: ${color};
      }
      .btn-outline-${name}:hover {
        color: ${textColor};
        background-color: ${color};
        border-color: ${color};
      }
      .btn-outline-${name}:focus, .btn-outline-${name}.focus {
        box-shadow: 0 0 0 0.2rem ${this.rgba(color, 0.5)};
      }
      .btn-outline-${name}.disabled, .btn-outline-${name}:disabled {
        color: ${color};
      }
      .btn-outline-${name}:not(:disabled):not(.disabled):active, .btn-outline-${name}:not(:disabled):not(.disabled).active,
      .show > .btn-outline-${name}.dropdown-toggle {
        color: ${textColor};
        background-color: ${color};
        border-color: ${color};
      }
      .btn-outline-${name}:not(:disabled):not(.disabled):active:focus, .btn-outline-${name}:not(:disabled):not(.disabled).active:focus,
      .show > .btn-outline-${name}.dropdown-toggle:focus {
        box-shadow: 0 0 0 0.2rem ${this.rgba(color, 0.5)};
      }
      .btn-${name} {
        color: ${textColor};
        background-color: ${color};
        border-color: ${color};
      }
      .btn-${name}:hover {
        color: ${textColor};
        background-color: ${this.darken(color, 15)};
        border-color: ${this.darken(color, 20)};
      }
      .btn-${name}:focus, .btn-${name}.focus {
        box-shadow: 0 0 0 0.2rem ${this.rgba(color, 0.5)};
      }
      .btn-${name}.disabled, .btn-${name}:disabled {
        color: ${textColor};
        background-color: ${color};
        border-color: ${color};
      }
      .btn-${name}:not(:disabled):not(.disabled):active, .btn-${name}:not(:disabled):not(.disabled).active,
      .show > .btn-${name}.dropdown-toggle {
        color: ${textColor};
        background-color: ${this.darken(color, 20)};
        border-color: ${this.darken(color, 25)};
      }
      .btn-${name}:not(:disabled):not(.disabled):active:focus, .btn-${name}:not(:disabled):not(.disabled).active:focus,
      .show > .btn-${name}.dropdown-toggle:focus {
        box-shadow: 0 0 0 0.2rem ${this.rgba(color, 0.5)};
      }
      .table-${name},
      .table-${name} > th,
      .table-${name} > td {
        background-color: ${this.lighten(color, 72.5)};
      }
      .table-hover .table-${name}:hover {
        background-color: ${this.lighten(color, 62.5)};
      }
      .table-hover .table-${name}:hover > td,
      .table-hover .table-${name}:hover > th {
        background-color: ${this.lighten(color, 62.5)};
      }`;
  }

  getPrimaryStyle(theme: Theme) {
    const color = theme.color;
    const textColor = theme.textColor;
    return `
      .fill-primary{
        fill: ${color};
      }
      a {
        color: ${color};
      }
      a:hover {
        color: ${this.darken(color, 30)};
      }
      .form-control:focus {
        border-color: ${this.lighten(color, 50)};
        box-shadow: 0 0 0 0.2rem ${this.rgba(color, 0.25)};
      }
      .btn:focus, .btn.focus {
        outline: 0;
        box-shadow: 0 0 0 0.2rem ${this.rgba(color, 0.25)};
      }
      .btn-link {
        color: ${color};
      }
      .btn-link:hover {
        color: ${this.darken(color, 30)};
      }
      .dropdown-item.active, .dropdown-item:active {
        background-color: ${color};
        color: ${textColor};
      }
      .custom-control-input ~ .custom-control-label::before {
        border: 1px solid ${color};
        background-color: ${this.rgba(color, 0.15)};
      }
      .custom-control-input:checked ~ .custom-control-label::before {
        border: 1px solid ${color};
        color: ${textColor};
        background-color: ${color};
      }
      .custom-control-input:active ~ .custom-control-label::before {
        background-color: ${this.lighten(color, 70)};
      }
      .custom-checkbox .custom-control-input:checked ~ .custom-control-label::before {
        border: 1px solid ${color};
        color: ${textColor};
        background-color: ${color};
      }
      .custom-control-input:focus ~ .custom-control-label::before {
        box-shadow: 0 0 0 1px ${textColor}, 0 0 0 0.2rem ${this.rgba(color, 0.25)};
      }
      .custom-checkbox .custom-control-input:indeterminate ~ .custom-control-label::before {
        background-color: ${color};
      }
      .custom-checkbox .custom-control-input:disabled:checked ~ .custom-control-label::before {
        background-color: ${this.rgba(color, 0.5)};
      }
      .custom-checkbox .custom-control-input:disabled:indeterminate ~ .custom-control-label::before {
        background-color: ${this.rgba(color, 0.5)};
      }
      .custom-radio .custom-control-input:checked ~ .custom-control-label::before {
        background-color: ${color};
      }
      .custom-radio .custom-control-input:disabled:checked ~ .custom-control-label::before {
        background-color: ${this.rgba(color, 0.5)};
      }
      .custom-select:focus {
        border-color: ${this.lighten(color, 50)};
        box-shadow: inset 0 1px 2px this.rgba(0, 0, 0, 0.075), 0 0 5px ${this.rgba(this.lighten(color, 50), 0.5)};
      }
      .custom-file-input:focus ~ .custom-file-control {
        border-color: ${this.lighten(color, 50)};
        box-shadow: 0 0 0 0.2rem ${this.rgba(color, 0.25)};
      }
      .custom-file-input:focus ~ .custom-file-control::before {
        border-color: ${this.lighten(color, 50)};
      }
      .list-group-item.active {
        color: ${textColor};
        background-color: ${color};
        border-color: ${color};
      }`;
  }
  getDarkStyle(theme: Theme) {
    const color = theme.color;
    const textColor = theme.textColor;
    return `.table .thead-dark th {
        color: ${textColor};
        background-color: ${this.darken(color, 35)};
        border-color: ${this.darken(color, 2.5)};
      }
      .table .thead-light th {
        color: ${this.lighten(color, 12)};
      }
      .table-dark {
        color: ${textColor};
        background-color: ${this.darken(color, 35)};
      }
      .table-dark th,
      .table-dark td,
      .table-dark thead th {
        border-color: ${this.darken(color, 2.5)};
      }
      .form-control:focus {
        color: ${this.lighten(color, 12)};
        background-color: ${textColor};
      }
      select.form-control:focus::-ms-value {
        color: ${this.lighten(color, 12)};
        background-color: ${textColor};
      }
      .dropdown-item {
        color: ${this.darken(color, 35)};
      }
      .dropdown-item:hover, .dropdown-item:focus {
        color: ${this.darken(color, 57.5)};
      }
      .custom-select {
        color: ${this.lighten(color, 12)};
      }
      .custom-select:focus::-ms-value {
        color: ${this.lighten(color, 12)};
        background-color: ${textColor};
      }
      .custom-file-label {
        color: ${this.lighten(color, 12)};
        background-color: ${textColor};
      }
      .custom-file-label::after {
        color: ${this.lighten(color, 12)};
      }
      .list-group-item-action {
        color: ${this.lighten(color, 12)};
      }
      .list-group-item-action:hover, .list-group-item-action:focus {
        color: ${this.lighten(color, 12)};
      }
      .list-group-item-action:active {
        color: ${this.darken(color, 35)};
      }`;
  }

  getSuccessStyle(theme: Theme) {
    const color = theme.color;
    const textColor = theme.textColor;
    return `.valid-feedback {
        color: ${color};
      }
      .valid-tooltip {
        color: ${textColor};
        background-color: ${this.rgba(color, 0.8)};
      }
      .was-validated .form-control:valid, .form-control.is-valid, .was-validated
      .custom-select:valid,
      .custom-select.is-valid {
        border-color: ${color};
      }
      .was-validated .form-control:valid:focus, .form-control.is-valid:focus, .was-validated
      .custom-select:valid:focus,
      .custom-select.is-valid:focus {
        border-color: ${color};
        box-shadow: 0 0 0 0.2rem ${this.rgba(color, 0.25)};
      }
      .was-validated .form-check-input:valid ~
      .form-check-label, .form-check-input.is-valid ~ .form-check-label {
        color: ${color};
      }
      .was-validated .custom-control-input:valid ~
      .custom-control-label, .custom-control-input.is-valid ~ .custom-control-label {
        color: ${color};
      }
      .was-validated .custom-control-input:valid ~
      .custom-control-label::before, .custom-control-input.is-valid ~ .custom-control-label::before {
        background-color: ${this.lighten(color, 42.5)};
      }
      .was-validated .custom-control-input:valid:checked ~
      .custom-control-label::before, .custom-control-input.is-valid:checked ~
      .custom-control-label::before {
        background-color: ${this.lighten(color, 17.5)};
      }
      .was-validated .custom-control-input:valid:focus ~
      .custom-control-label::before, .custom-control-input.is-valid:focus ~
      .custom-control-label::before {
        box-shadow: 0 0 0 1px ${textColor}, 0 0 0 0.2rem ${this.rgba(color, 0.25)};
      }
      .was-validated .custom-file-input:valid ~
      .custom-file-label, .custom-file-input.is-valid ~ .custom-file-label {
        border-color: ${color};
      }
      .was-validated .custom-file-input:valid:focus ~
      .custom-file-label, .custom-file-input.is-valid:focus ~ .custom-file-label {
        box-shadow: 0 0 0 0.2rem ${this.rgba(color, 0.25)};
      }`;
  }
  getDangerStyle(theme: Theme) {
    const color = theme.color;
    const textColor = theme.textColor;
    return `.invalid-feedback {
        color: ${color};
      }
      .invalid-tooltip {
        color: ${textColor};
        background-color: ${this.rgba(color, 0.8)};
      }
      .was-validated .form-control:invalid, .form-control.is-invalid, .was-validated
      .custom-select:invalid,
      .custom-select.is-invalid {
        border-color: ${color};
      }
      .was-validated .form-control:invalid:focus, .form-control.is-invalid:focus, .was-validated
      .custom-select:invalid:focus,
      .custom-select.is-invalid:focus {
        border-color: ${color};
        box-shadow: 0 0 0 0.2rem ${this.rgba(color, 0.25)};
      }
      .was-validated .form-check-input:invalid ~
      .form-check-label, .form-check-input.is-invalid ~ .form-check-label {
        color: ${color};
      }
      .was-validated .custom-control-input:invalid ~
      .custom-control-label, .custom-control-input.is-invalid ~ .custom-control-label {
        color: ${color};
      }
      .was-validated .custom-control-input:invalid ~
      .custom-control-label::before, .custom-control-input.is-invalid ~ .custom-control-label::before {
        background-color: ${this.lighten(color, 42.5)};
      }
      .was-validated .custom-control-input:invalid:checked ~
      .custom-control-label::before, .custom-control-input.is-invalid:checked ~
      .custom-control-label::before {
        background-color: ${this.lighten(color, 17.5)};
      }
      .was-validated .custom-control-input:invalid:focus ~
      .custom-control-label::before, .custom-control-input.is-invalid:focus ~
      .custom-control-label::before {
        box-shadow: 0 0 0 1px ${textColor}, 0 0 0 0.2rem ${this.rgba(color, 0.25)};
      }
      .was-validated .custom-file-input:invalid ~
      .custom-file-label, .custom-file-input.is-invalid ~ .custom-file-label {
        border-color: ${color};
      }
      .was-validated .custom-file-input:invalid:focus ~
      .custom-file-label, .custom-file-input.is-invalid:focus ~ .custom-file-label {
        box-shadow: 0 0 0 0.2rem ${this.rgba(color, 0.25)};
      }`;
  }
  getDisabledStyle(theme: Theme) {
    const color = theme.color;
    const textColor = theme.textColor;
    return `
      .form-control:disabled, .form-control[readonly] {
        background-color: ${textColor};
      }
      .form-check-input:disabled ~ .form-check-label {
        color: ${color};
      }
      .btn-link:disabled, .btn-link.disabled {
        color: ${color};
      }
      .dropdown-item.disabled, .dropdown-item:disabled {
        color: ${color};
      }
      .custom-control-input:disabled ~ .custom-control-label {
        color: ${color};
      }
      .custom-select:disabled {
        color: ${color};
        background-color: ${textColor};
      }
      .custom-control-input:disabled ~ .custom-control-label::before {
        background-color: ${textColor};
      }
      .list-group-item.disabled, .list-group-item:disabled {
        color: ${color};
        background-color: ${textColor};
      }
      .text-muted {
        color: ${color} !important;
      }`;
  }
}

export class Colors {
  primary = '#007bff';
  secondary = '#6c757d';
  light = '#f8f9fa';
  dark = '#343a40';
  success = '#28a745';
  danger = '#dc3545';
  warning = '#ffc107';
  info = '#17a2b8';
  white = '#ffffff';
  inputDisabled = '#cccccc';
  inputBorder = '#cccccc';
  border = '#cccccc';
}

export class Theme {
  name: string;
  color: string;
  textColor: string;

  static getDefault() {
    const temp: Theme[] = [];
    temp.push({ color: '#3498db', name: 'primary', textColor: '#ffffff' });
    temp.push({ color: '#1383c6', name: 'primary-dark', textColor: '#ffffff' });
    temp.push({ color: '#6A7179', name: 'secondary', textColor: '#ffffff' });
    temp.push({ color: '#F4F5F5', name: 'light', textColor: '#202a36' });
    temp.push({ color: '#202a36', name: 'dark', textColor: '#ffffff' });
    temp.push({ color: '#1CAD49', name: 'success', textColor: '#ffffff' });
    temp.push({ color: '#db0404', name: 'danger', textColor: '#ffffff' });
    temp.push({ color: '#17a2b8', name: 'info', textColor: '#ffffff' });
    temp.push({ color: '#ffc107', name: 'warning', textColor: '#202a36' });
    return temp;
  }
}
