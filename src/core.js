/**
 * Parse a dotted/bracketed path string into a list of keys.
 *
 * Examples:
 *   "a.b.c"            -> ["a", "b", "c"]
 *   "a[0].b"           -> ["a", 0, "b"]
 *   "a[\"foo\"].b[2]"   -> ["a", "foo", "b", 2]
 *   "a['b'].c['d']"     -> ["a", "b", "c", "d"]
 *
 * Number-looking indices become actual JS numbers; everything else stays a string.
 * Quotes are optional in non-numeric bracket keys (both single and double allowed)
 * so that "a[foo]" and "a['foo']" both yield the string key "foo". This avoids
 * forcing users to quote in the common unquoted case while still permitting keys
 * that contain "." or "[".
 */
export function parsePath(path) {
  if (typeof path !== "string" || path.length === 0) {
    return [];
  }

  const segments = [];
  const n = path.length;
  let i = 0;

  // Dot-prefixed segment: "<chars until . or [>"
  while (i < n) {
    const dotStart = i;
    while (i < n && path[i] !== "." && path[i] !== "[") {
      i++;
    }
    const dotLen = i - dotStart;
    if (dotLen > 0) {
      segments.push(path.slice(dotStart, i));
    }

    while (i < n && path[i] === "[") {
      i++; // step past '['
      if (i >= n) {
        throw new Error(`PathError: unterminated '[' at position ${i - 1}`);
      }

      const ch = path[i];
      if (ch === '"' || ch === "'") {
        const quote = ch;
        i++; // step past opening quote
        const strStart = i;
        let key = "";
        let esc = false;
        while (i < n) {
          const c = path[i++];
          if (esc) {
            key += c;
            esc = false;
          } else if (c === "\\") {
            esc = true;
          } else if (c === quote) {
            break;
          } else {
            key += c;
          }
        }
        if (esc) {
          throw new Error(`PathError: unterminated string key at position ${strStart}`);
        }
        if (i > n) {
          // string ran to EOF without closing quote
          throw new Error(`PathError: unterminated string key at position ${strStart}`);
        }
        segments.push(key);
        if (i < n && path[i] === "]") {
          i++; // step past closing ']'
        } else {
          throw new Error(`PathError: expected ']' after string key at position ${i}`);
        }
      } else {
        const numStart = i;
        if (path[i] === "-") {
          i++;
        }
        let digits = "";
        while (i < n && path[i] >= "0" && path[i] <= "9") {
          digits += path[i++];
        }
        if (digits.length === 0) {
          // Treat as an unquoted string key.
          const keyStart = numStart;
          while (i < n && path[i] !== "]") {
            i++;
          }
          if (i >= n) {
            throw new Error(`PathError: unterminated '[' at position ${keyStart - 1}`);
          }
          const key = path.slice(keyStart, i);
          if (key.length === 0) {
            throw new Error(`PathError: invalid index content at position ${keyStart}`);
          }
          segments.push(key);
          i++; // step past closing ']'
        } else {
          segments.push(Number(path.slice(numStart, i)));
          if (i < n && path[i] === "]") {
            i++;
          } else {
            throw new Error(`PathError: expected ']' after numeric index at position ${i}`);
          }
        }
      }
    }

    if (i < n && path[i] === ".") {
      i++;
    }
  }

  return segments;
}

/**
 * Resolve pre-parsed segments against root.
 *
 * Returns { value, exists } where:
 *   - exists is true only when every segment resolved against an object or array.
 *   - value is undefined when exists is false.
 *
 * Intentionally returns exists=false if any intermediate is null or a primitive —
 * null is treated as "absent" rather than "undefined but present". This makes the
 * flag reliable for distinguishing "path is missing" from "path's value is
 * null/undefined".
 */
export function resolvePath(root, segments) {
  let current = root;
  for (let k = 0; k < segments.length; k++) {
    if (current === null || typeof current !== "object") {
      return { value: undefined, exists: false };
    }
    const seg = segments[k];
    if (Array.isArray(current)) {
      if (typeof seg !== "number" || !Number.isInteger(seg)) {
        return { value: undefined, exists: false };
      }
      if (seg < 0 || seg >= current.length) {
        return { value: undefined, exists: false };
      }
      current = current[seg];
    } else {
      if (typeof seg !== "string") {
        return { value: undefined, exists: false };
      }
      if (!Object.prototype.hasOwnProperty.call(current, seg)) {
        return { value: undefined, exists: false };
      }
      current = current[seg];
    }
  }
  return { value: current, exists: true };
}
