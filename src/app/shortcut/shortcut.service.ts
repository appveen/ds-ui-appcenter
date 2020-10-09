import { Injectable, EventEmitter } from '@angular/core';

@Injectable()
export class ShortcutService {

  key: EventEmitter<KeyboardEvent>;
  enterKey: EventEmitter<KeyboardEvent>;
  shiftEnterKey: EventEmitter<KeyboardEvent>;
  altEnterKey: EventEmitter<KeyboardEvent>;
  ctrlEnterKey: EventEmitter<KeyboardEvent>;
  ctrlCKey: EventEmitter<KeyboardEvent>;
  ctrlVKey: EventEmitter<KeyboardEvent>;
  ctrlSKey: EventEmitter<KeyboardEvent>;
  ctrlShiftSKey: EventEmitter<KeyboardEvent>;

  ctrlDownArrowKey: EventEmitter<KeyboardEvent>;
  ctrlUpArrowKey: EventEmitter<KeyboardEvent>;
  ctrlLeftArrowKey: EventEmitter<KeyboardEvent>;
  ctrlRightArrowKey: EventEmitter<KeyboardEvent>;

  ctrlKey: EventEmitter<KeyboardEvent>;
  altKey: EventEmitter<KeyboardEvent>;
  shiftKey: EventEmitter<KeyboardEvent>;

  pasteEvent: EventEmitter<ClipboardEvent>;
  constructor() {
    const self = this;
    self.key = new EventEmitter<KeyboardEvent>();
    self.enterKey = new EventEmitter<KeyboardEvent>();
    self.shiftEnterKey = new EventEmitter<KeyboardEvent>();
    self.ctrlEnterKey = new EventEmitter<KeyboardEvent>();
    self.altEnterKey = new EventEmitter<KeyboardEvent>();
    self.ctrlCKey = new EventEmitter<KeyboardEvent>();
    self.ctrlVKey = new EventEmitter<KeyboardEvent>();
    self.ctrlSKey = new EventEmitter<KeyboardEvent>();
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

}
