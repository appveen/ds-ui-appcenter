/// <reference path="../../../../node_modules/monaco-editor/monaco.d.ts" />
import { Component, Input, Output, EventEmitter, AfterViewInit, OnChanges, ViewEncapsulation, SimpleChanges } from '@angular/core';
import { timeout } from 'rxjs/operators';
import { AppService } from '../../service/app.service';
import * as _ from 'lodash';

let loadedMonaco = false;
let loadPromise: Promise<void>;

@Component({
  selector: 'odp-code-editor',
  templateUrl: './code-editor.component.html',
  styleUrls: ['./code-editor.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class CodeEditorComponent implements AfterViewInit, OnChanges {

  @Input() theme: string;
  @Input() fontSize: number;
  @Input() code: any;
  @Input() edit: { status: boolean, id?: string };
  @Input() oldVal: any;
  @Input() newVal: any;
  @Input() diff: boolean;

  @Output() codeChange: EventEmitter<string>;
  @Output() codeError: EventEmitter<boolean>;
  codeEditorInstance: monaco.editor.IStandaloneCodeEditor;
  diffEditorInstance: monaco.editor.IStandaloneDiffEditor;


  typesString: string;
  constructor(private appService: AppService) {
    this.theme = 'vs-light';
    this.fontSize = 14;
    this.edit = { status: false };
    this.codeChange = new EventEmitter();
    this.codeError = new EventEmitter();
  }

  ngAfterViewInit(): void {
    if (loadedMonaco) {
      // Wait until monaco editor is available
      loadPromise.then(() => {
        this.initMonaco();
      });
    } else {
      loadedMonaco = true;
      loadPromise = new Promise<void>((resolve: any) => {
        if (typeof ((window as any).monaco) === 'object') {
          resolve();
          return;
        }
        const onAmdLoader: any = () => {
          // Load monaco
          (window as any).require.config({ paths: { 'vs': 'assets/monaco/vs' } });

          (window as any).require(['vs/editor/editor.main'], () => {
            this.initMonaco();
            resolve();
          });
        };

        // Load AMD loader if necessary
        if (!(window as any).require) {
          const loaderScript: HTMLScriptElement = document.createElement('script');
          loaderScript.type = 'text/javascript';
          loaderScript.src = 'assets/monaco/vs/loader.js';
          loaderScript.addEventListener('load', onAmdLoader);
          document.body.appendChild(loaderScript);
        } else {
          onAmdLoader();
        }
      });
    }
    this.appService.updateCodeEditorState.subscribe(() => {
      if (this.codeEditorInstance) {
        this.codeEditorInstance.updateOptions({ fontSize: this.fontSize, theme: this.theme, readOnly: !this.edit.status });
      }
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.codeEditorInstance) {
      this.codeEditorInstance.updateOptions({ fontSize: this.fontSize, theme: this.theme, readOnly: !this.edit.status });
    }
    if (changes.oldVal || changes.diff || changes.newVal) {
      if ((!_.isEqual(changes.oldVal.currentValue, changes.oldVal.previousValue)) ||
        (!_.isEqual(changes.newVal.currentValue, changes.newVal.previousValue))) {

        this.newVal = changes.newVal.currentValue;
        this.oldVal = changes.oldVal.currentValue;
        this.diffMode();

      }
    }
  }

  diffMode() {
    var originalModel = monaco.editor.createModel(
      JSON.stringify(this.newVal, null, '\t'),
      'json'
    );
    var modifiedModel = monaco.editor.createModel(
      JSON.stringify(this.oldVal, null, '\t'),
      'json'
    );
    if (!this.diffEditorInstance) {
      this.createDiffInstance()
    }
    this.diffEditorInstance.setModel({
      original: originalModel,
      modified: modifiedModel
    });

    this.diffEditorInstance.layout();
  }

  strCode(code) {
    let stringifiedCode = "{}";
    if (code != null) {
      stringifiedCode = JSON.stringify(code, null, '\t');
    }
    else {
      stringifiedCode = "{\n\t\n}"
    }
    return stringifiedCode;
  }

  createDiffInstance() {
    this.diffEditorInstance = monaco.editor.createDiffEditor(document.getElementById('code-editor'), {
      enableSplitViewResizing: false,
      theme: this.theme,
      automaticLayout: true,
      scrollBeyondLastLine: false,
      fontSize: this.fontSize,
      readOnly: !this.edit.status,
      contextmenu: this.edit.status
    });
  }

  initMonaco(): void {
    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: true,
      noSyntaxValidation: false,
    });
    monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
      lib: ['es5'],
      target: monaco.languages.typescript.ScriptTarget.ES2020,
      allowNonTsExtensions: true,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
    });

    monaco.editor.getModels().forEach(model => model.dispose());
    const modelUri = monaco.Uri.parse("json://grid/settings.json");

    if (!this.diff) {
      const jsonModel = monaco.editor.createModel(this.strCode(this.code), "json", modelUri);
      this.codeEditorInstance = monaco.editor.create(document.getElementById('code-editor'), {
        model: jsonModel,
        language: 'javascript',
        theme: this.theme,
        automaticLayout: true,
        scrollBeyondLastLine: false,
        fontSize: this.fontSize,
        readOnly: !this.edit.status,
        contextmenu: this.edit.status
      });

      this.codeEditorInstance.getModel().onDidChangeContent(e => {
        const val = this.codeEditorInstance.getValue();
        if (this.isJSON(val)) {
          this.codeError.emit(false);
          this.codeChange.emit(JSON.parse(val));
        }
        else {
          this.codeError.emit(true);
        }
      });

      this.codeEditorInstance.layout();

    } else {
      var originalModel = monaco.editor.createModel(
        JSON.stringify(this.newVal, null, '\t'),
        'json'
      );
      var modifiedModel = monaco.editor.createModel(
        JSON.stringify(this.oldVal, null, '\t'),
        'json'
      );
      this.createDiffInstance();
      this.diffEditorInstance.setModel({
        original: originalModel,
        modified: modifiedModel
      });

      this.diffEditorInstance.layout();
    }

  }

  isJSON(str) {
    try {
      return (JSON.parse(str) && !!str);
    } catch (e) {
      return false;
    }
  }
}
