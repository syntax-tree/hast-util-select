/**
 *
 * @typedef {import('hast').Root} Root
 * @typedef {import('hast').Content} Content
 * @typedef {import('hast').Element} Element
 * @typedef {import('hast').ElementContent} ElementChild
 * @typedef {import('hast').Properties} Properties
 * @typedef {Root|Content} Node
 * @typedef {Extract<Node, import('hast').Parent>} Parent
 * @typedef {Properties[keyof Properties]} PropertyValue
 *
 * @typedef {import('css-selector-parser').Selector} Selector
 * @typedef {import('css-selector-parser').Selectors} Selectors
 * @typedef {import('css-selector-parser').RuleSet} RuleSet
 * @typedef {import('css-selector-parser').Rule} Rule
 * @typedef {import('css-selector-parser').RulePseudo} RulePseudo
 * @typedef {import('css-selector-parser').AttrValueType} AttrValueType
 * @typedef {Selector|Rule|RulePseudo} Query
 *
 * @typedef RuleAttr
 *   Fix for types from `css-selector-parser`.
 * @property {string} name
 * @property {string} [operator]
 * @property {AttrValueType} [valueType]
 * @property {string} [value]
 *
 * More specific type for registered selector pseudos.
 * @typedef RulePseudoSelector
 * @property {string} name
 * @property {'selector'} valueType
 * @property {Selector} value
 *
 * Overwrite to compile nth-checks once.
 * @typedef RulePseudoNth
 * @property {string} name
 * @property {'function'} valueType
 * @property {(index: number) => boolean} value
 *
 * @typedef {'html'|'svg'} Space
 * @typedef {'auto'|'ltr'|'rtl'} Direction
 * @typedef {typeof import('property-information').html} Schema
 * @typedef {Schema['property'][string]} Info
 *
 * @typedef SelectState
 * @property {Array<Element>} [scopeElements]
 * @property {SelectIterator} [iterator]
 * @property {boolean} [one=false]
 * @property {boolean} [shallow=false]
 * @property {boolean} [index=false]
 * @property {boolean} [found=false]
 * @property {Space} [space]
 * @property {Schema} [schema]
 * @property {string} [language]
 * @property {Direction} [direction]
 * @property {boolean} [editableOrEditingHost]
 * @property {number} [typeIndex]
 *   Track siblings: this current element has `n` elements with its tag name
 *   before it.
 * @property {number} [elementIndex]
 *   Track siblings: this current element has `n` elements before it.
 * @property {number} [typeCount]
 *   Track siblings: there are `n` siblings with this element’s tag name.
 * @property {number} [elementCount]
 *   Track siblings: there are `n` siblings.
 */

/**
 * @callback SelectIterator
 * @param {Rule} query
 * @param {Node} node
 * @param {number} index
 * @param {Parent|null} parent
 * @param {SelectState} state
 */

/**
 * @typedef {(
 *  ((query: Rule, node: Node, index: number|null, parent: Parent|null, state: SelectState) => void)
 * )} Handler
 */

export {}
