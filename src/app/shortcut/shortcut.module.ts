import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ShortcutService } from 'src/app/shortcut/shortcut.service';
import { ShortcutDirective } from 'src/app/shortcut/shortcut.directive';

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [ShortcutDirective],
  exports: [ShortcutDirective],
  providers: [ShortcutService]
})
export class ShortcutModule { }
