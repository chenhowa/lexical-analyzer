import { ParseTree, TreeIterator, TreeNode, isTreeNode } from "parser/parser";


class TopDownParseTree<T> implements ParseTree<T> {
    root?: TreeNode<T>;
    constructor(data?: T) {
        if(data) {
            this.root = new ParseTreeNode(data);
        }
    }

    is_empty(): boolean {
        return this.root === undefined;
    }

    set_root(data: T): void {
        if(this.root) {
            this.root.data = data;
        } else {
            this.root = new ParseTreeNode(data);
        }
    }

    as_string(): string {
        if(!this.root) {
            return "";
        } else {
            let result: string[] = [];
            this._as_string(this.root, result);
            return result.join('');
        }
    }

    _as_string(node: TreeNode<T>, result: string[]): void {
        result.push('(');
        result.push(node.data.toString());

        for(let i = 0; i < node.children.length; i++) {
            this._as_string(node.children[i], result);
        }

        result.push(')');
    }

    get_root_iter(): TreeIterator<T> | undefined {
        return this.root ? new ParseTreeIterator(this.root) : this.root;
    }
}


class ParseTreeIterator<T> implements TreeIterator<T> {
    node: TreeNode<T>;
    constructor(node: TreeNode<T>) {
        this.node = node;
    }

    num_children(): number {
        return this.node.children.length;
    }

    add_before(data: T | TreeNode<T>, child_index?: number): TreeIterator<T> {
        const index = child_index ? child_index : 0;
        return this._add_before(data, index);
    }

    _add_before(data: T | TreeNode<T>, child_index: number): TreeIterator<T> {
        // create a node and make its parent this node.
        let new_node: TreeNode<T> = isTreeNode(data) ? data : new ParseTreeNode(data);
        new_node.parent = this.node;
        this.node.children.splice(child_index, 0, new_node);
        return new ParseTreeIterator(new_node);
    }

    add_after(data: T | TreeNode<T>, child_index?: number): TreeIterator<T> {
        const index = child_index ? child_index + 1 : this.node.children.length;
        return this._add_after(data, index);
    }

    _add_after(data: T | TreeNode<T>, child_index: number): TreeIterator<T> {
        let new_node: TreeNode<T> = isTreeNode(data) ? data : new ParseTreeNode(data);
        new_node.parent = this.node;
        this.node.children.splice(child_index, 0, new_node);
        return new ParseTreeIterator(new_node);
    }

    pre_order_traversal(process: ((data:T ) => void) ): void {
        process(this.node.data);
        for(let i = 0; i < this.node.children.length; i++) {
            let iter = this.clone();
            iter.child(i);
            iter.pre_order_traversal(process);
        }
    }

    post_order_traversal(process: ((data:T ) => void)): void {
        for(let i = 0; i < this.node.children.length; i++) {
            let iter = this.clone();
            iter.child(i);
            iter.post_order_traversal(process);
        }
        process(this.node.data);
    }

    parent(): void {
        if(!this.node.parent) {
            throw new Error("Node with data " + this.node.data.toString() + " does not have parent");
        }
        this.node = this.node.parent;
    }

    has_parent(): boolean {
        return this.parent !== undefined;
    }

    child(index: number): void {
        if(!this.has_child(index)) {
            throw new Error("Node with data " + this.node.data.toString() + " does not have child at index " + index);
        }
        this.node = this.node.children[index];
    }

    has_child(index: number): boolean {
        return index >= 0 && index < this.num_children();
    }

    clone(): TreeIterator<T> {
        return new ParseTreeIterator(this.node);
    }

    get(): T {
        return this.node.data;
    }

    set(data: T): void {
        this.node.data = data;
    }

    /**
     * @description Removes this node, and insert them at position in parent's children.
     */
    remove(): void {
        if(!this.node.parent) {
            throw new Error("Attempted to remove root");
        }

        const parent = this.node.parent;
        let children = this.node.children;

        // Destroy references to this node.
        this.node.parent = undefined;
        this.node.children = [];
        for(let i = 0; i < children.length; i++) {
            children[i].parent = parent;
        }

        // Replace this node with this node's children in the parent's children.
        parent.children.splice(parent.children.indexOf(this.node), 1, ...children);

        this.node = parent; // Update iterator to point at parent now.
    }

    /**
     * @description Remove the subtree starting at this iterator's node.
     */
    remove_subtree(): void {
        if(!this.node.parent) {
            throw new Error("Attempted to remove entire tree");
        }

        let parent = this.node.parent;
        this._remove_subtree(this.node);
        this.node = parent;
    }

    _remove_subtree(node: TreeNode<T>) {
        if(node.parent) {
            // Remove parent's reference to child.
            const parent = node.parent;
            parent.children.splice(parent.children.indexOf(node), 1);
        }

        node.parent = undefined;
        const children = node.children;
        node.children = [];
        for(let i = 0; i < children.length; i++) {
            this._remove_subtree(children[i]);
        }
    }

}

class ParseTreeNode<T> implements TreeNode<T> {
    parent?: TreeNode<T>;
    data: T;
    children: TreeNode<T>[] = new Array();

    constructor(data: T, parent?: TreeNode<T>, children?: TreeNode<T>[]) {
        this.data = data;
        this.parent = parent;
        if(children) {
            this.children = children;
        }
    }
}


export { ParseTreeNode, ParseTreeIterator, TopDownParseTree };