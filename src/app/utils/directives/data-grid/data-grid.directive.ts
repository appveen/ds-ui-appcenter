import {
  Directive,
  Input,
  Output,
  EventEmitter,
  ElementRef,
  Renderer2,
  AfterViewInit,
  AfterContentChecked,
  HostListener,
  DoCheck,
  KeyValueDiffer,
  KeyValueDiffers,
  KeyValueChangeRecord
} from '@angular/core';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { AppService } from 'src/app/service/app.service';

@Directive({
  selector: '[odpDataGrid]'
})
export class DataGridDirective implements AfterViewInit, AfterContentChecked, DoCheck {

  @Input() sortModel: any;
  @Output() sortModelChange: EventEmitter<any>;
  @Input() columns: Array<DataGridColumn>;
  @Output() columnsChange: EventEmitter<Array<DataGridColumn>>;
  @Output() loadData: EventEmitter<any>;
  private pageSize: number;
  private differ: KeyValueDiffer<string, any>;
  private allColWidth: number;
  private viewWidth: number;
  private maxScrollLeft: number;
  private debouncer: Subject<any>;
  private dragStartIndex: number;
  constructor(private table: ElementRef,
    private renderer: Renderer2,
    private keyValue: KeyValueDiffers,
    private appService: AppService) {
    this.sortModel = {};
    this.columns = [];
    this.columnsChange = new EventEmitter();
    this.loadData = new EventEmitter();
    this.sortModelChange = new EventEmitter();
    this.allColWidth = 0;
    this.pageSize = 30;
    this.debouncer = new Subject();
    this.debouncer
      .pipe(debounceTime(200))
      .subscribe((val) => this.loadData.emit(val));
  }

  ngAfterViewInit() {
    const self = this;
    self.differ = self.keyValue.find(self.sortModel).create();
    const thead: HTMLElement = self.table.nativeElement.querySelector('.data-grid-header');
    const tbody: HTMLElement = self.table.nativeElement.querySelector('.data-grid-body');
    const theadCells: NodeListOf<HTMLElement> = self.table.nativeElement
      .querySelectorAll('.data-grid-header>.data-grid-row:first-child>.data-grid-cell');
    self.renderer.listen(thead, 'scroll', (event: Event) => {
      const target: HTMLElement = event.target as HTMLElement;
      tbody.scrollLeft = target.scrollLeft;
    });
    self.renderer.listen(tbody, 'scroll', (event: Event) => {
      const target: HTMLElement = event.target as HTMLElement;
      if (self.maxScrollLeft < target.scrollLeft) {
        thead.scrollLeft = self.maxScrollLeft;
        tbody.scrollLeft = self.maxScrollLeft;
      } else {
        thead.scrollLeft = target.scrollLeft;
      }
      if (tbody.clientHeight + target.scrollTop === tbody.scrollHeight) {
        const nextPage = Math.floor(tbody.scrollHeight / 32 / self.pageSize) + 1;
        self.debouncer.next(nextPage);
      }
    });

    self.renderer.listen(tbody, 'wheel', (event: any) => {
      const tempLeftScroll = thead.scrollLeft + event.deltaX;
      const tempTopScroll = tbody.scrollTop + event.deltaY;
      if (self.maxScrollLeft < tempLeftScroll) {
        thead.scrollLeft = self.maxScrollLeft;
        tbody.scrollLeft = self.maxScrollLeft;
      } else {
        thead.scrollLeft = tempLeftScroll;
        tbody.scrollLeft = tempLeftScroll;
      }
      if (Math.abs(event.deltaY) > 5) {
        tbody.scrollTop = tempTopScroll;
      }
    });
    self.setBodyDimensions();
    for (let i = 0; i < theadCells.length; i++) {
      const node = theadCells.item(i);
      const oldData = self.columns.find(e => e.dataKey === node.id);
      node.dataset.sequenceNo = (i + 1) + '';
      if (oldData) {
        if (!oldData.width) {
          if (oldData.checkbox || oldData.dataKey === '_checkbox' || oldData.type === 'Checkbox') {
            oldData.width = 48;
          } else {
            oldData.width = 200;
          }
        }
        node.style.minWidth = oldData.width + 'px';
        node.style.maxWidth = oldData.width + 'px';
        if (oldData.sequenceNo !== undefined) {
          node.dataset.sequenceNo = oldData.sequenceNo + '';
        } else {
          oldData.sequenceNo = parseInt(node.dataset.sequenceNo, 10);
        }
      } else {
        if (node.classList.contains('checkbox-cell')) {
          node.style.minWidth = '48px';
          node.style.maxWidth = '48px';
        } else {
          node.style.minWidth = '200px';
          node.style.maxWidth = '200px';
        }
      }
      self.allColWidth += node.clientWidth;
      self.addSortListener(node);
      self.addUtilityIcon(node);
    }
    self.addListeners();
    self.appService.dataGridColumns = self.columns;
  }

  ngAfterContentChecked() {
    const self = this;
    if (!self.selectedColumn) {
      if (self.viewWidth > self.allColWidth) {
        const temp = self.columns[self.columns.length - 1];
        temp.width = temp.width + (self.viewWidth - self.allColWidth);
      }
      self.setBodyDimensions();
      self.setSequenceNo();
      self.columns.forEach(col => {
        if (!col.width) {
          if (col.checkbox || col.dataKey === '_checkbox' || col.type === 'Checkbox') {
            col.width = 48;
          } else {
            col.width = 200;
          }
        }
      });
      self.allColWidth = 0;
      self.columns.filter(e => e.show).forEach((item, i) => {
        if (item.width) {
          self.changeColumnWidth(i + 1, item.width);
        }
        self.allColWidth += item.width;
      });
    }
  }

  ngDoCheck() {
    if (this.differ) {
      const changes = this.differ.diff(this.sortModel);
      if (changes) {
        changes.forEachRemovedItem((value: KeyValueChangeRecord<string, any>) => {
          const node: HTMLElement = this.table.nativeElement
            .querySelector(`.data-grid-header>.data-grid-row:first-child>.data-grid-cell#${value.key}`);
          if (node) {
            this.toggleSortIcon(node, true);
          }
        });
      }
    }
  }

  private setSequenceNo() {
    const self = this;
    const theadCells: NodeListOf<HTMLElement> = this.table.nativeElement
      .querySelectorAll('.data-grid-header>.data-grid-row:first-child>.data-grid-cell');
    for (let i = 0; i < theadCells.length; i++) {
      const node = theadCells.item(i);
      const oldData = this.columns.find(e => e.dataKey === node.id);
      node.dataset.sequenceNo = (i + 1) + '';
      if (oldData) {
        if (oldData.sequenceNo !== undefined) {
          node.dataset.sequenceNo = oldData.sequenceNo + '';
        } else {
          oldData.sequenceNo = parseInt(node.dataset.sequenceNo, 10);
        }
      }
    }
  }

  private setBodyDimensions() {
    const self = this;
    const thead: HTMLElement = this.table.nativeElement.querySelector('.data-grid-header');
    const tbody: HTMLElement = this.table.nativeElement.querySelector('.data-grid-body');
    thead.style.minWidth = (this.table.nativeElement.parentElement.clientWidth) + 'px';
    thead.style.maxWidth = (this.table.nativeElement.parentElement.clientWidth) + 'px';
    tbody.style.minHeight = (this.table.nativeElement.parentElement.clientHeight - thead.clientHeight - 1) + 'px';
    tbody.style.maxHeight = (this.table.nativeElement.parentElement.clientHeight - thead.clientHeight - 1) + 'px';
    self.viewWidth = this.table.nativeElement.parentElement.clientWidth;
    self.maxScrollLeft = thead.scrollWidth - thead.clientWidth;
  }

  private toggleSortIcon(node: HTMLElement, remove?: boolean) {
    let sortType;
    let sortInfo = node.querySelector('.sort-info');
    if (remove) {
      if (sortInfo) {
        sortInfo.remove();
      }
      return;
    }
    if (!sortInfo) {
      sortInfo = document.createElement('span');
      sortInfo.classList.add('sort-info');
      sortInfo.classList.add('ml-2');
      sortInfo.classList.add('fa');
      sortInfo.classList.add('fa-long-arrow-alt-up');
      const temp = node.querySelector('.utility-icons');
      if (temp) {
        temp.prepend(sortInfo);
      } else {
        node.prepend(sortInfo);
      }
      sortType = 'asc';
    } else if (sortInfo.classList.contains('fa-long-arrow-alt-up')) {
      sortInfo.classList.remove('fa-long-arrow-alt-up');
      sortInfo.classList.add('fa-long-arrow-alt-down');
      sortType = 'desc';
    } else {
      sortInfo.remove();
      sortType = null;
    }
    if (!sortType) {
      delete this.sortModel[node.id];
    } else {
      this.sortModel[node.id] = sortType;
    }
  }

  private addDragListener() {
    const theadCells: NodeListOf<HTMLElement> = this.table.nativeElement
      .querySelectorAll('.data-grid-header>.data-grid-row:first-child>.data-grid-cell');
    for (let i = 0; i < theadCells.length; i++) {
      const node = theadCells.item(i);
      if (!node.classList.contains('no-move')) {
        node.removeEventListener('dragenter', () => { });
        node.removeEventListener('dragstart', () => { });
        this.renderer.listen(node, 'dragenter', (event: DragEvent) => {
          event.preventDefault();
          this.switchCells(this.dragStartIndex, this.dragStartIndex > i);
        });
        this.renderer.listen(node, 'dragstart', (event: DragEvent) => {
          this.dragStartIndex = i;
        });
      }
    }
  }

  private addSortListener(node: HTMLElement) {
    if (!node.classList.contains('no-sort')) {
      const textWrapper = document.createElement('div');
      textWrapper.classList.add('d-flex');
      textWrapper.classList.add('align-items-center');
      textWrapper.classList.add('w-100');
      textWrapper.classList.add('text-wrapper');
      textWrapper.classList.add('text-truncate');
      textWrapper.classList.add('noselect');
      textWrapper.innerText = node.innerText;
      textWrapper.style.minHeight = node.clientHeight + 'px';
      textWrapper.style.maxHeight = node.clientHeight + 'px';
      node.innerText = null;
      node.appendChild(textWrapper);
      textWrapper.removeEventListener('click', () => { });
      this.renderer.listen(textWrapper, 'click', (event) => {
        this.toggleSortIcon(node);
        this.sortModelChange.emit(this.sortModel);
      });
    }
  }

  private addListeners() {
    const self = this;
    const thead: HTMLElement = this.table.nativeElement.querySelector('.data-grid-header');
    const closeIcon: HTMLElement = thead.querySelector('.close-icon');
    const theadCells: NodeListOf<HTMLElement> = this.table.nativeElement
      .querySelectorAll('.data-grid-header>.data-grid-row>.data-grid-cell');
    thead.removeEventListener('mousemove', () => { });
    this.renderer.listen(thead, 'mousemove', function (event) {
      if (self.selectedColumn) {
        const temp = self.columns.find(e => e.dataKey === self.selectedColumn.id);
        if (self.selectedColumn.dataset.resize) {
          const prevX = parseFloat(self.selectedColumn.dataset.pageX);
          const initWidth = parseFloat(self.selectedColumn.dataset.initWidth);
          let newWidth = (parseFloat(event.pageX) - prevX + initWidth);
          const index = parseInt(self.selectedColumn.dataset.sequenceNo, 10);
          if (newWidth < 140) {
            newWidth = 140;
          }
          self.selectedColumn.style.minWidth = newWidth + 'px';
          temp.width = newWidth;
          self.changeColumnWidth(index, newWidth);
        } else if (self.selectedColumn.dataset.move) {
          const prevX = parseFloat(self.selectedColumn.dataset.pageX);
          const positive = parseFloat(event.pageX) - prevX >= 0;
          if (Math.abs(parseFloat(event.pageX) - prevX) > 50) {
            if (temp) {
              self.switchCells(temp.sequenceNo - 1, positive);
            }
          }
        }
      }
    });
    for (let i = 0; i < theadCells.length; i++) {
      const node = theadCells.item(i);
      const resizeIcon = node.querySelector('.resize-col');
      const moveIcon = node.querySelector('.move-col');
      const searchIcon = node.querySelector('.search-icon');
      const oldData = self.columns.find(e => e.dataKey === node.id);
      if (oldData) {
        oldData.sequenceNo = parseInt(node.dataset.sequenceNo, 10);
      }
      if (resizeIcon) {
        resizeIcon.removeEventListener('mousedown', () => { });
        self.renderer.listen(resizeIcon, 'mousedown', (event) => {
          node.dataset.resize = 'true';
          node.dataset.pageX = event.pageX;
          node.dataset.initWidth = node.clientWidth + '';
        });
      }
      if (moveIcon) {
        moveIcon.removeEventListener('mousedown', () => { });
        self.renderer.listen(moveIcon, 'mousedown', (event) => {
          node.dataset.move = 'true';
          node.dataset.pageX = event.pageX;
          // node.setAttribute('draggable', 'true');
        });
      }
      if (searchIcon && closeIcon) {
        searchIcon.removeEventListener('click', () => { });
        this.renderer.listen(searchIcon, 'click', (event) => {
          thead.style.maxHeight = '65px';
          thead.style.marginTop = '-65px';
          this.table.nativeElement.parentElement.style.marginTop = '65px';
        });
      }
    }
  }

  @HostListener('mouseup', ['$event'])
  onMouseUp(event) {
    let flag;
    if (this.selectedColumn) {
      flag = true;
    }
    this.dragStartIndex = null;
    const theadCells: NodeListOf<HTMLElement> = this.table.nativeElement
      .querySelectorAll('.data-grid-header>.data-grid-row:first-child>.data-grid-cell');
    for (let i = 0; i < theadCells.length; i++) {
      const node = theadCells.item(i);
      const temp = this.columns.find(e => e.dataKey === node.id);
      if (temp) {
        temp.width = node.clientWidth;
      }
      delete node.dataset.resize;
      delete node.dataset.move;
      delete node.dataset.pageX;
      node.removeAttribute('draggable');
    }
    if (flag) {
      this.columnsChange.emit(this.columns);
    }
  }

  private get selectedColumn() {
    const theadCells: NodeListOf<HTMLElement> = this.table.nativeElement
      .querySelectorAll('.data-grid-header>.data-grid-row:first-child>.data-grid-cell');
    let temp = null;
    if (theadCells) {
      for (let i = 0; i < theadCells.length; i++) {
        const node = theadCells.item(i);
        if (node.dataset.resize !== undefined || node.dataset.move !== undefined) {
          temp = node;
        }
      }
    }
    return temp;
  }

  private reCalculateOrder() {
    const theadCells: NodeListOf<HTMLElement> = this.table.nativeElement
      .querySelectorAll('.data-grid-header>.data-grid-row:first-child>.data-grid-cell');
    for (let i = 0; i < theadCells.length; i++) {
      const node = theadCells.item(i);
      delete node.dataset.move;
      delete node.dataset.resize;
      delete node.dataset.pageX;
      delete node.dataset.sequenceNo;
      const temp = this.columns.find(e => e.dataKey === node.id);
      node.dataset.sequenceNo = temp.sequenceNo + '';
    }
    this.columnsChange.emit(this.columns);
    this.addListeners();
  }

  private changeColumnWidth(index: number, width: number) {
    const headColumn: HTMLElement = this.table.nativeElement
      .querySelector(`.data-grid-header>.data-grid-row:nth-child(1)>.data-grid-cell:nth-child(${index})`);
    if (headColumn) {
      headColumn.style.minWidth = width + 'px';
      headColumn.style.maxWidth = width + 'px';
    }
    const filterColumn: HTMLElement = this.table.nativeElement
      .querySelector(`.data-grid-header>.data-grid-row:nth-child(2)>.data-grid-cell:nth-child(${index})`);
    if (filterColumn) {
      filterColumn.style.minWidth = width + 'px';
      filterColumn.style.maxWidth = width + 'px';
    }
    const textWrapper: HTMLElement = this.table.nativeElement
      .querySelector(`.data-grid-header>.data-grid-row:nth-child(1)>.data-grid-cell:nth-child(${index})>.text-wrapper`);
    if (textWrapper) {
      textWrapper.style.minWidth = (width) + 'px';
      textWrapper.style.maxWidth = (width) + 'px';
    }
    const selectedCells: NodeListOf<HTMLElement> = this.table.nativeElement
      .querySelectorAll(`.data-grid-body>.data-grid-row:not(.full-row)>.data-grid-cell:nth-child(${index})`);
    for (let i = 0; i < selectedCells.length; i++) {
      const node = selectedCells.item(i);
      node.style.minWidth = width + 'px';
      node.style.maxWidth = width + 'px';
    }
    const fullWithCells: NodeListOf<HTMLElement> = this.table.nativeElement
      .querySelectorAll(`.data-grid-body>.data-grid-row.full-row>.data-grid-cell:nth-child(${index})`);
    for (let i = 0; i < fullWithCells.length; i++) {
      const node = fullWithCells.item(i);
      node.style.minWidth = this.viewWidth + 'px';
      node.style.maxWidth = this.viewWidth + 'px';
    }
  }

  private switchCells(index: number, positive: boolean, skip?: number) {
    const temp = this.columns[index];
    this.columns.splice(index, 1);
    let next = index;
    if (positive) {
      if (typeof skip === 'number') {
        next = next + skip;
      } else {
        next = next + 1;
      }
      this.columns.splice(next, 0, temp);
    } else {
      if (typeof skip === 'number') {
        next = next - skip;
      } else {
        next = next - 1;
      }
      this.columns.splice(next, 0, temp);
    }
    this.columns.forEach((item, i) => {
      item.sequenceNo = (i + 1);
    });
    this.reCalculateOrder();
  }

  private addUtilityIcon(node: HTMLElement) {
    const group = document.createElement('div');
    group.classList.add('d-flex');
    group.classList.add('align-items-center');
    group.classList.add('ml-auto');
    group.classList.add('utility-icons');
    if (!node.classList.contains('no-move')) {
      const ele = document.createElement('span');
      ele.classList.add('fa');
      ele.classList.add('fa-arrows-alt');
      ele.classList.add('move-col');
      ele.classList.add('ml-2');
      group.appendChild(ele);
    }
    if (!node.classList.contains('no-grip')) {
      const ele = document.createElement('span');
      ele.classList.add('fa');
      ele.classList.add('fa-arrows-alt-h');
      ele.classList.add('fa-arrows-alt');
      ele.classList.add('resize-col');
      ele.classList.add('ml-2');
      group.appendChild(ele);
    }
    node.appendChild(group);
  }
}

export interface DataGridColumn {
  label?: string;
  dataKey?: string;
  show?: boolean;
  width?: number;
  sequenceNo?: number;
  search?: boolean;
  type?: string;
  styleclass?: string;
  checkbox?: boolean;
  resolve?: boolean;
}
