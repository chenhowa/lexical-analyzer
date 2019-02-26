
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

        this.success = this._parse_expression();

        return this.success;
    }

    _parse_expression(): boolean {
        const save = this.current_index;

        let tests: (() => boolean)[] = [
            
            this._parse_union_concat.bind(this), // C union E | C
        ];

        for(let i = 0; i < tests.length; i++) {
            let parsers = tests[i];
            if(parsers() && this._input_exhausted()) {
                return true;
            } else {
                this.current_index = save;
            }
        }

        return false;
    }

    _parse_union_concat(): boolean {
        console.log('union concat');
        if(this._parse_concat_expression()) {
            const save = this.current_index;

            if(!this._parse_remaining_union()) {
                this.current_index = save; // if parsing remaining union failed, forget about it.
            }

            return true;
        } else {
            return false;
        }
    }

    _parse_remaining_union(): boolean {
        return this._parse_char("|") && this._parse_expression();
    }

    _parse_concat_expression(): boolean {
        console.log('concat expression');
        const save = this.current_index;
        if(this._parse_concat_wildcard()) {
            return true;
        }
        this.current_index = save;
        if(this._parse_concat_at_least()) {
            return true;
        }


        return false;

    }

    _parse_concat_wildcard(): boolean {
        console.log('concat wildcard');
        if(this._parse_wildcard_expression()) {
            const save = this.current_index;

            if(!this._parse_remaining_concat()) {
                this.current_index = save;
            }

            return true;

        } else {
            return false;
        }
    }

    _parse_remaining_concat(): boolean {
        console.log('remaining concat');
        return this._parse_concat_expression();
    }

    _parse_wildcard_expression(): boolean {
        console.log('wildcard expression');
        const save = this.current_index;
        if(this._parse_wildcard_term()) {
            return true;
        }

        return false;
    }

    _parse_wildcard_term(): boolean {
        console.log('wildcard term');
        if(this._parse_term()) {
            const save = this.current_index;

            if(!this._parse_char("*")) {
                this.current_index = save;
            }

            return true;
        } else {
            return false;
        }
    }

    _parse_concat_at_least(): boolean {
        console.log("concat at least");
        if(this._parse_at_least_expression()) {
            const save = this.current_index;
            if(!this._parse_remaining_concat()) {
                this.current_index = save;
            }

            return true;
        } else {
            return false;
        }
    }

    _parse_at_least_expression(): boolean {
        console.log("at least expr");
        const save = this.current_index;
        if(this._parse_at_least_term()) {
            return true;
        }

        return false;
    }

    _parse_at_least_term(): boolean {
        console.log("at least term");
        if(this._parse_term()) {
            const save = this.current_index;

            if(!this._parse_char("?")) {
                this.current_index = save;
            }

            return true;
        } else {
            console.log("RETURNING FALSE");
            return false;
        }
    }

    _input_exhausted(): boolean {
        return this.current_index === this.chars.length;
    }

    /**
     * @description Parses a single term of the regular expression.
     */
    _parse_term(): boolean {
        console.log("Parsing term at token " + this._current_char() + " at index " + this.current_index + " with chars " + this.chars.toString());
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