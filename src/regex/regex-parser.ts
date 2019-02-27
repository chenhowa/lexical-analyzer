
import { Parser, ParseTree, ErrorMessage } from "parser/parser";
import { isAlpha, isDigit } from "voca";




class RegexParser implements Parser<string>{

    current_index: number = 0;
    tree: ParseTree<string> = new RegexParseTree();
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
        this.tree = new RegexParseTree();
        this.chars = chars;

        const success = this._expression();
        if(success && this._input_exhausted()) {
            this.success = true;
        } else {
            this.success = false;
        }

        return this.success;
    }

    _expression(): boolean {
        const save = this.current_index;

        let tests: (() => boolean)[] = [
            
            this._concat_union.bind(this), // C union E | C
            this._paren_expr_union.bind(this)  // (E) union E | (E)
        ];

        for(let i = 0; i < tests.length; i++) {
            let parsers = tests[i];
            if(parsers()) {
                return true;
            } else {
                this.current_index = save;
            }
        }

        return false;
    }

    _concat_union(): boolean {
        if(this._concat_expr()) {
            let save = this.current_index;
            if(!this._union_remainder()) {
                this.current_index = save;
            }
            return true;
        } else {
            return false;
        }
    }

    _concat_expr(): boolean {
        const save = this.current_index;
        let tests: (() => boolean)[] = [
            this._unary_concat.bind(this), // i.e. a*C
            this._paren_expr_concat.bind(this)
        ];

        for(let i = 0; i < tests.length; i++) {
            let parsers = tests[i];
            if(parsers()) {
                return true;
            } else {
                this.current_index = save;
            }
        }

        return false;
    }

    _unary_concat(): boolean {
        if(this._unary_expr()) {
            const save = this.current_index;
            if(!this._concat_remainder()) {
                this.current_index = save;
            }
            return true;
        } else {
            return false;
        }
    }

    _unary_expr(): boolean {
        if(this._parse_term()) {
            const save = this.current_index;
            if(!this._parse_char("*")) {
                this.current_index = save;

                if(!this._parse_char("?")) {
                    this.current_index = save;
                }
            }

            return true;
        } else {
            return false;
        }
    }

    // parse concat remainder OR empty string
    _concat_remainder(): boolean {
        const save = this.current_index;
        if(!this._concat_expr()) {
            this.current_index = save;
        }

        return true;
    }

    _paren_expr_concat(): boolean {
        return this._paren_expr() && this._concat_remainder();
    }

    // parse union remainder OR empty string
    _union_remainder(): boolean {
        const save = this.current_index;
        if(! ( this._parse_char("|") && this._expression() ) ) {
            this.current_index = save;
        }
        return true;
    }

    _paren_expr_union(): boolean {
        if(this._paren_expr()) {
            let save = this.current_index;
            if(!this._union_remainder()) {
                this.current_index = save;
            }
            return true;
        } else {
            return false;
        }
    }

    _paren_expr(): boolean {
        let result = this._parse_char("(") 
        result = result && this._expression();
        result = result && this._parse_char(")");
        
        return result;
    }

    _input_exhausted(): boolean {
        return this.current_index === this.chars.length;
    }

    /**
     * @description Parses a single term of the regular expression.
     */
    _parse_term(): boolean {
        const save = this.current_index;
        let tests: (() => boolean)[] = [
            this._parse_term_alpha.bind(this),
            this._parse_term_digit.bind(this),
            this._parse_term_special.bind(this),
            this._parse_term_space.bind(this),
            this._parse_term_punct.bind(this),
            this._parse_term_escaped.bind(this)
        ];

        for(let i = 0; i < tests.length; i++) {
            let parsers = tests[i];
            if(parsers()) {
                return true;
            } else {
                // If parsing failed, restore.
                this.current_index = save;
            }
        }


        return false;
    }

    _parse_term_alpha(): boolean {
        let success = isAlpha( this.chars[this.current_index] );
        this.current_index += 1;
        return success;
    }

    _parse_term_digit(): boolean {
        let success = isDigit( this.chars[this.current_index]);
        this.current_index += 1;
        return success;
    }

    _parse_term_special(): boolean {
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
        return success;
    }

    _parse_term_space(): boolean {
        const char = this._current_char();
        let success =   char === "\n" 
                     || char === "\t"
                     || char === " "
                     || char === "\r";
        this.current_index += 1;
        return success;
    }

    _parse_term_punct(): boolean {
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
        return success;

    }

    _parse_term_escaped(): boolean {
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
            return success;
        } else {
            return false;
        }
    }

    /**
     * @description Matches a single character to the input.
     * @param terminal_char String of length 1
     */
    _parse_char(terminal_char: string): boolean {
        if(terminal_char.length !== 1) {
            throw new Error("Invalid terminal char had length " + terminal_char.length.toString());
        }

        const success = terminal_char === this._current_char();
        this.current_index += 1;

        return success;
    }

    _current_char(): string {
        return this.chars[this.current_index];
    }

}


class RegexParseTree implements ParseTree<string> {

    as_string(): string {
        return "hi";
    }
}


export { RegexParser, RegexParseTree };