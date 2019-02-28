import { ParseTree, TreeIterator, TreeNode } from "parser/parser";


class TopDownParseTree<T> implements ParseTree<T> {
    head: TreeNode<T> = new ParseTreeNode();
    constructor() {

    }

    as_string(): string {
        return "hi";
    }

    get_root_iter(): TreeIterator<T> {
        return new ParseTreeIterator(this.head);
    }
}


class ParseTreeIterator<T> implements TreeIterator<T> {

    node: TreeNode<T>
    constructor(node: TreeNode<T>) {
        this.node = node;
    }

    num_children(): number {
        return this.node.children.length;
    }

    add_before(data: T | TreeNode<T>, child_index?: number): void {
        const index = child_index ? child_index : 0;
        this._add_before(data, index);
    }

    _add_before(data: T | TreeNode<T>, child_index: number): void {
        
    }

    add_after(data: T | TreeNode<T>, child_index?: number): void;
    in_order_mode(): void;
    pre_order_mode(): void;
    post_order_mode(): void;
    next(): void;
    has_next(): boolean;
    prev(): void;
    has_prev(): boolean;
    parent(): void;
    has_parent(): boolean;
    child(index: number): void;
    has_child(index: number): boolean;
    clone(): TreeIterator<T>;
}

class ParseTreeNode<T> implements TreeNode<T> {
    parent?: TreeNode<T>;
    children: TreeNode<T>[] = new Array();

    constructor(parent?: TreeNode<T>, children?: TreeNode<T>[]) {
        this.parent = parent;
        if(children) {
            this.children = children;
        }
    }
}