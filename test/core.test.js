import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { parsePath, resolvePath } from "../src/core.js";
import { extractValue } from "../src/index.js";

describe("parsePath", () => {
  it("parses a simple dotted path", () => {
    assert.deepEqual(parsePath("a.b.c"), ["a", "b", "c"]);
  });

  it("parses a numeric index", () => {
    assert.deepEqual(parsePath("a[0].b"), ["a", 0, "b"]);
  });

  it("parses single-quoted string keys", () => {
    assert.deepEqual(parsePath("a['foo'].b"), ["a", "foo", "b"]);
  });

  it("parses double-quoted string keys", () => {
    assert.deepEqual(parsePath('a["foo"].b'), ["a", "foo", "b"]);
  });

  it("allows unquoted bracket keys", () => {
    assert.deepEqual(parsePath("a[foo].b"), ["a", "foo", "b"]);
  });

  it("handles a key containing a dot via quoted bracket", () => {
    assert.deepEqual(parsePath('a["weird.key"]'), ["a", "weird.key"]);
  });

  it("returns [] for empty string", () => {
    assert.deepEqual(parsePath(""), []);
  });

  it("throws on unterminated bracket", () => {
    assert.throws(() => parsePath("a["), /PathError/);
  });

  it("throws on missing closing quote", () => {
    assert.throws(() => parsePath("a['foo"), /PathError/);
  });

  it("throws on missing closing bracket after numeric index", () => {
    assert.throws(() => parsePath("a[0"), /PathError/);
  });
});

describe("resolvePath", () => {
  it("resolves a nested object", () => {
    assert.deepEqual(resolvePath({ a: { b: { c: 1 } } }, ["a", "b", "c"]), {
      value: 1,
      exists: true,
    });
  });

  it("resolves an array index", () => {
    assert.deepEqual(resolvePath({ a: [10, 20] }, ["a", 0]), {
      value: 10,
      exists: true,
    });
  });

  it("reports false when a key is missing", () => {
    assert.deepEqual(resolvePath({ a: 1 }, ["b"]), {
      value: undefined,
      exists: false,
    });
  });

  it("reports false when walking into null", () => {
    assert.deepEqual(resolvePath({ a: null }, ["a", "b"]), {
      value: undefined,
      exists: false,
    });
  });

  it("reports false when walking into a primitive", () => {
    assert.deepEqual(resolvePath({ a: 5 }, ["a", "b"]), {
      value: undefined,
      exists: false,
    });
  });

  it("reports false for out-of-range array index", () => {
    assert.deepEqual(resolvePath({ a: [1] }, ["a", 5]), {
      value: undefined,
      exists: false,
    });
  });

  it("reports true when the resolved value is null", () => {
    assert.deepEqual(resolvePath({ a: null }, ["a"]), {
      value: null,
      exists: true,
    });
  });

  it("reports false when applying a number key to an object", () => {
    assert.deepEqual(resolvePath({ a: 1 }, [0]), {
      value: undefined,
      exists: false,
    });
  });

  it("reports false when applying a string key to an array", () => {
    assert.deepEqual(resolvePath([1, 2], ["a"]), {
      value: undefined,
      exists: false,
    });
  });
});

describe("extractValue (integration)", () => {
  it("dotted happy path", () => {
    assert.deepEqual(extractValue("a.b.c", { a: { b: { c: 42 } } }), {
      value: 42,
      exists: true,
    });
  });

  it("bracket index happy path", () => {
    assert.deepEqual(extractValue("list[1].name", { list: [{ name: "a" }, { name: "b" }] }), {
      value: "b",
      exists: true,
    });
  });

  it("missing path", () => {
    assert.deepEqual(extractValue("a.b", { a: 1 }), {
      value: undefined,
      exists: false,
    });
  });

  it("value is null still exists", () => {
    assert.deepEqual(extractValue("a", { a: null }), {
      value: null,
      exists: true,
    });
  });
});
