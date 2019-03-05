
import { Parser, ParseTree, ErrorMessage, TreeIterator, Token } from "parser/parser";
import { TopDownParseTree } from "parser/top-down-parse-tree";
import { isAlpha, isDigit } from "voca";


enum RegexTokenKind {
    Expression = "expression",
    ConcatUnion = "concat_union",
    ConcatExpr = "concat_expr",
    UnaryConcat = "unary_concat",
    UnaryExpr = "unary_expr",
    UnaryRange = "unary_range",
    RangeExpr = "range_expr",
    RangeNeg = "range_neg",
    RangeTerm = "range_term",
    RangeRemainder = "range_remainder",
    ConcatRemainder = "concat_remainder",
    ParenExprConcat = "paren_expr_concat",
    UnionRemainder = "union_remainder",
    ParenExprUnion = "paren_expr_union",
    ParenExpr = "paren_expr",
    Term = "term",
    TermChars = "term_alpha",
}

class RegexToken implements Token<RegexTokenKind, string> {
    kind: RegexTokenKind;
    data: string;
    constructor(kind: RegexTokenKind, data: string) {
        this.kind = kind;
        this.data = data;
    }

    as_string(): string {
        if(this.data) {
            return this.data;
        }
        return this.kind;
    }

    keep_when_pruning(): boolean {
        return this.kind === RegexTokenKind.TermChars;
    }
} 



class RegexParser implements Parser< string, Token<RegexTokenKind, string> >{

    current_index: number = 0;
    tree: ParseTree<Token<RegexTokenKind, string>> = new TopDownParseTree();
    chars: string[] = [];
    success: boolean = false;

    constructor() {

    }

    get_result(): ParseTree<Token<RegexTokenKind, string>> | ErrorMessage {
        if(this.success) {
            return this.tree;
        } else {
            return "Failed parse";
        }
    }

    /**
     * 
     * @param chars An array of length-1 strings, representing the input string.
     */
    parse(chars: string[]): boolean {

        this.current_index = 0;
        this.tree = new TopDownParseTree();
        this.chars = chars;

        const success = this._expression();
        if(success && this._input_exhausted()) {
            this.success = true;
        } else {
            this.success = false;
        }

        this._prune_tree();

        return this.success;
    }

    _prune_tree(): void {
        let iter = this.tree.get_root_iter();
        if(iter) {
            for(let i = 0; i < iter.num_children(); i++) {
                let child = iter.clone();
                child.child(i);
                this._prune_tree_helper(child);
            }
        }
    }

    _prune_tree_helper(current: TreeIterator<Token<RegexTokenKind, string>>): void {
        // Prune tree starting from the leaves, using recursion.
        for(let i = 0; i < current.num_children(); i++) {
            let child = current.clone();
            child.child(i);
            this._prune_tree_helper(child);
        }

        // Prune if 1 or 0 children, depending on conditions.
        if(current.num_children() === 1) {
            current.remove(); // this updates to point at parent.
        } else if (current.num_children() === 0) {
            if(!current.get().keep_when_pruning()) {
                current.remove();
            }
        }
    }

    _expression(parent?: TreeIterator<Token<RegexTokenKind, string>>): boolean {
        const save = this.current_index;
        let self: TreeIterator<Token<RegexTokenKind, string>>;
        if(parent) { 
            self = parent.add_after(new RegexToken(RegexTokenKind.Expression, "E"));
        } else {
            this.tree.set_root(new RegexToken(RegexTokenKind.Expression, "E"));
            let iter = this.tree.get_root_iter();
            if(!iter) {
                throw new Error("Root undefined");
            }
            self = iter;
        }
        
        let tests: ((parent: TreeIterator<Token<RegexTokenKind, string>>) => boolean)[] = [
            
            this._concat_union.bind(this), // C union E | C
            this._paren_expr_union.bind(this)  // (E) union E | (E)
        ];

        for(let i = 0; i < tests.length; i++) {
            let parsers = tests[i];
            if(parsers(self)) {
                return true;
            } else {
                this.current_index = save;
            }
        }

        return false;
    }

    _concat_union(parent: TreeIterator<Token<RegexTokenKind, string>>): boolean {
        let self = parent.add_after(new RegexToken(RegexTokenKind.ConcatUnion, ""));

        if(this._concat_expr(self)) {
            let save = this.current_index;
            if(!this._union_remainder(self)) {
                this.current_index = save;
            }
            return true;
        } else {
            self.remove_subtree();
            return false;
        }
    }

    _concat_expr(parent: TreeIterator<Token<RegexTokenKind, string>>): boolean {
        let self = parent.add_after(new RegexToken(RegexTokenKind.ConcatExpr, ""));
        const save = this.current_index;
        let tests: ((parent: TreeIterator<Token<RegexTokenKind, string>>) => boolean)[] = [
            this._unary_concat.bind(this), // i.e. a*C
            this._paren_expr_concat.bind(this)
        ];

        for(let i = 0; i < tests.length; i++) {
            let parsers = tests[i];
            if(parsers(self)) {
                return true;
            } else {
                this.current_index = save;
            }
        }
        self.remove_subtree();
        return false;
    }

    _unary_concat(parent: TreeIterator<Token<RegexTokenKind, string>>): boolean {
        let self = parent.add_after(new RegexToken(RegexTokenKind.UnaryConcat, ""));

        const save = this.current_index;
        if(this._unary_expr(self)) {
            const save = this.current_index;
            if(!this._concat_remainder(self)) {
                this.current_index = save;
            }
            return true;
        }
        
        this.current_index = save;
        if (this._paren_expr(self)) {
            const save = this.current_index;

            if(!this._char("*", self)) {
                this.current_index = save;

                if(!this._char("?", self)) {
                    this.current_index = save;
                }
            }

            if(!this._concat_remainder(self)) {
                this.current_index = save;
            }
            
            return true;
        }

        this.current_index = save;
        if(this._unary_range(self)) {
            const save = this.current_index;

            if(!this._char("*", self)) {
                this.current_index = save;

                if(!this._char("?", self)) {
                    this.current_index = save;
                }
            }

            if(!this._concat_remainder(self)) {
                this.current_index = save;
            }
            
            return true;
        }
        
        self.remove_subtree();
        return false;  
    }

    _unary_expr(parent: TreeIterator<Token<RegexTokenKind, string>>): boolean {
        let self = parent.add_after(new RegexToken(RegexTokenKind.UnaryExpr, ""));
        if(this._term(self)) {
            const save = this.current_index;
            if(!this._char("*", self)) {
                this.current_index = save;

                if(!this._char("?", self)) {
                    this.current_index = save;
                }
            }

            return true;
        } else {
            self.remove_subtree();
            return false;
        }
    }

    _unary_range(parent: TreeIterator<Token<RegexTokenKind, string>>): boolean {
        let self = parent.add_after(new RegexToken(RegexTokenKind.UnaryRange, ""));
        let result = this._char("[", self) && this._range_expr(self) && this._char("]", self);

        if(!result) {
            self.remove_subtree();
        }

        return result;
    }

    _range_expr(parent: TreeIterator<Token<RegexTokenKind, string>>): boolean {
        let self = parent.add_after(new RegexToken(RegexTokenKind.RangeExpr, ""));
        let result = this._range_neg(self) && this._range_term(self) && this._range_remainder(self);
        if(!result) {
            self.remove_subtree();
        }
        return result;
    }

    _range_neg(parent: TreeIterator<Token<RegexTokenKind, string>>): boolean {
        let self = parent.add_after(new RegexToken(RegexTokenKind.RangeNeg, ""));
        const save = this.current_index;
        if(!this._char("^", self)) {
            this.current_index = save;
        }

        return true;
    }

    _range_term(parent: TreeIterator<Token<RegexTokenKind, string>>): boolean {
        const self = parent.add_after(new RegexToken(RegexTokenKind.RangeTerm, ""));
        const save = this.current_index;
        if(this._term(self)) {
            const save = this.current_index;
            if(this._char("-", self)) {
                if(!this._term(self)) {
                    this.current_index = save;
                }
            } else {
                this.current_index = save;
            }
            
            return true;
        }
        
        this.current_index = save;
        if(this._char("(", self) && this._range_expr(self) && this._char(")", self)) {
            return true;
        }

        self.remove_subtree();
        return false;
    }

    _range_remainder(parent: TreeIterator<Token<RegexTokenKind, string>>): boolean {
        const self = parent.add_after(new RegexToken(RegexTokenKind.RangeRemainder, ""));
        const save = this.current_index;
        if(!(this._range_neg(self) && this._range_term(self) && this._range_remainder(self))) {
            this.current_index = save;
        }

        return true;
    }

    // parse concat remainder OR empty string
    _concat_remainder(parent: TreeIterator<Token<RegexTokenKind, string>>): boolean {
        const self = parent.add_after(new RegexToken(RegexTokenKind.ConcatRemainder, ""));
        const save = this.current_index;
        if(!this._concat_expr(self)) {
            this.current_index = save;
        }

        return true;
    }

    _paren_expr_concat(parent: TreeIterator<Token<RegexTokenKind, string>>): boolean {
        const self = parent.add_after(new RegexToken(RegexTokenKind.ParenExprConcat, ""));
        const result = this._paren_expr(self) && this._concat_remainder(self);
        if(!result) {
            self.remove_subtree();
        }
        return result;
    }

    // parse union remainder OR empty string
    _union_remainder(parent: TreeIterator<Token<RegexTokenKind, string>>): boolean {
        const self = parent.add_after(new RegexToken(RegexTokenKind.UnionRemainder, ""));
        const save = this.current_index;
        if(! ( this._char("|", self) && this._expression(self) ) ) {
            this.current_index = save;
        }
        return true;
    }

    _paren_expr_union(parent: TreeIterator<Token<RegexTokenKind, string>>): boolean {
        const self = parent.add_after(new RegexToken(RegexTokenKind.ParenExprUnion, ""));
        if(this._paren_expr(self)) {
            let save = this.current_index;
            if(!this._union_remainder(self)) {
                this.current_index = save;
            }
            return true;
        } else {
            self.remove_subtree();
            return false;
        }
    }

    _paren_expr(parent: TreeIterator<Token<RegexTokenKind, string>>): boolean {
        const self = parent.add_after(new RegexToken(RegexTokenKind.ParenExpr, ""));
        let result = this._char("(", self) 
        result = result && this._expression(self);
        result = result && this._char(")", self);

        if(!result) {
            self.remove_subtree();
        }
        
        return result;
    }

    _input_exhausted(): boolean {
        return this.current_index === this.chars.length;
    }

    /**
     * @description Parses a single term of the regular expression.
     */
    _term(parent: TreeIterator<Token<RegexTokenKind, string>>): boolean {
        const self = parent.add_after(new RegexToken(RegexTokenKind.Term, ""));
        const save = this.current_index;
        let tests: ((parent: TreeIterator<Token<RegexTokenKind, string>>) => boolean)[] = [
            this._term_alpha.bind(this),
            this._parse_term_digit.bind(this),
            this._parse_term_special.bind(this),
            this._parse_term_space.bind(this),
            this._parse_term_punct.bind(this),
            this._parse_term_escaped.bind(this)
        ];

        for(let i = 0; i < tests.length; i++) {
            let parsers = tests[i];
            if(parsers(self)) {
                return true;
            } else {
                // If parsing failed, restore.
                this.current_index = save;
            }
        }

        self.remove_subtree();
        return false;
    }

    _term_alpha(parent: TreeIterator<Token<RegexTokenKind, string>>): boolean {
        const self = parent.add_after(new RegexToken(RegexTokenKind.TermChars, this._current_char()))
        let success = isAlpha( this._current_char() );
        this.current_index += 1;

        if(!success) {
            self.remove_subtree();
        }

        return success;
    }

    _parse_term_digit(parent: TreeIterator<Token<RegexTokenKind, string>>): boolean {
        const self = parent.add_after(new RegexToken(RegexTokenKind.TermChars, this._current_char()));

        let success = isDigit( this._current_char());
        this.current_index += 1;
        if(!success) {
            self.remove_subtree();
        }
        return success;
    }

    _parse_term_special(parent: TreeIterator<Token<RegexTokenKind, string>>): boolean {
        const self = parent.add_after(new RegexToken(RegexTokenKind.TermChars, this._current_char()));
        const char = this._current_char();
        let success = char === "!"
                   || char === "@"
                   || char === "#"
                   || char === "$"
                   || char === "%"
                   || char === "^"
                   || char === "&"
                   || char === "_"
                   || char === "="
                   || char === "+"
                   || char === "<"
                   || char === ">";

        this.current_index += 1;
        if(!success) {
            self.remove_subtree();
        }

        return success;
    }

    _parse_term_space(parent: TreeIterator<Token<RegexTokenKind, string>>): boolean {
        const self = parent.add_after(new RegexToken(RegexTokenKind.TermChars, this._current_char()));
        const char = this._current_char();
        let success =   char === "\n" 
                     || char === "\t"
                     || char === " "
                     || char === "\r";
        this.current_index += 1;
        if(!success) {
            self.remove_subtree();
        }
        return success;
    }

    _parse_term_punct(parent: TreeIterator<Token<RegexTokenKind, string>>): boolean {
        const self = parent.add_after(new RegexToken(RegexTokenKind.TermChars, this._current_char()));
        const char = this._current_char();
        let success = char === ","
                   || char === "."
                   || char === "'"
                   || char === '"'
                   || char === ";"
                   || char === ":"
                   || char === "{"
                   || char === "}";
        this.current_index += 1;
        if(!success) {
            self.remove_subtree();
        }
        return success;

    }

    _parse_term_escaped(parent: TreeIterator<Token<RegexTokenKind, string>>): boolean {
        if(this._current_char() === "/") {
            this.current_index += 1;
            const char = this._current_char();
            let success = char === "/"
                       || char === "d"
                       || char === "s"
                       || char === "a"
                       || char === "A"
                       || char === "["
                       || char === "]"
                       || char === "("
                       || char === ")"
                       || char === "|"
                       || char === "-"
                       || char === "*"
                       || char === "?";
            this.current_index += 1;
            parent.add_after(new RegexToken(RegexTokenKind.TermChars, "/" + char));
            return success;
        } else {
            return false;
        }
    }

    /**
     * @description Matches a single character to the input.
     * @param terminal_char String of length 1
     */
    _char(terminal_char: string, parent: TreeIterator<Token<RegexTokenKind, string>>): boolean {
        if(terminal_char.length !== 1) {
            throw new Error("Invalid terminal char had length " + terminal_char.length.toString());
        }

        const success = terminal_char === this._current_char();
        this.current_index += 1;

        if(success) {
            parent.add_after(new RegexToken(RegexTokenKind.TermChars, terminal_char));
        }

        return success;
    }

    _current_char(): string {
        return this.chars[this.current_index];
    }

}




export { RegexParser };