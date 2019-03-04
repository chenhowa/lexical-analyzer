
import { Parser, ParseTree, ErrorMessage, TreeIterator } from "parser/parser";
import { TopDownParseTree } from "parser/top-down-parse-tree";
import { isAlpha, isDigit } from "voca";




class RegexParser implements Parser<string>{

    current_index: number = 0;
    tree: ParseTree<string> = new TopDownParseTree();
    chars: string[] = [];
    success: boolean = false;

    constructor() {

    }

    get_result(): ParseTree<string> | ErrorMessage {
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

        return this.success;
    }

    _expression(parent?: TreeIterator<string>): boolean {
        const save = this.current_index;
        let self: TreeIterator<string>;
        if(parent) { 
            self = parent.add_after("expr");
        } else {
            this.tree.set_root("expr");
            let iter = this.tree.get_root_iter();
            if(!iter) {
                throw new Error("Root undefined");
            }
            self = iter;
        }
        
        let tests: ((parent: TreeIterator<string>) => boolean)[] = [
            
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

    _concat_union(parent: TreeIterator<string>): boolean {
        let self = parent.add_after("concat_union");

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

    _concat_expr(parent: TreeIterator<string>): boolean {
        let self = parent.add_after("concat_expr");
        const save = this.current_index;
        let tests: ((parent: TreeIterator<string>) => boolean)[] = [
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

    _unary_concat(parent: TreeIterator<string>): boolean {
        let self = parent.add_after("unary_concat");

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

    _unary_expr(parent: TreeIterator<string>): boolean {
        let self = parent.add_after("unary_expr");
        if(this._parse_term(self)) {
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

    _unary_range(parent: TreeIterator<string>): boolean {
        let self = parent.add_after("unary_range");
        let result = this._char("[", self) && this._range_expr(self) && this._char("]", self);

        if(!result) {
            self.remove_subtree();
        }

        return result;
    }

    _range_expr(parent: TreeIterator<string>): boolean {
        let self = parent.add_after("range_expr");
        let result = this._range_neg(self) && this._range_term(self) && this._range_remainder(self);
        if(!result) {
            self.remove_subtree();
        }
        return result;
    }

    _range_neg(parent: TreeIterator<string>): boolean {
        let self = parent.add_after("range_neg");
        const save = this.current_index;
        if(!this._char("^", self)) {
            this.current_index = save;
        }

        return true;
    }

    _range_term(parent: TreeIterator<string>): boolean {
        const self = parent.add_after("range_term");
        const save = this.current_index;
        if(this._parse_term(self)) {
            const save = this.current_index;
            if(this._char("-", self)) {
                if(!this._parse_term(self)) {
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

    _range_remainder(parent: TreeIterator<string>): boolean {
        const self = parent.add_after("range_remainder");
        const save = this.current_index;
        if(!(this._range_neg(self) && this._range_term(self) && this._range_remainder(self))) {
            this.current_index = save;
        }

        return true;
    }

    // parse concat remainder OR empty string
    _concat_remainder(parent: TreeIterator<string>): boolean {
        const self = parent.add_after("concat_remainder");
        const save = this.current_index;
        if(!this._concat_expr(self)) {
            this.current_index = save;
        }

        return true;
    }

    _paren_expr_concat(parent: TreeIterator<string>): boolean {
        const self = parent.add_after("paren_expr_concat");
        const result = this._paren_expr(self) && this._concat_remainder(self);
        if(!result) {
            self.remove_subtree();
        }
        return result;
    }

    // parse union remainder OR empty string
    _union_remainder(parent: TreeIterator<string>): boolean {
        const self = parent.add_after("union_remainder");
        const save = this.current_index;
        if(! ( this._char("|", self) && this._expression(self) ) ) {
            this.current_index = save;
        }
        return true;
    }

    _paren_expr_union(parent: TreeIterator<string>): boolean {
        const self = parent.add_after("paren_expr_union");
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

    _paren_expr(parent: TreeIterator<string>): boolean {
        const self = parent.add_after("paren_expr");
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
    _parse_term(parent: TreeIterator<string>): boolean {
        const self = parent.add_after('parse_term');
        const save = this.current_index;
        let tests: ((parent: TreeIterator<string>) => boolean)[] = [
            this._parse_term_alpha.bind(this),
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

    _parse_term_alpha(parent: TreeIterator<string>): boolean {
        const self = parent.add_after(this._current_char())
        let success = isAlpha( this._current_char() );
        this.current_index += 1;

        if(!success) {
            self.remove_subtree();
        }

        return success;
    }

    _parse_term_digit(parent: TreeIterator<string>): boolean {
        const self = parent.add_after(this._current_char())

        let success = isDigit( this._current_char());
        this.current_index += 1;
        if(!success) {
            self.remove_subtree();
        }
        return success;
    }

    _parse_term_special(parent: TreeIterator<string>): boolean {
        const self = parent.add_after(this._current_char())
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

    _parse_term_space(parent: TreeIterator<string>): boolean {
        const self = parent.add_after(this._current_char())
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

    _parse_term_punct(parent: TreeIterator<string>): boolean {
        const self = parent.add_after(this._current_char())
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

    _parse_term_escaped(parent: TreeIterator<string>): boolean {
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
            parent.add_after("/" + char);
            return success;
        } else {
            return false;
        }
    }

    /**
     * @description Matches a single character to the input.
     * @param terminal_char String of length 1
     */
    _char(terminal_char: string, parent: TreeIterator<string>): boolean {
        if(terminal_char.length !== 1) {
            throw new Error("Invalid terminal char had length " + terminal_char.length.toString());
        }

        const success = terminal_char === this._current_char();
        this.current_index += 1;

        if(success) {
            parent.add_after("terminal_char");
        }

        return success;
    }

    _current_char(): string {
        return this.chars[this.current_index];
    }

}




export { RegexParser };