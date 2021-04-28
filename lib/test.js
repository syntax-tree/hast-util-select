import {attribute} from './attribute.js'
import {className} from './class-name.js'
import {id} from './id.js'
import {name} from './name.js'
import {pseudo} from './pseudo.js'

export function test(query, node, index, parent, state) {
  return (
    node &&
    node.type === 'element' &&
    (!query.tagName || name(query, node)) &&
    (!query.classNames || className(query, node)) &&
    (!query.id || id(query, node)) &&
    (!query.attrs || attribute(query, node, state.schema)) &&
    (!query.pseudos || pseudo(query, node, index, parent, state))
  )
}
