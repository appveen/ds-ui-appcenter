import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {AppSwitcherComponent} from './app-switcher.component';
import {IconsModule} from 'src/app/utils/icons/icons.module';
import {PipesModule} from 'src/app/pipes/pipes.module';
import { SearchBoxModule } from '../search-box/search-box.module';
import { ClickOutsideModule } from 'src/app/directive/click-outside/click-outside.module';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

@NgModule({
    imports: [
        CommonModule,
        NgbModule,
        FormsModule,
        IconsModule,
        PipesModule,
        SearchBoxModule,
        ClickOutsideModule
    ],
    declarations: [AppSwitcherComponent],
    exports: [AppSwitcherComponent]
})
export class AppSwitcherModule {
}
