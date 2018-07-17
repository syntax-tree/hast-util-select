'use strict'

var test = require('tape')
var u = require('unist-builder')
var s = require('hastscript/svg')
var select = require('..').select

test('svg', function(t) {
  t.deepEqual(
    select(
      '[writing-mode]',
      u('root', [s('svg', [s('text', {writingMode: 'lr-tb'}, '!')])])
    ),
    s('text', {writingMode: 'lr-tb'}, '!')
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
