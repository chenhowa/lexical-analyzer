
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
            //this._parse_expression_concat,
            //this._parse_expression_union,
            //this._parse_expression_at_least_zero,
            //this._parse_expression_at_least_one,
            this._input_exhausted.bind(this),
            this._parse_expression_just_term.bind(this),
            //this._parse_expression_parenthesized
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

    _parse_expression_concat(): boolean {
        return this._parse_term() && this._parse_expression() && this._parse_expression();
    }

    _parse_expression_union(): boolean {
        return this._parse_term() && 
                this._parse_expression() && this._parse_char('|') && this._parse_expression();
    }

    _parse_expression_at_least_zero(): boolean {
        return this._parse_term() && this._parse_expression() &&
                    this._parse_char('*');
    }

    _parse_expression_at_least_one(): boolean {
        return this._parse_term() && this._parse_expression() &&
                this._parse_char('?');
    }

    _parse_expression_just_term(): boolean {
        return this._parse_term();
    }

    _parse_expression_parenthesized(): boolean {
        return this._parse_char('(') && this._parse_expression() && 
                this._parse_char(')')
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
            //this._parse_term_special,
            this._parse_term_space.bind(this),
            //this._parse_term_punct,
            //this._parse_term_shortcut
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

    _parse_term_space(): boolean {
        let success = isBlank( this.chars[this.current_index] );
        this.current_index += 1;
        return success;
    }

    /**
     * @description Matches a single character to the input.
     * @param terminal_char String of length 1
     */
    _parse_char(terminal_char: string): boolean {
        if(terminal_char.length !== 1) {
            throw new Error("Invalid terminal char had length " + terminal_char.length.toString());
        }

        const success = terminal_char === this.chars[this.current_index];
        this.current_index += 1;

        return success;
    }

}


class RegexParseTree implements ParseTree<string> {

    as_string(): string {
        return "hi";
    }
}


export { RegexParser, RegexParseTree };