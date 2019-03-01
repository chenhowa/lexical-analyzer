import "jest";
import { ParseTreeNode, ParseTreeIterator, TopDownParseTree } from "parser/top-down-parse-tree";


describe("Building a tree", () => {
    let tree = new TopDownParseTree();
    beforeEach(() => {
        tree = new TopDownParseTree();
    })
    

    test("Inserts root", () => {
        expect(tree.is_empty()).toBe(true);
        tree.set_root(5);
        expect(tree.is_empty()).toBe(false);

        expect(tree.as_string()).toEqual("(5)");
    });

    test('unbalanced tree left', () => {
        tree.set_root(1);
        let root_iter = tree.get_root_iter();
        if(!root_iter) {
            expect(true).toBe(false);
        } else {
            let child_iter = root_iter.add_before(2);
            child_iter.add_before(3);
            
            expect(tree.as_string()).toBe("(1(2(3)))");
        }
    });

    test('unbalanced tree right', () => {
        tree.set_root(1);
        let root_iter = tree.get_root_iter();
        if(!root_iter) {
            expect(true).toBe(false);
        } else {
            let child_iter = root_iter.add_after(2);
            child_iter.add_after(3);
            
            expect(tree.as_string()).toBe("(1(2(3)))");
        }
    });;

    test('balanced tree', () => {
        tree.set_root(1);
        let root_iter = tree.get_root_iter();
        if(!root_iter) {
            expect(true).toBe(false);
        } else {
            let left_iter = root_iter.add_after(2);
            left_iter.add_after(3);

            let right_iter = root_iter.add_after(4);
            right_iter.add_after(5);
            expect(tree.as_string()).toBe("(1(2(3))(4(5)))");
        }
    })

});

describe('Removing from a tree', () => {
    let tree = new TopDownParseTree();
    beforeEach(() => {
        tree = new TopDownParseTree();
        tree.set_root(1);
        let root_iter = tree.get_root_iter();
        if(!root_iter) {
            expect(true).toBe(false);
        } else {
            let left_iter = root_iter.add_after(2);
            left_iter.add_after(3);

            let right_iter = root_iter.add_after(4);
            right_iter.add_after(5);
            expect(tree.as_string()).toBe("(1(2(3))(4(5)))");
        }
    });

    test('single node removal', () => {
        let iter = tree.get_root_iter();
        if(!iter) {
            expect(true).toBe(false);
        } else {
            iter.child(0);
            iter.remove();
            expect(tree.as_string()).toBe("(1(3)(4(5)))");
        }
    });

    test('subtree removal', () => {
        let iter = tree.get_root_iter();
        if(!iter) {
            expect(true).toBe(false);
        } else {
            iter.child(0);
            iter.remove_subtree();
            expect(tree.as_string()).toBe("(1(4(5)))");
        }
    });
});

describe('Updating a tree', () => {
    let tree = new TopDownParseTree();
    beforeEach(() => {
        tree = new TopDownParseTree();
        tree.set_root(1);
        let root_iter = tree.get_root_iter();
        if(!root_iter) {
            expect(true).toBe(false);
        } else {
            let left_iter = root_iter.add_after(2);
            left_iter.add_after(3);

            let right_iter = root_iter.add_after(4);
            right_iter.add_after(5);
            expect(tree.as_string()).toBe("(1(2(3))(4(5)))");
        }
    });

    test('updates work correctly', () => {
        let iter = tree.get_root_iter();
        if(!iter) {
            expect(true).toBe(false);
        } else {
            iter.child(0);
            iter.set(20);
            expect(tree.as_string()).toBe("(1(20(3))(4(5)))");
        }
    });
});