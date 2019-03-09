
import { Parser, ParseTree, Token } from "parser/parser";
import { RegexParser, RegexTokenKind } from "regex/regex-parser";

interface Regex {
    set(regex: string): void;
    emit_normalized_regex(): string;
}


class ConcreteRegex implements Regex {

    regex: string = "";

    constructor() {
    
    }


    set(regex: string) {
        this.regex = regex;
    }

    emit_normalized_regex(): string {
        let parser: Parser<string, Token<RegexTokenKind, string>> = new RegexParser();
        parser.parse(this.regex.split(''));
        let tree: ParseTree<Token<RegexTokenKind, string>> | string = parser.get_result();

        if(is_parse_tree(tree)) {
            return tree.as_string();
        } else {
            return tree;
        }
    }
}

function is_parse_tree<T>(tree: ParseTree<T> | string): tree is ParseTree<T> {
    return (<ParseTree<T>>tree).as_string !== undefined;
}


export { Regex, ConcreteRegex };