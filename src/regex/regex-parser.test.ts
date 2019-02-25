import "jest";

import { RegexParser } from "regex/regex-parser";


describe("Correctly parses regex strings", () => {
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
    })

});