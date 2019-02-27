import "jest";

import { RegexParser } from "regex/regex-parser";


describe("Correctly parses simple terminal regex tokens", () => {
    let parser: RegexParser = new RegexParser();

    beforeEach(() => {
        parser = new RegexParser();
    });
    
    test("single character", () => {
        expect( parser.parse("a".split('')) ).toBe(true);
        expect( parser.parse("z".split('')) ).toBe(true);
    });

    test("single digit", () => {
        expect( parser.parse("9".split(''))).toBe(true);
        expect( parser.parse("0".split(''))).toBe(true);
    });
    
    test("single space", () => {
        expect( parser.parse(" ".split(''))).toBe(true);
        expect( parser.parse("\t".split(''))).toBe(true);
        expect( parser.parse("\n".split(''))).toBe(true);
        expect( parser.parse("\r".split(''))).toBe(true);
    });

    test("special characters", () => {
        expect( parser.parse("@".split(''))).toBe(true);
        expect( parser.parse('#'.split(''))).toBe(true);
    });

    test("punctuation", () => {
        expect( parser.parse(":".split(''))).toBe(true);
        expect( parser.parse('.'.split(''))).toBe(true);
    });

    test("escaped tokens", () => {
        expect( parser.parse("//".split(''))).toBe(true);
        expect( parser.parse('/a'.split(''))).toBe(true);
        expect( parser.parse("/d".split(''))).toBe(true);
        expect( parser.parse('/A'.split(''))).toBe(true);
        expect( parser.parse('/s'.split(''))).toBe(true);
        expect( parser.parse('/('.split(''))).toBe(true);
        expect( parser.parse('/]'.split(''))).toBe(true);
    });
});

describe("Correctly parses single regex operations", () => {
    let parser: RegexParser = new RegexParser();

    beforeEach(() => {
        parser = new RegexParser();
    });

    test("union", () => {
        expect(parser.parse("a|b".split(''))).toBe(true);
        expect(parser.parse("a|b|c|d".split(''))).toBe(true);
    });

    test("concatenation", () => {
        expect(parser.parse("ab".split(''))).toBe(true);
        expect(parser.parse("ab12@".split(''))).toBe(true);
    });
    
    test("wildcard", () => {
        expect(parser.parse("a*".split(''))).toBe(true);
        expect(parser.parse("a*b*c*".split(''))).toBe(true);
    });

    
    test("at least one", () => {
        expect(parser.parse("a?".split(''))).toBe(true);
        expect(parser.parse("a?b?c?d?".split(''))).toBe(true);
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

});


