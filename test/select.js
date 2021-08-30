import test from 'tape'
import {u} from 'unist-builder'
import {h, s} from 'hastscript'
import {select} from '../index.js'

test('select.select()', (t) => {
  t.test('invalid selectors', (t) => {
    t.throws(
      () => {
        // @ts-expect-error runtime.
        select()
      },
      /Error: Expected `string` as selector, not `undefined`/,
      'should throw without selector'
    )

    t.throws(
      () => {
        // @ts-expect-error runtime.
        select([], h(''))
      },
      /Error: Expected `string` as selector, not ``/,
      'should throw w/ invalid selector (1)'
    )

    t.throws(
      () => {
        select('@supports (transform-origin: 5% 5%) {}', h(''))
      },
      /Error: Rule expected but "@" found./,
      'should throw w/ invalid selector (2)'
    )

    t.throws(
      () => {
        select('[foo%=bar]', h(''))
      },
      /Error: Expected "=" but "%" found./,
      'should throw on invalid attribute operators'
    )

    t.throws(
      () => {
        select(':active', h(''))
      },
      /Error: Unknown pseudo-selector `active`/,
      'should throw on invalid pseudo classes'
    )

    t.throws(
      () => {
        select(':nth-foo(2n+1)', h(''))
      },
      /Error: Unknown pseudo-selector `nth-foo`/,
      'should throw on invalid pseudo class “functions”'
    )

    t.throws(
      () => {
        select('::before', h(''))
      },
      /Error: Unexpected pseudo-element or empty pseudo-class/,
      'should throw on invalid pseudo elements'
    )

    t.end()
  })

  t.test('general', (t) => {
    t.equal(select('', h('')), null, 'nothing for the empty string as selector')
    t.equal(select(' ', h('')), null, 'nothing for a white-space only selector')
    t.equal(select('*'), null, 'nothing if not given a node')
    t.equal(
      select('*', {type: 'text', value: 'a'}),
      null,
      'nothing if not given an element'
    )

    t.deepEqual(
      select('h1, h2', h('main', [h('h1', 'Alpha'), h('h2', 'Bravo')])),
      h('h1', 'Alpha'),
      'should select one of several elements'
    )

    t.end()
  })

  t.test('descendant selector', (t) => {
    t.deepEqual(
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

    t.deepEqual(
      select('div', h('#one')),
      h('#one'),
      'should return the given node if it matches'
    )

    t.deepEqual(
      select(
        'div',
        u('root', [h('#one', [h('#two'), h('#three', h('#four'))])])
      ),
      h('#one', [h('#two'), h('#three', h('#four'))]),
      'should return the first match'
    )

    t.deepEqual(
      select('p i s', u('root', [h('p', h('i', h('s', h('s'))))])),
      h('s', h('s')),
      'should return deep matches'
    )

    t.end()
  })

  t.test('child selector', (t) => {
    t.deepEqual(
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

    t.deepEqual(
      select(
        'div > div',
        u('root', [h('#one', [h('#two'), h('#three', h('#four'))])])
      ),
      h('#two'),
      'should return matches with nested matches'
    )

    t.deepEqual(
      select('p > i > s', u('root', [h('p', h('i', h('s', h('s'))))])),
      h('s', h('s')),
      'should return deep matches'
    )

    t.end()
  })

  t.test('next-sibling selector', (t) => {
    t.deepEqual(
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

    t.deepEqual(
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

    t.equal(
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

    t.end()
  })

  t.test('subsequent sibling selector', (t) => {
    t.deepEqual(
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

    t.deepEqual(
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

    t.deepEqual(
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

    t.equal(
      select(
        'h1 ~ p',
        u('root', [h('p', 'Alpha'), h('h1', 'Bravo'), h('h2', 'Charlie')])
      ),
      null,
      'should return nothing without matches'
    )

    t.end()
  })

  t.test('parent-sensitive pseudo-selectors', (t) => {
    t.test(':first-child', (t) => {
      t.deepEqual(
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

      t.equal(
        select(
          'h1:first-child',
          u('root', [h('p', 'Alpha'), h('h1', 'Bravo'), h('p', 'Charlie')])
        ),
        null,
        'should return nothing if nothing matches'
      )

      t.end()
    })

    t.test(':last-child', (t) => {
      t.deepEqual(
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

      t.equal(
        select(
          'h1:last-child',
          u('root', [h('p', 'Alpha'), h('h1', 'Bravo'), h('p', 'Charlie')])
        ),
        null,
        'should return nothing if nothing matches'
      )

      t.end()
    })

    t.test(':only-child', (t) => {
      t.deepEqual(
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

      t.equal(
        select(
          'h1:only-child',
          u('root', [h('p', 'Alpha'), h('h1', 'Bravo'), h('p', 'Charlie')])
        ),
        null,
        'should return nothing if nothing matches'
      )

      t.end()
    })

    t.test(':nth-child', (t) => {
      t.deepEqual(
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

      t.deepEqual(
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

      t.deepEqual(
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

      t.deepEqual(
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

      t.end()
    })

    t.test(':nth-last-child', (t) => {
      t.deepEqual(
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

      t.deepEqual(
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

      t.deepEqual(
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

      t.deepEqual(
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

      t.end()
    })

    t.test(':nth-of-type', (t) => {
      t.deepEqual(
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

      t.deepEqual(
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

      t.deepEqual(
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

      t.deepEqual(
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

      t.end()
    })

    t.test(':nth-last-of-type', (t) => {
      t.deepEqual(
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

      t.deepEqual(
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

      t.deepEqual(
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

      t.deepEqual(
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

      t.end()
    })

    t.test(':first-of-type', (t) => {
      t.deepEqual(
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

      t.equal(
        select('dt:first-of-type', h('dl', [])),
        null,
        'should return nothing without matches'
      )

      t.end()
    })

    t.test(':last-of-type', (t) => {
      t.deepEqual(
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

      t.equal(
        select('dt:last-of-type', h('dl', [])),
        null,
        'should return nothing without matches'
      )

      t.end()
    })

    t.test(':only-of-type', (t) => {
      t.deepEqual(
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

      t.equal(
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

      t.equal(
        select('dt:only-of-type', h('dl', [])),
        null,
        'should return nothing without matches'
      )

      t.end()
    })

    t.test(':lang()', (t) => {
      t.deepEqual(
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

      t.end()
    })

    t.test(':dir()', (t) => {
      const ltr = 'a'
      const rtl = 'أ'
      const neutral = '!'

      t.deepEqual(
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

      t.end()
    })

    t.test(':read-write', (t) => {
      t.deepEqual(
        select(
          'p:read-write',
          u('root', [h('div', {contentEditable: 'true'}, [h('p', 'A')])])
        ),
        h('p', 'A'),
        'should return elements inside `[contentEditable=true]`'
      )

      t.deepEqual(
        select(
          'a:read-write',
          u('root', [
            h('div', {contentEditable: 'true'}, [
              s('svg', {viewBox: [0, 0, 50, 50]}, [
                s('a', {download: true}, '!')
              ])
            ])
          ])
        ),
        null,
        'should not return elements inside SVG embedded in `[contentEditable=true]`'
      )

      t.end()
    })

    t.test(':read-only', (t) => {
      t.deepEqual(
        select(
          'p:read-only',
          u('root', [h('div', {contentEditable: 'true'}, [h('p', 'A')])])
        ),
        null,
        'should not return elements inside `[contentEditable=true]`'
      )

      t.deepEqual(
        select(
          'a:read-only',
          u('root', [
            h('div', {contentEditable: 'true'}, [
              s('svg', {viewBox: [0, 0, 50, 50]}, [
                s('a', {download: true}, '!')
              ])
            ])
          ])
        ),
        s('a', {download: true}, '!'),
        'should return elements inside SVG embedded in `[contentEditable=true]`'
      )

      t.end()
    })

    t.test(':root', (t) => {
      t.deepEqual(
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

      t.deepEqual(
        select(':root', h('html', [h('title', 'Hello'), h('p', 'World')])),
        h('html', [h('title', 'Hello'), h('p', 'World')]),
        'should return the `<html>` element with a no parent'
      )

      t.deepEqual(
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

      t.deepEqual(
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

      t.deepEqual(
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

      t.end()
    })

    t.test(':scope', (t) => {
      t.deepEqual(
        select(
          ':scope',
          u('root', [h('strong', h('b', 'a')), h('em', h('i', 'b'))])
        ),
        h('strong', h('b', 'a')),
        'should select the first element directly in a `root`, if a `root` is given'
      )

      t.deepEqual(
        select(':scope', h('em', h('i', 'b'))),
        h('em', h('i', 'b')),
        'should select the root element if one is given'
      )

      t.end()
    })

    t.end()
  })

  t.end()
})
