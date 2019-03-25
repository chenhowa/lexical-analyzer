
import "jest";
import { RegexCodeGenerator } from "code-gen/generator";
import { TopDownParseTree } from "parser/top-down-parse-tree";
import { ParseTree, Token } from "parser/parser";
import { RegexTokenKind, RegexToken } from "regex/regex-parser";


describe("correctly generates nfa for basic terms and operations", () => {
    let generator: RegexCodeGenerator;

    beforeEach(() => {
        generator = new RegexCodeGenerator();
    })

    test('single character terms', () => {
        let nfa = generator._term("a");
        expect(nfa.start_state).toEqual(0);
        expect(nfa.accept_states).toEqual([1]);
        let res: [string, number[]][][] = [
            [["a", [1] ]], // state 0 transitions
            [],          // state 1 transitions
        ];
        expect(nfa_transitions_as_array(nfa.transitions)).toEqual(res);
    });

    test('union of single character terms', () => {
        let children = [generator._term("a"), generator._term("b")];
        let nfa = generator._union_helper(children);
        expect(nfa.start_state).toEqual(0);
        expect(nfa.accept_states).toEqual([2, 4]);
        let res: [string, number[]][][] = [
            [["EPSILON", [1, 3] ]],     // state 0 transitions to the children
            [["a", [2]]  ],          
            [],                         // 2: accept state for first child
            [["b", [4]]],
            []                          // 4: accept state for second child.
        ];
        expect(nfa_transitions_as_array(nfa.transitions)).toEqual(res);
    });

    test('concat of single character terms', () => {
        let children = [generator._term("a"), generator._term("b")];
        let nfa = generator._concat_helper(children);
        expect(nfa.start_state).toEqual(0);
        expect(nfa.accept_states).toEqual([3]);
        let res: [string, number[]][][] = [
            [ ["a", [1] ] ],     // state 0 transition starts at first child and acts as first child
            [ ["EPSILON", [2]] ],   // accept state of first child may transition to second child.       
            [["b", [3]]],                         
            []                          // 3: accept state for second child is accept state for whole nfa.
        ];
        expect(nfa_transitions_as_array(nfa.transitions)).toEqual(res);
    });

    test('wildcard of single character terms', () => {
        let child = generator._term("a");
        let nfa = generator._wildcard_helper(child);
        expect(nfa.start_state).toEqual(0);
        expect(nfa.accept_states).toEqual([0, 2]);
        let res: [string, number[]][][] = [
            [ ["EPSILON", [1] ]  ],  // state 0 transition accepts (no input read)
            [ ["a", [2] ]],      // state 1 is just start of child
            [ ["EPSILON", [0]] ]                // state 2 is just accept state of child.
                                                // notice the transition back to the start
        ];
        expect(nfa_transitions_as_array(nfa.transitions)).toEqual(res);
    });

    test('optional of single character terms', () => {
        let child = generator._term("a");
        let nfa = generator._optional_helper(child);
        expect(nfa.start_state).toEqual(0);
        expect(nfa.accept_states).toEqual([0, 2]);
        let res: [string, number[]][][] = [
            [ ["EPSILON", [1] ]  ],  // state 0 transition accepts (no input read)
            [ ["a", [2] ]],      // State 1 is just start of child
            [  ]                // State 2 is just accept state of child. 
                                //      There is no transition back to the start since this is either 0 or 1
        ];
        expect(nfa_transitions_as_array(nfa.transitions)).toEqual(res);
    });

});

describe('correctly generates special nfas for special characters', () => {
    expect(true).toBe(false);
});

describe('correctly generates nfas for range trees', () => {
    expect(true).toBe(false);
});

describe("correctly generates nfa from tree", () => {
    let generator: RegexCodeGenerator;

    beforeEach(() => {
        generator = new RegexCodeGenerator();
    })

    test('union tree', () => {
        const tree: ParseTree<Token<RegexTokenKind, string>> = 
                    new TopDownParseTree(new RegexToken(RegexTokenKind.Union, ''));
        let parent = tree.get_root_iter();
        if(parent) {
            parent.add_before(new RegexToken(RegexTokenKind.TermChars, "a"));
            parent.add_after(new RegexToken(RegexTokenKind.TermChars, "b"));
            let nfa = generator._generate(parent);
            expect(nfa.start_state).toEqual(0);
            expect(nfa.accept_states).toEqual([2, 4]);
            let res: [string, number[]][][] = [
                [["EPSILON", [1, 3] ]],     // state 0 transitions to the children
                [["a", [2]]  ],          
                [],                         // 2: accept state for first child
                [["b", [4]]],
                []                          // 4: accept state for second child.
            ];
            expect(nfa_transitions_as_array(nfa.transitions)).toEqual(res);
        } else {
            expect(true).toEqual(false);
        }
    });

    test('concat tree', () => {
        const tree: ParseTree<Token<RegexTokenKind, string>> = 
                    new TopDownParseTree(new RegexToken(RegexTokenKind.Concat, ''));
        let parent = tree.get_root_iter();
        if(parent) {
            parent.add_before(new RegexToken(RegexTokenKind.TermChars, "a"));
            parent.add_after(new RegexToken(RegexTokenKind.TermChars, "b"));
            const nfa = generator._generate(parent);
            expect(nfa.start_state).toEqual(0);
            expect(nfa.accept_states).toEqual([3]);
            let res: [string, number[]][][] = [
                [ ["a", [1] ] ],     // state 0 transition starts at first child and acts as first child
                [ ["EPSILON", [2]] ],   // accept state of first child may transition to second child.       
                [["b", [3]]],                         
                []                          // 3: accept state for second child is accept state for whole nfa.
            ];
            expect(nfa_transitions_as_array(nfa.transitions)).toEqual(res);
        }
        else {
            expect(true).toEqual(false);
        }
    });

    test('wildcard tree', () => {
        const tree: ParseTree<Token<RegexTokenKind, string>> = 
                    new TopDownParseTree(new RegexToken(RegexTokenKind.Wildcard, ''));
        let parent = tree.get_root_iter();
        if(parent) {
            parent.add_before(new RegexToken(RegexTokenKind.TermChars, "a"));
            const nfa = generator._generate(parent);
            expect(nfa.start_state).toEqual(0);
            expect(nfa.accept_states).toEqual([0, 2]);
            let res: [string, number[]][][] = [
                [ ["EPSILON", [1] ]  ],  // state 0 transition accepts (no input read)
                [ ["a", [2] ]],      // state 1 is just start of child
                [ ["EPSILON", [0]] ]                // state 2 is just accept state of child.
                                                    // notice the transition back to the start
            ];
            expect(nfa_transitions_as_array(nfa.transitions)).toEqual(res);
        }
        else {
            expect(true).toEqual(false);
        }
    });

    test('optional tree', () => {
        const tree: ParseTree<Token<RegexTokenKind, string>> = 
                    new TopDownParseTree(new RegexToken(RegexTokenKind.Optional, ''));
        let parent = tree.get_root_iter();
        if(parent) {
            parent.add_before(new RegexToken(RegexTokenKind.TermChars, "a"));
            const nfa = generator._generate(parent);
            expect(nfa.start_state).toEqual(0);
            expect(nfa.accept_states).toEqual([0, 2]);
            let res: [string, number[]][][] = [
                [ ["EPSILON", [1] ]  ],  // state 0 transition accepts (no input read)
                [ ["a", [2] ]],      // State 1 is just start of child
                [  ]                // State 2 is just accept state of child. 
                                    // There is no transition back to the start since this is either 0 or 1
            ];
            expect(nfa_transitions_as_array(nfa.transitions)).toEqual(res);
        }
        else {
            expect(true).toEqual(false);
        }
    });
});

function nfa_transitions_as_array(transitions: Map<string, number[]>[]): [string, number[]][][] {
    let stringed = transitions.map((transition) => {
        return [...transition];
    });

    return stringed;
}