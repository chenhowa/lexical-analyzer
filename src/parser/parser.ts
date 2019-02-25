
type ErrorMessage = string;

interface Parser<T> {
    parse(token: T[]): boolean;
    get_result(): ParseTree<T> | ErrorMessage;
}


interface ParseTree<T> {
    as_string(): string;
}

export { Parser, ParseTree, ErrorMessage };