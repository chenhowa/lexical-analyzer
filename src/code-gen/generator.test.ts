
import "jest";
import { RegexCodeGenerator } from "code-gen/generator";


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

describe("correctly generates nfa from tree", () => {

});

function nfa_transitions_as_array(transitions: Map<string, number[]>[]): [string, number[]][][] {
    let stringed = transitions.map((transition) => {
        return [...transition];
    });

    return stringed;
}