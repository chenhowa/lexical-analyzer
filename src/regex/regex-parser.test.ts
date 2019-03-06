import "jest";

import { RegexParser } from "regex/regex-parser";
import { isParseTree, ParseTree } from "parser/parser";


describe("Correctly parses simple terminal regex tokens", () => {
    let parser: RegexParser = new RegexParser();

    beforeEach(() => {
        parser = new RegexParser();
    });
    
    test("single character", () => {
        expect( parser.parse("a".split('')) ).toBe(true);
        expect_parse_result(parser.get_result(), "(E(a))");

        expect( parser.parse("z".split('')) ).toBe(true);
        expect_parse_result(parser.get_result(), "(E(z))")
    });

    test("single digit", () => {
        expect( parser.parse("9".split(''))).toBe(true);
        expect_parse_result(parser.get_result(), "(E(9))");
        expect( parser.parse("0".split(''))).toBe(true);
        expect_parse_result(parser.get_result(), "(E(0))");

    });
    
    test("single space", () => {
        expect( parser.parse(" ".split(''))).toBe(true);
        expect_parse_result(parser.get_result(), "(E( ))");
        expect( parser.parse("\t".split(''))).toBe(true);
        expect_parse_result(parser.get_result(), "(E(\t))");
        expect( parser.parse("\n".split(''))).toBe(true);
        expect_parse_result(parser.get_result(), "(E(\n))");
        expect( parser.parse("\r".split(''))).toBe(true);
        expect_parse_result(parser.get_result(), "(E(\r))");
    });

    test("special characters", () => {
        expect( parser.parse("@".split(''))).toBe(true);
        expect_parse_result(parser.get_result(), "(E(@))");
        expect( parser.parse('#'.split(''))).toBe(true);
        expect_parse_result(parser.get_result(), "(E(#))");
    });

    test("punctuation", () => {
        expect( parser.parse(":".split(''))).toBe(true);
        expect_parse_result(parser.get_result(), "(E(:))");
        expect( parser.parse('.'.split(''))).toBe(true);
        expect_parse_result(parser.get_result(), "(E(.))");
    });

    test("escaped tokens", () => {
        expect( parser.parse("//".split(''))).toBe(true);
        expect_parse_result(parser.get_result(), "(E(//))");
        expect( parser.parse('/a'.split(''))).toBe(true);
        expect_parse_result(parser.get_result(), "(E(/a))");
        expect( parser.parse("/d".split(''))).toBe(true);
        expect_parse_result(parser.get_result(), "(E(/d))");
        expect( parser.parse('/A'.split(''))).toBe(true);
        expect_parse_result(parser.get_result(), "(E(/A))");
        expect( parser.parse('/s'.split(''))).toBe(true);
        expect_parse_result(parser.get_result(), "(E(/s))");
        expect( parser.parse('/('.split(''))).toBe(true);
        expect_parse_result(parser.get_result(), "(E(/())");
        expect( parser.parse('/]'.split(''))).toBe(true);
        expect_parse_result(parser.get_result(), "(E(/]))");
    });
});

describe("Correctly parses single regex operations", () => {
    let parser: RegexParser = new RegexParser();

    beforeEach(() => {
        parser = new RegexParser();
    });

    test("union", () => {
        expect(parser.parse("a|b".split(''))).toBe(true);
        expect_parse_result(parser.get_result(), "(E(U(a)(b)))");
        expect(parser.parse("a|b|c|d".split(''))).toBe(true);
        expect_parse_result(parser.get_result(), "(E(U(a)(U(b)(U(c)(d)))))");
    });

    test("concatenation", () => {
        expect(parser.parse("ab".split(''))).toBe(true);
        expect_parse_result(parser.get_result(), "(E(C(a)(b)))");
        expect(parser.parse("ab12@".split(''))).toBe(true);
        expect_parse_result(parser.get_result(), "(E(C(a)(C(b)(C(1)(C(2)(@))))))");
    });
    
    test("wildcard", () => {
        expect(parser.parse("a*".split(''))).toBe(true);
        expect_parse_result(parser.get_result(), "(E(W(a)))");
        expect(parser.parse("a*b*c*".split(''))).toBe(true);
        expect_parse_result(parser.get_result(), "(E(C(W(a))(C(W(b))(W(c)))))");
    });

    
    test("at least one", () => {
        expect(parser.parse("a?".split(''))).toBe(true);
        expect_parse_result(parser.get_result(), "(E(AL(a)))");
        expect(parser.parse("a?b?c?".split(''))).toBe(true);
        expect_parse_result(parser.get_result(), "(E(C(AL(a))(C(AL(b))(AL(c)))))");
    });

    test("(nested) parentheses", () => {
        expect(parser.parse("(a)".split(''))).toBe(true);
        expect_parse_result(parser.get_result(), "(E(a))");
        expect(parser.parse("(ab)".split(''))).toBe(true);
        expect_parse_result(parser.get_result(), "(E(C(a)(b)))");
        expect(parser.parse("(abc)".split(''))).toBe(true);
        expect_parse_result(parser.get_result(), "(E(C(a)(C(b)(c))))");
        expect(parser.parse("((a))".split(''))).toBe(true);
        expect_parse_result(parser.get_result(), "(E(a))");
    });
});

describe('Correctly parses sequences of regex operations', () => {
    let parser: RegexParser = new RegexParser();

    beforeEach(() => {
        parser = new RegexParser();
    });

    test("union, concat", () => {
        expect(parser.parse("ab|c".split(''))).toBe(true);
        expect_parse_result(parser.get_result(), "(E(U(C(a)(b))(c)))");
        expect(parser.parse("a|bc".split(''))).toBe(true);
        expect_parse_result(parser.get_result(), "(E(U(a)(C(b)(c))))");
    });

    test("concat, wildcard, at least", () => { 
        expect(parser.parse("a?b".split(''))).toBe(true);
        expect_parse_result(parser.get_result(), "(E(C(AL(a))(b)))");
        expect(parser.parse("a*b".split(''))).toBe(true);
        expect_parse_result(parser.get_result(), "(E(C(W(a))(b)))");
        expect(parser.parse("ab?".split(''))).toBe(true);
        expect_parse_result(parser.get_result(), "(E(C(a)(AL(b))))");
        expect(parser.parse("ab*".split(''))).toBe(true);
        expect_parse_result(parser.get_result(), "(E(C(a)(W(b))))");
    });

    test("union, wildcard, at least", () => {
        expect(parser.parse("a?|b".split(''))).toBe(true);
        expect_parse_result(parser.get_result(), "(E(U(AL(a))(b)))");
        expect(parser.parse("a*|b".split(''))).toBe(true);
        expect_parse_result(parser.get_result(), "(E(U(W(a))(b)))");
        expect(parser.parse("a|b?".split(''))).toBe(true);
        expect_parse_result(parser.get_result(), "(E(U(a)(AL(b))))");
        expect(parser.parse("a|b*".split(''))).toBe(true);
        expect_parse_result(parser.get_result(), "(E(U(a)(W(b))))");
    });

    test("sequences with parentheses and all operations" , () => {
        expect(parser.parse("(a?|bc)d|e*fgh?".split(''))).toBe(true);
        //expect_parse_result(parser.get_result(), "(E(U(AL(a))(b)))");
        expect(parser.parse("a?|bc(d|e*fgh)?".split(''))).toBe(true);
        //expect_parse_result(parser.get_result(), "(E(U(AL(a))(b)))");
        expect(parser.parse("(a?|bc)(d|e*fgh)?".split(''))).toBe(true);
        //expect_parse_result(parser.get_result(), "(E(U(AL(a))(b)))");
        expect(parser.parse("(a?|bc)(d|e*(fgh))".split(''))).toBe(true);
        //expect_parse_result(parser.get_result(), "(E(U(AL(a))(b)))");
    });

    test("sequences using all operations", () => {
        expect(parser.parse("a?|bcd|e*fgh?".split(''))).toBe(true);
        expect_parse_result(parser.get_result(), "(E(U(AL(a))(U(C(b)(C(c)(d)))(C(W(e))(C(f)(C(g)(AL(h))))))))");
    });
});

describe("Correctly parses ranges", () => {
    let parser: RegexParser = new RegexParser();

    beforeEach(() => {
        parser = new RegexParser();
    });

    test("single character ranges", () => {
        expect(parser.parse("[a]".split(''))).toBe(true);
        expect_parse_result(parser.get_result(), "(E(R(a)))");
        expect(parser.parse("[$]".split(''))).toBe(true);
        expect_parse_result(parser.get_result(), "(E(R($)))");
        expect(parser.parse("[/s]".split(''))).toBe(true);
        expect_parse_result(parser.get_result(), "(E(R(/s)))");
    });

    test("single ranges", () => {
        expect(parser.parse("[a-Z]".split(''))).toBe(true);
        expect(parser.parse("[$-Q]".split(''))).toBe(true);
        expect(parser.parse("[0-9]".split(''))).toBe(true);
    });

    test("negate single ranges", () => {
        expect(parser.parse("[^a-Z]".split(''))).toBe(true);
        expect(parser.parse("[^$]".split(''))).toBe(true);
        expect(parser.parse("[^0]".split(''))).toBe(true);
    });

    test("(nested) parenthesized single range", () => {
        expect(parser.parse("[(a-Z)]".split(''))).toBe(true);
        expect(parser.parse("[($)]".split(''))).toBe(true);
        expect(parser.parse("[(($))]".split(''))).toBe(true);
    });

    test("multiple single ranges", () => {
        expect(parser.parse("[ab]".split(''))).toBe(true);
        expect(parser.parse("[a-z1]".split(''))).toBe(true);
        expect(parser.parse("[1a-z]".split(''))).toBe(true);
        expect(parser.parse("[1-9a-z]".split(''))).toBe(true);
    });

    test("multiple ranges and range operations", () => {
        expect(parser.parse("[^ab]".split(''))).toBe(true);
        expect(parser.parse("[^a(b-c0)]".split(''))).toBe(true);
        expect(parser.parse("[^(ab^(c1-3(^5-9)))]".split(''))).toBe(true);
    });
});


describe("Rejects invalid regex", () => {
    let parser: RegexParser = new RegexParser();

    beforeEach(() => {
        parser = new RegexParser();
    });

    test("sequence of wildcard and at least", () => {
        expect(parser.parse("a*?".split(''))).toBe(false);
        expect(parser.parse("a?*".split(''))).toBe(false);
    });

    test("operations with not enough operands", () => {
        expect(parser.parse("*".split(''))).toBe(false);
        expect(parser.parse("?".split(''))).toBe(false);
        expect(parser.parse("a|".split(''))).toBe(false);
        expect(parser.parse("|a".split(''))).toBe(false);
    });

    test("empty ranges", () => {
        expect(parser.parse("[]".split(''))).toBe(false);
    });

});


function expect_parse_result<T, U>(data: ParseTree<T> | U, expected: string) {
    if(isParseTree(data)) {
        expect(data.as_string()).toEqual(expected);
    } else {
        expect(true).toBe(false);
    }
}