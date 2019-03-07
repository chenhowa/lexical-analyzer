
type ErrorMessage = string;

interface Parser<T, U> {
    parse(token: T[]): boolean;
    get_result(): ParseTree<U> | ErrorMessage;
}


interface ParseTree<T> {
    root?: TreeNode<T>;
    is_empty(): boolean;
    set_root(data: T): void;
    as_string(): string;
    get_root_iter(): TreeIterator<T> | undefined;
}

function isParseTree<T, U>(data: ParseTree<T> | U): data is ParseTree<T> {
    return (<ParseTree<T>>data).get_root_iter !== undefined;
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
    set(data: T): void;
    remove(): void;
    remove_subtree(): void;
}

interface Token<T, U> {
    kind: T,
    data: U,
    as_string(): string
    keep_if_no_children(): boolean;
    keep_if_one_child(): boolean;
    keep_if_multiple_children(): boolean;
}

interface ParseResult<T> {
    success: boolean;
    node: TreeNode<T>;
    message: string;
}

interface TreeNode<T> {
    parent?: TreeNode<T>;
    data: T;
    children: TreeNode<T>[]; 
}

function isTreeNode<T, U>(data: U | TreeNode<T>): data is TreeNode<T> {
    return data && ( <TreeNode<T>>data).children !== undefined;
}

export { 
    Parser, ParseTree, ErrorMessage, 
    TreeIterator, TreeNode, isTreeNode, 
    isParseTree, ParseResult, Token
};