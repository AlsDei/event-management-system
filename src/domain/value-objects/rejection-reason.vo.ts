export class RejectionReason {
    private readonly value: string;

    constructor(value: string) {
        if (!value) {
            throw new Error("A rejection reason must be provided.");
        }
        this.value = value;
    }

    getValue(): string {
        return this.value;
    }
}