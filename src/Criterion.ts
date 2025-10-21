/**
 * Represents the structure of a comparator result.
 * Each property key corresponds to a comparison operation (e.g., 'gt', 'even').
 */
export type ComparatorResult<K extends PropertyKey = string> = Record<K, boolean>;

/**
 * Describes a dynamic interface of callable comparison methods.
 * Each method accepts an optional test value and returns a new chainable Search instance.
 */
export type CriterionInstance<D, T extends ComparatorResult> = {
    [K in keyof T]: (arg?: D) => Criterion<D, T> & CriterionInstance<D, T>;
};

/**
 * Describes the signature of a comparator function.
 * It takes a datum, an optional test value, and an optional key,
 * returning a ComparatorResult indicating the outcomes of various comparisons.
 */
export type ComparatorFunction<D, T extends ComparatorResult> = (datum: D, test?: D, key?: keyof T) => T;

/**
 * Criterion class provides a composable, chainable interface for
 * performing dataset evaluations using a user-defined comparator function.
 *
 * Key semantics:
 * - `source` is the immutable dataset.
 * - `result` is the cumulative list of matches, built up through chained operations.
 * - Comparator methods are created dynamically based on the comparator's return keys.
 * - Each method appends matching elements to `result` instead of overwriting it.
 */
class Criterion<D, T extends ComparatorResult> {
    /** User-defined comparator: determines how two data items relate */
    private readonly comparator: ComparatorFunction<D, T>;

    /** Immutable source dataset */
    private readonly source: D[];

    /** Cumulative matches built up through chained comparisons */
    private result: D[] = [];

    constructor(data: D[], comparator: (datum: D, test?: D, key?: keyof T) => T) {
        this.source = [...data];
        this.comparator = comparator;

        // Derive available comparator keys dynamically (e.g. 'gt', 'even', etc.)
        const keys = comparator(null as any, undefined, undefined);
        if (typeof keys !== 'object' || keys === null) {
            throw new Error('Did you forget to return an object in the comparator function?');
        }
        for (const key of Object.keys(keys) as (keyof T)[]) {
            (this as any)[key] = (test?: D) => {
                const testValue = test;
                const matches = this.source.filter(
                    (d) => this.comparator(d, testValue, key)[key],
                );
                this.result.push(...matches);
                return this as Criterion<D, T> & CriterionInstance<D, T>;
            };
        }
    }

    /** Returns the current cumulative result of chained evaluations */
    get value(): D[] {
        return this.result;
    }

    /**
     * Clears only the cumulative result list.
     * Does not affect the original source dataset.
     */
    clear(): this {
        this.result = [];
        return this;
    }

    /**
     * Removes duplicate entries from the cumulative result.
     *
     * @param key - Optional deduplication basis:
     *   - If omitted, uses reference-based deduplication.
     *   - If string key, dedupes by property value.
     *   - If function, dedupes by function return value.
     */
    dedupe(key?: keyof D | ((datum: D) => any)): this {
        const seen = new Set<any>();
        const resolver =
            typeof key === 'function'
                ? key
                : key
                  ? (d: D) => (d as any)[key]
                  : (d: D) => d;

        this.result = this.result.filter((d) => {
            const val = resolver(d);
            if (seen.has(val)) return false;
            seen.add(val);
            return true;
        });
        return this;
    }
}

/**
 * Factory function that constructs a new Search instance
 * while preserving full type inference for both data and comparator result.
 */
export default function create<D, T extends ComparatorResult>(
    data: D[],
    comparator: ComparatorFunction<D, T>,
): Criterion<D, T> & CriterionInstance<D, T> {
    return new Criterion(data, comparator) as Criterion<D, T> & CriterionInstance<D, T>;
}
