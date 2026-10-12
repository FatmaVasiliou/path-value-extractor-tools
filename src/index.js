import { parsePath, resolvePath } from "./core.js";

/**
 * Resolve a dot/bracket path against root.
 *
 * @param {string} path - e.g. "a.b[0].c['weird.key']".
 * @param {object} root - root object to walk.
 * @returns {{value: unknown, exists: boolean}}
 *   `exists` is true only when every segment resolved against an object or array.
 *   `value` is whatever was found (which may itself be null or undefined).
 */
export function extractValue(path, root) {
  return resolvePath(root, parsePath(path));
}

export { parsePath, resolvePath };
