'use strict'

var test = require('tape')
var u = require('unist-builder')
var h = require('hastscript')
var selectAll = require('..').selectAll

test('all together now', function(t) {
  t.deepEqual(
    selectAll(
      'dl > dt.foo:nth-of-type(odd)',
      u('root', [
        h('dl', [
          h('dt.foo', 'Alpha'),
          h('dd', 'Bravo'),
          h('dt', 'Charlie'),
          h('dd', 'Delta'),
          h('dt', 'Echo'),
          h('dd', 'Foxtrot')
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
          h('dt', 'Alpha'),
          h('dd', 'Bravo'),
          h('dt.foo', 'Charlie'),
          h('dd', 'Delta'),
          h('dt', 'Echo'),
          h('dd', 'Foxtrot'),
          h('dt', 'Golf'),
          h('dd', 'Hotel')
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
          h('dt', 'Alpha'),
          h('dd', 'Bravo'),
          h('dt.foo', 'Charlie'),
          h('dd', 'Delta'),
          h('dt', 'Echo'),
          h('dd', 'Foxtrot'),
          h('dt', 'Golf'),
          h('dd', 'Hotel')
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
