import test from 'tape'
import {u} from 'unist-builder'
import {h, s} from 'hastscript'
import {select, selectAll} from '../index.js'

test('svg', (t) => {
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
