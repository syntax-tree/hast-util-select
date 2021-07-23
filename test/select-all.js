import test from 'tape'
import {u} from 'unist-builder'
import {h, s} from 'hastscript'
import {selectAll} from '../index.js'

test('select.selectAll()', (t) => {
  t.test('invalid selectors', (t) => {
    t.throws(
      () => {
        // @ts-expect-error runtime.
        selectAll()
      },
      /Error: Expected `string` as selector, not `undefined`/,
      'should throw without selector'
    )

    t.throws(
      () => {
        // @ts-expect-error runtime.
        selectAll([], h(''))
      },
      /Error: Expected `string` as selector, not ``/,
      'should throw w/ invalid selector (1)'
    )

    t.throws(
      () => {
        selectAll('@supports (transform-origin: 5% 5%) {}', h(''))
      },
      /Error: Rule expected but "@" found./,
      'should throw w/ invalid selector (2)'
    )

    t.throws(
      () => {
        selectAll('[foo%=bar]', h(''))
      },
      /Error: Expected "=" but "%" found./,
      'should throw on invalid attribute operators'
    )

    t.throws(
      () => {
        selectAll(':active', h(''))
      },
      /Error: Unknown pseudo-selector `active`/,
      'should throw on invalid pseudo classes'
    )

    t.throws(
      () => {
        selectAll(':nth-foo(2n+1)', h(''))
      },
      /Error: Unknown pseudo-selector `nth-foo`/,
      'should throw on invalid pseudo class “functions”'
    )

    t.throws(
      () => {
        selectAll('::before', h(''))
      },
      /Error: Unexpected pseudo-element or empty pseudo-class/,
      'should throw on invalid pseudo elements'
    )

    t.end()
  })

  t.test('general', (t) => {
    t.deepEqual(
      selectAll('', h('')),
      [],
      'nothing for the empty string as selector'
    )
    t.deepEqual(
      selectAll(' ', h('')),
      [],
      'nothing for a white-space only selector'
    )
    t.deepEqual(selectAll('*'), [], 'nothing if not given a node')
    t.deepEqual(
      selectAll('*', {type: 'text', value: 'a'}),
      [],
      'nothing if not given an element'
    )

    t.end()
  })

  t.test('descendant selector', (t) => {
    t.deepEqual(
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

    t.deepEqual(
      selectAll('div', h('#one')),
      [h('#one')],
      'should return the given node if it matches'
    )

    t.deepEqual(
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

    t.deepEqual(
      selectAll('p i s', u('root', [h('p', h('i', h('s', h('s'))))])),
      [h('s', h('s')), h('s')],
      'should return deep matches'
    )

    t.deepEqual(
      selectAll('b s', h('p', [h('b', h('s', '1')), h('i', h('s', '2'))])),
      [h('s', '1')],
      'should not match outside other matches'
    )

    t.end()
  })

  t.test('child selector', (t) => {
    t.deepEqual(
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

    t.deepEqual(
      selectAll(
        'div > div',
        u('root', [h('#one', [h('#two'), h('#three', h('#four'))])])
      ),
      [h('#two'), h('#three', h('#four')), h('#four')],
      'should return matches with nested matches'
    )

    t.deepEqual(
      selectAll('p > i > s', u('root', [h('p', h('i', h('s', h('s'))))])),
      [h('s', h('s'))],
      'should return deep matches'
    )

    t.end()
  })

  t.test('next-sibling selector', (t) => {
    t.deepEqual(
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

    t.deepEqual(
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

    t.deepEqual(
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

    t.end()
  })

  t.test('subsequent sibling selector', (t) => {
    t.deepEqual(
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

    t.deepEqual(
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

    t.deepEqual(
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

    t.deepEqual(
      selectAll(
        'h1 ~ p',
        u('root', [h('p', 'Alpha'), h('h1', 'Bravo'), h('h2', 'Charlie')])
      ),
      [],
      'should return nothing without matches'
    )

    t.end()
  })

  t.test('parent-sensitive pseudo-selectors', (t) => {
    t.test(':first-child', (t) => {
      t.deepEqual(
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

      t.deepEqual(
        selectAll(
          'p:first-child',
          u('root', [h('p', 'Alpha'), h('h1', 'Bravo'), h('p', 'Charlie')])
        ),
        [h('p', 'Alpha')],
        'should return all `:first-child`s (2)'
      )

      t.deepEqual(
        selectAll(
          'h1:first-child',
          u('root', [h('p', 'Alpha'), h('h1', 'Bravo'), h('p', 'Charlie')])
        ),
        [],
        'should return nothing if nothing matches'
      )

      t.end()
    })

    t.test(':last-child', (t) => {
      t.deepEqual(
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

      t.deepEqual(
        selectAll(
          'p:last-child',
          u('root', [h('p', 'Alpha'), h('h1', 'Bravo'), h('p', 'Charlie')])
        ),
        [h('p', 'Charlie')],
        'should return all `:last-child`s (2)'
      )

      t.deepEqual(
        selectAll(
          'h1:last-child',
          u('root', [h('p', 'Alpha'), h('h1', 'Bravo'), h('p', 'Charlie')])
        ),
        [],
        'should return nothing if nothing matches'
      )

      t.end()
    })

    t.test(':only-child', (t) => {
      t.deepEqual(
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

      t.deepEqual(
        selectAll(
          'h1:only-child',
          u('root', [h('p', 'Alpha'), h('h1', 'Bravo'), h('p', 'Charlie')])
        ),
        [],
        'should return nothing if nothing matches'
      )

      t.end()
    })

    t.test(':nth-child', (t) => {
      t.deepEqual(
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

      t.deepEqual(
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

      t.deepEqual(
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

      t.deepEqual(
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

      t.end()
    })

    t.test(':nth-last-child', (t) => {
      t.deepEqual(
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

      t.deepEqual(
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

      t.deepEqual(
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

      t.deepEqual(
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

      t.end()
    })

    t.test(':nth-of-type', (t) => {
      t.deepEqual(
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

      t.deepEqual(
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

      t.deepEqual(
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

      t.deepEqual(
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

      t.end()
    })

    t.test(':nth-last-of-type', (t) => {
      t.deepEqual(
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

      t.deepEqual(
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

      t.deepEqual(
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

      t.deepEqual(
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

      t.end()
    })

    t.test(':first-of-type', (t) => {
      t.deepEqual(
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

      t.deepEqual(
        selectAll('dt:first-of-type', h('dl', [])),
        [],
        'should return nothing without matches'
      )

      t.end()
    })

    t.test(':last-of-type', (t) => {
      t.deepEqual(
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

      t.deepEqual(
        selectAll('dt:last-of-type', h('dl', [])),
        [],
        'should return nothing without matches'
      )

      t.end()
    })

    t.test(':only-of-type', (t) => {
      t.deepEqual(
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

      t.deepEqual(
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

      t.deepEqual(
        selectAll('dt:only-of-type', h('dl', [])),
        [],
        'should return nothing without matches'
      )

      t.end()
    })

    t.test(':lang()', (t) => {
      t.deepEqual(
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

      t.end()
    })

    t.test(':dir()', (t) => {
      const ltr = 'a'
      const rtl = 'أ'

      t.deepEqual(
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

      t.end()
    })

    t.test(':read-write', (t) => {
      t.deepEqual(
        selectAll(
          'p:read-write',
          u('root', [h('div', {contentEditable: 'true'}, [h('p', 'A')])])
        ),
        [h('p', 'A')],
        'should return elements inside `[contentEditable=true]`'
      )

      t.deepEqual(
        selectAll(
          'a:read-write',
          u('root', [
            h('div', {contentEditable: 'true'}, [
              s('svg', {viewBox: [0, 0, 50, 50]}, [
                s('a', {download: true}, '!')
              ])
            ])
          ])
        ),
        [],
        'should not return elements inside SVG embedded in `[contentEditable=true]`'
      )

      t.end()
    })

    t.test(':read-only', (t) => {
      t.deepEqual(
        selectAll(
          'p:read-only',
          u('root', [h('div', {contentEditable: 'true'}, [h('p', 'A')])])
        ),
        [],
        'should not return elements inside `[contentEditable=true]`'
      )

      t.deepEqual(
        selectAll(
          'a:read-only',
          u('root', [
            h('div', {contentEditable: 'true'}, [
              s('svg', {viewBox: [0, 0, 50, 50]}, [
                s('a', {download: true}, '!')
              ])
            ])
          ])
        ),
        [s('a', {download: true}, '!')],
        'should return elements inside SVG embedded in `[contentEditable=true]`'
      )

      t.end()
    })

    t.test(':root', (t) => {
      t.deepEqual(
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

      t.deepEqual(
        selectAll(':root', h('html', [h('title', 'Hello'), h('p', 'World')])),
        [h('html', [h('title', 'Hello'), h('p', 'World')])],
        'should return the `<html>` element with a no parent'
      )

      t.deepEqual(
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

      t.deepEqual(
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

      t.deepEqual(
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

      t.end()
    })

    t.test(':scope', (t) => {
      t.deepEqual(
        selectAll(
          ':scope',
          u('root', [h('strong', h('b', 'a')), h('em', h('i', 'b'))])
        ),
        [h('strong', h('b', 'a')), h('em', h('i', 'b'))],
        'should select the elements directly in `root`, if a `root` is given'
      )

      t.deepEqual(
        selectAll(':scope', h('em', h('i', 'b'))),
        [h('em', h('i', 'b'))],
        'should select the root element if one is given'
      )

      t.end()
    })

    t.end()
  })

  t.end()
})
