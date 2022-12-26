import assert from 'node:assert/strict'
import test from 'node:test'
import {u} from 'unist-builder'
import {h, s} from 'hastscript'
import {select, selectAll} from '../index.js'

test('svg', () => {
  assert.deepEqual(
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

  assert.deepEqual(
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

  assert.deepEqual(
    select('[writing-mode]', s('text', {writingMode: 'lr-tb'}, '!')),
    null
  )

  assert.deepEqual(
    select('[writing-mode]', s('text', {writingMode: 'lr-tb'}, '!'), 'svg'),
    s('text', {writingMode: 'lr-tb'}, '!')
  )
})
