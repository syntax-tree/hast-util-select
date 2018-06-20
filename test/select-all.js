'use strict'

var test = require('tape')
var u = require('unist-builder')
var h = require('hastscript')
var selectAll = require('..').selectAll

test('select.selectAll()', function(t) {
  t.test('invalid selectors', function(st) {
    st.throws(
      function() {
        selectAll()
      },
      /Error: Expected `string` as selector, not `undefined`/,
      'should throw without selector'
    )

    st.throws(
      function() {
        selectAll([], h())
      },
      /Error: Expected `string` as selector, not ``/,
      'should throw w/ invalid selector (1)'
    )

    st.throws(
      function() {
        selectAll('@supports (transform-origin: 5% 5%) {}', h())
      },
      /Error: Rule expected but "@" found./,
      'should throw w/ invalid selector (2)'
    )

    st.throws(
      function() {
        selectAll('[foo%=bar]', h())
      },
      /Error: Expected "=" but "%" found./,
      'should throw on invalid attribute operators'
    )

    st.throws(
      function() {
        selectAll(':active', h())
      },
      /Error: Unknown pseudo-selector `active`/,
      'should throw on invalid pseudo classes'
    )

    st.throws(
      function() {
        selectAll(':nth-foo(2n+1)', h())
      },
      /Error: Unknown pseudo-selector `nth-foo`/,
      'should throw on invalid pseudo class “functions”'
    )

    st.throws(
      function() {
        selectAll('::before', h())
      },
      /Error: Unexpected pseudo-element or empty pseudo-class/,
      'should throw on invalid pseudo elements'
    )

    st.end()
  })

  t.test('general', function(st) {
    st.deepEqual(
      selectAll('', h()),
      [],
      'nothing for the empty string as selector'
    )
    st.deepEqual(
      selectAll(' ', h()),
      [],
      'nothing for a white-space only selector'
    )
    st.deepEqual(selectAll('*'), [], 'nothing if not given a node')
    st.deepEqual(
      selectAll('*', {type: 'text', value: 'a'}),
      [],
      'nothing if not given an element'
    )

    st.end()
  })

  t.test('descendant selector', function(st) {
    st.deepEqual(
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

    st.deepEqual(
      selectAll('div', h('#one')),
      [h('#one')],
      'should return the given node if it matches'
    )

    st.deepEqual(
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

    st.deepEqual(
      selectAll('p i s', u('root', [h('p', h('i', h('s', h('s'))))])),
      [h('s', h('s')), h('s')],
      'should return deep matches'
    )

    st.deepEqual(
      selectAll('b s', h('p', [h('b', h('s', '1')), h('i', h('s', '2'))])),
      [h('s', '1')],
      'should not match outside other matches'
    )

    st.end()
  })

  t.test('child selector', function(st) {
    st.deepEqual(
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

    st.deepEqual(
      selectAll(
        'div > div',
        u('root', [h('#one', [h('#two'), h('#three', h('#four'))])])
      ),
      [h('#two'), h('#three', h('#four')), h('#four')],
      'should return matches with nested matches'
    )

    st.deepEqual(
      selectAll('p > i > s', u('root', [h('p', h('i', h('s', h('s'))))])),
      [h('s', h('s'))],
      'should return deep matches'
    )

    st.end()
  })

  t.test('adjacent sibling selector', function(st) {
    st.deepEqual(
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
      'should return adjacent sibling'
    )

    st.deepEqual(
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

    st.end()
  })

  t.test('general sibling selector', function(st) {
    st.deepEqual(
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
      'should return adjacent sibling'
    )

    st.deepEqual(
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
      'should return future siblings'
    )

    st.deepEqual(
      selectAll(
        'h1 ~ p',
        u('root', [h('p', 'Alpha'), h('h1', 'Bravo'), h('h2', 'Charlie')])
      ),
      [],
      'should return nothing without matches'
    )

    st.end()
  })

  t.test('parent-sensitive pseudo-selectors', function(st) {
    st.test(':first-child', function(sst) {
      st.deepEqual(
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

      st.deepEqual(
        selectAll(
          'p:first-child',
          u('root', [h('p', 'Alpha'), h('h1', 'Bravo'), h('p', 'Charlie')])
        ),
        [h('p', 'Alpha')],
        'should return all `:first-child`s (2)'
      )

      st.deepEqual(
        selectAll(
          'h1:first-child',
          u('root', [h('p', 'Alpha'), h('h1', 'Bravo'), h('p', 'Charlie')])
        ),
        [],
        'should return nothing if nothing matches'
      )

      sst.end()
    })

    st.test(':last-child', function(sst) {
      st.deepEqual(
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

      st.deepEqual(
        selectAll(
          'p:last-child',
          u('root', [h('p', 'Alpha'), h('h1', 'Bravo'), h('p', 'Charlie')])
        ),
        [h('p', 'Charlie')],
        'should return all `:last-child`s (2)'
      )

      st.deepEqual(
        selectAll(
          'h1:last-child',
          u('root', [h('p', 'Alpha'), h('h1', 'Bravo'), h('p', 'Charlie')])
        ),
        [],
        'should return nothing if nothing matches'
      )

      sst.end()
    })

    st.test(':only-child', function(sst) {
      st.deepEqual(
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

      st.deepEqual(
        selectAll(
          'h1:only-child',
          u('root', [h('p', 'Alpha'), h('h1', 'Bravo'), h('p', 'Charlie')])
        ),
        [],
        'should return nothing if nothing matches'
      )

      sst.end()
    })

    st.test(':nth-child', function(sst) {
      st.deepEqual(
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

      st.deepEqual(
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

      st.deepEqual(
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

      st.deepEqual(
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

      sst.end()
    })

    st.test(':nth-last-child', function(sst) {
      st.deepEqual(
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

      st.deepEqual(
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

      st.deepEqual(
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

      st.deepEqual(
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

      sst.end()
    })

    st.test(':nth-of-type', function(sst) {
      st.deepEqual(
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

      st.deepEqual(
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

      st.deepEqual(
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

      st.deepEqual(
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

      sst.end()
    })

    st.test(':nth-last-of-type', function(sst) {
      st.deepEqual(
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

      st.deepEqual(
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

      st.deepEqual(
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

      st.deepEqual(
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

      sst.end()
    })

    st.test(':first-of-type', function(sst) {
      st.deepEqual(
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

      st.deepEqual(
        selectAll('dt:first-of-type', h('dl', [])),
        [],
        'should return nothing without matches'
      )

      sst.end()
    })

    st.test(':last-of-type', function(sst) {
      st.deepEqual(
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

      st.deepEqual(
        selectAll('dt:last-of-type', h('dl', [])),
        [],
        'should return nothing without matches'
      )

      sst.end()
    })

    st.test(':only-of-type', function(sst) {
      st.deepEqual(
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

      st.deepEqual(
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

      st.deepEqual(
        selectAll('dt:only-of-type', h('dl', [])),
        [],
        'should return nothing without matches'
      )

      sst.end()
    })

    st.end()
  })

  t.end()
})
