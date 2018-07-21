'use strict'

var test = require('tape')
var u = require('unist-builder')
var s = require('hastscript/svg')
var h = require('hastscript')
var select = require('..').select

test('select.select()', function(t) {
  t.test('invalid selectors', function(st) {
    st.throws(
      function() {
        select()
      },
      /Error: Expected `string` as selector, not `undefined`/,
      'should throw without selector'
    )

    st.throws(
      function() {
        select([], h())
      },
      /Error: Expected `string` as selector, not ``/,
      'should throw w/ invalid selector (1)'
    )

    st.throws(
      function() {
        select('@supports (transform-origin: 5% 5%) {}', h())
      },
      /Error: Rule expected but "@" found./,
      'should throw w/ invalid selector (2)'
    )

    st.throws(
      function() {
        select('[foo%=bar]', h())
      },
      /Error: Expected "=" but "%" found./,
      'should throw on invalid attribute operators'
    )

    st.throws(
      function() {
        select(':active', h())
      },
      /Error: Unknown pseudo-selector `active`/,
      'should throw on invalid pseudo classes'
    )

    st.throws(
      function() {
        select(':nth-foo(2n+1)', h())
      },
      /Error: Unknown pseudo-selector `nth-foo`/,
      'should throw on invalid pseudo class “functions”'
    )

    st.throws(
      function() {
        select('::before', h())
      },
      /Error: Unexpected pseudo-element or empty pseudo-class/,
      'should throw on invalid pseudo elements'
    )

    st.end()
  })

  t.test('general', function(st) {
    st.equal(select('', h()), null, 'nothing for the empty string as selector')
    st.equal(select(' ', h()), null, 'nothing for a white-space only selector')
    st.equal(select('*'), null, 'nothing if not given a node')
    st.equal(
      select('*', {type: 'text', value: 'a'}),
      null,
      'nothing if not given an element'
    )

    st.end()
  })

  t.test('descendant selector', function(st) {
    st.deepEqual(
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

    st.deepEqual(
      select('div', h('#one')),
      h('#one'),
      'should return the given node if it matches'
    )

    st.deepEqual(
      select(
        'div',
        u('root', [h('#one', [h('#two'), h('#three', h('#four'))])])
      ),
      h('#one', [h('#two'), h('#three', h('#four'))]),
      'should return the first match'
    )

    st.deepEqual(
      select('p i s', u('root', [h('p', h('i', h('s', h('s'))))])),
      h('s', h('s')),
      'should return deep matches'
    )

    st.end()
  })

  t.test('child selector', function(st) {
    st.deepEqual(
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

    st.deepEqual(
      select(
        'div > div',
        u('root', [h('#one', [h('#two'), h('#three', h('#four'))])])
      ),
      h('#two'),
      'should return matches with nested matches'
    )

    st.deepEqual(
      select('p > i > s', u('root', [h('p', h('i', h('s', h('s'))))])),
      h('s', h('s')),
      'should return deep matches'
    )

    st.end()
  })

  t.test('adjacent sibling selector', function(st) {
    st.deepEqual(
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
      'should return adjacent sibling'
    )

    st.equal(
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

    st.end()
  })

  t.test('general sibling selector', function(st) {
    st.deepEqual(
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
      'should return the first adjacent sibling'
    )

    st.deepEqual(
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
      'should return future siblings'
    )

    st.equal(
      select(
        'h1 ~ p',
        u('root', [h('p', 'Alpha'), h('h1', 'Bravo'), h('h2', 'Charlie')])
      ),
      null,
      'should return nothing without matches'
    )

    st.end()
  })

  t.test('parent-sensitive pseudo-selectors', function(st) {
    st.test(':first-child', function(sst) {
      sst.deepEqual(
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

      sst.equal(
        select(
          'h1:first-child',
          u('root', [h('p', 'Alpha'), h('h1', 'Bravo'), h('p', 'Charlie')])
        ),
        null,
        'should return nothing if nothing matches'
      )

      sst.end()
    })

    st.test(':last-child', function(sst) {
      sst.deepEqual(
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

      sst.equal(
        select(
          'h1:last-child',
          u('root', [h('p', 'Alpha'), h('h1', 'Bravo'), h('p', 'Charlie')])
        ),
        null,
        'should return nothing if nothing matches'
      )

      sst.end()
    })

    st.test(':only-child', function(sst) {
      sst.deepEqual(
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

      sst.equal(
        select(
          'h1:only-child',
          u('root', [h('p', 'Alpha'), h('h1', 'Bravo'), h('p', 'Charlie')])
        ),
        null,
        'should return nothing if nothing matches'
      )

      sst.end()
    })

    st.test(':nth-child', function(sst) {
      sst.deepEqual(
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

      sst.deepEqual(
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

      sst.deepEqual(
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

      sst.deepEqual(
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

      sst.end()
    })

    st.test(':nth-last-child', function(sst) {
      sst.deepEqual(
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

      sst.deepEqual(
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

      sst.deepEqual(
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

      sst.deepEqual(
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

      sst.end()
    })

    st.test(':nth-of-type', function(sst) {
      sst.deepEqual(
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

      sst.deepEqual(
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

      sst.deepEqual(
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

      sst.deepEqual(
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

      sst.end()
    })

    st.test(':nth-last-of-type', function(sst) {
      sst.deepEqual(
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

      sst.deepEqual(
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

      sst.deepEqual(
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

      sst.deepEqual(
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

      sst.end()
    })

    st.test(':first-of-type', function(sst) {
      sst.deepEqual(
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

      sst.equal(
        select('dt:first-of-type', h('dl', [])),
        null,
        'should return nothing without matches'
      )

      sst.end()
    })

    st.test(':last-of-type', function(sst) {
      sst.deepEqual(
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

      sst.equal(
        select('dt:last-of-type', h('dl', [])),
        null,
        'should return nothing without matches'
      )

      sst.end()
    })

    st.test(':only-of-type', function(sst) {
      sst.deepEqual(
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

      sst.equal(
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

      sst.equal(
        select('dt:only-of-type', h('dl', [])),
        null,
        'should return nothing without matches'
      )

      sst.end()
    })

    st.test(':lang()', function(sst) {
      sst.deepEqual(
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

      sst.end()
    })

    st.test(':dir()', function(sst) {
      var ltr = 'a'
      var rtl = 'أ'
      var neutral = '!'

      sst.deepEqual(
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

      sst.end()
    })

    st.test(':read-write', function(sst) {
      sst.deepEqual(
        select(
          'p:read-write',
          u('root', [h('div', {contentEditable: 'true'}, [h('p', 'A')])])
        ),
        h('p', 'A'),
        'should return elements inside `[contentEditable=true]`'
      )

      sst.deepEqual(
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

      sst.end()
    })

    st.test(':read-only', function(sst) {
      sst.deepEqual(
        select(
          'p:read-only',
          u('root', [h('div', {contentEditable: 'true'}, [h('p', 'A')])])
        ),
        null,
        'should not return elements inside `[contentEditable=true]`'
      )

      sst.deepEqual(
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

      sst.end()
    })

    st.test(':root', function(sst) {
      sst.deepEqual(
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

      sst.deepEqual(
        select(':root', h('html', [h('title', 'Hello'), h('p', 'World')])),
        h('html', [h('title', 'Hello'), h('p', 'World')]),
        'should return the `<html>` element with a no parent'
      )

      sst.deepEqual(
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

      sst.deepEqual(
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

      sst.deepEqual(
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

      sst.end()
    })

    st.test(':scope', function(sst) {
      sst.deepEqual(
        select(
          ':scope',
          u('root', [h('strong', h('b', 'a')), h('em', h('i', 'b'))])
        ),
        h('strong', h('b', 'a')),
        'should select the first element directly in a `root`, if a `root` is given'
      )

      sst.deepEqual(
        select(':scope', h('em', h('i', 'b'))),
        h('em', h('i', 'b')),
        'should select the root element if one is given'
      )

      sst.end()
    })

    st.end()
  })

  t.end()
})
