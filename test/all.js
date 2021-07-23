import test from 'tape'
import {u} from 'unist-builder'
import {h} from 'hastscript'
import {selectAll} from '../index.js'

test('all together now', (t) => {
  t.deepEqual(
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

  t.deepEqual(
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

  t.deepEqual(
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

  t.deepEqual(
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
      h('dt.foo', 'Charlie'),
      h('dd.foo', {title: 'baz'}, 'Foxtrot'),
      h('dd', 'Delta'),
      h('dt', 'Golf'),
      h('dd', 'Hotel'),
      h('dt', {title: 'bar'}, 'Alpha')
    ]
  )

  t.end()
})
