# Criterion

[![npm version](https://badge.fury.io/js/criterion.svg)](https://badge.fury.io/js/criterion)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> A type-safe, chainable dataset evaluator that dynamically generates logic-based search methods from a user-defined comparator.

Criterion is a composable engine for building chainable data queries. It dynamically generates methods (e.g., `.gt()`, `.even()`, `.older()`) from a comparator function, turning any dataset into a flexible and type-safe query system with support for filtering, chaining, and deduplication.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [API Reference](#api-reference)
- [Use Cases](#use-cases)
- [Contributing](#contributing)
- [License](#license)

## Features

- **Dynamic Method Generation**: Define a comparator, and Criterion automatically creates chainable methods from its keys.
- **Composable Chaining**: Combine conditions fluidly (e.g., `.even().gt(3).dedupe()`).
- **Immutability**: The original dataset is never mutated.
- **Flexible Data Support**: Works with primitives, objects, and complex nested structures.
- **Built-in Utilities**: Includes `.dedupe()` and `.clear()` for refining results.
- **Type-Safe**: Provides full TypeScript inference for the dataset type and comparator result shape.

## Installation

```bash
npm install criterion
# or
yarn add criterion
```

## Usage

Criterion works by taking a dataset and a comparator function. The comparator defines boolean flags that are transformed into chainable methods.

### Example: Numbers

```typescript
import Criterion from 'criterion';

const comparator = (n: number, test = 2) => ({
  even: n % 2 === 0,
  gt: n > test,
  multipleOf3: n % 3 === 0,
});

const numbers = [1, 2, 3, 4, 5, 6, 9];
const criterion = Criterion(numbers, comparator);

const result = criterion
  .even()       // Filters for even numbers
  .gt(3)        // Filters for numbers greater than 3
  .multipleOf3()// Filters for multiples of 3
  .dedupe()     // Removes duplicates
  .value;

console.log(result); // [6]
```

### Example: Objects

```typescript
import Criterion from 'criterion';

type User = { id: number; age: number; active: boolean };

const comparator = (u: User, test: User = { id: 0, age: 25, active: true }) => ({
  adult: u.age >= 18,
  older: u.age > test.age,
  active: u.active,
});

const users: User[] = [
  { id: 1, age: 17, active: true },
  { id: 2, age: 22, active: false },
  { id: 3, age: 30, active: true },
  { id: 4, age: 30, active: true },
];

const criterion = Criterion(users, comparator);

const result = criterion
  .adult()
  .older({ id: 999, age: 20, active: true })
  .dedupe('age')
  .value;

console.log(result);
/*
[
  { id: 2, age: 22, active: false },
  { id: 3, age: 30, active: true },
]
*/
```

## API Reference

### `Criterion(data, comparator)`

Creates a new Criterion instance.

- **`data`**: An array of any type (primitives or objects).
- **`comparator`**: A function with the signature `(item, test?) => Record<string, boolean>`.

  **Important:**
    - This function must be able to handle cases where the `item` (the first argument) is `null` or `undefined`.
    - It must always return an object with the complete key structure, as this structure is used to generate the dynamic methods on the `Criterion` instance.

### Dynamic Methods

Each key in the comparator’s return object becomes a chainable filter method. Each call filters the dataset based on that key and returns the instance for further chaining.

### `.value`

Returns the cumulative result of all chained filters.

### `.clear()`

Resets the cumulative result list. The original dataset is not modified.

### `.dedupe(keyOrFn?)`

Removes duplicates from the cumulative result.

- **No argument**: Dedupes by object reference.
- **`string`**: Dedupes by the specified property key.
- **`function`**: Dedupes by the return value of the provided function.

## Use Cases

- **Domain-Specific Queries**: Create mini query languages for datasets.
- **Rule Engines**: Define rule engines for trading strategies, metric filters, and more.
- **Composable Search**: Build search pipelines without re-filtering the raw data.
- **Behavioral Testing**: Dynamically test comparator logic.

### Example: Complex Use Case

```typescript
const candles = [
  { open: 1, close: 2 },
  { open: 2, close: 1 },
  { open: 3, close: 5 },
];

const comparator = (candle, ref = { close: 2 }) => ({
  bullish: candle.close > candle.open,
  bearish: candle.close < candle.open,
  aboveRef: candle.close > ref.close,
});

const s = Criterion(candles, comparator);

const setup = s.bullish().aboveRef().dedupe().value;
// Returns candles that closed above their open and above the reference close price.
```

## Contributing

Contributions, issues, and feature requests are welcome. Please check the [issues page](https://github.com/ndifreke/criterion/issues).

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
