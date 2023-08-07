import assert from 'node:assert/strict'
import test from 'node:test'
import {h, s} from 'hastscript'
import {selectAll} from 'hast-util-select'
import {u} from 'unist-builder'

test('select.selectAll()', async function (t) {
  await t.test('invalid selectors', async function (t) {
    await t.test('should throw without selector', async function () {
      assert.throws(function () {
        // @ts-expect-error: check how the runtime handles a missing `selector`.
        selectAll()
      }, /Error: Expected `string` as selector, not `undefined`/)
    })

    await t.test('should throw w/ invalid selector (1)', async function () {
      assert.throws(function () {
        // @ts-expect-error: check how the runtime handles an incorrect `selector`.
        selectAll([], h(''))
      }, /Error: Expected `string` as selector, not ``/)
    })

    await t.test('should throw w/ invalid selector (2)', async function () {
      assert.throws(function () {
        selectAll('@supports (transform-origin: 5% 5%) {}', h(''))
      }, /Expected rule but "@" found/)
    })

    await t.test(
      'should throw on invalid attribute operators',
      async function () {
        assert.throws(function () {
          selectAll('[foo%=bar]', h(''))
        }, /Expected a valid attribute selector operator/)
      }
    )

    await t.test('should throw on invalid pseudo classes', async function () {
      assert.throws(function () {
        selectAll(':active', h(''))
      }, /Error: Unknown pseudo-selector `active`/)
    })

    await t.test(
      'should throw on invalid pseudo class “functions”',
      async function () {
        assert.throws(function () {
          selectAll(':nth-foo(2n+1)', h(''))
        }, /Unknown pseudo-class/)
      }
    )

    await t.test('should throw on invalid pseudo elements', async function () {
      assert.throws(function () {
        selectAll('::before', h(''))
      }, /Invalid selector: `::before`/)
    })
  })

  await t.test('general', async function (t) {
    await t.test('should throw on empty selectors', async function () {
      assert.throws(function () {
        selectAll('', h())
      }, /Expected rule but end of input reached/)
    })

    await t.test(
      'should throw for a white-space only selector',
      async function () {
        assert.throws(function () {
          selectAll(' ', h())
        }, /Expected rule but end of input reached/)
      }
    )

    await t.test('should be empty if not given a node', async function () {
      assert.deepEqual(selectAll('*'), [])
    })

    await t.test('should be empty if not given an element', async function () {
      assert.deepEqual(selectAll('*', {type: 'text', value: 'a'}), [])
    })
  })

  await t.test('descendant selector', async function (t) {
    await t.test('should return descendant nodes', async function () {
      assert.deepEqual(
        selectAll(
          'div',
          u('root', [
            h('#one'),
            h('main', [h('#two'), h('article', h('#three'))])
          ])
        ),
        [h('#one'), h('#two'), h('#three')]
      )
    })

    await t.test(
      'should return the given node if it matches',
      async function () {
        assert.deepEqual(selectAll('div', h('#one')), [h('#one')])
      }
    )

    await t.test(
      'should return matches with nested matches',
      async function () {
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
          ]
        )
      }
    )

    await t.test('should return deep matches', async function () {
      assert.deepEqual(
        selectAll('p i s', u('root', [h('p', h('i', h('s', h('s'))))])),
        [h('s', h('s')), h('s')]
      )
    })

    await t.test('should not match outside other matches', async function () {
      assert.deepEqual(
        selectAll('b s', h('p', [h('b', h('s', '1')), h('i', h('s', '2'))])),
        [h('s', '1')]
      )
    })
  })

  await t.test('child selector', async function (t) {
    await t.test('should return child nodes', async function () {
      assert.deepEqual(
        selectAll(
          'main > article',
          u('root', [
            h('#one'),
            h('main', [h('#two'), h('article', h('#three'))])
          ])
        ),
        [h('article', h('#three'))]
      )
    })

    await t.test(
      'should return matches with nested matches',
      async function () {
        assert.deepEqual(
          selectAll(
            'div > div',
            u('root', [h('#one', [h('#two'), h('#three', h('#four'))])])
          ),
          [h('#two'), h('#three', h('#four')), h('#four')]
        )
      }
    )

    await t.test('should return deep matches', async function () {
      assert.deepEqual(
        selectAll('p > i > s', u('root', [h('p', h('i', h('s', h('s'))))])),
        [h('s', h('s'))]
      )
    })
  })

  await t.test('next-sibling selector', async function (t) {
    await t.test('should return next-sibling', async function () {
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
        [h('p', 'Charlie')]
      )
    })

    await t.test(
      'should return next-sibling ignoring non-elements',
      async function () {
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
          [h('b', 'dolor')]
        )
      }
    )

    await t.test('should return nothing without matches', async function () {
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
        []
      )
    })
  })

  await t.test('subsequent sibling selector', async function (t) {
    await t.test('should return subsequent sibling', async function () {
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
        [h('p', 'Charlie'), h('p', 'Delta')]
      )
    })

    await t.test('should return subsequent siblings', async function () {
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
        [h('p', 'Delta')]
      )
    })

    await t.test(
      'should return siblings ignoring non-elements',
      async function () {
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
          [h('i', 'amet'), h('i', 'tempor')]
        )
      }
    )

    await t.test('should return nothing without matches', async function () {
      assert.deepEqual(
        selectAll(
          'h1 ~ p',
          u('root', [h('p', 'Alpha'), h('h1', 'Bravo'), h('h2', 'Charlie')])
        ),
        []
      )
    })
  })

  await t.test('parent-sensitive pseudo-selectors', async function (t) {
    await t.test(':first-child', async function (t) {
      await t.test('should return all `:first-child`s (1)', async function () {
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
          [h('p', 'Alpha'), h('p', 'Echo')]
        )
      })

      await t.test('should return all `:first-child`s (2)', async function () {
        assert.deepEqual(
          selectAll(
            'p:first-child',
            u('root', [h('p', 'Alpha'), h('h1', 'Bravo'), h('p', 'Charlie')])
          ),
          [h('p', 'Alpha')]
        )
      })

      await t.test(
        'should return nothing if nothing matches',
        async function () {
          assert.deepEqual(
            selectAll(
              'h1:first-child',
              u('root', [h('p', 'Alpha'), h('h1', 'Bravo'), h('p', 'Charlie')])
            ),
            []
          )
        }
      )
    })

    await t.test(':last-child', async function (t) {
      await t.test('should return all `:last-child`s (1)', async function () {
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
          [h('div', [h('p', 'Echo')]), h('p', 'Echo')]
        )
      })

      await t.test('should return all `:last-child`s (2)', async function () {
        assert.deepEqual(
          selectAll(
            'p:last-child',
            u('root', [h('p', 'Alpha'), h('h1', 'Bravo'), h('p', 'Charlie')])
          ),
          [h('p', 'Charlie')]
        )
      })

      await t.test(
        'should return nothing if nothing matches',
        async function () {
          assert.deepEqual(
            selectAll(
              'h1:last-child',
              u('root', [h('p', 'Alpha'), h('h1', 'Bravo'), h('p', 'Charlie')])
            ),
            []
          )
        }
      )
    })

    await t.test(':only-child', async function (t) {
      await t.test('should return all `:only-child`s', async function () {
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
          [h('p', 'Echo')]
        )
      })

      await t.test(
        'should return nothing if nothing matches',
        async function () {
          assert.deepEqual(
            selectAll(
              'h1:only-child',
              u('root', [h('p', 'Alpha'), h('h1', 'Bravo'), h('p', 'Charlie')])
            ),
            []
          )
        }
      )
    })

    await t.test(':nth-child', async function (t) {
      await t.test('should return all `:nth-child(odd)`s', async function () {
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
          [h('li', 'Alpha'), h('li', 'Charlie'), h('li', 'Echo')]
        )
      })

      await t.test('should return all `:nth-child(2n+1)`s', async function () {
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
          [h('li', 'Alpha'), h('li', 'Charlie'), h('li', 'Echo')]
        )
      })

      await t.test('should return all `:nth-child(even)`s', async function () {
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
          [h('li', 'Bravo'), h('li', 'Delta'), h('li', 'Foxtrot')]
        )
      })

      await t.test('should return all `:nth-child(2n+0)`s', async function () {
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
          [h('li', 'Bravo'), h('li', 'Delta'), h('li', 'Foxtrot')]
        )
      })
    })

    await t.test(':nth-last-child', async function (t) {
      await t.test(
        'should return all `:nth-last-child(odd)`s',
        async function () {
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
            [h('li', 'Bravo'), h('li', 'Delta'), h('li', 'Foxtrot')]
          )
        }
      )

      await t.test(
        'should return all `:nth-last-child(2n+1)`s',
        async function () {
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
            [h('li', 'Bravo'), h('li', 'Delta'), h('li', 'Foxtrot')]
          )
        }
      )

      await t.test(
        'should return all `:nth-last-child(even)`s',
        async function () {
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
            [h('li', 'Alpha'), h('li', 'Charlie'), h('li', 'Echo')]
          )
        }
      )

      await t.test(
        'should return all `:nth-last-child(2n+0)`s',
        async function () {
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
            [h('li', 'Alpha'), h('li', 'Charlie'), h('li', 'Echo')]
          )
        }
      )
    })

    await t.test(':nth-of-type', async function (t) {
      await t.test('should return all `:nth-of-type(odd)`s', async function () {
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
          [h('dt', 'Alpha'), h('dt', 'Echo')]
        )
      })

      await t.test(
        'should return all `:nth-of-type(2n+1)`s',
        async function () {
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
            [h('dt', 'Alpha'), h('dt', 'Echo')]
          )
        }
      )

      await t.test(
        'should return all `:nth-of-type(even)`s',
        async function () {
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
            [h('dt', 'Charlie')]
          )
        }
      )

      await t.test(
        'should return all `:nth-of-type(2n+0)`s',
        async function () {
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
            [h('dt', 'Charlie')]
          )
        }
      )
    })

    await t.test(':nth-last-of-type', async function (t) {
      await t.test(
        'should return all `:nth-last-of-type(odd)`s',
        async function () {
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
            [h('dt', 'Alpha'), h('dt', 'Echo')]
          )
        }
      )

      await t.test(
        'should return all `:nth-last-of-type(2n+1)`s',
        async function () {
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
            [h('dt', 'Alpha'), h('dt', 'Echo')]
          )
        }
      )

      await t.test(
        'should return all `:nth-last-of-type(even)`s',
        async function () {
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
            [h('dt', 'Charlie')]
          )
        }
      )

      await t.test(
        'should return all `:nth-last-of-type(2n+0)`s',
        async function () {
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
            [h('dt', 'Charlie')]
          )
        }
      )
    })

    await t.test(':first-of-type', async function (t) {
      await t.test('should return all `:first-of-type`s', async function () {
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
          [h('dt', 'Alpha')]
        )
      })

      await t.test('should return nothing without matches', async function () {
        assert.deepEqual(selectAll('dt:first-of-type', h('dl', [])), [])
      })
    })

    await t.test(':last-of-type', async function (t) {
      await t.test('should return all `:last-of-type`s', async function () {
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
          [h('dt', 'Echo')]
        )
      })

      await t.test('should return nothing without matches', async function () {
        assert.deepEqual(selectAll('dt:last-of-type', h('dl', [])), [])
      })
    })

    await t.test(':only-of-type', async function (t) {
      await t.test('should return the only type', async function () {
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
          [h('dd', 'Charlie')]
        )
      })

      await t.test(
        'should return nothing with too many matches',
        async function () {
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
            []
          )
        }
      )

      await t.test('should return nothing without matches', async function () {
        assert.deepEqual(selectAll('dt:only-of-type', h('dl', [])), [])
      })
    })
  })

  await t.test(':lang()', async function (t) {
    await t.test(
      'should return the correct matching elements',
      async function () {
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
          ]
        )
      }
    )
  })

  await t.test(':dir()', async function (t) {
    const ltr = 'a'
    const rtl = 'أ'

    await t.test(
      'should return the correct matching element',
      async function () {
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
          [h('q#a', ltr), h('q#e', {dir: 'rtl'}, rtl)]
        )
      }
    )
  })

  await t.test(':read-write', async function (t) {
    await t.test(
      'should return elements inside `[contentEditable=true]`',
      async function () {
        assert.deepEqual(
          selectAll(
            'p:read-write',
            u('root', [h('div', {contentEditable: 'true'}, [h('p', 'A')])])
          ),
          [h('p', 'A')]
        )
      }
    )

    await t.test(
      'should not return elements inside SVG embedded in `[contentEditable=true]`',
      async function () {
        assert.deepEqual(
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
          []
        )
      }
    )
  })

  await t.test(':read-only', async function (t) {
    await t.test(
      'should not return elements inside `[contentEditable=true]`',
      async function () {
        assert.deepEqual(
          selectAll(
            'p:read-only',
            u('root', [h('div', {contentEditable: 'true'}, [h('p', 'A')])])
          ),
          []
        )
      }
    )

    await t.test(
      'should return elements inside SVG embedded in `[contentEditable=true]`',
      async function () {
        assert.deepEqual(
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
          [s('a', {download: true}, '!')]
        )
      }
    )
  })

  await t.test(':root', async function (t) {
    await t.test(
      'should return the `<html>` element with a `root` as parent',
      async function () {
        assert.deepEqual(
          selectAll(
            ':root',
            u('root', [
              u('doctype', {name: 'html'}),
              h('html', [h('title', 'Hello'), h('p', 'World')])
            ])
          ),
          [h('html', [h('title', 'Hello'), h('p', 'World')])]
        )
      }
    )

    await t.test(
      'should return the `<html>` element with a no parent',
      async function () {
        assert.deepEqual(
          selectAll(':root', h('html', [h('title', 'Hello'), h('p', 'World')])),
          [h('html', [h('title', 'Hello'), h('p', 'World')])]
        )
      }
    )

    await t.test(
      'should return the `<svg>` element with a `root` as parent',
      async function () {
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
          ]
        )
      }
    )

    await t.test(
      'should return the `<svg>` element with a no parent',
      async function () {
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
          ]
        )
      }
    )

    await t.test(
      'should return the `<html>` element, not an embedded `<svg>` element',
      async function () {
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
          ]
        )
      }
    )
  })

  await t.test(':scope', async function (t) {
    await t.test(
      'should select the elements directly in `root`, if a `root` is given',
      async function () {
        assert.deepEqual(
          selectAll(
            ':scope',
            u('root', [h('strong', h('b', 'a')), h('em', h('i', 'b'))])
          ),
          [h('strong', h('b', 'a')), h('em', h('i', 'b'))]
        )
      }
    )

    await t.test(
      'should select the root element if one is given',
      async function () {
        assert.deepEqual(selectAll(':scope', h('em', h('i', 'b'))), [
          h('em', h('i', 'b'))
        ])
      }
    )
  })

  await t.test(':is', async function (t) {
    await t.test('should support parent-sensitive `:is`', async function () {
      assert.deepEqual(
        selectAll('y:is(:first-child)', h('x', [h('y#a'), h('y#b')])),
        [h('y#a')]
      )
    })
  })

  await t.test(':not', async function (t) {
    await t.test('should support parent-sensitive `:not`', async function () {
      assert.deepEqual(
        selectAll('y:not(:first-child)', h('x', [h('y#a'), h('y#b')])),
        [h('y#b')]
      )
    })
  })
})
