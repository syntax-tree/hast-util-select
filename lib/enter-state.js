/**
 * @typedef {import('./types.js').SelectState} SelectState
 * @typedef {import('./types.js').HastNode} HastNode
 * @typedef {import('./types.js').ElementChild} ElementChild
 * @typedef {import('./types.js').Direction} Direction
 * @typedef {import('unist-util-visit').Visitor<ElementChild>} Visitor
 */

import {direction} from 'direction'
import {isElement} from 'hast-util-is-element'
import toString from 'hast-util-to-string'
import {svg} from 'property-information'
import {visit, EXIT, SKIP} from 'unist-util-visit'
import {element} from './util.js'

/**
 * @param {SelectState} state
 * @param {HastNode} node
 * @returns {() => void}
 */
// eslint-disable-next-line complexity
export function enterState(state, node) {
  var schema = state.schema
  var language = state.language
  var currentDirection = state.direction
  var editableOrEditingHost = state.editableOrEditingHost
  /** @type {Direction|null} */
  var dirInferred
  /** @type {string} */
  var type
  /** @type {boolean} */
  var found
  /** @type {string} */
  var lang
  /** @type {Direction|null} */
  var dir

  if (element(node)) {
    // @ts-ignore Assume string.
    lang = node.properties.xmlLang || node.properties.lang
    // @ts-ignore Assume string.
    type = node.properties.type || 'text'
    dir = dirProperty(node)

    if (lang !== undefined && lang !== null) {
      state.language = lang
      found = true
    }

    if (schema.space === 'html') {
      if (node.properties.contentEditable === 'true') {
        state.editableOrEditingHost = true
        found = true
      }

      if (isElement(node, 'svg')) {
        state.schema = svg
        found = true
      }

      // See: <https://html.spec.whatwg.org/#the-directionality>.
      // Explicit `[dir=rtl]`.
      if (dir === 'rtl') {
        dirInferred = dir
      } else if (
        // Explicit `[dir=ltr]`.
        dir === 'ltr' ||
        // HTML with an invalid or no `[dir]`.
        (dir !== 'auto' && isElement(node, 'html')) ||
        // `input[type=tel]` with an invalid or no `[dir]`.
        (dir !== 'auto' && isElement(node, 'input') && type === 'tel')
      ) {
        dirInferred = 'ltr'
        // `[dir=auto]` or `bdi` with an invalid or no `[dir]`.
      } else if (dir === 'auto' || isElement(node, 'bdi')) {
        if (isElement(node, 'textarea')) {
          // Check contents of `<textarea>`.
          dirInferred = dirBidi(toString(node))
        } else if (
          isElement(node, 'input') &&
          (type === 'email' ||
            type === 'search' ||
            type === 'tel' ||
            type === 'text')
        ) {
          // Check value of `<input>`.
          // @ts-ignore something is `never` in types but this is needed.
          dirInferred = node.properties.value
            ? // @ts-ignore Assume string
              dirBidi(node.properties.value)
            : 'ltr'
        } else {
          // Check text nodes in `node`.
          visit(node, inferDirectionality)
        }
      }

      if (dirInferred) {
        state.direction = dirInferred
        found = true
      }
    }
    // Turn off editing mode in non-HTML spaces.
    else if (state.editableOrEditingHost) {
      state.editableOrEditingHost = false
      found = true
    }
  }

  return found ? reset : noop

  function reset() {
    state.schema = schema
    state.language = language
    state.direction = currentDirection
    state.editableOrEditingHost = editableOrEditingHost
  }

  /** @type {Visitor} */
  function inferDirectionality(child) {
    if (child.type === 'text') {
      dirInferred = dirBidi(child.value)
      return dirInferred ? EXIT : null
    }

    if (
      child !== node &&
      (isElement(child, ['bdi', 'script', 'style', 'textare']) ||
        dirProperty(child))
    ) {
      return SKIP
    }
  }
}

/**
 * @param {string} value
 * @returns {Direction}
 */
function dirBidi(value) {
  var result = direction(value)
  return result === 'neutral' ? null : result
}

/**
 * @param {ElementChild} node
 * @returns {Direction}
 */
function dirProperty(node) {
  var value =
    element(node) && typeof node.properties.dir === 'string'
      ? node.properties.dir.toLowerCase()
      : null
  return value === 'auto' || value === 'ltr' || value === 'rtl' ? value : null
}

function noop() {}
