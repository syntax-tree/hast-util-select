import assert from 'node:assert/strict'
import test from 'node:test'
import {h, s} from 'hastscript'
import {select} from 'hast-util-select'
import {u} from 'unist-builder'

test('select.select()', async function (t) {
  await t.test('invalid selectors', async function (t) {
    await t.test('should throw without selector', async function () {
      assert.throws(function () {
        // @ts-expect-error: check how the runtime handles a missing `selector`.
        select()
      }, /Error: Expected `string` as selector, not `undefined`/)
    })

    await t.test('should throw w/ invalid selector (1)', async function () {
      assert.throws(function () {
        // @ts-expect-error: check how the runtime handles an incorrect `selector`.
        select([], h(''))
      }, /Error: Expected `string` as selector, not ``/)
    })

    await t.test('should throw w/ invalid selector (2)', async function () {
      assert.throws(function () {
        select('@supports (transform-origin: 5% 5%) {}', h(''))
      }, /Expected rule but "@" found/)
    })

    await t.test(
      'should throw on invalid attribute operators',
      async function () {
        assert.throws(function () {
          select('[foo%=bar]', h(''))
        }, /Expected a valid attribute selector operator/)
      }
    )

    await t.test('should throw on invalid pseudo classes', async function () {
      assert.throws(function () {
        select(':active', h(''))
      }, /Error: Unknown pseudo-selector `active`/)
    })

    await t.test(
      'should throw on invalid pseudo class “functions”',
      async function () {
        assert.throws(function () {
          select(':nth-foo(2n+1)', h(''))
        }, /Unknown pseudo-class/)
      }
    )

    await t.test('should throw on invalid pseudo elements', async function () {
      assert.throws(function () {
        select('::before', h(''))
      }, /Invalid selector: `::before`/)
    })
  })

  await t.test('general', async function (t) {
    await t.test('should throw on empty selectors', async function () {
      assert.throws(function () {
        select('', h())
      }, /Expected rule but end of input reached/)
    })

    await t.test(
      'should throw for a white-space only selector',
      async function () {
        assert.throws(function () {
          select(' ', h())
        }, /Expected rule but end of input reached/)
      }
    )

    await t.test('should not select if not given a node', async function () {
      assert.equal(select('*'), undefined)
    })

    await t.test(
      'should not select if not given an element',
      async function () {
        assert.equal(select('*', {type: 'text', value: 'a'}), undefined)
      }
    )

    await t.test('should select one of several elements', async function () {
      assert.deepEqual(
        select('h1, h2', h('main', [h('h1', 'Alpha'), h('h2', 'Bravo')])),
        h('h1', 'Alpha')
      )
    })
  })

  await t.test('descendant selector', async function (t) {
    await t.test('should return the first descendant node', async function () {
      assert.deepEqual(
        select(
          'div',
          u('root', [
            h('#one'),
            h('main', [h('#two'), h('article', h('#three'))])
          ])
        ),
        h('#one')
      )
    })

    await t.test(
      'should return the given node if it matches',
      async function () {
        assert.deepEqual(select('div', h('#one')), h('#one'))
      }
    )

    await t.test('should return the first match', async function () {
      assert.deepEqual(
        select(
          'div',
          u('root', [h('#one', [h('#two'), h('#three', h('#four'))])])
        ),
        h('#one', [h('#two'), h('#three', h('#four'))])
      )
    })

    await t.test('should return deep matches', async function () {
      assert.deepEqual(
        select('p i s', u('root', [h('p', h('i', h('s', h('s'))))])),
        h('s', h('s'))
      )
    })
  })

  await t.test('child selector', async function (t) {
    await t.test('should return child nodes', async function () {
      assert.deepEqual(
        select(
          'main > article',
          u('root', [
            h('#one'),
            h('main', [h('#two'), h('article', h('#three'))])
          ])
        ),
        h('article', h('#three'))
      )
    })

    await t.test(
      'should return matches with nested matches',
      async function () {
        assert.deepEqual(
          select(
            'div > div',
            u('root', [h('#one', [h('#two'), h('#three', h('#four'))])])
          ),
          h('#two')
        )
      }
    )

    await t.test('should return deep matches', async function () {
      assert.deepEqual(
        select('p > i > s', u('root', [h('p', h('i', h('s', h('s'))))])),
        h('s', h('s'))
      )
    })
  })

  await t.test('next-sibling selector', async function (t) {
    await t.test('should return next-sibling', async function () {
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
        h('p', 'Charlie')
      )
    })

    await t.test(
      'should return next-sibling ignoring non-elements',
      async function () {
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
          h('b', 'dolor')
        )
      }
    )

    await t.test('should return nothing without matches', async function () {
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
        undefined
      )
    })
  })

  await t.test('subsequent sibling selector', async function (t) {
    await t.test(
      'should return the first subsequent sibling',
      async function () {
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
          h('p', 'Charlie')
        )
      }
    )

    await t.test('should return subsequent siblings', async function () {
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
        h('p', 'Delta')
      )
    })

    await t.test(
      'should return siblings ignoring non-elements',
      async function () {
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
          h('i', 'amet')
        )
      }
    )

    await t.test('should return nothing without matches', async function () {
      assert.equal(
        select(
          'h1 ~ p',
          u('root', [h('p', 'Alpha'), h('h1', 'Bravo'), h('h2', 'Charlie')])
        ),
        undefined
      )
    })
  })

  await t.test('parent-sensitive pseudo-selectors', async function (t) {
    await t.test(':first-child', async function (t) {
      await t.test('should return the first child', async function () {
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
          h('p', 'Alpha')
        )
      })

      await t.test(
        'should return nothing if nothing matches',
        async function () {
          assert.equal(
            select(
              'h1:first-child',
              u('root', [h('p', 'Alpha'), h('h1', 'Bravo'), h('p', 'Charlie')])
            ),
            undefined
          )
        }
      )
    })

    await t.test(':last-child', async function (t) {
      await t.test('should return the last child', async function () {
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
          h('div', [h('p', 'Echo')])
        )
      })

      await t.test(
        'should return nothing if nothing matches',
        async function () {
          assert.equal(
            select(
              'h1:last-child',
              u('root', [h('p', 'Alpha'), h('h1', 'Bravo'), h('p', 'Charlie')])
            ),
            undefined
          )
        }
      )
    })

    await t.test(':only-child', async function (t) {
      await t.test('should return an only child', async function () {
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
          h('p', 'Echo')
        )
      })

      await t.test(
        'should return nothing if nothing matches',
        async function () {
          assert.equal(
            select(
              'h1:only-child',
              u('root', [h('p', 'Alpha'), h('h1', 'Bravo'), h('p', 'Charlie')])
            ),
            undefined
          )
        }
      )
    })

    await t.test(':nth-child', async function (t) {
      await t.test(
        'should return the match for `:nth-child(odd)`',
        async function () {
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
            h('li', 'Alpha')
          )
        }
      )

      await t.test(
        'should return the match for `:nth-child(2n+1)`',
        async function () {
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
            h('li', 'Alpha')
          )
        }
      )

      await t.test(
        'should return the match for `:nth-child(even)`',
        async function () {
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
            h('li', 'Bravo')
          )
        }
      )

      await t.test(
        'should return the match for `:nth-child(2n+0)`',
        async function () {
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
            h('li', 'Bravo')
          )
        }
      )
    })

    await t.test(':nth-last-child', async function (t) {
      await t.test(
        'should return the last match for `:nth-last-child(odd)`',
        async function () {
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
            h('li', 'Bravo')
          )
        }
      )

      await t.test(
        'should return the last match for `:nth-last-child(2n+1)`',
        async function () {
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
            h('li', 'Bravo')
          )
        }
      )

      await t.test(
        'should return the last match for `:nth-last-child(even)`',
        async function () {
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
            h('li', 'Alpha')
          )
        }
      )

      await t.test(
        'should return the last match for `:nth-last-child(2n+0)`',
        async function () {
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
            h('li', 'Alpha')
          )
        }
      )
    })

    await t.test(':nth-of-type', async function (t) {
      await t.test(
        'should return the first match for `:nth-of-type(odd)`',
        async function () {
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
            h('dt', 'Alpha')
          )
        }
      )

      await t.test(
        'should return the first match for `:nth-of-type(2n+1)`',
        async function () {
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
            h('dt', 'Alpha')
          )
        }
      )

      await t.test(
        'should return the first match for `:nth-of-type(even)`',
        async function () {
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
            h('dt', 'Charlie')
          )
        }
      )

      await t.test(
        'should return the first match for `:nth-of-type(2n+0)`',
        async function () {
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
            h('dt', 'Charlie')
          )
        }
      )
    })

    await t.test(':nth-last-of-type', async function (t) {
      await t.test(
        'should return the last match for `:nth-last-of-type(odd)`s',
        async function () {
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
            h('dt', 'Alpha')
          )
        }
      )

      await t.test(
        'should return the last match for `:nth-last-of-type(2n+1)`',
        async function () {
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
            h('dt', 'Alpha')
          )
        }
      )

      await t.test(
        'should return the last match for `:nth-last-of-type(even)`',
        async function () {
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
            h('dt', 'Charlie')
          )
        }
      )

      await t.test(
        'should return the last match for `:nth-last-of-type(2n+0)`',
        async function () {
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
            h('dt', 'Charlie')
          )
        }
      )
    })

    await t.test(':first-of-type', async function (t) {
      await t.test(
        'should return the first match for `:first-of-type`',
        async function () {
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
            h('dt', 'Alpha')
          )
        }
      )

      await t.test('should return nothing without matches', async function () {
        assert.equal(select('dt:first-of-type', h('dl', [])), undefined)
      })
    })

    await t.test(':last-of-type', async function (t) {
      await t.test(
        'should return the last match for `:last-of-type`s',
        async function () {
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
            h('dt', 'Echo')
          )
        }
      )

      await t.test('should return nothing without matches', async function () {
        assert.equal(select('dt:last-of-type', h('dl', [])), undefined)
      })
    })

    await t.test(':only-of-type', async function (t) {
      await t.test('should return the only match', async function () {
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
          h('dd', 'Charlie')
        )
      })

      await t.test(
        'should return nothing with too many matches',
        async function () {
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
            undefined
          )
        }
      )

      await t.test('should return nothing without matches', async function () {
        assert.equal(select('dt:only-of-type', h('dl', [])), undefined)
      })
    })
  })

  await t.test(':lang()', async function (t) {
    await t.test(
      'should return the correct matching element',
      async function () {
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
          h('q', {lang: 'en-GB'}, 'C')
        )
      }
    )
  })

  await t.test(':dir()', async function (t) {
    const ltr = 'a'
    const rtl = 'أ'
    const neutral = '!'

    await t.test(
      'should return the correct matching element',
      async function () {
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
          h('q', ltr)
        )
      }
    )
  })

  await t.test(':read-write', async function (t) {
    await t.test(
      'should return elements inside `[contentEditable=true]`',
      async function () {
        assert.deepEqual(
          select(
            'p:read-write',
            u('root', [h('div', {contentEditable: 'true'}, [h('p', 'A')])])
          ),
          h('p', 'A')
        )
      }
    )

    await t.test(
      'should not return elements inside SVG embedded in `[contentEditable=true]`',
      async function () {
        assert.deepEqual(
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
          undefined
        )
      }
    )
  })

  await t.test(':read-only', async function (t) {
    await t.test(
      'should not return elements inside `[contentEditable=true]`',
      async function () {
        assert.deepEqual(
          select(
            'p:read-only',
            u('root', [h('div', {contentEditable: 'true'}, [h('p', 'A')])])
          ),
          undefined
        )
      }
    )

    await t.test(
      'should return elements inside SVG embedded in `[contentEditable=true]`',
      async function () {
        assert.deepEqual(
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
          s('a', {download: true}, '!')
        )
      }
    )
  })

  await t.test(':root', async function (t) {
    await t.test(
      'should return the `<html>` element with a `root` as parent',
      async function () {
        assert.deepEqual(
          select(
            ':root',
            u('root', [
              u('doctype', {name: 'html'}),
              h('html', [h('title', 'Hello'), h('p', 'World')])
            ])
          ),
          h('html', [h('title', 'Hello'), h('p', 'World')])
        )
      }
    )

    await t.test(
      'should return the `<html>` element with a no parent',
      async function () {
        assert.deepEqual(
          select(':root', h('html', [h('title', 'Hello'), h('p', 'World')])),
          h('html', [h('title', 'Hello'), h('p', 'World')])
        )
      }
    )

    await t.test(
      'should return the `<svg>` element with a `root` as parent',
      async function () {
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
          ])
        )
      }
    )

    await t.test(
      'should return the `<svg>` element with a no parent',
      async function () {
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
          ])
        )
      }
    )

    await t.test(
      'should return the `<html>` element, not an embedded `<svg>` element',
      async function () {
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
          ])
        )
      }
    )
  })

  await t.test(':scope', async function (t) {
    await t.test(
      'should select the first element directly in a `root`, if a `root` is given',
      async function () {
        assert.deepEqual(
          select(
            ':scope',
            u('root', [h('strong', h('b', 'a')), h('em', h('i', 'b'))])
          ),
          h('strong', h('b', 'a'))
        )
      }
    )

    await t.test(
      'should select the root element if one is given',
      async function () {
        assert.deepEqual(
          select(':scope', h('em', h('i', 'b'))),
          h('em', h('i', 'b'))
        )
      }
    )
  })

  await t.test(':is', async function (t) {
    await t.test('should support parent-sensitive `:is`', async function () {
      assert.deepEqual(
        select('y:is(:first-child)', h('x', [h('y#a'), h('y#b')])),
        h('y#a')
      )
    })
  })

  await t.test(':not', async function (t) {
    await t.test('should support parent-sensitive `:not`', async function () {
      assert.deepEqual(
        select('y:not(:first-child)', h('x', [h('y#a'), h('y#b')])),
        h('y#b')
      )
    })
  })
})
