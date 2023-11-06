/**
 * @typedef {import('css-selector-parser').AstClassName} AstClassName
 * @typedef {import('hast').Element} Element
 */

/** @type {Array<never>} */
const emptyClassNames = []

/**
 * Check whether an element has all class names.
 *
 * @param {AstClassName} query
 *   AST rule (with `classNames`).
 * @param {Element} element
 *   Element.
 * @returns {boolean}
 *   Whether `element` matches `query`.
 */
export function className(query, element) {
  // Assume array.
  const value = /** @type {Readonly<Array<string>>} */ (
    element.properties.className || emptyClassNames
  )

  return value.includes(query.name)
}
