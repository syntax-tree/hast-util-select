import assert from 'node:assert/strict'
import test from 'node:test'
import {h, s} from 'hastscript'
import {u} from 'unist-builder'
import {matches} from '../index.js'

test('select.matches()', async function (t) {
  await t.test('invalid selector', async function (t) {
    await t.test('should throw without selector', async function () {
      assert.throws(function () {
        // @ts-expect-error: check how the runtime handles a missing `selector`.
        matches()
      }, /Error: Expected `string` as selector, not `undefined`/)
    })

    await t.test('should throw w/ invalid selector (1)', async function () {
      assert.throws(function () {
        // @ts-expect-error: check how the runtime handles an incorrect `selector`.
        matches([], h(''))
      }, /Error: Expected `string` as selector, not ``/)
    })

    await t.test('should throw w/ invalid selector (2)', async function () {
      assert.throws(function () {
        matches('@supports (transform-origin: 5% 5%) {}', h(''))
      }, /Expected rule but "@" found/)
    })

    await t.test(
      'should throw on invalid attribute operators',
      async function () {
        assert.throws(function () {
          matches('[foo%=bar]', h(''))
        }, /Expected a valid attribute selector operator/)
      }
    )

    await t.test('should throw on invalid pseudo classes', async function () {
      assert.throws(function () {
        matches(':active', h(''))
      }, /Error: Unknown pseudo-selector `active`/)
    })

    await t.test(
      'should throw on invalid pseudo class “functions”',
      async function () {
        assert.throws(function () {
          matches(':nth-foo(2n+1)', h(''))
        }, /Unknown pseudo-class/)
      }
    )

    await t.test('should throw on invalid pseudo elements', async function () {
      assert.throws(function () {
        matches('::before', h(''))
      }, /Invalid selector: `::before`/)
    })

    await t.test(
      'should throw on nested selectors (descendant)',
      async function () {
        assert.throws(function () {
          matches('foo bar', h(''))
        }, /Error: Expected selector without nesting/)
      }
    )

    await t.test(
      'should throw on nested selectors (direct child)',
      async function () {
        assert.throws(function () {
          matches('foo > bar', h(''))
        }, /Error: Expected selector without nesting/)
      }
    )
  })

  await t.test('parent-sensitive pseudo-selectors', async function (t) {
    const simplePseudos = [
      'first-child',
      'first-of-type',
      'last-child',
      'last-of-type',
      'only-child',
      'only-of-type'
    ]
    const functionalPseudos = [
      'nth-child',
      'nth-last-child',
      'nth-of-type',
      'nth-last-of-type'
    ]
    let index = -1

    while (++index < simplePseudos.length) {
      const pseudo = simplePseudos[index]

      await t.test('should throw on `' + pseudo + '`', async function () {
        assert.throws(
          function () {
            matches(':' + pseudo, h(''))
          },
          new RegExp('Error: Cannot use `:' + pseudo + '` without parent')
        )
      })
    }

    index = -1

    while (++index < functionalPseudos.length) {
      const pseudo = functionalPseudos[index]

      await t.test('should throw on `' + pseudo + '()`', async function () {
        assert.throws(function () {
          matches(':' + pseudo + '()', h(''))
        }, /Formula parse error/)
      })
    }
  })

  await t.test('general', async function (t) {
    await t.test('should throw on empty selectors', async function () {
      assert.throws(function () {
        matches('', h())
      }, /Expected rule but end of input reached/)
    })

    await t.test(
      'should throw for a white-space only selector',
      async function () {
        assert.throws(function () {
          matches(' ', h())
        }, /Expected rule but end of input reached/)
      }
    )

    await t.test('should not match w/o a node', async function () {
      assert.ok(!matches('*'))
    })

    await t.test('should not match w/ non-element', async function () {
      assert.ok(!matches('*', {type: 'text', value: 'a'}))
    })
  })

  await t.test('multiple selectors', async function (t) {
    await t.test('should match if one selector matches', async function () {
      assert.ok(matches('b, i', h('b')))
    })

    await t.test('should not match if no selector matches', async function () {
      assert.ok(!matches('i, s', h('b')))
    })
  })

  await t.test('tag-names: `div`, `*`', async function (t) {
    await t.test('should match the wildcard `*`', async function () {
      assert.ok(matches('*', h('')))
    })

    await t.test('should match a tag name', async function () {
      assert.ok(matches('b', h('b')))
    })

    await t.test(
      'should not match if the tag names doesn’t',
      async function () {
        assert.ok(!matches('b', h('i')))
      }
    )
  })

  await t.test('id: `#id`', async function (t) {
    await t.test('should not match if no id exists', async function () {
      assert.ok(!matches('#one', h('')))
    })

    await t.test('should match for matchesing id’s', async function () {
      assert.ok(matches('#one', h('#one')))
    })

    await t.test('should not match for mismatchesed id’s', async function () {
      assert.ok(!matches('#two', h('#one')))
    })

    await t.test(
      'should prefer the last id if multiple id’s are specified (1)',
      async function () {
        assert.ok(matches('#two#one', h('#one')))
      }
    )

    await t.test(
      'should prefer the last id if multiple id’s are specified (2)',
      async function () {
        assert.ok(!matches('#one#two', h('#one')))
      }
    )
  })

  await t.test('class: `.class`', async function (t) {
    await t.test('should not match if no class-name exists', async function () {
      assert.ok(!matches('.one', h('')))
    })

    await t.test('should match for matchesing class-name', async function () {
      assert.ok(matches('.one', h('.one')))
    })

    await t.test(
      'should match when matchesing in multiple class-name',
      async function () {
        assert.ok(matches('.one', h('.one.two')))
      }
    )

    await t.test(
      'should not match if not all class-names exist',
      async function () {
        assert.ok(!matches('.one.two', h('.one')))
      }
    )
  })

  await t.test('attributes, existence: `[attr]`', async function (t) {
    await t.test('should match if attribute exists', async function () {
      assert.ok(matches('[class]', h('.one')))
    })

    await t.test(
      'should not match if attribute does not exist',
      async function () {
        assert.ok(!matches('[for]', h('.one')))
      }
    )

    await t.test('should match if attribute exists (2)', async function () {
      assert.ok(matches('[accesskey]', h('div', {accessKey: ['a']})))
    })

    await t.test('should match if attribute exists (3)', async function () {
      assert.ok(matches('[data-foo]', h('div', {dataFoo: 'bar'})))
    })

    await t.test(
      'should not match if attribute does not exist (2)',
      async function () {
        assert.ok(!matches('[data-bar]', h('div', {dataFoo: 'bar'})))
      }
    )
  })

  await t.test('attributes, equality: `[attr=value]`', async function (t) {
    await t.test(
      'should match if attribute matches (string value)',
      async function () {
        assert.ok(matches('[id=one]', h('#one')))
      }
    )

    await t.test(
      'should match if attribute matches (space-separated list, 1)',
      async function () {
        assert.ok(matches('[class=one]', h('.one')))
      }
    )

    await t.test(
      'should match if attribute matches (space-separated list, 2)',
      async function () {
        assert.ok(matches('[class="one two"]', h('.one.two')))
      }
    )

    await t.test(
      'should match if attribute matches (comma-separated list)',
      async function () {
        assert.ok(
          matches(
            '[accept="audio/*"]',
            h('input', {type: 'file', accept: ['audio/*']})
          )
        )
      }
    )

    await t.test(
      'should match if attribute matches (boolean)',
      async function () {
        assert.ok(matches('[hidden=hidden]', h('div', {hidden: true})))
      }
    )

    await t.test(
      'should match if attribute matches (overloaded boolean, 1)',
      async function () {
        assert.ok(matches('[download=download]', h('a', {download: true})))
      }
    )

    await t.test(
      'should match if attribute matches (overloaded boolean, 2)',
      async function () {
        assert.ok(
          matches('[download="image.png"]', h('a', {download: 'image.png'}))
        )
      }
    )

    await t.test(
      'should match if attribute matches (numeric)',
      async function () {
        assert.ok(matches('[tabindex=-1]', h('div', {tabIndex: -1})))
      }
    )

    await t.test(
      'should match if attribute matches (positive numeric)',
      async function () {
        assert.ok(matches('[minlength=3]', h('input', {minLength: 3})))
      }
    )

    await t.test(
      'should not match if attribute does not matches (string value)',
      async function () {
        assert.ok(!matches('[id=two]', h('#one')))
      }
    )

    await t.test(
      'should not match if attribute does not matches (space-separated list, 1)',
      async function () {
        assert.ok(!matches('[class=two]', h('.one')))
      }
    )

    await t.test(
      'should not match if attribute does not matches (space-separated list, 2)',
      async function () {
        assert.ok(!matches('[class="three four"]', h('.one.two')))
      }
    )

    await t.test(
      'should not match if attribute does not matches (comma-separated list)',
      async function () {
        assert.ok(
          !matches(
            '[accept="image/*"]',
            h('input', {type: 'file', accept: ['audio/*']})
          )
        )
      }
    )

    await t.test(
      'should not match if attribute does not matches (boolean)',
      async function () {
        assert.ok(!matches('[hidden=hidden]', h('div', {hidden: false})))
      }
    )

    await t.test(
      'should not match if attribute does not matches (overloaded boolean, 1)',
      async function () {
        assert.ok(!matches('[download=download]', h('a', {download: false})))
      }
    )

    await t.test(
      'should not match if attribute does not matches (overloaded boolean, 2)',
      async function () {
        assert.ok(
          !matches('[download="image.png"]', h('a', {download: 'photo.png'}))
        )
      }
    )

    await t.test(
      'should not match if attribute does not matches (numeric)',
      async function () {
        assert.ok(!matches('[tabindex=-1]', h('div', {tabIndex: -2})))
      }
    )

    await t.test(
      'should not match if attribute does not matches (positive numeric)',
      async function () {
        assert.ok(!matches('[minlength=3]', h('input', {minLength: 2})))
      }
    )
  })

  await t.test('attributes, begins: `[attr^=value]`', async function (t) {
    await t.test(
      'should match if attribute matches (string value)',
      async function () {
        assert.ok(matches('[id^=one]', h('#one')))
      }
    )

    await t.test(
      'should match if attribute starts with (string value)',
      async function () {
        assert.ok(matches('[id^=on]', h('#one')))
      }
    )

    await t.test(
      'should match if attribute starts with (space-separated list)',
      async function () {
        assert.ok(matches('[class^=one]', h('.one.two')))
      }
    )

    await t.test(
      'should match if attribute starts with (comma-separated list)',
      async function () {
        assert.ok(
          matches(
            '[accept^=audio]',
            h('input', {type: 'file', accept: ['audio/*']})
          )
        )
      }
    )

    await t.test(
      'should match if attribute starts with (boolean)',
      async function () {
        assert.ok(matches('[hidden^=hid]', h('div', {hidden: true})))
      }
    )

    await t.test(
      'should match if attribute starts with (overloaded boolean)',
      async function () {
        assert.ok(matches('[download^=down]', h('a', {download: true})))
      }
    )

    await t.test(
      'should match if attribute starts with (overloaded boolean, 2)',
      async function () {
        assert.ok(matches('[download^=ima]', h('a', {download: 'image.png'})))
      }
    )

    await t.test(
      'should match if attribute starts with (numeric)',
      async function () {
        assert.ok(matches('[tabindex^=-]', h('div', {tabIndex: -1})))
      }
    )

    await t.test(
      'should match if attribute starts with (positive numeric)',
      async function () {
        assert.ok(matches('[minlength^=1]', h('input', {minLength: 10})))
      }
    )

    await t.test(
      'should not match if attribute does not start with (string value)',
      async function () {
        assert.ok(!matches('[id^=t]', h('#one')))
      }
    )

    await t.test(
      'should not match if attribute does not start with (space-separated list)',
      async function () {
        assert.ok(!matches('[class^=t]', h('.one')))
      }
    )

    await t.test(
      'should not match if attribute does not start with (comma-separated list)',
      async function () {
        assert.ok(
          !matches(
            '[accept^=video]',
            h('input', {type: 'file', accept: ['audio/*']})
          )
        )
      }
    )

    await t.test(
      'should not match if attribute does not start with (boolean)',
      async function () {
        assert.ok(!matches('[hidden^=hid]', h('div', {hidden: false})))
      }
    )

    await t.test(
      'should not match if attribute does not start with (overloaded boolean, 1)',
      async function () {
        assert.ok(!matches('[download^=down]', h('a', {download: false})))
      }
    )

    await t.test(
      'should not match if attribute does not start with (overloaded boolean, 2)',
      async function () {
        assert.ok(
          !matches('[download^=image]', h('a', {download: 'photo.png'}))
        )
      }
    )

    await t.test(
      'should not match if attribute does not start with (numeric)',
      async function () {
        assert.ok(!matches('[tabindex^=-]', h('div', {tabIndex: 2})))
      }
    )

    await t.test(
      'should not match if attribute does not start with (positive numeric)',
      async function () {
        assert.ok(!matches('[minlength^=1]', h('input', {minLength: 2})))
      }
    )
  })

  await t.test('attributes, ends: `[attr$=value]`', async function (t) {
    await t.test(
      'should match if attribute matches (string value)',
      async function () {
        assert.ok(matches('[id$=one]', h('#one')))
      }
    )

    await t.test(
      'should match if attribute ends with (string value)',
      async function () {
        assert.ok(matches('[id$=ne]', h('#one')))
      }
    )

    await t.test(
      'should match if attribute ends with (space-separated list)',
      async function () {
        assert.ok(matches('[class$=wo]', h('.one.two')))
      }
    )

    await t.test(
      'should match if attribute ends with (comma-separated list)',
      async function () {
        assert.ok(
          matches(
            '[accept$="*"]',
            h('input', {type: 'file', accept: ['audio/*']})
          )
        )
      }
    )

    await t.test(
      'should match if attribute ends with (boolean)',
      async function () {
        assert.ok(matches('[hidden$=den]', h('div', {hidden: true})))
      }
    )

    await t.test(
      'should match if attribute ends with (overloaded boolean)',
      async function () {
        assert.ok(matches('[download$=load]', h('a', {download: true})))
      }
    )

    await t.test(
      'should match if attribute ends with (overloaded boolean, 2)',
      async function () {
        assert.ok(matches('[download$=png]', h('a', {download: 'image.png'})))
      }
    )

    await t.test(
      'should match if attribute ends with (numeric)',
      async function () {
        assert.ok(matches('[tabindex$=1]', h('div', {tabIndex: -1})))
      }
    )

    await t.test(
      'should match if attribute ends with (positive numeric)',
      async function () {
        assert.ok(matches('[minlength$=0]', h('input', {minLength: 10})))
      }
    )

    await t.test(
      'should not match if attribute does not end with (string value)',
      async function () {
        assert.ok(!matches('[id$=wo]', h('#one')))
      }
    )

    await t.test(
      'should not match if attribute does not end with (space-separated list)',
      async function () {
        assert.ok(!matches('[class$=wo]', h('.one')))
      }
    )

    await t.test(
      'should not match if attribute does not end with (comma-separated list)',
      async function () {
        assert.ok(
          !matches(
            '[accept$=doc]',
            h('input', {type: 'file', accept: ['audio/*']})
          )
        )
      }
    )

    await t.test(
      'should not match if attribute does not end with (boolean)',
      async function () {
        assert.ok(!matches('[hidden$=den]', h('div', {hidden: false})))
      }
    )

    await t.test(
      'should not match if attribute does not end with (overloaded boolean, 1)',
      async function () {
        assert.ok(!matches('[download$=load]', h('a', {download: false})))
      }
    )

    await t.test(
      'should not match if attribute does not end with (overloaded boolean, 2)',
      async function () {
        assert.ok(!matches('[download$=jpg]', h('a', {download: 'photo.png'})))
      }
    )

    await t.test(
      'should not match if attribute does not end with (numeric)',
      async function () {
        assert.ok(!matches('[tabindex$=2]', h('div', {tabIndex: -1})))
      }
    )

    await t.test(
      'should not match if attribute does not start with (positive numeric)',
      async function () {
        assert.ok(!matches('[minlength$=1]', h('input', {minLength: 2})))
      }
    )
  })

  await t.test('attributes, contains: `[attr*=value]`', async function (t) {
    await t.test(
      'should match if attribute matches (string value)',
      async function () {
        assert.ok(matches('[id*=one]', h('#one')))
      }
    )

    await t.test(
      'should match if attribute contains (string value)',
      async function () {
        assert.ok(matches('[id*=n]', h('#one')))
      }
    )

    await t.test(
      'should match if attribute contains (space-separated list)',
      async function () {
        assert.ok(matches('[class*=w]', h('.one.two')))
      }
    )

    await t.test(
      'should match if attribute contains (comma-separated list)',
      async function () {
        assert.ok(
          matches(
            '[accept*="audio/*"]',
            h('input', {type: 'file', accept: ['audio/*']})
          )
        )
      }
    )

    await t.test(
      'should match if attribute contains (boolean)',
      async function () {
        assert.ok(matches('[hidden*=dd]', h('div', {hidden: true})))
      }
    )

    await t.test(
      'should match if attribute contains (overloaded boolean)',
      async function () {
        assert.ok(matches('[download*=nl]', h('a', {download: true})))
      }
    )

    await t.test(
      'should match if attribute contains (overloaded boolean, 2)',
      async function () {
        assert.ok(matches('[download*=age]', h('a', {download: 'image.png'})))
      }
    )

    await t.test(
      'should match if attribute contains (numeric)',
      async function () {
        assert.ok(matches('[tabindex*=1]', h('div', {tabIndex: -12})))
      }
    )

    await t.test(
      'should match if attribute contains (positive numeric)',
      async function () {
        assert.ok(matches('[minlength*=0]', h('input', {minLength: 102})))
      }
    )

    await t.test(
      'should not match if attribute does not contain (string value)',
      async function () {
        assert.ok(!matches('[id*=w]', h('#one')))
      }
    )

    await t.test(
      'should not match if attribute does not contain (space-separated list)',
      async function () {
        assert.ok(!matches('[class*=w]', h('.one')))
      }
    )

    await t.test(
      'should not match if attribute does not contain (comma-separated list)',
      async function () {
        assert.ok(
          !matches(
            '[accept*="video/*"]',
            h('input', {type: 'file', accept: ['audio/*']})
          )
        )
      }
    )

    await t.test(
      'should not match if attribute does not contain (boolean)',
      async function () {
        assert.ok(!matches('[hidden*=dd]', h('div', {hidden: false})))
      }
    )

    await t.test(
      'should not match if attribute does not contain (overloaded boolean, 1)',
      async function () {
        assert.ok(!matches('[download*=nl]', h('a', {download: false})))
      }
    )

    await t.test(
      'should not match if attribute does not contain (overloaded boolean, 2)',
      async function () {
        assert.ok(!matches('[download*=age]', h('a', {download: 'photo.png'})))
      }
    )

    await t.test(
      'should not match if attribute does not contain (numeric)',
      async function () {
        assert.ok(!matches('[tabindex*=3]', h('div', {tabIndex: -12})))
      }
    )

    await t.test(
      'should not match if attribute does not contain (positive numeric)',
      async function () {
        assert.ok(!matches('[minlength*=3]', h('input', {minLength: 102})))
      }
    )
  })

  await t.test(
    'attributes, contains in space-separated list: `[attr~=value]`',
    async function (t) {
      await t.test(
        'should match if attribute matches (string value)',
        async function () {
          assert.ok(matches('[id~=one]', h('#one')))
        }
      )

      await t.test(
        'should match if attribute matches (space-separated list, 1)',
        async function () {
          assert.ok(matches('[class~=one]', h('.one')))
        }
      )

      await t.test(
        'should match if attribute matches (space-separated list, 2)',
        async function () {
          assert.ok(matches('[class~="one two"]', h('.one.two')))
        }
      )

      await t.test(
        'should match if attribute matches (comma-separated list)',
        async function () {
          assert.ok(
            matches(
              '[accept~="audio/*"]',
              h('input', {type: 'file', accept: ['audio/*']})
            )
          )
        }
      )

      await t.test(
        'should match if attribute matches (boolean)',
        async function () {
          assert.ok(matches('[hidden~=hidden]', h('div', {hidden: true})))
        }
      )

      await t.test(
        'should match if attribute matches (overloaded boolean, 1)',
        async function () {
          assert.ok(matches('[download~=download]', h('a', {download: true})))
        }
      )

      await t.test(
        'should match if attribute matches (overloaded boolean, 2)',
        async function () {
          assert.ok(
            matches('[download~="image.png"]', h('a', {download: 'image.png'}))
          )
        }
      )

      await t.test(
        'should match if attribute matches (numeric)',
        async function () {
          assert.ok(matches('[tabindex~=-1]', h('div', {tabIndex: -1})))
        }
      )

      await t.test(
        'should match if attribute matches (positive numeric)',
        async function () {
          assert.ok(matches('[minlength~=3]', h('input', {minLength: 3})))
        }
      )

      await t.test(
        'should not match if attribute does not matches (string value)',
        async function () {
          assert.ok(!matches('[id~=two]', h('#one')))
        }
      )

      await t.test(
        'should not match if attribute does not matches (space-separated list, 1)',
        async function () {
          assert.ok(!matches('[class~=two]', h('.one')))
        }
      )

      await t.test(
        'should not match if attribute does not matches (space-separated list, 2)',
        async function () {
          assert.ok(!matches('[class~="three four"]', h('.one.two')))
        }
      )

      await t.test(
        'should not match if attribute does not matches (comma-separated list)',
        async function () {
          assert.ok(
            !matches(
              '[accept~="video/*"]',
              h('input', {type: 'file', accept: ['audio/*']})
            )
          )
        }
      )

      await t.test(
        'should not match if attribute does not matches (boolean)',
        async function () {
          assert.ok(!matches('[hidden~=hidden]', h('div', {hidden: false})))
        }
      )

      await t.test(
        'should not match if attribute does not matches (overloaded boolean, 1)',
        async function () {
          assert.ok(!matches('[download~=download]', h('a', {download: false})))
        }
      )

      await t.test(
        'should not match if attribute does not matches (overloaded boolean, 2)',
        async function () {
          assert.ok(
            !matches('[download~="image.png"]', h('a', {download: 'photo.png'}))
          )
        }
      )

      await t.test(
        'should not match if attribute does not matches (numeric)',
        async function () {
          assert.ok(!matches('[tabindex~=-1]', h('div', {tabIndex: -2})))
        }
      )

      await t.test(
        'should not match if attribute does not matches (positive numeric)',
        async function () {
          assert.ok(!matches('[minlength~=3]', h('input', {minLength: 2})))
        }
      )

      await t.test(
        'should match if attribute part exists (space-separated list, 1)',
        async function () {
          assert.ok(matches('[class~=one]', h('.one.two')))
        }
      )

      await t.test(
        'should match if attribute part exists (space-separated list, 2)',
        async function () {
          assert.ok(matches('[class~=two]', h('.one.two')))
        }
      )

      await t.test(
        'should not match if attribute part does not exist (space-separated list)',
        async function () {
          assert.ok(!matches('[class~=three]', h('.one.two')))
        }
      )
    }
  )

  await t.test(
    'attributes, starts or prefixes: `[attr|=value]`',
    async function (t) {
      await t.test(
        'should match if attribute matches (string value)',
        async function () {
          assert.ok(matches('[id|=one]', h('#one')))
        }
      )

      await t.test(
        'should match if attribute matches (space-separated list, 1)',
        async function () {
          assert.ok(matches('[class|=one]', h('.one')))
        }
      )

      await t.test(
        'should match if attribute matches (space-separated list, 2)',
        async function () {
          assert.ok(matches('[class|="one two"]', h('.one.two')))
        }
      )

      await t.test(
        'should match if attribute matches (comma-separated list)',
        async function () {
          assert.ok(
            matches(
              '[accept|="audio/*"]',
              h('input', {type: 'file', accept: ['audio/*']})
            )
          )
        }
      )

      await t.test(
        'should match if attribute matches (boolean)',
        async function () {
          assert.ok(matches('[hidden|=hidden]', h('div', {hidden: true})))
        }
      )

      await t.test(
        'should match if attribute matches (overloaded boolean, 1)',
        async function () {
          assert.ok(matches('[download|=download]', h('a', {download: true})))
        }
      )

      await t.test(
        'should match if attribute matches (overloaded boolean, 2)',
        async function () {
          assert.ok(
            matches('[download|="image.png"]', h('a', {download: 'image.png'}))
          )
        }
      )

      await t.test(
        'should match if attribute matches (numeric)',
        async function () {
          assert.ok(matches('[tabindex|=-1]', h('div', {tabIndex: -1})))
        }
      )

      await t.test(
        'should match if attribute matches (positive numeric)',
        async function () {
          assert.ok(matches('[minlength|=3]', h('input', {minLength: 3})))
        }
      )

      await t.test(
        'should not match if attribute does not matches (string value)',
        async function () {
          assert.ok(!matches('[id|=two]', h('#one')))
        }
      )

      await t.test(
        'should not match if attribute does not matches (space-separated list, 1)',
        async function () {
          assert.ok(!matches('[class|=two]', h('.one')))
        }
      )

      await t.test(
        'should not match if attribute does not matches (space-separated list, 2)',
        async function () {
          assert.ok(!matches('[class|="three four"]', h('.one.two')))
        }
      )

      await t.test(
        'should not match if attribute does not matches (comma-separated list)',
        async function () {
          assert.ok(
            !matches(
              '[accept|="video/*"]',
              h('input', {type: 'file', accept: ['audio/*']})
            )
          )
        }
      )

      await t.test(
        'should not match if attribute does not matches (boolean)',
        async function () {
          assert.ok(!matches('[hidden|=hidden]', h('div', {hidden: false})))
        }
      )

      await t.test(
        'should not match if attribute does not matches (overloaded boolean, 1)',
        async function () {
          assert.ok(!matches('[download|=download]', h('a', {download: false})))
        }
      )

      await t.test(
        'should not match if attribute does not matches (overloaded boolean, 2)',
        async function () {
          assert.ok(
            !matches('[download|="image.png"]', h('a', {download: 'photo.png'}))
          )
        }
      )

      await t.test(
        'should not match if attribute does not matches (numeric)',
        async function () {
          assert.ok(!matches('[tabindex|=-1]', h('div', {tabIndex: -2})))
        }
      )

      await t.test(
        'should not match if attribute does not matches (positive numeric)',
        async function () {
          assert.ok(!matches('[minlength|=3]', h('input', {minLength: 2})))
        }
      )

      await t.test('should match if value starts with', async function () {
        assert.ok(matches('[alpha|=bravo]', h('div', {alpha: 'bravo'})))
      })

      await t.test('should match if value prefixes', async function () {
        assert.ok(matches('[alpha|=bravo]', h('div', {alpha: 'bravo-charlie'})))
      })

      await t.test(
        'should not match if value does not prefix',
        async function () {
          assert.ok(
            !matches('[alpha|=bravo]', h('div', {alpha: 'bravocharlie'}))
          )
        }
      )

      await t.test(
        'should not match if value does start with',
        async function () {
          assert.ok(!matches('[alpha|=charlie]', h('div', {alpha: 'bravo'})))
        }
      )
    }
  )

  await t.test('pseudo-classes', async function (t) {
    await t.test(':is()', async function (t) {
      await t.test('should match if any matches (type)', async function () {
        assert.ok(matches(':is(a, [title], .class)', h('a')))
      })

      await t.test('should match if any matches (.class)', async function () {
        assert.ok(matches(':is(a, [title], .class)', h('.class')))
      })

      await t.test(
        'should match if any matches (attribute existence)',
        async function () {
          assert.ok(matches(':is(a, [title], .class)', h('div', {title: '1'})))
        }
      )

      await t.test('should not match if nothing matches', async function () {
        assert.ok(!matches(':is(a, [title], .class)', h('i')))
      })

      await t.test('should not match if children match', async function () {
        assert.ok(!matches(':is(a, [title], .class)', h('div', h('i.class'))))
      })
    })

    await t.test(':not()', async function (t) {
      await t.test('should not match if any matches (type)', async function () {
        assert.ok(!matches(':not(a, [title], .class)', h('a')))
      })

      await t.test(
        'should not match if any matches (.class)',
        async function () {
          assert.ok(!matches(':not(a, [title], .class)', h('.class')))
        }
      )

      await t.test(
        'should not match if any matches (attribute existence)',
        async function () {
          assert.ok(
            !matches(':not(a, [title], .class)', h('div', {title: '1'}))
          )
        }
      )

      await t.test('should match if nothing matches', async function () {
        assert.ok(matches(':not(a, [title], .class)', h('i')))
      })

      await t.test('should match if children match', async function () {
        assert.ok(matches(':not(a, [title], .class)', h('div', h('i.class'))))
      })
    })

    await t.test(':has', async function (t) {
      await t.test('should throw on empty selectors', async function () {
        assert.throws(function () {
          matches('a:not(:has())', h('p'))
        }, /Expected rule but "\)" found/)
      })

      await t.test('should throw on empty selectors', async function () {
        assert.throws(function () {
          matches('a:has()', h('p'))
        }, /Expected rule but "\)" found/)
      })

      await t.test(
        'should not match the scope element (#1)',
        async function () {
          assert.ok(!matches('p:has(p)', h('p', h('s'))))
        }
      )

      await t.test(
        'should not match the scope element (#2)',
        async function () {
          assert.ok(matches('p:has(p)', h('p', h('p'))))
        }
      )

      await t.test(
        'should match if children match the descendant selector',
        async function () {
          assert.ok(matches('a:has(img)', h('a', h('img'))))
        }
      )

      await t.test(
        'should not match if no children match the descendant selector',
        async function () {
          assert.ok(!matches('a:has(img)', h('a', h('span'))))
        }
      )

      await t.test(
        'should match if descendants match the descendant selector',
        async function () {
          assert.ok(matches('a:has(img)', h('a', h('span'), h('img'))))
        }
      )

      await t.test(
        'should not match if no descendants match the descendant selector',
        async function () {
          assert.ok(!matches('a:has(img)', h('a', h('span', h('span')))))
        }
      )

      await t.test(
        'should support a nested next-sibling selector (#1)',
        async function () {
          assert.ok(matches('dd:has(dt + dd)', h('dd', [h('dt'), h('dd')])))
        }
      )

      await t.test(
        'should support a nested next-sibling selector (#2)',
        async function () {
          assert.ok(!matches('dd:has(dt + dd)', h('dd', [h('dt'), h('dt')])))
        }
      )

      await t.test(
        'should add `:scope` to sub-selectors (#1)',
        async function () {
          assert.ok(matches('a:has([title])', h('a', h('s', {title: 'a'}))))
        }
      )

      await t.test(
        'should add `:scope` to sub-selectors (#2)',
        async function () {
          assert.ok(!matches('a:has([title])', h('a', {title: '!'}, h('s'))))
        }
      )

      await t.test(
        'should add `:scope` to all sub-selectors (#2)',
        async function () {
          assert.ok(!matches('a:has(a, :scope i)', h('a', h('s'))))
        }
      )

      await t.test(
        'should add `:scope` to all sub-selectors (#3)',
        async function () {
          assert.ok(
            matches(
              'section:not(:has(h1, h2, h3, h4, h5, h6))',
              h('section', [])
            )
          )
        }
      )

      await t.test(
        'should add `:scope` to all sub-selectors (#4)',
        async function () {
          assert.ok(
            matches(
              'section:not(:has(h1, h2, h3, h4, h5, h6))',
              h('section', [h('p', '!')])
            )
          )
        }
      )

      await t.test('should ignore commas in parens (#1)', async function () {
        assert.ok(
          !matches(
            'section:has(:lang(en, fr))',
            h('section', [h('q', {lang: 'de'})])
          )
        )
      })

      await t.test('should ignore commas in parens (#2)', async function () {
        assert.ok(
          matches(
            'section:has(:lang(en, fr))',
            h('section', [h('q', {lang: 'en'})])
          )
        )
      })

      await t.test(
        'should support multiple relative selectors (#1)',
        async function () {
          assert.ok(
            !matches('section:has(:is(i), :is(b))', h('section', [h('s')]))
          )
        }
      )

      await t.test(
        'should support multiple relative selectors (#2)',
        async function () {
          assert.ok(
            matches('section:has(:is(i), :is(b))', h('section', [h('b')]))
          )
        }
      )

      // These check white space.

      await t.test('should match w/o whitespace (#1)', async function () {
        assert.ok(matches('a:has( img)', h('a', h('img'))))
      })

      await t.test('should match w/o whitespace (#2)', async function () {
        assert.ok(matches('a:has( img  )', h('a', h('img'))))
      })

      await t.test('should match w/o whitespace (#3)', async function () {
        assert.ok(matches('a:has(img )', h('a', h('img'))))
      })

      await t.test('should match w/o whitespace (#4)', async function () {
        assert.ok(matches('a:has( img  ,\t p )', h('a', h('img'))))
      })

      // To do: add `:has(>)`.
      // Note: These should be uncommented, but that’s not supported by the CSS
      // parser:
      // await t.test(
      //   'should match for relative direct child selector',
      //   async function () {
      //     assert.ok(matches('a:has(> img)', h('a', h('img'))))
      //   }
      // )

      // await t.test(
      //   'should not match for relative direct child selectors',
      //   async function () {
      //     assert.ok(!matches('a:has(> img)', h('a', h('span', h('img')))))
      //   }
      // )

      // await t.test(
      //   'should support a list of relative selectors',
      //   async function () {
      //     assert.ok(
      //       matches('a:has(> img, > span)', h('a', h('span', h('span'))))
      //     )
      //   }
      // )
    })

    await t.test(':any-link', async function (t) {
      const links = ['a', 'area', 'link']
      let index = -1

      while (++index < links.length) {
        const name = links[index]

        await t.test('should match if w/ href on ' + name, async function () {
          assert.ok(matches(':any-link', h(name, {href: '#'})))
        })

        await t.test(
          'should not match if w/o href on ' + name,
          async function () {
            assert.ok(!matches(':any-link', h(name)))
          }
        )
      }
    })

    await t.test(':checked', async function (t) {
      await t.test(
        'should match for checkbox inputs w/ `checked`',
        async function () {
          assert.ok(
            matches(':checked', h('input', {type: 'checkbox', checked: true}))
          )
        }
      )

      await t.test(
        'should match for radio inputs w/ `checked`',
        async function () {
          assert.ok(
            matches(':checked', h('input', {type: 'radio', checked: true}))
          )
        }
      )

      await t.test(
        'should match for checkbox menuitems w/ `checked`',
        async function () {
          assert.ok(
            matches(
              ':checked',
              h('menuitem', {type: 'checkbox', checked: true})
            )
          )
        }
      )

      await t.test(
        'should match for radio menuitems w/ `checked`',
        async function () {
          assert.ok(
            matches(':checked', h('menuitem', {type: 'radio', checked: true}))
          )
        }
      )

      await t.test('should match for options w/ `selected`', async function () {
        assert.ok(matches(':checked', h('option', {selected: true})))
      })

      await t.test(
        'should not match for checkbox inputs w/o `checked`',
        async function () {
          assert.ok(
            !matches(':checked', h('input', {type: 'checkbox', checked: false}))
          )
        }
      )

      await t.test(
        'should not match for radio inputs w/o `checked`',
        async function () {
          assert.ok(
            !matches(':checked', h('input', {type: 'radio', checked: false}))
          )
        }
      )

      await t.test(
        'should not match for checkbox menuitems w/o `checked`',
        async function () {
          assert.ok(
            !matches(
              ':checked',
              h('menuitem', {type: 'checkbox', checked: false})
            )
          )
        }
      )

      await t.test(
        'should not match for radio menuitems w/o `checked`',
        async function () {
          assert.ok(
            !matches(':checked', h('menuitem', {type: 'radio', checked: false}))
          )
        }
      )

      await t.test(
        'should not match for options w/o `selected`',
        async function () {
          assert.ok(!matches(':checked', h('option', {selected: false})))
        }
      )

      await t.test('should not match for other nodes', async function () {
        assert.ok(!matches(':checked', h('')))
      })
    })

    await t.test(':disabled', async function (t) {
      const things = [
        'button',
        'input',
        'select',
        'textarea',
        'optgroup',
        'option',
        'menuitem',
        'fieldset'
      ]
      let index = -1

      while (++index < things.length) {
        const name = things[index]

        await t.test(
          'should match if w/ disabled on ' + name,
          async function () {
            assert.ok(matches(':disabled', h(name, {disabled: true})))
          }
        )

        await t.test(
          'should not match if w/o disabled on ' + name,
          async function () {
            assert.ok(!matches(':disabled', h(name)))
          }
        )
      }
    })

    await t.test(':enabled', async function (t) {
      const things = [
        'button',
        'input',
        'select',
        'textarea',
        'optgroup',
        'option',
        'menuitem',
        'fieldset'
      ]
      let index = -1

      while (++index < things.length) {
        const name = things[index]

        await t.test(
          'should match if w/o disabled on ' + name,
          async function () {
            assert.ok(matches(':enabled', h(name)))
          }
        )

        await t.test(
          'should not match if w/ disabled on ' + name,
          async function () {
            assert.ok(!matches(':enabled', h(name, {disabled: true})))
          }
        )
      }
    })

    await t.test(':required', async function (t) {
      const things = ['input', 'textarea', 'select']
      let index = -1

      while (++index < things.length) {
        const name = things[index]

        await t.test(
          'should match if w/ required on ' + name,
          async function () {
            assert.ok(matches(':required', h(name, {required: true})))
          }
        )

        await t.test(
          'should not match if w/o required on ' + name,
          async function () {
            assert.ok(!matches(':required', h(name)))
          }
        )
      }
    })

    await t.test(':optional', async function (t) {
      const things = ['input', 'textarea', 'select']

      let index = -1

      while (++index < things.length) {
        const name = things[index]

        await t.test(
          'should match if w/o required on ' + name,
          async function () {
            assert.ok(matches(':optional', h(name)))
          }
        )

        await t.test(
          'should not match if w/ required on ' + name,
          async function () {
            assert.ok(!matches(':optional', h(name, {required: true})))
          }
        )
      }
    })

    await t.test(':empty', async function (t) {
      await t.test('should match if w/o children', async function () {
        assert.ok(matches(':empty', h('')))
      })

      await t.test('should match if w/o elements or texts', async function () {
        assert.ok(matches(':empty', h('', u('comment', '?'))))
      })

      await t.test('should not match if w/ elements', async function () {
        assert.ok(!matches(':empty', h('', h(''))))
      })

      await t.test('should not match if w/ text', async function () {
        assert.ok(!matches(':empty', h('', u('text', '.'))))
      })

      await t.test(
        'should not match if w/ white-space text',
        async function () {
          assert.ok(!matches(':empty', h('', u('text', ' '))))
        }
      )
    })

    await t.test(':blank', async function (t) {
      await t.test('should match if w/o children', async function () {
        assert.ok(matches(':blank', h('')))
      })

      await t.test('should match if w/o elements or texts', async function () {
        assert.ok(matches(':blank', h('', u('comment', '?'))))
      })

      await t.test('should match if w/ white-space text', async function () {
        assert.ok(matches(':blank', h('', u('text', ' '))))
      })

      await t.test('should not match if w/ elements', async function () {
        assert.ok(!matches(':blank', h('', h(''))))
      })

      await t.test('should not match if w/ text', async function () {
        assert.ok(!matches(':blank', h('', u('text', '.'))))
      })
    })

    await t.test(':lang()', async function (t) {
      await t.test(
        'should match if the element has an `xml:lang` attribute',
        async function () {
          assert.ok(matches(':lang(de, en)', h('html', {xmlLang: 'en'})))
        }
      )

      await t.test(
        'should match if the element has a `lang` attribute',
        async function () {
          assert.ok(matches(':lang(de, en)', h('html', {lang: 'de'})))
        }
      )

      await t.test(
        'should not match if the element has an different language set',
        async function () {
          assert.ok(!matches(':lang(de, en)', h('html', {xmlLang: 'jp'})))
        }
      )

      await t.test(
        'should prefer `xmlLang` over `lang` (#1)',
        async function () {
          assert.ok(
            !matches(':lang(de, en)', h('html', {xmlLang: 'jp', lang: 'de'}))
          )
        }
      )

      await t.test(
        'should prefer `xmlLang` over `lang` (#2)',
        async function () {
          assert.ok(
            matches(':lang(de, en)', h('html', {xmlLang: 'de', lang: 'jp'}))
          )
        }
      )

      await t.test(
        'should not match if the element has an different language set',
        async function () {
          assert.ok(!matches(':lang(de, en)', h('html', {xmlLang: 'jp'})))
        }
      )

      await t.test('should support wildcards', async function () {
        assert.ok(matches(':lang(*)', h('html', {lang: 'en'})))
      })

      await t.test(
        'should not match if [lang] is an empty string (means unknown language)',
        async function () {
          assert.ok(!matches(':lang(en)', h('html', {lang: ''})))
        }
      )

      await t.test(
        'should not match with wildcard if [lang] is an empty string (means unknown language)',
        async function () {
          assert.ok(!matches(':lang(*)', h('html', {lang: ''})))
        }
      )

      await t.test(
        'should support non-primary wildcard subtags (#1)',
        async function () {
          assert.ok(matches(':lang(de-*-DE)', h('html', {lang: 'de-Latn-DE'})))
        }
      )

      await t.test(
        'should support non-primary wildcard subtags (#2)',
        async function () {
          assert.ok(
            matches(':lang(fr-BE, de-*-DE)', h('html', {lang: 'de-Latn-DE'}))
          )
        }
      )
    })

    await t.test(':dir()', async function (t) {
      const ltr = 'a'
      const rtl = 'أ'
      const neutral = '!'

      await t.test(
        'should match `ltr` if the element has a matching explicit `dir` attribute',
        async function () {
          assert.ok(matches(':dir(ltr)', h('html', {dir: 'ltr'})))
        }
      )

      await t.test(
        'should match `rtl` if the element has a matching explicit `dir` attribute',
        async function () {
          assert.ok(matches(':dir(rtl)', h('html', {dir: 'rtl'})))
        }
      )

      await t.test(
        'should match `ltr` if the element is `html` with no `dir` attribute',
        async function () {
          assert.ok(matches(':dir(ltr)', h('html')))
        }
      )

      await t.test(
        'should match `ltr` if the element is `html` with an invalid `dir` attribute',
        async function () {
          assert.ok(matches(':dir(ltr)', h('html', {dir: 'foo'})))
        }
      )

      await t.test(
        'should match `ltr` if the element is `input[type=tel]` with no `dir` attribute',
        async function () {
          assert.ok(matches(':dir(ltr)', h('input', {type: 'tel'})))
        }
      )

      await t.test(
        'should match `ltr` if the element is `input[type=tel]` with an invalid `dir` attribute',
        async function () {
          assert.ok(matches(':dir(ltr)', h('input', {type: 'tel', dir: 'foo'})))
        }
      )

      await t.test(
        'should match `ltr` if `[dir=auto]` on a textarea and it’s content is BIDI LTR',
        async function () {
          assert.ok(matches(':dir(ltr)', h('textarea', {dir: 'auto'}, ltr)))
        }
      )

      await t.test(
        'should match `rtl` if `[dir=auto]` on a textarea and it’s content is BIDI RTL',
        async function () {
          assert.ok(matches(':dir(rtl)', h('textarea', {dir: 'auto'}, rtl)))
        }
      )

      await t.test(
        'should match `ltr` if `[dir=auto]` on a textarea and it’s content is BIDI neutral',
        async function () {
          assert.ok(matches(':dir(ltr)', h('textarea', {dir: 'auto'}, neutral)))
        }
      )

      await t.test(
        'should match `ltr` if `[dir=auto]` on a text input and it’s value is BIDI LTR',
        async function () {
          assert.ok(matches(':dir(ltr)', h('input', {dir: 'auto', value: ltr})))
        }
      )

      await t.test(
        'should match `rtl` if `[dir=auto]` on a search input and it’s value is BIDI RTL',
        async function () {
          assert.ok(
            matches(
              ':dir(rtl)',
              h('input', {type: 'search', dir: 'auto', value: rtl})
            )
          )
        }
      )

      await t.test(
        'should match `ltr` if `[dir=auto]` on a URL input and it’s value is BIDI neutral',
        async function () {
          assert.ok(
            matches(
              ':dir(ltr)',
              h('input', {type: 'url', dir: 'auto', value: neutral})
            )
          )
        }
      )

      await t.test(
        'should match `ltr` if `[dir=auto]` on an email input without value',
        async function () {
          assert.ok(
            matches(':dir(ltr)', h('input', {type: 'email', dir: 'auto'}))
          )
        }
      )

      await t.test(
        'should match `ltr` if `[dir=auto]` and the element has BIDI LTR text',
        async function () {
          assert.ok(matches(':dir(ltr)', h('p', {dir: 'auto'}, ltr)))
        }
      )

      await t.test(
        'should match `rtl` if `[dir=auto]` and the element has BIDI RTL text',
        async function () {
          assert.ok(matches(':dir(rtl)', h('p', {dir: 'auto'}, rtl)))
        }
      )

      await t.test(
        'should match `ltr` if `[dir=auto]` and the element has BIDI neutral text',
        async function () {
          assert.ok(matches(':dir(ltr)', h('p', {dir: 'auto'}, neutral)))
        }
      )

      await t.test(
        'should match `ltr` if `[dir=auto]` and the element has BIDI neutral text followed by LTR text',
        async function () {
          assert.ok(
            matches(':dir(ltr)', h('p', {dir: 'auto'}, [neutral, ltr, rtl]))
          )
        }
      )

      await t.test(
        'should match `rtl` if `[dir=auto]` and the element has BIDI neutral text followed by RTL text',
        async function () {
          assert.ok(
            matches(':dir(rtl)', h('p', {dir: 'auto'}, [neutral, rtl, ltr]))
          )
        }
      )

      await t.test(
        'should match `ltr` if `[dir=auto]`, ignoring BIDI text in scripts, followed by LTR text',
        async function () {
          assert.ok(
            matches(
              ':dir(ltr)',
              h('p', {dir: 'auto'}, [neutral, h('script', rtl), ltr])
            )
          )
        }
      )

      await t.test(
        'should match `rtl` if `[dir=auto]`, ignoring BIDI text in styles, followed by RTL text',
        async function () {
          assert.ok(
            matches(
              ':dir(rtl)',
              h('p', {dir: 'auto'}, [neutral, h('style', ltr), rtl])
            )
          )
        }
      )

      await t.test(
        'should match `ltr` if `[dir=auto]`, ignoring elements with directions, followed by LTR text',
        async function () {
          assert.ok(
            matches(
              ':dir(ltr)',
              h('p', {dir: 'auto'}, [
                neutral,
                h('span', {dir: 'rtl'}, rtl),
                ltr
              ])
            )
          )
        }
      )

      await t.test(
        'should match `rtl` if `[dir=auto]`, ignoring elements with directions, followed by RTL text',
        async function () {
          assert.ok(
            matches(
              ':dir(rtl)',
              h('p', {dir: 'auto'}, [
                neutral,
                h('span', {dir: 'ltr'}, ltr),
                rtl
              ])
            )
          )
        }
      )

      await t.test(
        'should match `ltr` on `bdi` elements, ignoring elements with directions, followed by LTR text',
        async function () {
          assert.ok(
            matches(
              ':dir(ltr)',
              h('bdi', [neutral, h('span', {dir: 'rtl'}, rtl), ltr])
            )
          )
        }
      )

      await t.test(
        'should match `rtl` on `bdi` elements, ignoring elements with directions, followed by RTL text',
        async function () {
          assert.ok(
            matches(
              ':dir(rtl)',
              h('bdi', [neutral, h('span', {dir: 'ltr'}, ltr), rtl])
            )
          )
        }
      )
    })

    await t.test(':root', async function (t) {
      await t.test('should match if `<html>` in HTML space', async function () {
        assert.ok(matches(':root', h('html')))
      })

      await t.test(
        'should not match if not `<html>` in HTML space',
        async function () {
          assert.ok(!matches(':root', h('div')))
        }
      )

      await t.test('should match if `<svg>` in SVG space', async function () {
        assert.ok(matches(':root', s('svg'), 'svg'))
      })

      await t.test(
        'should not match if not `<svg>` in SVG space',
        async function () {
          assert.ok(!matches(':root', s('circle'), 'svg'))
        }
      )
    })

    await t.test(':scope', async function (t) {
      await t.test('should always be true for elements', async function () {
        assert.ok(matches(':scope', h('html')))
      })

      await t.test('should always be true for elements', async function () {
        assert.ok(matches(':scope', h('p')))
      })

      await t.test('should always be true for elements', async function () {
        assert.ok(!matches(':scope', u('text', '!')))
      })
    })

    await t.test(':read-write', async function (t) {
      await t.test('should match on input', async function () {
        assert.ok(matches(':read-write', h('input')))
      })

      await t.test('should match on textarea', async function () {
        assert.ok(matches(':read-write', h('input')))
      })

      await t.test('should not match on input w/ readonly', async function () {
        assert.ok(!matches(':read-write', h('input', {readOnly: true})))
      })

      await t.test(
        'should not match on textarea w/ readonly',
        async function () {
          assert.ok(!matches(':read-write', h('textarea', {readOnly: true})))
        }
      )

      await t.test('should not match on input w/ disabled', async function () {
        assert.ok(!matches(':read-write', h('input', {disabled: true})))
      })

      await t.test(
        'should not match on textarea w/ disabled',
        async function () {
          assert.ok(!matches(':read-write', h('textarea', {disabled: true})))
        }
      )

      await t.test(
        'should match on element w/ contenteditable',
        async function () {
          assert.ok(matches(':read-write', h('div', {contentEditable: 'true'})))
        }
      )
    })

    await t.test(':read-only', async function (t) {
      await t.test('should not match on input', async function () {
        assert.ok(!matches(':read-only', h('input')))
      })

      await t.test('should not match on textarea', async function () {
        assert.ok(!matches(':read-only', h('input')))
      })

      await t.test('should match on input w/ readonly', async function () {
        assert.ok(matches(':read-only', h('input', {readOnly: true})))
      })

      await t.test('should match on textarea w/ readonly', async function () {
        assert.ok(matches(':read-only', h('textarea', {readOnly: true})))
      })

      await t.test('should match on input w/ disabled', async function () {
        assert.ok(matches(':read-only', h('input', {disabled: true})))
      })

      await t.test('should match on textarea w/ disabled', async function () {
        assert.ok(matches(':read-only', h('textarea', {disabled: true})))
      })

      await t.test(
        'should not match on element w/ contenteditable',
        async function () {
          assert.ok(!matches(':read-only', h('div', {contentEditable: 'true'})))
        }
      )
    })
  })
})
