/**
 * @typedef {import('css-selector-parser').AstTagName} AstTagName
 *
 * @typedef {import('hast').Element} Element
 */

// Workaround to show references to above types in VS Code.
''

/**
 * Check whether an element has a tag name.
 *
 * @param {AstTagName} query
 *   AST rule (with `tag`).
 * @param {Element} element
 *   Element.
 * @returns {boolean}
 *   Whether `element` matches `query`.
 */
export function name(query, element) {
  return query.name === element.tagName
}
