import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppSwitcherIconComponent } from './app-switcher-icon/app-switcher-icon.component';
import { AppIconComponent } from './app-icon/app-icon.component';
import { AgentIconComponent } from 'src/app/utils/icons/agent-icon/agent-icon.component';
import { PartnerIconComponent } from 'src/app/utils/icons/partner-icon/partner-icon.component';

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [AppSwitcherIconComponent, AppIconComponent, AgentIconComponent, PartnerIconComponent],
  exports: [AppSwitcherIconComponent, AppIconComponent, AgentIconComponent, PartnerIconComponent]
})
export class IconsModule { }
