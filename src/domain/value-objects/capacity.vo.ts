export class Capacity {
    private readonly value: number;

    constructor(value: number) {
        if (value <= 0) {
            throw new Error("Maximum capacity must be greater than 0");
        }
        this.value = value;
    }

    get Value(): number {
        return this.value;
    }
}