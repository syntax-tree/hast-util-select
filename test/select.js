import assert from 'node:assert/strict'
import test from 'node:test'
import {u} from 'unist-builder'
import {h, s} from 'hastscript'
import {select} from '../index.js'

test('select.select()', async (t) => {
  await t.test('invalid selectors', () => {
    assert.throws(
      () => {
        // @ts-expect-error runtime.
        select()
      },
      /Error: Expected `string` as selector, not `undefined`/,
      'should throw without selector'
    )

    assert.throws(
      () => {
        // @ts-expect-error runtime.
        select([], h(''))
      },
      /Error: Expected `string` as selector, not ``/,
      'should throw w/ invalid selector (1)'
    )

    assert.throws(
      () => {
        select('@supports (transform-origin: 5% 5%) {}', h(''))
      },
      /Error: Rule expected but "@" found./,
      'should throw w/ invalid selector (2)'
    )

    assert.throws(
      () => {
        select('[foo%=bar]', h(''))
      },
      /Error: Expected "=" but "%" found./,
      'should throw on invalid attribute operators'
    )

    assert.throws(
      () => {
        select(':active', h(''))
      },
      /Error: Unknown pseudo-selector `active`/,
      'should throw on invalid pseudo classes'
    )

    assert.throws(
      () => {
        select(':nth-foo(2n+1)', h(''))
      },
      /Error: Unknown pseudo-selector `nth-foo`/,
      'should throw on invalid pseudo class “functions”'
    )

    assert.throws(
      () => {
        select('::before', h(''))
      },
      /Error: Unexpected pseudo-element or empty pseudo-class/,
      'should throw on invalid pseudo elements'
    )
  })

  await t.test('general', () => {
    assert.equal(
      select('', h('')),
      null,
      'nothing for the empty string as selector'
    )
    assert.equal(
      select(' ', h('')),
      null,
      'nothing for a white-space only selector'
    )
    assert.equal(select('*'), null, 'nothing if not given a node')
    assert.equal(
      select('*', {type: 'text', value: 'a'}),
      null,
      'nothing if not given an element'
    )

    assert.deepEqual(
      select('h1, h2', h('main', [h('h1', 'Alpha'), h('h2', 'Bravo')])),
      h('h1', 'Alpha'),
      'should select one of several elements'
    )
  })

  await t.test('descendant selector', () => {
    assert.deepEqual(
      select(
        'div',
        u('root', [
          h('#one'),
          h('main', [h('#two'), h('article', h('#three'))])
        ])
      ),
      h('#one'),
      'should return the first descendant node'
    )

    assert.deepEqual(
      select('div', h('#one')),
      h('#one'),
      'should return the given node if it matches'
    )

    assert.deepEqual(
      select(
        'div',
        u('root', [h('#one', [h('#two'), h('#three', h('#four'))])])
      ),
      h('#one', [h('#two'), h('#three', h('#four'))]),
      'should return the first match'
    )

    assert.deepEqual(
      select('p i s', u('root', [h('p', h('i', h('s', h('s'))))])),
      h('s', h('s')),
      'should return deep matches'
    )
  })

  await t.test('child selector', () => {
    assert.deepEqual(
      select(
        'main > article',
        u('root', [
          h('#one'),
          h('main', [h('#two'), h('article', h('#three'))])
        ])
      ),
      h('article', h('#three')),
      'should return child nodes'
    )

    assert.deepEqual(
      select(
        'div > div',
        u('root', [h('#one', [h('#two'), h('#three', h('#four'))])])
      ),
      h('#two'),
      'should return matches with nested matches'
    )

    assert.deepEqual(
      select('p > i > s', u('root', [h('p', h('i', h('s', h('s'))))])),
      h('s', h('s')),
      'should return deep matches'
    )
  })

  await t.test('next-sibling selector', () => {
    assert.deepEqual(
      select(
        'h1 + p',
        u('root', [
          h('p', 'Alpha'),
          h('h1', 'Bravo'),
          h('p', 'Charlie'),
          h('p', 'Delta'),
          h('div', [h('p', 'Echo')])
        ])
      ),
      h('p', 'Charlie'),
      'should return next-sibling'
    )

    assert.deepEqual(
      select(
        'a + b',
        u('root', [
          u('text', '\n'),
          h('a', 'Lorem'),
          u('text', ' ipsum '),
          h('b', 'dolor'),
          u('text', ' sit '),
          h('i', 'amet'),
          u('text', ' sed '),
          h('b', 'do'),
          u('text', ' eiusmod '),
          h('i', 'tempor'),
          u('text', '.\n')
        ])
      ),
      h('b', 'dolor'),
      'should return next-sibling ignoring non-elements'
    )

    assert.equal(
      select(
        'h1 + p',
        u('root', [
          h('p', 'Alpha'),
          h('h1', 'Bravo'),
          h('h2', 'Charlie'),
          h('p', 'Delta')
        ])
      ),
      null,
      'should return nothing without matches'
    )
  })

  await t.test('subsequent sibling selector', () => {
    assert.deepEqual(
      select(
        'h1 ~ p',
        u('root', [
          h('p', 'Alpha'),
          h('h1', 'Bravo'),
          h('p', 'Charlie'),
          h('p', 'Delta'),
          h('div', [h('p', 'Echo')])
        ])
      ),
      h('p', 'Charlie'),
      'should return the first subsequent sibling'
    )

    assert.deepEqual(
      select(
        'h1 ~ p',
        u('root', [
          h('p', 'Alpha'),
          h('h1', 'Bravo'),
          h('h2', 'Charlie'),
          h('p', 'Delta')
        ])
      ),
      h('p', 'Delta'),
      'should return subsequent siblings'
    )

    assert.deepEqual(
      select(
        'a ~ i',
        u('root', [
          u('text', '\n'),
          h('a', 'Lorem'),
          u('text', ' ipsum '),
          h('b', 'dolor'),
          u('text', ' sit '),
          h('i', 'amet'),
          u('text', ' sed '),
          h('b', 'do'),
          u('text', ' eiusmod '),
          h('i', 'tempor'),
          u('text', '.\n')
        ])
      ),
      h('i', 'amet'),
      'should return siblings ignoring non-elements'
    )

    assert.equal(
      select(
        'h1 ~ p',
        u('root', [h('p', 'Alpha'), h('h1', 'Bravo'), h('h2', 'Charlie')])
      ),
      null,
      'should return nothing without matches'
    )
  })

  await t.test('parent-sensitive pseudo-selectors', async (t) => {
    await t.test(':first-child', () => {
      assert.deepEqual(
        select(
          ':first-child',
          u('root', [
            h('p', 'Alpha'),
            h('h1', 'Bravo'),
            h('p', 'Charlie'),
            h('p', 'Delta'),
            h('div', [h('p', 'Echo')])
          ])
        ),
        h('p', 'Alpha'),
        'should return the first child'
      )

      assert.equal(
        select(
          'h1:first-child',
          u('root', [h('p', 'Alpha'), h('h1', 'Bravo'), h('p', 'Charlie')])
        ),
        null,
        'should return nothing if nothing matches'
      )
    })

    await t.test(':last-child', () => {
      assert.deepEqual(
        select(
          ':last-child',
          u('root', [
            h('p', 'Alpha'),
            h('h1', 'Bravo'),
            h('p', 'Charlie'),
            h('p', 'Delta'),
            h('div', [h('p', 'Echo')])
          ])
        ),
        h('div', [h('p', 'Echo')]),
        'should return the last child'
      )

      assert.equal(
        select(
          'h1:last-child',
          u('root', [h('p', 'Alpha'), h('h1', 'Bravo'), h('p', 'Charlie')])
        ),
        null,
        'should return nothing if nothing matches'
      )
    })

    await t.test(':only-child', () => {
      assert.deepEqual(
        select(
          ':only-child',
          u('root', [
            h('p', 'Alpha'),
            h('h1', 'Bravo'),
            h('p', 'Charlie'),
            h('p', 'Delta'),
            h('div', [h('p', 'Echo')])
          ])
        ),
        h('p', 'Echo'),
        'should return an only child'
      )

      assert.equal(
        select(
          'h1:only-child',
          u('root', [h('p', 'Alpha'), h('h1', 'Bravo'), h('p', 'Charlie')])
        ),
        null,
        'should return nothing if nothing matches'
      )
    })

    await t.test(':nth-child', () => {
      assert.deepEqual(
        select(
          'li:nth-child(odd)',
          h('ol', [
            h('li', 'Alpha'),
            h('li', 'Bravo'),
            h('li', 'Charlie'),
            h('li', 'Delta'),
            h('li', 'Echo'),
            h('li', 'Foxtrot')
          ])
        ),
        h('li', 'Alpha'),
        'should return the match for `:nth-child(odd)`'
      )

      assert.deepEqual(
        select(
          'li:nth-child(2n+1)',
          h('ol', [
            h('li', 'Alpha'),
            h('li', 'Bravo'),
            h('li', 'Charlie'),
            h('li', 'Delta'),
            h('li', 'Echo'),
            h('li', 'Foxtrot')
          ])
        ),
        h('li', 'Alpha'),
        'should return the match for `:nth-child(2n+1)`'
      )

      assert.deepEqual(
        select(
          'li:nth-child(even)',
          h('ol', [
            h('li', 'Alpha'),
            h('li', 'Bravo'),
            h('li', 'Charlie'),
            h('li', 'Delta'),
            h('li', 'Echo'),
            h('li', 'Foxtrot')
          ])
        ),
        h('li', 'Bravo'),
        'should return the match for `:nth-child(even)`'
      )

      assert.deepEqual(
        select(
          'li:nth-child(2n+0)',
          h('ol', [
            h('li', 'Alpha'),
            h('li', 'Bravo'),
            h('li', 'Charlie'),
            h('li', 'Delta'),
            h('li', 'Echo'),
            h('li', 'Foxtrot')
          ])
        ),
        h('li', 'Bravo'),
        'should return the match for `:nth-child(2n+0)`'
      )
    })

    await t.test(':nth-last-child', () => {
      assert.deepEqual(
        select(
          'li:nth-last-child(odd)',
          h('ol', [
            h('li', 'Alpha'),
            h('li', 'Bravo'),
            h('li', 'Charlie'),
            h('li', 'Delta'),
            h('li', 'Echo'),
            h('li', 'Foxtrot')
          ])
        ),
        h('li', 'Bravo'),
        'should return the last match for `:nth-last-child(odd)`'
      )

      assert.deepEqual(
        select(
          'li:nth-last-child(2n+1)',
          h('ol', [
            h('li', 'Alpha'),
            h('li', 'Bravo'),
            h('li', 'Charlie'),
            h('li', 'Delta'),
            h('li', 'Echo'),
            h('li', 'Foxtrot')
          ])
        ),
        h('li', 'Bravo'),
        'should return the last match for `:nth-last-child(2n+1)`'
      )

      assert.deepEqual(
        select(
          'li:nth-last-child(even)',
          h('ol', [
            h('li', 'Alpha'),
            h('li', 'Bravo'),
            h('li', 'Charlie'),
            h('li', 'Delta'),
            h('li', 'Echo'),
            h('li', 'Foxtrot')
          ])
        ),
        h('li', 'Alpha'),
        'should return the last match for `:nth-last-child(even)`'
      )

      assert.deepEqual(
        select(
          'li:nth-last-child(2n+0)',
          h('ol', [
            h('li', 'Alpha'),
            h('li', 'Bravo'),
            h('li', 'Charlie'),
            h('li', 'Delta'),
            h('li', 'Echo'),
            h('li', 'Foxtrot')
          ])
        ),
        h('li', 'Alpha'),
        'should return the last match for `:nth-last-child(2n+0)`'
      )
    })

    await t.test(':nth-of-type', () => {
      assert.deepEqual(
        select(
          'dt:nth-of-type(odd)',
          h('dl', [
            h('dt', 'Alpha'),
            h('dd', 'Bravo'),
            h('dt', 'Charlie'),
            h('dd', 'Delta'),
            h('dt', 'Echo'),
            h('dd', 'Foxtrot')
          ])
        ),
        h('dt', 'Alpha'),
        'should return the first match for `:nth-of-type(odd)`'
      )

      assert.deepEqual(
        select(
          'dt:nth-of-type(2n+1)',
          h('dl', [
            h('dt', 'Alpha'),
            h('dd', 'Bravo'),
            h('dt', 'Charlie'),
            h('dd', 'Delta'),
            h('dt', 'Echo'),
            h('dd', 'Foxtrot')
          ])
        ),
        h('dt', 'Alpha'),
        'should return the first match for `:nth-of-type(2n+1)`'
      )

      assert.deepEqual(
        select(
          'dt:nth-of-type(even)',
          h('dl', [
            h('dt', 'Alpha'),
            h('dd', 'Bravo'),
            h('dt', 'Charlie'),
            h('dd', 'Delta'),
            h('dt', 'Echo'),
            h('dd', 'Foxtrot')
          ])
        ),
        h('dt', 'Charlie'),
        'should return the first match for `:nth-of-type(even)`'
      )

      assert.deepEqual(
        select(
          'dt:nth-of-type(2n+0)',
          h('dl', [
            h('dt', 'Alpha'),
            h('dd', 'Bravo'),
            h('dt', 'Charlie'),
            h('dd', 'Delta'),
            h('dt', 'Echo'),
            h('dd', 'Foxtrot')
          ])
        ),
        h('dt', 'Charlie'),
        'should return the first match for `:nth-of-type(2n+0)`'
      )
    })

    await t.test(':nth-last-of-type', () => {
      assert.deepEqual(
        select(
          'dt:nth-last-of-type(odd)',
          h('dl', [
            h('dt', 'Alpha'),
            h('dd', 'Bravo'),
            h('dt', 'Charlie'),
            h('dd', 'Delta'),
            h('dt', 'Echo'),
            h('dd', 'Foxtrot')
          ])
        ),
        h('dt', 'Alpha'),
        'should return the last match for `:nth-last-of-type(odd)`s'
      )

      assert.deepEqual(
        select(
          'dt:nth-last-of-type(2n+1)',
          h('dl', [
            h('dt', 'Alpha'),
            h('dd', 'Bravo'),
            h('dt', 'Charlie'),
            h('dd', 'Delta'),
            h('dt', 'Echo'),
            h('dd', 'Foxtrot')
          ])
        ),
        h('dt', 'Alpha'),
        'should return the last match for `:nth-last-of-type(2n+1)`'
      )

      assert.deepEqual(
        select(
          'dt:nth-last-of-type(even)',
          h('dl', [
            h('dt', 'Alpha'),
            h('dd', 'Bravo'),
            h('dt', 'Charlie'),
            h('dd', 'Delta'),
            h('dt', 'Echo'),
            h('dd', 'Foxtrot')
          ])
        ),
        h('dt', 'Charlie'),
        'should return the last match for `:nth-last-of-type(even)`'
      )

      assert.deepEqual(
        select(
          'dt:nth-last-of-type(2n+0)',
          h('dl', [
            h('dt', 'Alpha'),
            h('dd', 'Bravo'),
            h('dt', 'Charlie'),
            h('dd', 'Delta'),
            h('dt', 'Echo'),
            h('dd', 'Foxtrot')
          ])
        ),
        h('dt', 'Charlie'),
        'should return the last match for `:nth-last-of-type(2n+0)`'
      )
    })

    await t.test(':first-of-type', () => {
      assert.deepEqual(
        select(
          'dt:first-of-type',
          h('dl', [
            h('dt', 'Alpha'),
            h('dd', 'Bravo'),
            h('dt', 'Charlie'),
            h('dd', 'Delta'),
            h('dt', 'Echo'),
            h('dd', 'Foxtrot')
          ])
        ),
        h('dt', 'Alpha'),
        'should return the first match for `:first-of-type`'
      )

      assert.equal(
        select('dt:first-of-type', h('dl', [])),
        null,
        'should return nothing without matches'
      )
    })

    await t.test(':last-of-type', () => {
      assert.deepEqual(
        select(
          'dt:last-of-type',
          h('dl', [
            h('dt', 'Alpha'),
            h('dd', 'Bravo'),
            h('dt', 'Charlie'),
            h('dd', 'Delta'),
            h('dt', 'Echo'),
            h('dd', 'Foxtrot')
          ])
        ),
        h('dt', 'Echo'),
        'should return the last match for `:last-of-type`s'
      )

      assert.equal(
        select('dt:last-of-type', h('dl', [])),
        null,
        'should return nothing without matches'
      )
    })

    await t.test(':only-of-type', () => {
      assert.deepEqual(
        select(
          'dd:only-of-type',
          h('dl', [
            h('dt', 'Alpha'),
            h('dt', 'Bravo'),
            h('dd', 'Charlie'),
            h('dt', 'Delta')
          ])
        ),
        h('dd', 'Charlie'),
        'should return the only match'
      )

      assert.equal(
        select(
          'dt:only-of-type',
          h('dl', [
            h('dt', 'Alpha'),
            h('dd', 'Bravo'),
            h('dt', 'Charlie'),
            h('dd', 'Delta'),
            h('dt', 'Echo'),
            h('dd', 'Foxtrot')
          ])
        ),
        null,
        'should return nothing with too many matches'
      )

      assert.equal(
        select('dt:only-of-type', h('dl', [])),
        null,
        'should return nothing without matches'
      )
    })
  })

  await t.test(':lang()', () => {
    assert.deepEqual(
      select(
        'q:lang(en)',
        u('root', [
          h('div', {lang: 'en'}, h('p', {lang: ''}, h('q', '0'))),
          h('p', {lang: 'fr'}, h('q', {lang: 'fr'}, 'A')),
          h('p', {lang: 'fr'}, h('q', {lang: ''}, 'B')),
          h('p', {lang: 'fr'}, h('q', {lang: 'en-GB'}, 'C')),
          h('p', {lang: 'fr'}, h('q', {lang: 'en'}, 'D'))
        ])
      ),
      h('q', {lang: 'en-GB'}, 'C'),
      'should return the correct matching element'
    )
  })

  await t.test(':dir()', () => {
    const ltr = 'a'
    const rtl = 'أ'
    const neutral = '!'

    assert.deepEqual(
      select(
        'q:dir(rtl)',
        u('root', [
          h('div', {dir: 'rtl'}, h('p', {dir: ''}, h('q', ltr))),
          h('p', {dir: 'ltr'}, h('q', {dir: 'ltr'}, rtl)),
          h('p', {dir: 'ltr'}, h('q', {dir: ''}, neutral)),
          h('p', {dir: 'ltr'}, h('q', {dir: 'foo'}, ltr)),
          h('p', {dir: 'ltr'}, h('q', {dir: 'rtl'}, rtl))
        ])
      ),
      h('q', ltr),
      'should return the correct matching element'
    )
  })

  await t.test(':read-write', () => {
    assert.deepEqual(
      select(
        'p:read-write',
        u('root', [h('div', {contentEditable: 'true'}, [h('p', 'A')])])
      ),
      h('p', 'A'),
      'should return elements inside `[contentEditable=true]`'
    )

    assert.deepEqual(
      select(
        'a:read-write',
        u('root', [
          h('div', {contentEditable: 'true'}, [
            s('svg', {viewBox: [0, 0, 50, 50]}, [s('a', {download: true}, '!')])
          ])
        ])
      ),
      null,
      'should not return elements inside SVG embedded in `[contentEditable=true]`'
    )
  })

  await t.test(':read-only', () => {
    assert.deepEqual(
      select(
        'p:read-only',
        u('root', [h('div', {contentEditable: 'true'}, [h('p', 'A')])])
      ),
      null,
      'should not return elements inside `[contentEditable=true]`'
    )

    assert.deepEqual(
      select(
        'a:read-only',
        u('root', [
          h('div', {contentEditable: 'true'}, [
            s('svg', {viewBox: [0, 0, 50, 50]}, [s('a', {download: true}, '!')])
          ])
        ])
      ),
      s('a', {download: true}, '!'),
      'should return elements inside SVG embedded in `[contentEditable=true]`'
    )
  })

  await t.test(':root', () => {
    assert.deepEqual(
      select(
        ':root',
        u('root', [
          u('doctype', {name: 'html'}),
          h('html', [h('title', 'Hello'), h('p', 'World')])
        ])
      ),
      h('html', [h('title', 'Hello'), h('p', 'World')]),
      'should return the `<html>` element with a `root` as parent'
    )

    assert.deepEqual(
      select(':root', h('html', [h('title', 'Hello'), h('p', 'World')])),
      h('html', [h('title', 'Hello'), h('p', 'World')]),
      'should return the `<html>` element with a no parent'
    )

    assert.deepEqual(
      select(
        ':root',
        u('root', [
          s('svg', {viewBox: [0, 0, 10, 10]}, [
            s('circle', {cx: 10, cy: 10, r: 10})
          ])
        ]),
        'svg'
      ),
      s('svg', {viewBox: [0, 0, 10, 10]}, [
        s('circle', {cx: 10, cy: 10, r: 10})
      ]),
      'should return the `<svg>` element with a `root` as parent'
    )

    assert.deepEqual(
      select(
        ':root',
        s('svg', {viewBox: [0, 0, 10, 10]}, [
          s('circle', {cx: 10, cy: 10, r: 10})
        ]),
        'svg'
      ),
      s('svg', {viewBox: [0, 0, 10, 10]}, [
        s('circle', {cx: 10, cy: 10, r: 10})
      ]),
      'should return the `<svg>` element with a no parent'
    )

    assert.deepEqual(
      select(
        ':root',
        u('root', [
          u('doctype', {name: 'html'}),
          h('html', [
            h('title', 'Hello'),
            h('p', 'World'),
            s('svg', {viewBox: [0, 0, 10, 10]}, [
              s('circle', {cx: 10, cy: 10, r: 10})
            ])
          ])
        ])
      ),
      h('html', [
        h('title', 'Hello'),
        h('p', 'World'),
        s('svg', {viewBox: [0, 0, 10, 10]}, [
          s('circle', {cx: 10, cy: 10, r: 10})
        ])
      ]),
      'should return the `<html>` element, not an embedded `<svg>` element'
    )
  })

  await t.test(':scope', () => {
    assert.deepEqual(
      select(
        ':scope',
        u('root', [h('strong', h('b', 'a')), h('em', h('i', 'b'))])
      ),
      h('strong', h('b', 'a')),
      'should select the first element directly in a `root`, if a `root` is given'
    )

    assert.deepEqual(
      select(':scope', h('em', h('i', 'b'))),
      h('em', h('i', 'b')),
      'should select the root element if one is given'
    )
  })

  await t.test(':any', () => {
    assert.deepEqual(
      select('y:any(:first-child)', h('x', [h('y#a'), h('y#b')])),
      h('y#a'),
      'should support parent-sensitive `:any`'
    )
  })

  await t.test(':matches', () => {
    assert.deepEqual(
      select('y:matches(:first-child)', h('x', [h('y#a'), h('y#b')])),
      h('y#a'),
      'should support parent-sensitive `:matches`'
    )
  })

  await t.test(':not', () => {
    assert.deepEqual(
      select('y:not(:first-child)', h('x', [h('y#a'), h('y#b')])),
      h('y#b'),
      'should support parent-sensitive `:not`'
    )
  })
})
