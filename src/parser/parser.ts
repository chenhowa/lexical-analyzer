
type ErrorMessage = string;

interface Parser<T> {
    parse(token: T[]): boolean;
    get_result(): ParseTree<T> | ErrorMessage;
}


interface ParseTree<T> {
    head: TreeNode<T>
    as_string(): string;
    get_root_iter(): TreeIterator<T>;
}

interface TreeIterator<T> {
    num_children(): number;
    add_before(data: T | TreeNode<T>, child_index?: number): void;
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

interface TreeNode<T> {
    parent?: TreeNode<T>;
    children: TreeNode<T>[]; 
}

export { Parser, ParseTree, ErrorMessage, TreeIterator, TreeNode };