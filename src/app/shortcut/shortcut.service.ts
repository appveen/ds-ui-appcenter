import { Injectable, EventEmitter } from '@angular/core';

@Injectable()
export class ShortcutService {
  key: EventEmitter<KeyboardEvent>;
  enterKey: EventEmitter<KeyboardEvent>;
  shiftEnterKey: EventEmitter<KeyboardEvent>;
  shiftDotKey: EventEmitter<KeyboardEvent>;
  shiftCommaKey: EventEmitter<KeyboardEvent>;
  shiftAKey: EventEmitter<KeyboardEvent>;
  shiftRKey: EventEmitter<KeyboardEvent>;
  shiftWKey: EventEmitter<KeyboardEvent>;
  shiftHKey: EventEmitter<KeyboardEvent>;
  shiftXKey: EventEmitter<KeyboardEvent>;
  shiftFKey: EventEmitter<KeyboardEvent>;
  altShiftFKey: EventEmitter<KeyboardEvent>;
  altEnterKey: EventEmitter<KeyboardEvent>;
  ctrlEnterKey: EventEmitter<KeyboardEvent>;
  ctrlCKey: EventEmitter<KeyboardEvent>;
  ctrlVKey: EventEmitter<KeyboardEvent>;
  ctrlSKey: EventEmitter<KeyboardEvent>;
  ctrlAKey: EventEmitter<KeyboardEvent>;
  ctrlShiftSKey: EventEmitter<KeyboardEvent>;

  ctrlDownArrowKey: EventEmitter<KeyboardEvent>;
  ctrlUpArrowKey: EventEmitter<KeyboardEvent>;
  ctrlLeftArrowKey: EventEmitter<KeyboardEvent>;
  ctrlRightArrowKey: EventEmitter<KeyboardEvent>;

  ctrlKey: EventEmitter<KeyboardEvent>;
  altKey: EventEmitter<KeyboardEvent>;
  shiftKey: EventEmitter<KeyboardEvent>;

  pasteEvent: EventEmitter<ClipboardEvent>;

  private availableShortcuts: Array<IAvailableShortcut> = [];
  componentWidth: number;

  constructor() {
    const self = this;
    self.key = new EventEmitter<KeyboardEvent>();
    self.enterKey = new EventEmitter<KeyboardEvent>();
    self.shiftEnterKey = new EventEmitter<KeyboardEvent>();
    self.shiftDotKey = new EventEmitter<KeyboardEvent>();
    self.shiftCommaKey = new EventEmitter<KeyboardEvent>();
    self.shiftAKey = new EventEmitter<KeyboardEvent>();
    self.shiftRKey = new EventEmitter<KeyboardEvent>();
    self.shiftWKey = new EventEmitter<KeyboardEvent>();
    self.shiftHKey = new EventEmitter<KeyboardEvent>();
    self.shiftXKey = new EventEmitter<KeyboardEvent>();
    self.shiftFKey = new EventEmitter<KeyboardEvent>();
    self.altShiftFKey = new EventEmitter<KeyboardEvent>();
    self.ctrlEnterKey = new EventEmitter<KeyboardEvent>();
    self.altEnterKey = new EventEmitter<KeyboardEvent>();
    self.ctrlCKey = new EventEmitter<KeyboardEvent>();
    self.ctrlVKey = new EventEmitter<KeyboardEvent>();
    self.ctrlSKey = new EventEmitter<KeyboardEvent>();
    self.ctrlAKey = new EventEmitter<KeyboardEvent>();
    self.ctrlShiftSKey = new EventEmitter<KeyboardEvent>();
    self.ctrlDownArrowKey = new EventEmitter<KeyboardEvent>();
    self.ctrlUpArrowKey = new EventEmitter<KeyboardEvent>();
    self.ctrlLeftArrowKey = new EventEmitter<KeyboardEvent>();
    self.ctrlRightArrowKey = new EventEmitter<KeyboardEvent>();
    self.ctrlKey = new EventEmitter<KeyboardEvent>();
    self.altKey = new EventEmitter<KeyboardEvent>();
    self.shiftKey = new EventEmitter<KeyboardEvent>();
    self.pasteEvent = new EventEmitter<ClipboardEvent>();
  }

  getAvailableShortcuts(): Array<IAvailableShortcut> {
    return this.availableShortcuts;
  }

  registerShortcut(shortcut: IAvailableShortcut) {
    this.availableShortcuts = [
      ...this.availableShortcuts,
      shortcut
    ]
  }

  unregisterAllShortcuts(nextWidth?: number) {
    this.availableShortcuts = [];
    if (!!nextWidth) {
      this.componentWidth = nextWidth;
    }
  }

  getComponentWidth() {
    return this.componentWidth;
  }

}


interface IAvailableShortcut {
  section: string;
  label: string;
  keys: Array<string>
}