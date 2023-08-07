import assert from 'node:assert/strict'
import test from 'node:test'
import {u} from 'unist-builder'
import {h, s} from 'hastscript'
import {selectAll} from '../index.js'

test('select.selectAll()', async (t) => {
  await t.test('invalid selectors', () => {
    assert.throws(
      () => {
        // @ts-expect-error runtime.
        selectAll()
      },
      /Error: Expected `string` as selector, not `undefined`/,
      'should throw without selector'
    )

    assert.throws(
      () => {
        // @ts-expect-error runtime.
        selectAll([], h(''))
      },
      /Error: Expected `string` as selector, not ``/,
      'should throw w/ invalid selector (1)'
    )

    assert.throws(
      () => {
        selectAll('@supports (transform-origin: 5% 5%) {}', h(''))
      },
      /Expected rule but "@" found/,
      'should throw w/ invalid selector (2)'
    )

    assert.throws(
      () => {
        selectAll('[foo%=bar]', h(''))
      },
      /Expected a valid attribute selector operator/,
      'should throw on invalid attribute operators'
    )

    assert.throws(
      () => {
        selectAll(':active', h(''))
      },
      /Error: Unknown pseudo-selector `active`/,
      'should throw on invalid pseudo classes'
    )

    assert.throws(
      () => {
        selectAll(':nth-foo(2n+1)', h(''))
      },
      /Unknown pseudo-class/,
      'should throw on invalid pseudo class “functions”'
    )

    assert.throws(
      () => {
        selectAll('::before', h(''))
      },
      /Invalid selector: `::before`/,
      'should throw on invalid pseudo elements'
    )
  })

  await t.test('general', () => {
    assert.throws(
      function () {
        selectAll('', h())
      },
      /Expected rule but end of input reached/,
      'should throw on empty selectors'
    )

    assert.throws(
      function () {
        selectAll(' ', h())
      },
      /Expected rule but end of input reached/,
      'should throw for a white-space only selector'
    )

    assert.deepEqual(selectAll('*'), [], 'nothing if not given a node')

    assert.deepEqual(
      selectAll('*', {type: 'text', value: 'a'}),
      [],
      'nothing if not given an element'
    )
  })

  await t.test('descendant selector', () => {
    assert.deepEqual(
      selectAll(
        'div',
        u('root', [
          h('#one'),
          h('main', [h('#two'), h('article', h('#three'))])
        ])
      ),
      [h('#one'), h('#two'), h('#three')],
      'should return descendant nodes'
    )

    assert.deepEqual(
      selectAll('div', h('#one')),
      [h('#one')],
      'should return the given node if it matches'
    )

    assert.deepEqual(
      selectAll(
        'div',
        u('root', [h('#one', [h('#two'), h('#three', h('#four'))])])
      ),
      [
        h('#one', [h('#two'), h('#three', h('#four'))]),
        h('#two'),
        h('#three', h('#four')),
        h('#four')
      ],
      'should return matches with nested matches'
    )

    assert.deepEqual(
      selectAll('p i s', u('root', [h('p', h('i', h('s', h('s'))))])),
      [h('s', h('s')), h('s')],
      'should return deep matches'
    )

    assert.deepEqual(
      selectAll('b s', h('p', [h('b', h('s', '1')), h('i', h('s', '2'))])),
      [h('s', '1')],
      'should not match outside other matches'
    )
  })

  await t.test('child selector', () => {
    assert.deepEqual(
      selectAll(
        'main > article',
        u('root', [
          h('#one'),
          h('main', [h('#two'), h('article', h('#three'))])
        ])
      ),
      [h('article', h('#three'))],
      'should return child nodes'
    )

    assert.deepEqual(
      selectAll(
        'div > div',
        u('root', [h('#one', [h('#two'), h('#three', h('#four'))])])
      ),
      [h('#two'), h('#three', h('#four')), h('#four')],
      'should return matches with nested matches'
    )

    assert.deepEqual(
      selectAll('p > i > s', u('root', [h('p', h('i', h('s', h('s'))))])),
      [h('s', h('s'))],
      'should return deep matches'
    )
  })

  await t.test('next-sibling selector', () => {
    assert.deepEqual(
      selectAll(
        'h1 + p',
        u('root', [
          h('p', 'Alpha'),
          h('h1', 'Bravo'),
          h('p', 'Charlie'),
          h('p', 'Delta'),
          h('div', [h('p', 'Echo')])
        ])
      ),
      [h('p', 'Charlie')],
      'should return next-sibling'
    )

    assert.deepEqual(
      selectAll(
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
      [h('b', 'dolor')],
      'should return next-sibling ignoring non-elements'
    )

    assert.deepEqual(
      selectAll(
        'h1 + p',
        u('root', [
          h('p', 'Alpha'),
          h('h1', 'Bravo'),
          h('h2', 'Charlie'),
          h('p', 'Delta')
        ])
      ),
      [],
      'should return nothing without matches'
    )
  })

  await t.test('subsequent sibling selector', () => {
    assert.deepEqual(
      selectAll(
        'h1 ~ p',
        u('root', [
          h('p', 'Alpha'),
          h('h1', 'Bravo'),
          h('p', 'Charlie'),
          h('p', 'Delta'),
          h('div', [h('p', 'Echo')])
        ])
      ),
      [h('p', 'Charlie'), h('p', 'Delta')],
      'should return subsequent sibling'
    )

    assert.deepEqual(
      selectAll(
        'h1 ~ p',
        u('root', [
          h('p', 'Alpha'),
          h('h1', 'Bravo'),
          h('h2', 'Charlie'),
          h('p', 'Delta')
        ])
      ),
      [h('p', 'Delta')],
      'should return subsequent siblings'
    )

    assert.deepEqual(
      selectAll(
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
      [h('i', 'amet'), h('i', 'tempor')],
      'should return siblings ignoring non-elements'
    )

    assert.deepEqual(
      selectAll(
        'h1 ~ p',
        u('root', [h('p', 'Alpha'), h('h1', 'Bravo'), h('h2', 'Charlie')])
      ),
      [],
      'should return nothing without matches'
    )
  })

  await t.test('parent-sensitive pseudo-selectors', async (t) => {
    await t.test(':first-child', () => {
      assert.deepEqual(
        selectAll(
          ':first-child',
          u('root', [
            h('p', 'Alpha'),
            h('h1', 'Bravo'),
            h('p', 'Charlie'),
            h('p', 'Delta'),
            h('div', [h('p', 'Echo')])
          ])
        ),
        [h('p', 'Alpha'), h('p', 'Echo')],
        'should return all `:first-child`s (1)'
      )

      assert.deepEqual(
        selectAll(
          'p:first-child',
          u('root', [h('p', 'Alpha'), h('h1', 'Bravo'), h('p', 'Charlie')])
        ),
        [h('p', 'Alpha')],
        'should return all `:first-child`s (2)'
      )

      assert.deepEqual(
        selectAll(
          'h1:first-child',
          u('root', [h('p', 'Alpha'), h('h1', 'Bravo'), h('p', 'Charlie')])
        ),
        [],
        'should return nothing if nothing matches'
      )
    })

    await t.test(':last-child', () => {
      assert.deepEqual(
        selectAll(
          ':last-child',
          u('root', [
            h('p', 'Alpha'),
            h('h1', 'Bravo'),
            h('p', 'Charlie'),
            h('p', 'Delta'),
            h('div', [h('p', 'Echo')])
          ])
        ),
        [h('div', [h('p', 'Echo')]), h('p', 'Echo')],
        'should return all `:last-child`s (1)'
      )

      assert.deepEqual(
        selectAll(
          'p:last-child',
          u('root', [h('p', 'Alpha'), h('h1', 'Bravo'), h('p', 'Charlie')])
        ),
        [h('p', 'Charlie')],
        'should return all `:last-child`s (2)'
      )

      assert.deepEqual(
        selectAll(
          'h1:last-child',
          u('root', [h('p', 'Alpha'), h('h1', 'Bravo'), h('p', 'Charlie')])
        ),
        [],
        'should return nothing if nothing matches'
      )
    })

    await t.test(':only-child', () => {
      assert.deepEqual(
        selectAll(
          ':only-child',
          u('root', [
            h('p', 'Alpha'),
            h('h1', 'Bravo'),
            h('p', 'Charlie'),
            h('p', 'Delta'),
            h('div', [h('p', 'Echo')])
          ])
        ),
        [h('p', 'Echo')],
        'should return all `:only-child`s'
      )

      assert.deepEqual(
        selectAll(
          'h1:only-child',
          u('root', [h('p', 'Alpha'), h('h1', 'Bravo'), h('p', 'Charlie')])
        ),
        [],
        'should return nothing if nothing matches'
      )
    })

    await t.test(':nth-child', () => {
      assert.deepEqual(
        selectAll(
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
        [h('li', 'Alpha'), h('li', 'Charlie'), h('li', 'Echo')],
        'should return all `:nth-child(odd)`s'
      )

      assert.deepEqual(
        selectAll(
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
        [h('li', 'Alpha'), h('li', 'Charlie'), h('li', 'Echo')],
        'should return all `:nth-child(2n+1)`s'
      )

      assert.deepEqual(
        selectAll(
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
        [h('li', 'Bravo'), h('li', 'Delta'), h('li', 'Foxtrot')],
        'should return all `:nth-child(even)`s'
      )

      assert.deepEqual(
        selectAll(
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
        [h('li', 'Bravo'), h('li', 'Delta'), h('li', 'Foxtrot')],
        'should return all `:nth-child(2n+0)`s'
      )
    })

    await t.test(':nth-last-child', () => {
      assert.deepEqual(
        selectAll(
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
        [h('li', 'Bravo'), h('li', 'Delta'), h('li', 'Foxtrot')],
        'should return all `:nth-last-child(odd)`s'
      )

      assert.deepEqual(
        selectAll(
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
        [h('li', 'Bravo'), h('li', 'Delta'), h('li', 'Foxtrot')],
        'should return all `:nth-last-child(2n+1)`s'
      )

      assert.deepEqual(
        selectAll(
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
        [h('li', 'Alpha'), h('li', 'Charlie'), h('li', 'Echo')],
        'should return all `:nth-last-child(even)`s'
      )

      assert.deepEqual(
        selectAll(
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
        [h('li', 'Alpha'), h('li', 'Charlie'), h('li', 'Echo')],
        'should return all `:nth-last-child(2n+0)`s'
      )
    })

    await t.test(':nth-of-type', () => {
      assert.deepEqual(
        selectAll(
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
        [h('dt', 'Alpha'), h('dt', 'Echo')],
        'should return all `:nth-of-type(odd)`s'
      )

      assert.deepEqual(
        selectAll(
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
        [h('dt', 'Alpha'), h('dt', 'Echo')],
        'should return all `:nth-of-type(2n+1)`s'
      )

      assert.deepEqual(
        selectAll(
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
        [h('dt', 'Charlie')],
        'should return all `:nth-of-type(even)`s'
      )

      assert.deepEqual(
        selectAll(
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
        [h('dt', 'Charlie')],
        'should return all `:nth-of-type(2n+0)`s'
      )
    })

    await t.test(':nth-last-of-type', () => {
      assert.deepEqual(
        selectAll(
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
        [h('dt', 'Alpha'), h('dt', 'Echo')],
        'should return all `:nth-last-of-type(odd)`s'
      )

      assert.deepEqual(
        selectAll(
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
        [h('dt', 'Alpha'), h('dt', 'Echo')],
        'should return all `:nth-last-of-type(2n+1)`s'
      )

      assert.deepEqual(
        selectAll(
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
        [h('dt', 'Charlie')],
        'should return all `:nth-last-of-type(even)`s'
      )

      assert.deepEqual(
        selectAll(
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
        [h('dt', 'Charlie')],
        'should return all `:nth-last-of-type(2n+0)`s'
      )
    })

    await t.test(':first-of-type', () => {
      assert.deepEqual(
        selectAll(
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
        [h('dt', 'Alpha')],
        'should return all `:first-of-type`s'
      )

      assert.deepEqual(
        selectAll('dt:first-of-type', h('dl', [])),
        [],
        'should return nothing without matches'
      )
    })

    await t.test(':last-of-type', () => {
      assert.deepEqual(
        selectAll(
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
        [h('dt', 'Echo')],
        'should return all `:last-of-type`s'
      )

      assert.deepEqual(
        selectAll('dt:last-of-type', h('dl', [])),
        [],
        'should return nothing without matches'
      )
    })

    await t.test(':only-of-type', () => {
      assert.deepEqual(
        selectAll(
          'dd:only-of-type',
          h('dl', [
            h('dt', 'Alpha'),
            h('dt', 'Bravo'),
            h('dd', 'Charlie'),
            h('dt', 'Delta')
          ])
        ),
        [h('dd', 'Charlie')],
        'should return the only type'
      )

      assert.deepEqual(
        selectAll(
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
        [],
        'should return nothing with too many matches'
      )

      assert.deepEqual(
        selectAll('dt:only-of-type', h('dl', [])),
        [],
        'should return nothing without matches'
      )
    })
  })

  await t.test(':lang()', () => {
    assert.deepEqual(
      selectAll(
        'q:lang(en)',
        u('root', [
          h('div', {lang: 'en'}, h('p', {lang: ''}, h('q', '0'))),
          h('p', {lang: 'fr'}, h('q', {lang: 'fr'}, 'A')),
          h('p', {lang: 'fr'}, h('q', {lang: 'en'}, 'B')),
          h('p', {lang: 'fr'}, h('q', {lang: 'en-GB'}, 'C')),
          h('p', {lang: 'fr'}, h('q', {lang: ''}, 'D')),
          h('p', {lang: 'fr'}, h('q', 'E')),
          h('p', {lang: 'en'}, h('q', {lang: 'fr'}, 'F')),
          h('p', {lang: 'en'}, h('q', {lang: 'en'}, 'G')),
          h('p', {lang: 'en'}, h('q', {lang: 'en-GB'}, 'H')),
          h('p', {lang: 'en'}, h('q', {lang: ''}, 'I')),
          h('p', {lang: 'en'}, h('q', 'J')),
          h('p', {lang: 'en-GB'}, h('q', {lang: 'fr'}, 'K')),
          h('p', {lang: 'en-GB'}, h('q', {lang: 'en'}, 'L')),
          h('p', {lang: 'en-GB'}, h('q', {lang: 'en-GB'}, 'M')),
          h('p', {lang: 'en-GB'}, h('q', {lang: ''}, 'N')),
          h('p', {lang: 'en-GB'}, h('q', 'O'))
        ])
      ),
      [
        h('q', {lang: 'en'}, 'B'),
        h('q', {lang: 'en-GB'}, 'C'),
        h('q', {lang: 'en'}, 'G'),
        h('q', {lang: 'en-GB'}, 'H'),
        h('q', 'J'),
        h('q', {lang: 'en'}, 'L'),
        h('q', {lang: 'en-GB'}, 'M'),
        h('q', 'O')
      ],
      'should return the correct matching elements'
    )
  })

  await t.test(':dir()', () => {
    const ltr = 'a'
    const rtl = 'أ'

    assert.deepEqual(
      selectAll(
        'q:dir(rtl)',
        u('root', [
          h('div', {dir: 'rtl'}, h('p', {dir: ''}, h('q#a', ltr))),
          h('p', {dir: 'ltr'}, h('q#b', {dir: 'ltr'}, rtl)),
          h('p', {dir: 'ltr'}, h('q#c', {dir: ''}, rtl)),
          h('p', {dir: 'ltr'}, h('q#d', {dir: 'foo'}, rtl)),
          h('p', {dir: 'ltr'}, h('q#e', {dir: 'rtl'}, rtl))
        ])
      ),
      [h('q#a', ltr), h('q#e', {dir: 'rtl'}, rtl)],
      'should return the correct matching element'
    )
  })

  await t.test(':read-write', () => {
    assert.deepEqual(
      selectAll(
        'p:read-write',
        u('root', [h('div', {contentEditable: 'true'}, [h('p', 'A')])])
      ),
      [h('p', 'A')],
      'should return elements inside `[contentEditable=true]`'
    )

    assert.deepEqual(
      selectAll(
        'a:read-write',
        u('root', [
          h('div', {contentEditable: 'true'}, [
            s('svg', {viewBox: [0, 0, 50, 50]}, [s('a', {download: true}, '!')])
          ])
        ])
      ),
      [],
      'should not return elements inside SVG embedded in `[contentEditable=true]`'
    )
  })

  await t.test(':read-only', () => {
    assert.deepEqual(
      selectAll(
        'p:read-only',
        u('root', [h('div', {contentEditable: 'true'}, [h('p', 'A')])])
      ),
      [],
      'should not return elements inside `[contentEditable=true]`'
    )

    assert.deepEqual(
      selectAll(
        'a:read-only',
        u('root', [
          h('div', {contentEditable: 'true'}, [
            s('svg', {viewBox: [0, 0, 50, 50]}, [s('a', {download: true}, '!')])
          ])
        ])
      ),
      [s('a', {download: true}, '!')],
      'should return elements inside SVG embedded in `[contentEditable=true]`'
    )
  })

  await t.test(':root', () => {
    assert.deepEqual(
      selectAll(
        ':root',
        u('root', [
          u('doctype', {name: 'html'}),
          h('html', [h('title', 'Hello'), h('p', 'World')])
        ])
      ),
      [h('html', [h('title', 'Hello'), h('p', 'World')])],
      'should return the `<html>` element with a `root` as parent'
    )

    assert.deepEqual(
      selectAll(':root', h('html', [h('title', 'Hello'), h('p', 'World')])),
      [h('html', [h('title', 'Hello'), h('p', 'World')])],
      'should return the `<html>` element with a no parent'
    )

    assert.deepEqual(
      selectAll(
        ':root',
        u('root', [
          s('svg', {viewBox: [0, 0, 10, 10]}, [
            s('circle', {cx: 10, cy: 10, r: 10})
          ])
        ]),
        'svg'
      ),
      [
        s('svg', {viewBox: [0, 0, 10, 10]}, [
          s('circle', {cx: 10, cy: 10, r: 10})
        ])
      ],
      'should return the `<svg>` element with a `root` as parent'
    )

    assert.deepEqual(
      selectAll(
        ':root',
        s('svg', {viewBox: [0, 0, 10, 10]}, [
          s('circle', {cx: 10, cy: 10, r: 10})
        ]),
        'svg'
      ),
      [
        s('svg', {viewBox: [0, 0, 10, 10]}, [
          s('circle', {cx: 10, cy: 10, r: 10})
        ])
      ],
      'should return the `<svg>` element with a no parent'
    )

    assert.deepEqual(
      selectAll(
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
      [
        h('html', [
          h('title', 'Hello'),
          h('p', 'World'),
          s('svg', {viewBox: [0, 0, 10, 10]}, [
            s('circle', {cx: 10, cy: 10, r: 10})
          ])
        ])
      ],
      'should return the `<html>` element, not an embedded `<svg>` element'
    )
  })

  await t.test(':scope', () => {
    assert.deepEqual(
      selectAll(
        ':scope',
        u('root', [h('strong', h('b', 'a')), h('em', h('i', 'b'))])
      ),
      [h('strong', h('b', 'a')), h('em', h('i', 'b'))],
      'should select the elements directly in `root`, if a `root` is given'
    )

    assert.deepEqual(
      selectAll(':scope', h('em', h('i', 'b'))),
      [h('em', h('i', 'b'))],
      'should select the root element if one is given'
    )
  })

  await t.test(':is', () => {
    assert.deepEqual(
      selectAll('y:is(:first-child)', h('x', [h('y#a'), h('y#b')])),
      [h('y#a')],
      'should support parent-sensitive `:is`'
    )
  })

  await t.test(':not', () => {
    assert.deepEqual(
      selectAll('y:not(:first-child)', h('x', [h('y#a'), h('y#b')])),
      [h('y#b')],
      'should support parent-sensitive `:not`'
    )
  })
})
