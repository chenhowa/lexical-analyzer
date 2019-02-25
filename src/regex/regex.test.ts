import "jest";

import { ConcreteRegex } from "regex/regex";
import { Regex } from "regex/regex";

describe("Emits correct regex sequence from string shorthand", () => {
    let regex = new ConcreteRegex();

    beforeEach(() => {
        regex = new ConcreteRegex();
    })


    test('simple character', () => {
        regex.set('a');

        expect_emits(regex, 'a');

        regex.set('z');
        expect_emits(regex, 'z');

        regex.set('$');
        expect_emits(regex, '$');
    });

    test('simple character strings', () => {
        regex.set('1a2b3c$');
        expect_emits(regex, '1a2b3c$');
    });

    test('parenthesized character strings', () => {
        regex.set('(ab(cd(ef)))');
        expect_emits(regex, '(ab(cd(ef)))');
    });

    test('simple regex operations', () => {
        regex.set('a*');
        expect_emits(regex, 'a*');

        regex.set('ab');
        expect_emits(regex, 'ab');

        regex.set('a|b');
        expect_emits(regex, 'a|b');
    });

    test('regex operation precedence and associativity', () => {
        regex.set('a*b');
        expect_emits(regex, '(a*)b');

        regex.set('ab*');
        expect_emits(regex, 'a(b*)');

        regex.set('a|b*');
        expect_emits(regex, 'a|(b*)');

        regex.set('a*|b');
        expect_emits(regex, '(a*)|b');

        regex.set('ab|c');
        expect_emits(regex, '(ab)|c');

        regex.set('a|bc')
        expect_emits(regex, 'a|(bc)');
    });

    test('parenthesized regex operations', () => {
        regex.set('(ab)*');
        expect_emits(regex, '(ab)*');

        regex.set('(a|b)*');
        expect_emits(regex, '(a|b)*');

        regex.set('(a|b)c');
        expect_emits(regex, '(a|b)c');

        regex.set('a(b|c)');
        expect_emits(regex, 'a(b|c)');

        regex.set('a(b|c)*');
        expect_emits(regex, 'a((b|c))*');
    });
});

function expect_emits(regex: Regex, expected: string) {
    expect(regex.emit_normalized_regex()).toEqual(expected);
}