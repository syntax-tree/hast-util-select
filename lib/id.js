/**
 * @typedef {import('css-selector-parser').AstId} AstId
 *
 * @typedef {import('hast').Element} Element
 */

// Workaround to show references to above types in VS Code.
''

/**
 * Check whether an element has an ID.
 *
 * @param {AstId} query
 *   AST rule (with `ids`).
 * @param {Element} element
 *   Element.
 * @returns {boolean}
 *   Whether `element` matches `query`.
 */
export function id(query, element) {
  return element.properties.id === query.name
}
