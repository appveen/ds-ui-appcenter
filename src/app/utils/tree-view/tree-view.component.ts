import { Component, Input, OnInit } from '@angular/core';
import { NestedTreeControl } from '@angular/cdk/tree';
import { MatTreeNestedDataSource } from '@angular/material/tree';

interface TreeNode {
  name: string;
  children?: TreeNode[];
}

@Component({
  selector: 'odp-tree-view',
  templateUrl: './tree-view.component.html',
  styleUrls: ['./tree-view.component.scss']
})
export class TreeViewComponent implements OnInit {

  treeControl = new NestedTreeControl<TreeNode>(node => node.children);
  dataSource = new MatTreeNestedDataSource<TreeNode>();
  @Input() code: any;

  constructor() {
  }

  ngOnInit() {
    this.dataSource.data = this.createTreeView(this.code);
  }

  createTreeView(data, arrayName?, childIndex?) {
    const self = this;
    let output = [];
    let node = { 'name': 'Object', 'children': [] }
    if (arrayName || childIndex >= 0) {
      node['name'] = arrayName ? arrayName : childIndex;
    }
    // Object
    if (!Array.isArray(data)) {
      Object.keys(data).forEach((key) => {
        // string / number 
        if (typeof data[key] !== 'object' || data[key] == null || data[key] == '') {
          let childNode = { 'name': key + ' : ' + data[key] }
          node['children'].push(childNode)
        }
        // array
        else if (Array.isArray(data[key])) {
          node['children'].push(self.createTreeView(data[key], key)[0]);
        }
        // object 
        else {
          node['children'].push(self.createTreeView(data[key], key)[0]);
        }
      })
    } else {
      // array
      data.forEach((child, index) => {
        // string/number
        if (typeof child !== 'object' || child == null || child == '') {
          node['children'].push({ 'name': index + ' : ' + child })
        }
        // object/array
        else {
          node['children'].push(self.createTreeView(child, null, childIndex = index)[0]);
        }
      });
    }
    output.push(node)
    return output;
  }

  hasChild = (_: number, node: TreeNode) => !!node.children && node.children.length > 0;

}


