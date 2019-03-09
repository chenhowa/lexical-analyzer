import { RegexParser } from "regex/regex-parser";
import { RegexCodeGenerator } from "./code-gen/generator";


let generator = new RegexCodeGenerator();
let children = [generator._term("a"), generator._term("b")];
let nfa = generator._concat_helper(children);