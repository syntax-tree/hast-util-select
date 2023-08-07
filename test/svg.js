import assert from 'node:assert/strict'
import test from 'node:test'
import {h, s} from 'hastscript'
import {u} from 'unist-builder'
import {select, selectAll} from '../index.js'

test('svg', async function (t) {
  await t.test('should match svg (#1)', async function () {
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
  })

  await t.test('should match svg (#2)', async function () {
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
  })

  await t.test('should match svg (#3)', async function () {
    assert.deepEqual(
      select('[writing-mode]', s('text', {writingMode: 'lr-tb'}, '!')),
      null
    )
  })

  await t.test('should match svg (#4)', async function () {
    assert.deepEqual(
      select('[writing-mode]', s('text', {writingMode: 'lr-tb'}, '!'), 'svg'),
      s('text', {writingMode: 'lr-tb'}, '!')
    )
  })
})
