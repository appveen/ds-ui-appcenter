import { AfterContentInit, Directive, ElementRef } from '@angular/core';
import { Renderer2 } from '@angular/core';

import { ShortcutService } from 'src/app/shortcut/shortcut.service';

@Directive({
  selector: '[odpShortcut]'
})
export class ShortcutDirective implements AfterContentInit {

  constructor(private element: ElementRef, private renderer: Renderer2, private service: ShortcutService) {

  }

  ngAfterContentInit() {
    const self = this;
    self.renderer.listen('body', 'keydown', (event: KeyboardEvent) => {
      self.service.key.emit(event);
      if (event.ctrlKey && event.altKey) {
        self.altCtrlKey(event);
      } else if (event.ctrlKey && event.shiftKey) {
        self.ctrlShiftKey(event);
      } else if (event.altKey && event.shiftKey) {
        self.altShiftKey(event);
      } else if (event.ctrlKey) {
        self.ctrlKey(event);
      } else if (event.altKey) {
        self.altKey(event);
      } else if (event.shiftKey) {
        self.shiftKey(event);
      }
    });

    self.renderer.listen('body', 'paste', (event: ClipboardEvent) => {
      self.service.pasteEvent.emit(event);
    });
  }

  ctrlKey(event: KeyboardEvent) {
    const self = this;
    self.service.ctrlKey.emit(event);
    if (event.key === 'Enter') {
      self.service.ctrlEnterKey.emit(event);
    } else if (event.key === 's') {
      event.preventDefault();
      self.service.ctrlSKey.emit(event);
    } else if (event.key === 'ArrowDown') {
      self.service.ctrlDownArrowKey.emit(event);
    } else if (event.key === 'ArrowUp') {
      self.service.ctrlUpArrowKey.emit(event);
    } else if (event.key === 'ArrowLeft') {
      self.service.ctrlLeftArrowKey.emit(event);
    } else if (event.key === 'ArrowRight') {
      self.service.ctrlRightArrowKey.emit(event);
    }
  }

  altKey(event: KeyboardEvent) {
    const self = this;
    self.service.altKey.emit(event);
    if (event.key === 'Enter') {
      self.service.altEnterKey.emit(event);
    }
  }

  shiftKey(event: KeyboardEvent) {
    const self = this;
    self.service.shiftKey.emit(event);
    if (event.key === 'Enter') {
      self.service.shiftEnterKey.emit(event);
    }
  }

  altCtrlKey(event: KeyboardEvent) {

  }
  ctrlShiftKey(event: KeyboardEvent) {
    const self = this;
    if (event.key === 'S') {
      self.service.ctrlShiftSKey.emit(event);
    }
  }
  altShiftKey(event: KeyboardEvent) {

  }
}
