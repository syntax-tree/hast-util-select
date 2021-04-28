import {any} from './lib/any.js'
import {parse} from './lib/parse.js'

export function matches(selector, node, space) {
  return Boolean(
    any(parse(selector), node, {space, one: true, shallow: true})[0]
  )
}

export function select(selector, node, space) {
  return any(parse(selector), node, {space, one: true})[0] || null
}

export function selectAll(selector, node, space) {
  return any(parse(selector), node, {space})
}
