import { ParseTree, Token, TreeIterator } from "parser/parser";
import { RegexTokenKind } from "regex/regex-parser";


interface NFA {
    start_state: number;
    accept_states: number[];
    transitions: Map<string, number[]>[];
}

interface Generator<T> {
    generate(tree: ParseTree<Token<T, string>>): string;
}

class RegexCodeGenerator implements Generator<RegexTokenKind> {

    /**
     * @description Generates string representation of the NFA that the Regex AST describes.
     * @param tree 
     */
    generate(tree: ParseTree<Token<RegexTokenKind, string>>): string {
        let root_iter = tree.get_root_iter();
        if(root_iter) {
            this._generate(root_iter);
        } else {
            throw new Error("Tried to generate code from a tree with no root");
        }

        return "blah";
    }

    _generate(iter: TreeIterator<Token<RegexTokenKind, string> >): NFA {
        // How do I generate a DFA from a tree representing the regex?
        // a | b vs ab | c
        // I mean, we're trying to generate a table, start states, and accept states.
        // Each operator represents a state and transitions.
        // For example, a union represents 2 epsilon transitions into new states.
        // But really, we want to make small NFAs, and compose larger NFAs from the smaller ones.
        // This implies that we aren't building the entire table from scratch, but that we CAN serialize the entire 
        // table afterwards by pulling out the data from the nested NFAs.
        return {
            start_state: 0,
            accept_states: [
                // should be accept states of the child nfas
            ],
            transitions: [

            ]
        };
    }

    _union(iter: TreeIterator<Token<RegexTokenKind, string>>): NFA {
        const child_nfas: NFA[] = this._generate_child_nfas(iter);

        const nfa = this._union_helper(child_nfas);
        
        return nfa;
    }

    _generate_child_nfas(iter: TreeIterator<Token<RegexTokenKind, string>>): NFA[] {
        let child_nfas: NFA[] = [];
        for(let i = 0; i < iter.num_children(); i++) {
            let child = iter.clone();
            child.child(i);
            child_nfas.push( this._generate(child) );
        }
        return child_nfas;
    }

    _union_helper(children: NFA[]): NFA {
        let union_transition: Map<string, number[]> = new Map();
        union_transition.set('EPSILON', []);
        let nfa: NFA = {
            start_state: 0,
            accept_states: [
                // should be accept states of the child nfas
            ],
            transitions: [
                union_transition
            ]
        }

        // link to each child nfa through an epsilon
        let offset = 1;
        for(let i = 0; i < children.length; i++) {
            let converted = this._offset_nfa(children[i], offset);
            offset += converted.transitions.length; // each transition is for one state.
            nfa.accept_states = nfa.accept_states.concat(converted.accept_states);
            let epsilon_transitions = nfa.transitions[0].get('EPSILON');
            if(epsilon_transitions) {
                nfa.transitions[0].set('EPSILON', epsilon_transitions.concat(converted.start_state));
            } else {
                nfa.transitions[0].set('EPSILON', [converted.start_state]);
            }
            nfa.transitions = nfa.transitions.concat(converted.transitions);
        }

        return nfa;
    }

    _concat(iter: TreeIterator<Token<RegexTokenKind, string>>): NFA {
        const child_nfas = this._generate_child_nfas(iter);
        const nfa = this._concat_helper(child_nfas);
        return nfa;
    }

    _concat_helper(children: NFA[]): NFA {
        let offset = 0;
        let converted_children: NFA[] = children.map((child) => {
            let converted = this._offset_nfa(child, offset);
            offset += converted.transitions.length;
            return converted;
        });

        // Fuse the child nfas
        let nfa: NFA = {
            start_state: 0,     // Start at the first child.
            accept_states: converted_children[converted_children.length - 1].accept_states, // it accepts only when the last nfa accepts.
            transitions: [

            ]
        }
        for(let i = 0; i < converted_children.length; i++) {
            nfa.transitions = nfa.transitions.concat(converted_children[i].transitions);
        }
        // link the accept states of each child (except the last) each to the start states of the next child.
        for(let child_index = 0; child_index < converted_children.length - 1; child_index++) {
            let accept_states = converted_children[child_index].accept_states;
            for(let state_index = 0; state_index < accept_states.length; state_index++) {
                let accept_state_epsilon_transition = nfa.transitions[accept_states[state_index]].get("EPSILON");
                if(accept_state_epsilon_transition) {
                    accept_state_epsilon_transition.push(converted_children[child_index + 1].start_state);
                    nfa.transitions[accept_states[state_index]].set("EPSILON", accept_state_epsilon_transition);
                } else {
                    nfa.transitions[accept_states[state_index]].set("EPSILON", [converted_children[child_index + 1].start_state]);
                }
            }
        }

        return nfa;
    }

    _wildcard(iter: TreeIterator<Token<RegexTokenKind, string>>): NFA {
        const child_nfas = this._generate_child_nfas(iter);
        const nfa = this._wildcard_helper(child_nfas[0]);
        return nfa;
    }

    _wildcard_helper(child: NFA): NFA {
        let offset = 1;
        let converted: NFA = this._offset_nfa(child, offset);

        // For each accept state of the converted nfa, set epsilon transition back to new start state.
        for(let i = 0; i < converted.accept_states.length; i++) {
            const accept_state = converted.accept_states[i] - offset;
            let converted_epsilon_transition = converted.transitions[accept_state].get("EPSILON");
            if(converted_epsilon_transition) {
                converted_epsilon_transition.push(0);
                converted.transitions[accept_state].set("EPSILON", converted_epsilon_transition);
            } else {
                converted.transitions[accept_state].set("EPSILON", [0]);
            }
        }
        
        // Append new start state, that is also accept state, that has epsilon-transition to 
        // start state of child nfa.
        let start_transition: Map<string, number[]> = new Map();
        start_transition.set("EPSILON", [1]);
        let nfa: NFA = {
            start_state: 0,
            accept_states: [0, ...converted.accept_states],
            transitions: [
                start_transition,
                ...converted.transitions
            ]
        }

        return nfa;
    }

    _optional(iter: TreeIterator<Token<RegexTokenKind, string>>): NFA {
        const child_nfas = this._generate_child_nfas(iter);
        const nfa = this._wildcard_helper(child_nfas[0]);
        return nfa;
    }

    _optional_helper(child: NFA): NFA {
        let offset = 1;
        let converted: NFA = this._offset_nfa(child, offset);
        
        // Append new start state, that is also accept state, that has epsilon-transition to 
        // start state of child nfa.
        let start_transition: Map<string, number[]> = new Map();
        start_transition.set("EPSILON", [1]);
        let nfa: NFA = {
            start_state: 0,
            accept_states: [0, ...converted.accept_states],
            transitions: [
                start_transition,
                ...converted.transitions
            ]
        }

        return nfa;
    }

    /**
     * @description - offsets nfa accept states, start states, and transitions by the offset.
     *                BUT DOES NOT CHANGE INDEX of transitions.
     * @param nfa 
     * @param offset 
     */
    _offset_nfa(nfa: NFA, offset: number): NFA {
        let converted: NFA = {
            start_state: nfa.start_state + offset,
            accept_states: nfa.accept_states.map((state) => {
                return state + offset;
            }),
            transitions: nfa.transitions.map((transition) => {
                let map: Map<string, number[]> = new Map();
                const pairs = transition.entries();
                while(true) {
                    let next = pairs.next();
                    if(next.done) {
                        break;
                    } else {
                        map.set(next.value[0], next.value[1].map((state) => {return state + offset}));
                    }
                }

                return map;
            })
        }

        return converted;
    }

    _term(char: string): NFA {
        let transition: Map<string, number[]> = new Map();
        transition.set(char, [1]);
        return {
            start_state: 0,
            accept_states: [1],
            transitions: [
                transition,  // transition from 0 to 1 on the input char.
                new Map()    // No transitions from 1.
            ]
        }
    }
}

/**
 * This should generate an NFA - a 2D array\
 * 
 *          a           |       b   |    epsilon
 *      A   {A, B}          {}              {C}
 *      B   {A}             {C}             {}
 *      C   {}              {A, B}          {}
 * 
 *      accept_states: {C}
 *     start: A
 * 
 *      The above completely describes the NFA, giving the alphabet, the states, the accept states,
 *          the start state, and the transition function.
 */

 export { RegexCodeGenerator };