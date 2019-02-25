


interface Regex {
    set(regex: string): void;
    emit_normalized_regex(): string;
}


class ConcreteRegex implements Regex {
    set(regex: string) {

    }

    emit_normalized_regex(): string {
        return "";
    }
}


export { Regex, ConcreteRegex };