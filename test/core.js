import assert from 'node:assert/strict'
import test from 'node:test'
import {h} from 'hastscript'
import {u} from 'unist-builder'
import {selectAll} from '../index.js'

test('hast-util-select', async function (t) {
  await t.test('should expose the public api', async function () {
    assert.deepEqual(Object.keys(await import('../index.js')).sort(), [
      'matches',
      'select',
      'selectAll'
    ])
  })

  await t.test('should select stuff (#1)', async function () {
    assert.deepEqual(
      selectAll(
        'dl > dt.foo:nth-of-type(odd)',
        u('root', [
          h('dl', [
            '\n  ',
            h('dt.foo', 'Alpha'),
            '\n  ',
            h('dd', 'Bravo'),
            '\n  ',
            h('dt', 'Charlie'),
            '\n  ',
            h('dd', 'Delta'),
            '\n  ',
            h('dt', 'Echo'),
            '\n  ',
            h('dd', 'Foxtrot'),
            '\n'
          ])
        ])
      ),
      [h('dt.foo', 'Alpha')]
    )
  })

  await t.test('should select stuff (#2)', async function () {
    assert.deepEqual(
      selectAll(
        '.foo ~ dd:nth-of-type(even)',
        u('root', [
          h('dl', [
            '\n  ',
            h('dt', 'Alpha'),
            '\n  ',
            h('dd', 'Bravo'),
            '\n  ',
            h('dt.foo', 'Charlie'),
            '\n  ',
            h('dd', 'Delta'),
            '\n  ',
            h('dt', 'Echo'),
            '\n  ',
            h('dd', 'Foxtrot'),
            '\n  ',
            h('dt', 'Golf'),
            '\n  ',
            h('dd', 'Hotel'),
            '\n'
          ])
        ])
      ),
      [h('dd', 'Delta'), h('dd', 'Hotel')]
    )
  })

  await t.test('should select stuff (#3)', async function () {
    assert.deepEqual(
      selectAll(
        '.foo + dd:nth-of-type(even)',
        u('root', [
          h('dl', [
            '\n  ',
            h('dt', 'Alpha'),
            '\n  ',
            h('dd', 'Bravo'),
            '\n  ',
            h('dt.foo', 'Charlie'),
            '\n  ',
            h('dd', 'Delta'),
            '\n  ',
            h('dt', 'Echo'),
            '\n  ',
            h('dd', 'Foxtrot'),
            '\n  ',
            h('dt', 'Golf'),
            '\n  ',
            h('dd', 'Hotel'),
            '\n'
          ])
        ])
      ),
      [h('dd', 'Delta')]
    )
  })

  await t.test('should select stuff (#4)', async function () {
    assert.deepEqual(
      selectAll(
        '.foo, :nth-of-type(even), [title]',
        u('root', [
          h('dl', [
            h('dt', {title: 'bar'}, 'Alpha'),
            h('dd', 'Bravo'),
            h('dt.foo', 'Charlie'),
            h('dd', 'Delta'),
            h('dt', 'Echo'),
            h('dd.foo', {title: 'baz'}, 'Foxtrot'),
            h('dt', 'Golf'),
            h('dd', 'Hotel')
          ])
        ])
      ),
      [
        h('dt', {title: 'bar'}, 'Alpha'),
        h('dt.foo', 'Charlie'),
        h('dd', 'Delta'),
        h('dd.foo', {title: 'baz'}, 'Foxtrot'),
        h('dt', 'Golf'),
        h('dd', 'Hotel')
      ]
    )
  })

  await t.test('should select stuff (#5)', async function () {
    assert.deepEqual(
      selectAll(
        'a:not([class])',
        u('root', [h('a#w.a'), h('a#x'), h('a#y.b'), h('a#z')])
      ),
      [h('a#x'), h('a#z')],
      'should support `:not` with multiple matches (GH-6)'
    )
  })
})
