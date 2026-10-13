# path-value-extractor-tools

Extract a value from a nested object given a dot-or-bracket path string, returning
both the value and a boolean indicating whether the path actually existed.

```js
import { extractValue } from "path-value-extractor-tools";

const result = extractValue("users[0].name", { users: [{ name: "Ada" }] });
// { value: "Ada", exists: true }

const missing = extractValue("users[5].name", { users: [{ name: "Ada" }] });
// { value: undefined, exists: false }
```

Exports: `extractValue(path, root)` (default entry point), plus `parsePath(path)` and
`resolvePath(root, segments)` from `./core.js`.

## Why

`obj?.a?.b` tells you the value is undefined; it does not tell you whether `b` was
missing versus present-but-undefined. This library gives you an `exists` flag so you
can tell the two apart, which matters when null/undefined are themselves meaningful
values.

## Path syntax

`a.b.c`, `a[0].b`, `a['foo'].b[2]`, `a["weird.key"]`, and `a[foo].b` are all accepted.
Quotes are optional for non-numeric bracket keys so `a[foo]` is equivalent to
`a['foo']`. Use quotes when the key contains `.` or `[`.

Numeric indices become real numbers. A bracket key is treated as a numeric index if its
content is digits (optionally leading `-`); everything else is a string.

## Awkward edges

- A path that walks into `null` or a primitive reports `exists: false`. `null` is
treated as absent, not as "present but null". If you need the "present but null" case,
fetch the parent with a shorter path and read the property yourself.
- `exists` uses `hasOwnProperty`, so inherited properties on a plain object are treated
as missing. Arrays use range-checked integer indexing.
