import Criterion from "../Criterion";

describe("Logic system", () => {
    describe("with primitive literals", () => {
        let logic: ReturnType<typeof Criterion<number, any>>;

        beforeEach(() => {
            const comparator = (d: number, test = 2) => {
                if (d == null) return { even: false, gt: false };
                return {
                    even: d % 2 === 0,
                    gt: d > test,
                };
            };
            logic = Criterion([1, 2, 3, 4, 5, 6, 4, 6], comparator);
        });

        it("chains correctly with arguments", () => {
            const result = logic.even(2).gt(3).value;
            expect(result).toEqual([2, 4, 6, 4, 6, 4, 5, 6, 4, 6]);
        });

        it("works without arguments (default test)", () => {
            const result = logic.even().gt().value;
            expect(result).toEqual([2, 4, 6, 4, 6, 3, 4, 5, 6, 4, 6]);
        });

        it("dedupes by reference (no arg)", () => {
            const result = logic.even().gt().dedupe().value;
            expect(result).toEqual([2, 4, 6, 3, 5]);
        });

        it("clear() empties result but not source", () => {
            logic.clear().even().gt();
            expect(logic.value.length).toBeGreaterThan(0);
            logic.clear();
            expect(logic.value).toEqual([]);
            logic.even();
            expect(logic.value.length).toBeGreaterThan(0);
        });
    });

    describe("with object dataset", () => {
        type User = { id: number; age: number; active: boolean };
        let logic: ReturnType<typeof Criterion<User, any>>;

        beforeEach(() => {
            const comparator = (user: User, test: User = { id: 0, age: 25, active: true }) => {
                if (user == null) return { adult: false, older: false, active: false };
                return {
                    adult: user.age >= 18,
                    older: user.age > test.age,
                    active: user.active,
                };
            };

            const users: User[] = [
                { id: 1, age: 17, active: true },
                { id: 2, age: 22, active: false },
                { id: 3, age: 30, active: true },
                { id: 4, age: 30, active: true },
            ];

            logic = Criterion(users, comparator);
        });

        it("filters adults and older correctly", () => {
            const result = logic.adult().older({ id: 99, age: 20, active: true }).value;
            const ages = result.map((u) => u.age);
            expect(ages).toContain(22);
            expect(ages).toContain(30);
            expect(ages).not.toContain(17);
        });

        it("dedupes by key", () => {
            const result = logic.adult().older({ id: 99, age: 20, active: true }).dedupe("age").value;
            const ages = result.map((u) => u.age);
            expect(ages).toEqual([22, 30]);
        });

        it("dedupes by function", () => {
            const result = logic.older({ id: 99, age: 20, active: true }).dedupe((u) => u.age).value;
            expect(result.length).toBe(2);
        });

        it("supports chaining without test arguments", () => {
            const result = logic.active().value;
            expect(result.every((u) => u.active)).toBe(true);
        });
    });
});
