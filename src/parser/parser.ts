
type ErrorMessage = string;

interface Parser<T> {
    parse(token: T[]): boolean;
    get_result(): ParseTree<T> | ErrorMessage;
}


interface ParseTree<T> {
    root?: TreeNode<T>;
    is_empty(): boolean;
    set_root(data: T): void;
    as_string(): string;
    get_root_iter(): TreeIterator<T> | undefined;
}

interface TreeIterator<T> {
    num_children(): number;
    add_before(data: T | TreeNode<T>, child_index?: number): TreeIterator<T>;
    add_after(data: T | TreeNode<T>, child_index?: number): TreeIterator<T>;
    pre_order_traversal(process: ((data:T ) => void) ): void;
    post_order_traversal(process: ((data:T ) => void)): void;
    parent(): void;
    has_parent(): boolean;
    child(index: number): void;
    has_child(index: number): boolean;
    clone(): TreeIterator<T>;
    get(): T;
}

interface TreeNode<T> {
    parent?: TreeNode<T>;
    data: T;
    children: TreeNode<T>[]; 
}

function isTreeNode<T>(data: T | TreeNode<T>): data is TreeNode<T> {
    return ( <TreeNode<T>>data).children !== undefined;
}

export { Parser, ParseTree, ErrorMessage, TreeIterator, TreeNode, isTreeNode };