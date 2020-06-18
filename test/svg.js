'use strict'

var test = require('tape')
var u = require('unist-builder')
var s = require('hastscript/svg')
var h = require('hastscript')
var select = require('..').select
var selectAll = require('..').selectAll

test('svg', function (t) {
  t.deepEqual(
    select(
      '[writing-mode]',
      u('root', [
        s('svg', [s('text', {writingMode: 'lr-tb'}, '!')]),
        s('p', [
          h(
            'text',
            {writingMode: 'lr-tb'},
            'this is a camelcased HTML attribute'
          )
        ])
      ])
    ),
    s('text', {writingMode: 'lr-tb'}, '!')
  )

  t.deepEqual(
    selectAll(
      '[writing-mode]',
      u('root', [
        s('svg', [s('text', {writingMode: 'lr-tb'}, '!')]),
        s('p', [
          h(
            'text',
            {writingMode: 'lr-tb'},
            'this is a camelcased HTML attribute'
          )
        ])
      ])
    ),
    [s('text', {writingMode: 'lr-tb'}, '!')]
  )

  t.deepEqual(
    select('[writing-mode]', s('text', {writingMode: 'lr-tb'}, '!')),
    null
  )

  t.deepEqual(
    select('[writing-mode]', s('text', {writingMode: 'lr-tb'}, '!'), 'svg'),
    s('text', {writingMode: 'lr-tb'}, '!')
  )

  t.end()
})
