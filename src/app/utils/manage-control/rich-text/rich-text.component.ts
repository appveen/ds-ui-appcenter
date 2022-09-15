import {
    Component,
    OnInit,
    AfterViewInit,
    EventEmitter,
    OnDestroy,
    Input,
    Output
} from '@angular/core';
import { FormControl } from '@angular/forms';

import 'tinymce';
import 'tinymce/themes/silver/theme.js';

import 'tinymce/plugins/table';
import 'tinymce/plugins/link';
import 'tinymce/plugins/print';
import 'tinymce/plugins/preview';
import 'tinymce/plugins/fullpage';
import 'tinymce/plugins/searchreplace';
import 'tinymce/plugins/autolink';
import 'tinymce/plugins/directionality';
import 'tinymce/plugins/visualblocks';
import 'tinymce/plugins/visualchars';
import 'tinymce/plugins/fullscreen';
import 'tinymce/plugins/image';
import 'tinymce/plugins/media';
import 'tinymce/plugins/template';
// import 'tinymce/plugins/codesample';
import 'tinymce/plugins/charmap';
import 'tinymce/plugins/hr';
import 'tinymce/plugins/pagebreak';
import 'tinymce/plugins/nonbreaking';
import 'tinymce/plugins/anchor';
import 'tinymce/plugins/toc';
import 'tinymce/plugins/insertdatetime';
import 'tinymce/plugins/advlist';
import 'tinymce/plugins/lists';
import 'tinymce/plugins/wordcount';
import 'tinymce/plugins/imagetools';
import 'tinymce/plugins/textpattern';

import { DomSanitizer } from '@angular/platform-browser';
import { AppService } from 'src/app/service/app.service';

declare let tinymce: any;

@Component({
    selector: 'odp-rich-text',
    templateUrl: './rich-text.component.html',
    styleUrls: ['./rich-text.component.scss']
})
export class RichTextComponent implements OnInit, AfterViewInit, OnDestroy {

    @Input() control: FormControl;
    @Input() definition: any;
    @Input() first: boolean;
    @Output() keyupEvent: EventEmitter<KeyboardEvent>;
    usedTokens: any;
    editor: any;

    constructor(private domSanitizer: DomSanitizer,
        private appService: AppService) {
        const self = this;
        self.usedTokens = {};
        self.keyupEvent = new EventEmitter();
    }



    ngOnInit() {
        const self = this;
        self.control?.statusChanges.subscribe(eve => {
            if (self.control?.enabled) {
                tinymce.get(self.Id)?.show();
            } else {
                tinymce.get(self.Id)?.hide();
            }

        })
    }

    ngAfterViewInit() {
        const self = this;
        const plugins = ['print', 'preview', 'fullpage', 'searchreplace',
            'autolink', 'directionality', 'visualblocks', 'visualchars', 'fullscreen',
            'image', 'link', 'media', 'template', 'table', 'charmap', 'hr', 'pagebreak', 'nonbreaking',
            'anchor', 'toc', 'insertdatetime', 'advlist', 'lists', 'wordcount',
            , 'imagetools', 'textpattern', 'image imagetools'];

        const toolbar = 'formatselect | bold italic strikethrough forecolor backcolor | link | alignleft aligncenter' +
            'alignright alignjustify  | numlist bullist outdent indent  | removeformat | image |  underline insertfile | addcomment';
        let selector = '#' + self.definition.camelCase; //+ 'rich';

        if (self.definition.id) {
            const id = self.definition.id.replace('.', '');
            selector = '#' + id; //+ 'rich';
        }
        selector = selector.replace('.', '');
        tinymce.init({
            selector: selector,
            // selector: '.editor',
            plugins,
            toolbar,
            base_url: '/appcenter/assets',
            setup: editor => {
                self.editor = editor;
                editor.on('keyup change', ($event) => {
                    const content = editor.getContent();
                    self.setContent(content);
                });
            }
        });
        if (self.control && self.control?.value && self.editor) {
            self.editor.setContent(self.control?.value);

        }
        if (self.control?.enabled) {
            tinymce.get(self.Id).show();
        } else {
            tinymce.get(self.Id).hide();
        }


    }

    ngOnDestroy() {
        const self = this;
        tinymce.remove(self.editor);
    }

    setContent(val) {
        const self = this;
        const tokens = (self.definition.properties).hasTokens;
        if (tokens && tokens.length > 0) {
            for (const tok of tokens) {
                const regex = new RegExp('(.*)(' + tok.replace(/[-[\]{}()*+?.,%\\^$|#\s]/g, '\\$&') + ')(.*)', 'g');
                if (val.match(regex)) {
                    self.usedTokens[tok] = true;
                } else {
                    self.usedTokens[tok] = false;
                }
            }
        }
        self.control?.patchValue(val);
        self.control?.markAsDirty();
    }

    putToken(token) {
        const self = this;
        self.usedTokens[token] = true;
        self.editor.insertContent(token);
    }

    onKeyup(event: KeyboardEvent) {
        const self = this;
        self.keyupEvent.emit(event);
    }
    getContent(val: string) {
        const self = this;
        let temp = val + '';
        if (self.definition.properties.hasTokens) {
            for (const tok of self.definition.properties.hasTokens) {
                const regex = new RegExp('(.*)(' + tok.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&') + ')(.*)', 'g');
                temp = temp.replace(regex, '$1' + '<span class="text-info font-weight-bold">$2</span>' + '$3');
            }
        }
        return self.domSanitizer.bypassSecurityTrustHtml(val);
    }


    hasContent(val: string) {
        const doc = new DOMParser().parseFromString(val, 'text/html');
        if (doc.body.textContent && doc.body.textContent.trim()) {
            return true;
        }
        return false;
    }
    get Id() {
        const self = this;
        let retVal = self.definition.camelCase; // + 'rich';
        if (self.definition.id) {
            const id = self.definition.id.replace('.', '');
            retVal = id; // + 'rich';
        }
        retVal = retVal.replace('.', '');

        return retVal;
    }

    get requiredError() {
        const self = this;
        return self.control?.hasError('required') && self.control?.touched;
    }
}
