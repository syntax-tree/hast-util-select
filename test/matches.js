import assert from 'node:assert/strict'
import test from 'node:test'
import {u} from 'unist-builder'
import {h, s} from 'hastscript'
import {matches} from '../index.js'

test('select.matches()', async (t) => {
  await t.test('invalid selector', () => {
    assert.throws(
      () => {
        // @ts-expect-error runtime.
        matches()
      },
      /Error: Expected `string` as selector, not `undefined`/,
      'should throw without selector'
    )

    assert.throws(
      () => {
        // @ts-expect-error runtime.
        matches([], h(''))
      },
      /Error: Expected `string` as selector, not ``/,
      'should throw w/ invalid selector (1)'
    )

    assert.throws(
      () => {
        matches('@supports (transform-origin: 5% 5%) {}', h(''))
      },
      /Expected rule but "@" found/,
      'should throw w/ invalid selector (2)'
    )

    assert.throws(
      () => {
        matches('[foo%=bar]', h(''))
      },
      /Expected a valid attribute selector operator/,
      'should throw on invalid attribute operators'
    )

    assert.throws(
      () => {
        matches(':active', h(''))
      },
      /Error: Unknown pseudo-selector `active`/,
      'should throw on invalid pseudo classes'
    )

    assert.throws(
      () => {
        matches(':nth-foo(2n+1)', h(''))
      },
      /Unknown pseudo-class/,
      'should throw on invalid pseudo class “functions”'
    )

    assert.throws(
      () => {
        matches('::before', h(''))
      },
      /Invalid selector: `::before`/,
      'should throw on invalid pseudo elements'
    )

    assert.throws(
      () => {
        matches('foo bar', h(''))
      },
      /Error: Expected selector without nesting/,
      'should throw on nested selectors (descendant)'
    )

    assert.throws(
      () => {
        matches('foo > bar', h(''))
      },
      /Error: Expected selector without nesting/,
      'should throw on nested selectors (direct child)'
    )
  })

  await t.test('parent-sensitive pseudo-selectors', () => {
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
      assert.throws(
        () => {
          matches(':' + pseudo, h(''))
        },
        new RegExp('Error: Cannot use `:' + pseudo + '` without parent'),
        'should throw on `' + pseudo + '`'
      )
    }

    index = -1

    while (++index < functionalPseudos.length) {
      const pseudo = functionalPseudos[index]
      assert.throws(
        () => {
          matches(':' + pseudo + '()', h(''))
        },
        /Formula parse error/,
        'should throw on `' + pseudo + '()`'
      )
    }
  })

  await t.test('general', () => {
    assert.throws(
      function () {
        matches('', h())
      },
      /Expected rule but end of input reached/,
      'should throw on empty selectors'
    )

    assert.throws(
      function () {
        matches(' ', h())
      },
      /Expected rule but end of input reached/,
      'should throw for a white-space only selector'
    )

    assert.ok(!matches('*'), 'false if not given a node')

    assert.ok(
      !matches('*', {type: 'text', value: 'a'}),
      'false if not given an element'
    )
  })

  await t.test('multiple selectors', () => {
    assert.ok(matches('b, i', h('b')), 'true for string')

    assert.ok(!matches('i, s', h('b')), 'false for string')
  })

  await t.test('tag-names: `div`, `*`', () => {
    assert.ok(matches('*', h('')), 'true for `*`')

    assert.ok(matches('b', h('b')), 'true if tag-names matches')

    assert.ok(!matches('b', h('i')), 'false if tag-names don’t matches')
  })

  await t.test('id: `#id`', () => {
    assert.ok(!matches('#one', h('')), 'false if no id exists')

    assert.ok(matches('#one', h('#one')), 'true for matchesing id’s')

    assert.ok(!matches('#two', h('#one')), 'false for mismatchesed id’s')

    assert.ok(
      matches('#two#one', h('#one')),
      'should prefer the last id if multiple id’s are specified (1)'
    )

    assert.ok(
      !matches('#one#two', h('#one')),
      'should prefer the last id if multiple id’s are specified (2)'
    )
  })

  await t.test('class: `.class`', () => {
    assert.ok(!matches('.one', h('')), 'false if no class-name exists')

    assert.ok(matches('.one', h('.one')), 'true for matchesing class-name')

    assert.ok(
      matches('.one', h('.one.two')),
      'true when matchesing in multiple class-name'
    )

    assert.ok(
      !matches('.one.two', h('.one')),
      'false if not all class-names exist'
    )
  })

  await t.test('attributes, existence: `[attr]`', () => {
    assert.ok(matches('[class]', h('.one')), 'true if attribute exists')

    assert.ok(!matches('[for]', h('.one')), 'false if attribute does not exist')

    assert.ok(
      matches('[accesskey]', h('div', {accessKey: ['a']})),
      'true if attribute exists (2)'
    )

    assert.ok(
      matches('[data-foo]', h('div', {dataFoo: 'bar'})),
      'true if attribute exists (3)'
    )

    assert.ok(
      !matches('[data-bar]', h('div', {dataFoo: 'bar'})),
      'false if attribute does not exist (2)'
    )
  })

  await t.test('attributes, equality: `[attr=value]`', () => {
    assert.ok(
      matches('[id=one]', h('#one')),
      'true if attribute matches (string value)'
    )

    assert.ok(
      matches('[class=one]', h('.one')),
      'true if attribute matches (space-separated list, 1)'
    )

    assert.ok(
      matches('[class="one two"]', h('.one.two')),
      'true if attribute matches (space-separated list, 2)'
    )

    assert.ok(
      matches(
        '[accept="audio/*"]',
        h('input', {type: 'file', accept: ['audio/*']})
      ),
      'true if attribute matches (comma-separated list)'
    )

    assert.ok(
      matches('[hidden=hidden]', h('div', {hidden: true})),
      'true if attribute matches (boolean)'
    )

    assert.ok(
      matches('[download=download]', h('a', {download: true})),
      'true if attribute matches (overloaded boolean, 1)'
    )

    assert.ok(
      matches('[download="image.png"]', h('a', {download: 'image.png'})),
      'true if attribute matches (overloaded boolean, 2)'
    )

    assert.ok(
      matches('[tabindex=-1]', h('div', {tabIndex: -1})),
      'true if attribute matches (numeric)'
    )

    assert.ok(
      matches('[minlength=3]', h('input', {minLength: 3})),
      'true if attribute matches (positive numeric)'
    )

    assert.ok(
      !matches('[id=two]', h('#one')),
      'false if attribute does not matches (string value)'
    )

    assert.ok(
      !matches('[class=two]', h('.one')),
      'false if attribute does not matches (space-separated list, 1)'
    )

    assert.ok(
      !matches('[class="three four"]', h('.one.two')),
      'false if attribute does not matches (space-separated list, 2)'
    )

    assert.ok(
      !matches(
        '[accept="image/*"]',
        h('input', {type: 'file', accept: ['audio/*']})
      ),
      'false if attribute does not matches (comma-separated list)'
    )

    assert.ok(
      !matches('[hidden=hidden]', h('div', {hidden: false})),
      'false if attribute does not matches (boolean)'
    )

    assert.ok(
      !matches('[download=download]', h('a', {download: false})),
      'false if attribute does not matches (overloaded boolean, 1)'
    )

    assert.ok(
      !matches('[download="image.png"]', h('a', {download: 'photo.png'})),
      'false if attribute does not matches (overloaded boolean, 2)'
    )

    assert.ok(
      !matches('[tabindex=-1]', h('div', {tabIndex: -2})),
      'false if attribute does not matches (numeric)'
    )

    assert.ok(
      !matches('[minlength=3]', h('input', {minLength: 2})),
      'false if attribute does not matches (positive numeric)'
    )
  })

  await t.test('attributes, begins: `[attr^=value]`', () => {
    assert.ok(
      matches('[id^=one]', h('#one')),
      'true if attribute matches (string value)'
    )

    assert.ok(
      matches('[id^=on]', h('#one')),
      'true if attribute starts with (string value)'
    )

    assert.ok(
      matches('[class^=one]', h('.one.two')),
      'true if attribute starts with (space-separated list)'
    )

    assert.ok(
      matches(
        '[accept^=audio]',
        h('input', {type: 'file', accept: ['audio/*']})
      ),
      'true if attribute starts with (comma-separated list)'
    )

    assert.ok(
      matches('[hidden^=hid]', h('div', {hidden: true})),
      'true if attribute starts with (boolean)'
    )

    assert.ok(
      matches('[download^=down]', h('a', {download: true})),
      'true if attribute starts with (overloaded boolean)'
    )

    assert.ok(
      matches('[download^=ima]', h('a', {download: 'image.png'})),
      'true if attribute starts with (overloaded boolean, 2)'
    )

    assert.ok(
      matches('[tabindex^=-]', h('div', {tabIndex: -1})),
      'true if attribute starts with (numeric)'
    )

    assert.ok(
      matches('[minlength^=1]', h('input', {minLength: 10})),
      'true if attribute starts with (positive numeric)'
    )

    assert.ok(
      !matches('[id^=t]', h('#one')),
      'false if attribute does not start with (string value)'
    )

    assert.ok(
      !matches('[class^=t]', h('.one')),
      'false if attribute does not start with (space-separated list)'
    )

    assert.ok(
      !matches(
        '[accept^=video]',
        h('input', {type: 'file', accept: ['audio/*']})
      ),
      'false if attribute does not start with (comma-separated list)'
    )

    assert.ok(
      !matches('[hidden^=hid]', h('div', {hidden: false})),
      'false if attribute does not start with (boolean)'
    )

    assert.ok(
      !matches('[download^=down]', h('a', {download: false})),
      'false if attribute does not start with (overloaded boolean, 1)'
    )

    assert.ok(
      !matches('[download^=image]', h('a', {download: 'photo.png'})),
      'false if attribute does not start with (overloaded boolean, 2)'
    )

    assert.ok(
      !matches('[tabindex^=-]', h('div', {tabIndex: 2})),
      'false if attribute does not start with (numeric)'
    )

    assert.ok(
      !matches('[minlength^=1]', h('input', {minLength: 2})),
      'false if attribute does not start with (positive numeric)'
    )
  })

  await t.test('attributes, ends: `[attr$=value]`', () => {
    assert.ok(
      matches('[id$=one]', h('#one')),
      'true if attribute matches (string value)'
    )

    assert.ok(
      matches('[id$=ne]', h('#one')),
      'true if attribute ends with (string value)'
    )

    assert.ok(
      matches('[class$=wo]', h('.one.two')),
      'true if attribute ends with (space-separated list)'
    )

    assert.ok(
      matches('[accept$="*"]', h('input', {type: 'file', accept: ['audio/*']})),
      'true if attribute ends with (comma-separated list)'
    )

    assert.ok(
      matches('[hidden$=den]', h('div', {hidden: true})),
      'true if attribute ends with (boolean)'
    )

    assert.ok(
      matches('[download$=load]', h('a', {download: true})),
      'true if attribute ends with (overloaded boolean)'
    )

    assert.ok(
      matches('[download$=png]', h('a', {download: 'image.png'})),
      'true if attribute ends with (overloaded boolean, 2)'
    )

    assert.ok(
      matches('[tabindex$=1]', h('div', {tabIndex: -1})),
      'true if attribute ends with (numeric)'
    )

    assert.ok(
      matches('[minlength$=0]', h('input', {minLength: 10})),
      'true if attribute ends with (positive numeric)'
    )

    assert.ok(
      !matches('[id$=wo]', h('#one')),
      'false if attribute does not end with (string value)'
    )

    assert.ok(
      !matches('[class$=wo]', h('.one')),
      'false if attribute does not end with (space-separated list)'
    )

    assert.ok(
      !matches(
        '[accept$=doc]',
        h('input', {type: 'file', accept: ['audio/*']})
      ),
      'false if attribute does not end with (comma-separated list)'
    )

    assert.ok(
      !matches('[hidden$=den]', h('div', {hidden: false})),
      'false if attribute does not end with (boolean)'
    )

    assert.ok(
      !matches('[download$=load]', h('a', {download: false})),
      'false if attribute does not end with (overloaded boolean, 1)'
    )

    assert.ok(
      !matches('[download$=jpg]', h('a', {download: 'photo.png'})),
      'false if attribute does not end with (overloaded boolean, 2)'
    )

    assert.ok(
      !matches('[tabindex$=2]', h('div', {tabIndex: -1})),
      'false if attribute does not end with (numeric)'
    )

    assert.ok(
      !matches('[minlength$=1]', h('input', {minLength: 2})),
      'false if attribute does not start with (positive numeric)'
    )
  })

  await t.test('attributes, contains: `[attr*=value]`', () => {
    assert.ok(
      matches('[id*=one]', h('#one')),
      'true if attribute matches (string value)'
    )

    assert.ok(
      matches('[id*=n]', h('#one')),
      'true if attribute contains (string value)'
    )

    assert.ok(
      matches('[class*=w]', h('.one.two')),
      'true if attribute contains (space-separated list)'
    )

    assert.ok(
      matches(
        '[accept*="audio/*"]',
        h('input', {type: 'file', accept: ['audio/*']})
      ),
      'true if attribute contains (comma-separated list)'
    )

    assert.ok(
      matches('[hidden*=dd]', h('div', {hidden: true})),
      'true if attribute contains (boolean)'
    )

    assert.ok(
      matches('[download*=nl]', h('a', {download: true})),
      'true if attribute contains (overloaded boolean)'
    )

    assert.ok(
      matches('[download*=age]', h('a', {download: 'image.png'})),
      'true if attribute contains (overloaded boolean, 2)'
    )

    assert.ok(
      matches('[tabindex*=1]', h('div', {tabIndex: -12})),
      'true if attribute contains (numeric)'
    )

    assert.ok(
      matches('[minlength*=0]', h('input', {minLength: 102})),
      'true if attribute contains (positive numeric)'
    )

    assert.ok(
      !matches('[id*=w]', h('#one')),
      'false if attribute does not contain (string value)'
    )

    assert.ok(
      !matches('[class*=w]', h('.one')),
      'false if attribute does not contain (space-separated list)'
    )

    assert.ok(
      !matches(
        '[accept*="video/*"]',
        h('input', {type: 'file', accept: ['audio/*']})
      ),
      'false if attribute does not contain (comma-separated list)'
    )

    assert.ok(
      !matches('[hidden*=dd]', h('div', {hidden: false})),
      'false if attribute does not contain (boolean)'
    )

    assert.ok(
      !matches('[download*=nl]', h('a', {download: false})),
      'false if attribute does not contain (overloaded boolean, 1)'
    )

    assert.ok(
      !matches('[download*=age]', h('a', {download: 'photo.png'})),
      'false if attribute does not contain (overloaded boolean, 2)'
    )

    assert.ok(
      !matches('[tabindex*=3]', h('div', {tabIndex: -12})),
      'false if attribute does not contain (numeric)'
    )

    assert.ok(
      !matches('[minlength*=3]', h('input', {minLength: 102})),
      'false if attribute does not contain (positive numeric)'
    )
  })

  await t.test(
    'attributes, contains in space-separated list: `[attr~=value]`',
    () => {
      assert.ok(
        matches('[id~=one]', h('#one')),
        'true if attribute matches (string value)'
      )

      assert.ok(
        matches('[class~=one]', h('.one')),
        'true if attribute matches (space-separated list, 1)'
      )

      assert.ok(
        matches('[class~="one two"]', h('.one.two')),
        'true if attribute matches (space-separated list, 2)'
      )

      assert.ok(
        matches(
          '[accept~="audio/*"]',
          h('input', {type: 'file', accept: ['audio/*']})
        ),
        'true if attribute matches (comma-separated list)'
      )

      assert.ok(
        matches('[hidden~=hidden]', h('div', {hidden: true})),
        'true if attribute matches (boolean)'
      )

      assert.ok(
        matches('[download~=download]', h('a', {download: true})),
        'true if attribute matches (overloaded boolean, 1)'
      )

      assert.ok(
        matches('[download~="image.png"]', h('a', {download: 'image.png'})),
        'true if attribute matches (overloaded boolean, 2)'
      )

      assert.ok(
        matches('[tabindex~=-1]', h('div', {tabIndex: -1})),
        'true if attribute matches (numeric)'
      )

      assert.ok(
        matches('[minlength~=3]', h('input', {minLength: 3})),
        'true if attribute matches (positive numeric)'
      )

      assert.ok(
        !matches('[id~=two]', h('#one')),
        'false if attribute does not matches (string value)'
      )

      assert.ok(
        !matches('[class~=two]', h('.one')),
        'false if attribute does not matches (space-separated list, 1)'
      )

      assert.ok(
        !matches('[class~="three four"]', h('.one.two')),
        'false if attribute does not matches (space-separated list, 2)'
      )

      assert.ok(
        !matches(
          '[accept~="video/*"]',
          h('input', {type: 'file', accept: ['audio/*']})
        ),
        'false if attribute does not matches (comma-separated list)'
      )

      assert.ok(
        !matches('[hidden~=hidden]', h('div', {hidden: false})),
        'false if attribute does not matches (boolean)'
      )

      assert.ok(
        !matches('[download~=download]', h('a', {download: false})),
        'false if attribute does not matches (overloaded boolean, 1)'
      )

      assert.ok(
        !matches('[download~="image.png"]', h('a', {download: 'photo.png'})),
        'false if attribute does not matches (overloaded boolean, 2)'
      )

      assert.ok(
        !matches('[tabindex~=-1]', h('div', {tabIndex: -2})),
        'false if attribute does not matches (numeric)'
      )

      assert.ok(
        !matches('[minlength~=3]', h('input', {minLength: 2})),
        'false if attribute does not matches (positive numeric)'
      )

      assert.ok(
        matches('[class~=one]', h('.one.two')),
        'true if attribute part exists (space-separated list, 1)'
      )

      assert.ok(
        matches('[class~=two]', h('.one.two')),
        'true if attribute part exists (space-separated list, 2)'
      )

      assert.ok(
        !matches('[class~=three]', h('.one.two')),
        'false if attribute part does not exist (space-separated list)'
      )
    }
  )

  await t.test('attributes, starts or prefixes: `[attr|=value]`', () => {
    assert.ok(
      matches('[id|=one]', h('#one')),
      'true if attribute matches (string value)'
    )

    assert.ok(
      matches('[class|=one]', h('.one')),
      'true if attribute matches (space-separated list, 1)'
    )

    assert.ok(
      matches('[class|="one two"]', h('.one.two')),
      'true if attribute matches (space-separated list, 2)'
    )

    assert.ok(
      matches(
        '[accept|="audio/*"]',
        h('input', {type: 'file', accept: ['audio/*']})
      ),
      'true if attribute matches (comma-separated list)'
    )

    assert.ok(
      matches('[hidden|=hidden]', h('div', {hidden: true})),
      'true if attribute matches (boolean)'
    )

    assert.ok(
      matches('[download|=download]', h('a', {download: true})),
      'true if attribute matches (overloaded boolean, 1)'
    )

    assert.ok(
      matches('[download|="image.png"]', h('a', {download: 'image.png'})),
      'true if attribute matches (overloaded boolean, 2)'
    )

    assert.ok(
      matches('[tabindex|=-1]', h('div', {tabIndex: -1})),
      'true if attribute matches (numeric)'
    )

    assert.ok(
      matches('[minlength|=3]', h('input', {minLength: 3})),
      'true if attribute matches (positive numeric)'
    )

    assert.ok(
      !matches('[id|=two]', h('#one')),
      'false if attribute does not matches (string value)'
    )

    assert.ok(
      !matches('[class|=two]', h('.one')),
      'false if attribute does not matches (space-separated list, 1)'
    )

    assert.ok(
      !matches('[class|="three four"]', h('.one.two')),
      'false if attribute does not matches (space-separated list, 2)'
    )

    assert.ok(
      !matches(
        '[accept|="video/*"]',
        h('input', {type: 'file', accept: ['audio/*']})
      ),
      'false if attribute does not matches (comma-separated list)'
    )

    assert.ok(
      !matches('[hidden|=hidden]', h('div', {hidden: false})),
      'false if attribute does not matches (boolean)'
    )

    assert.ok(
      !matches('[download|=download]', h('a', {download: false})),
      'false if attribute does not matches (overloaded boolean, 1)'
    )

    assert.ok(
      !matches('[download|="image.png"]', h('a', {download: 'photo.png'})),
      'false if attribute does not matches (overloaded boolean, 2)'
    )

    assert.ok(
      !matches('[tabindex|=-1]', h('div', {tabIndex: -2})),
      'false if attribute does not matches (numeric)'
    )

    assert.ok(
      !matches('[minlength|=3]', h('input', {minLength: 2})),
      'false if attribute does not matches (positive numeric)'
    )

    assert.ok(
      matches('[alpha|=bravo]', h('div', {alpha: 'bravo'})),
      'true if value starts with'
    )

    assert.ok(
      matches('[alpha|=bravo]', h('div', {alpha: 'bravo-charlie'})),
      'true if value prefixes'
    )

    assert.ok(
      !matches('[alpha|=bravo]', h('div', {alpha: 'bravocharlie'})),
      'false if value does not prefix'
    )

    assert.ok(
      !matches('[alpha|=charlie]', h('div', {alpha: 'bravo'})),
      'false if value does start with'
    )
  })

  await t.test('pseudo-classes', async (t) => {
    await t.test(':is()', () => {
      assert.ok(
        matches(':is(a, [title], .class)', h('a')),
        'true if any matches (type)'
      )

      assert.ok(
        matches(':is(a, [title], .class)', h('.class')),
        'true if any matches (.class)'
      )

      assert.ok(
        matches(':is(a, [title], .class)', h('div', {title: '1'})),
        'true if any matches (attribute existence)'
      )

      assert.ok(
        !matches(':is(a, [title], .class)', h('i')),
        'false if nothing matches'
      )

      assert.ok(
        !matches(':is(a, [title], .class)', h('div', h('i.class'))),
        'false if children match'
      )
    })

    await t.test(':not()', () => {
      assert.ok(
        !matches(':not(a, [title], .class)', h('a')),
        'false if any matches (type)'
      )

      assert.ok(
        !matches(':not(a, [title], .class)', h('.class')),
        'false if any matches (.class)'
      )

      assert.ok(
        !matches(':not(a, [title], .class)', h('div', {title: '1'})),
        'false if any matches (attribute existence)'
      )

      assert.ok(
        matches(':not(a, [title], .class)', h('i')),
        'true if nothing matches'
      )

      assert.ok(
        matches(':not(a, [title], .class)', h('div', h('i.class'))),
        'true if children match'
      )
    })

    await t.test(':has', () => {
      assert.throws(
        () => {
          matches('a:not(:has())', h('p'))
        },
        /Expected rule but "\)" found/,
        'should throw on empty selectors'
      )

      assert.throws(
        () => {
          matches('a:has()', h('p'))
        },
        /Expected rule but "\)" found/,
        'should throw on empty selectors'
      )

      assert.ok(
        !matches('p:has(p)', h('p', h('s'))),
        'should not match the scope element (#1)'
      )

      assert.ok(
        matches('p:has(p)', h('p', h('p'))),
        'should not match the scope element (#2)'
      )

      assert.ok(
        matches('a:has(img)', h('a', h('img'))),
        'true if children match the descendant selector'
      )

      assert.ok(
        !matches('a:has(img)', h('a', h('span'))),
        'false if no children match the descendant selector'
      )

      assert.ok(
        matches('a:has(img)', h('a', h('span'), h('img'))),
        'true if descendants match the descendant selector'
      )

      assert.ok(
        !matches('a:has(img)', h('a', h('span', h('span')))),
        'false if no descendants match the descendant selector'
      )

      assert.ok(
        matches('dd:has(dt + dd)', h('dd', [h('dt'), h('dd')])),
        'should support a nested next-sibling selector (#1)'
      )

      assert.ok(
        !matches('dd:has(dt + dd)', h('dd', [h('dt'), h('dt')])),
        'should support a nested next-sibling selector (#2)'
      )

      assert.ok(
        matches('a:has([title])', h('a', h('s', {title: 'a'}))),
        'should add `:scope` to sub-selectors (#1)'
      )

      assert.ok(
        !matches('a:has([title])', h('a', {title: '!'}, h('s'))),
        'should add `:scope` to sub-selectors (#2)'
      )

      assert.ok(
        !matches('a:has(a, :scope i)', h('a', h('s'))),
        'should add `:scope` to all sub-selectors (#2)'
      )

      assert.ok(
        matches('section:not(:has(h1, h2, h3, h4, h5, h6))', h('section', [])),
        'should add `:scope` to all sub-selectors (#3)'
      )

      assert.ok(
        matches(
          'section:not(:has(h1, h2, h3, h4, h5, h6))',
          h('section', [h('p', '!')])
        ),
        'should add `:scope` to all sub-selectors (#4)'
      )

      assert.ok(
        !matches(
          'section:has(:lang(en, fr))',
          h('section', [h('q', {lang: 'de'})])
        ),
        'should ignore commas in parens (#1)'
      )

      assert.ok(
        matches(
          'section:has(:lang(en, fr))',
          h('section', [h('q', {lang: 'en'})])
        ),
        'should ignore commas in parens (#2)'
      )

      assert.ok(
        !matches('section:has(:is(i), :is(b))', h('section', [h('s')])),
        'should support multiple relative selectors (#1)'
      )

      assert.ok(
        matches('section:has(:is(i), :is(b))', h('section', [h('b')])),
        'should support multiple relative selectors (#2)'
      )

      // This checks white-space.
      assert.ok(matches('a:has( img)', h('a', h('img'))), 'assertion (#1)')

      assert.ok(matches('a:has( img  )', h('a', h('img'))), 'assertion (#2)')

      assert.ok(matches('a:has(img )', h('a', h('img'))), 'assertion (#3)')

      assert.ok(
        matches('a:has( img  ,\t p )', h('a', h('img'))),
        'assertion (#4)'
      )

      // Note: These should be uncommented, but that’s not supported by the CSS
      // parser:
      //
      // assert.ok(
      //   matches('a:has(> img)', h('a', h('img'))),
      //   'true for relative direct child selector'
      // )
      // assert.ok(!
      //   matches('a:has(> img)', h('a', h('span', h('img')))),
      //   'false for relative direct child selectors'
      // )
      // assert.ok(
      //   matches('a:has(> img, > span)', h('a', h('span', h('span')))),
      //   'should support a list of relative selectors'
      // )
    })

    await t.test(':any-link', () => {
      const links = ['a', 'area', 'link']
      let index = -1

      while (++index < links.length) {
        const name = links[index]

        assert.ok(
          matches(':any-link', h(name, {href: '#'})),
          'true if w/ href on ' + name
        )

        assert.ok(
          !matches(':any-link', h(name)),
          'false if w/o href on ' + name
        )
      }
    })

    await t.test(':checked', () => {
      assert.ok(
        matches(':checked', h('input', {type: 'checkbox', checked: true})),
        'true for checkbox inputs w/ `checked`'
      )

      assert.ok(
        matches(':checked', h('input', {type: 'radio', checked: true})),
        'true for radio inputs w/ `checked`'
      )

      assert.ok(
        matches(':checked', h('menuitem', {type: 'checkbox', checked: true})),
        'true for checkbox menuitems w/ `checked`'
      )

      assert.ok(
        matches(':checked', h('menuitem', {type: 'radio', checked: true})),
        'true for radio menuitems w/ `checked`'
      )

      assert.ok(
        matches(':checked', h('option', {selected: true})),
        'true for options w/ `selected`'
      )

      assert.ok(
        !matches(':checked', h('input', {type: 'checkbox', checked: false})),
        'false for checkbox inputs w/o `checked`'
      )

      assert.ok(
        !matches(':checked', h('input', {type: 'radio', checked: false})),
        'false for radio inputs w/o `checked`'
      )

      assert.ok(
        !matches(':checked', h('menuitem', {type: 'checkbox', checked: false})),
        'false for checkbox menuitems w/o `checked`'
      )

      assert.ok(
        !matches(':checked', h('menuitem', {type: 'radio', checked: false})),
        'false for radio menuitems w/o `checked`'
      )

      assert.ok(
        !matches(':checked', h('option', {selected: false})),
        'false for options w/o `selected`'
      )

      assert.ok(!matches(':checked', h('')), 'false for other nodes')
    })

    await t.test(':disabled', () => {
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

        assert.ok(
          matches(':disabled', h(name, {disabled: true})),
          'true if w/ disabled on ' + name
        )

        assert.ok(
          !matches(':disabled', h(name)),
          'false if w/o disabled on ' + name
        )
      }
    })

    await t.test(':enabled', () => {
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
        assert.ok(
          matches(':enabled', h(name)),
          'true if w/o disabled on ' + name
        )

        assert.ok(
          !matches(':enabled', h(name, {disabled: true})),
          'false if w/ disabled on ' + name
        )
      }
    })

    await t.test(':required', () => {
      const things = ['input', 'textarea', 'select']
      let index = -1

      while (++index < things.length) {
        const name = things[index]
        assert.ok(
          matches(':required', h(name, {required: true})),
          'true if w/ required on ' + name
        )

        assert.ok(
          !matches(':required', h(name)),
          'false if w/o required on ' + name
        )
      }
    })

    await t.test(':optional', () => {
      const things = ['input', 'textarea', 'select']

      let index = -1

      while (++index < things.length) {
        const name = things[index]
        assert.ok(
          matches(':optional', h(name)),
          'true if w/o required on ' + name
        )

        assert.ok(
          !matches(':optional', h(name, {required: true})),
          'false if w/ required on ' + name
        )
      }
    })

    await t.test(':empty', () => {
      assert.ok(matches(':empty', h('')), 'true if w/o children')

      assert.ok(
        matches(':empty', h('', u('comment', '?'))),
        'true if w/o elements or texts'
      )

      assert.ok(!matches(':empty', h('', h(''))), 'false if w/ elements')

      assert.ok(!matches(':empty', h('', u('text', '.'))), 'false if w/ text')

      assert.ok(
        !matches(':empty', h('', u('text', ' '))),
        'false if w/ white-space text'
      )
    })

    await t.test(':blank', () => {
      assert.ok(matches(':blank', h('')), 'true if w/o children')

      assert.ok(
        matches(':blank', h('', u('comment', '?'))),
        'true if w/o elements or texts'
      )

      assert.ok(
        matches(':blank', h('', u('text', ' '))),
        'true if w/ white-space text'
      )

      assert.ok(!matches(':blank', h('', h(''))), 'false if w/ elements')

      assert.ok(!matches(':blank', h('', u('text', '.'))), 'false if w/ text')
    })

    await t.test(':lang()', () => {
      assert.ok(
        matches(':lang(de, en)', h('html', {xmlLang: 'en'})),
        'true if the element has an `xml:lang` attribute'
      )

      assert.ok(
        matches(':lang(de, en)', h('html', {lang: 'de'})),
        'true if the element has a `lang` attribute'
      )

      assert.ok(
        !matches(':lang(de, en)', h('html', {xmlLang: 'jp'})),
        'false if the element has an different language set'
      )

      assert.ok(
        !matches(':lang(de, en)', h('html', {xmlLang: 'jp', lang: 'de'})),
        'should prefer `xmlLang` over `lang` (#1)'
      )

      assert.ok(
        matches(':lang(de, en)', h('html', {xmlLang: 'de', lang: 'jp'})),
        'should prefer `xmlLang` over `lang` (#2)'
      )

      assert.ok(
        !matches(':lang(de, en)', h('html', {xmlLang: 'jp'})),
        'false if the element has an different language set'
      )

      assert.ok(
        matches(':lang(*)', h('html', {lang: 'en'})),
        'should support wildcards'
      )

      assert.ok(
        !matches(':lang(en)', h('html', {lang: ''})),
        'false if [lang] is an empty string (means unknown language)'
      )

      assert.ok(
        !matches(':lang(*)', h('html', {lang: ''})),
        'false with wildcard if [lang] is an empty string (means unknown language)'
      )

      assert.ok(
        matches(':lang(de-*-DE)', h('html', {lang: 'de-Latn-DE'})),
        'should support non-primary wildcard subtags (#1)'
      )

      assert.ok(
        matches(':lang(fr-BE, de-*-DE)', h('html', {lang: 'de-Latn-DE'})),
        'should support non-primary wildcard subtags (#2)'
      )
    })

    await t.test(':dir()', () => {
      const ltr = 'a'
      const rtl = 'أ'
      const neutral = '!'

      assert.ok(
        matches(':dir(ltr)', h('html', {dir: 'ltr'})),
        'matching `ltr` if the element has a matching explicit `dir` attribute'
      )

      assert.ok(
        matches(':dir(rtl)', h('html', {dir: 'rtl'})),
        'matching `rtl` if the element has a matching explicit `dir` attribute'
      )

      assert.ok(
        matches(':dir(ltr)', h('html')),
        'matching `ltr` if the element is `html` with no `dir` attribute'
      )

      assert.ok(
        matches(':dir(ltr)', h('html', {dir: 'foo'})),
        'matching `ltr` if the element is `html` with an invalid `dir` attribute'
      )

      assert.ok(
        matches(':dir(ltr)', h('input', {type: 'tel'})),
        'matching `ltr` if the element is `input[type=tel]` with no `dir` attribute'
      )

      assert.ok(
        matches(':dir(ltr)', h('input', {type: 'tel', dir: 'foo'})),
        'matching `ltr` if the element is `input[type=tel]` with an invalid `dir` attribute'
      )

      assert.ok(
        matches(':dir(ltr)', h('textarea', {dir: 'auto'}, ltr)),
        'matching `ltr` if `[dir=auto]` on a textarea and it’s content is BIDI LTR'
      )

      assert.ok(
        matches(':dir(rtl)', h('textarea', {dir: 'auto'}, rtl)),
        'matching `rtl` if `[dir=auto]` on a textarea and it’s content is BIDI RTL'
      )

      assert.ok(
        matches(':dir(ltr)', h('textarea', {dir: 'auto'}, neutral)),
        'matching `ltr` if `[dir=auto]` on a textarea and it’s content is BIDI neutral'
      )

      assert.ok(
        matches(':dir(ltr)', h('input', {dir: 'auto', value: ltr})),
        'matching `ltr` if `[dir=auto]` on a text input and it’s value is BIDI LTR'
      )

      assert.ok(
        matches(
          ':dir(rtl)',
          h('input', {type: 'search', dir: 'auto', value: rtl})
        ),
        'matching `rtl` if `[dir=auto]` on a search input and it’s value is BIDI RTL'
      )

      assert.ok(
        matches(
          ':dir(ltr)',
          h('input', {type: 'url', dir: 'auto', value: neutral})
        ),
        'matching `ltr` if `[dir=auto]` on a URL input and it’s value is BIDI neutral'
      )

      assert.ok(
        matches(':dir(ltr)', h('input', {type: 'email', dir: 'auto'})),
        'matching `ltr` if `[dir=auto]` on an email input without value'
      )

      assert.ok(
        matches(':dir(ltr)', h('p', {dir: 'auto'}, ltr)),
        'matching `ltr` if `[dir=auto]` and the element has BIDI LTR text'
      )

      assert.ok(
        matches(':dir(rtl)', h('p', {dir: 'auto'}, rtl)),
        'matching `rtl` if `[dir=auto]` and the element has BIDI RTL text'
      )

      assert.ok(
        matches(':dir(ltr)', h('p', {dir: 'auto'}, neutral)),
        'matching `ltr` if `[dir=auto]` and the element has BIDI neutral text'
      )

      assert.ok(
        matches(':dir(ltr)', h('p', {dir: 'auto'}, [neutral, ltr, rtl])),
        'matching `ltr` if `[dir=auto]` and the element has BIDI neutral text followed by LTR text'
      )

      assert.ok(
        matches(':dir(rtl)', h('p', {dir: 'auto'}, [neutral, rtl, ltr])),
        'matching `rtl` if `[dir=auto]` and the element has BIDI neutral text followed by RTL text'
      )

      assert.ok(
        matches(
          ':dir(ltr)',
          h('p', {dir: 'auto'}, [neutral, h('script', rtl), ltr])
        ),
        'matching `ltr` if `[dir=auto]`, ignoring BIDI text in scripts, followed by LTR text'
      )

      assert.ok(
        matches(
          ':dir(rtl)',
          h('p', {dir: 'auto'}, [neutral, h('style', ltr), rtl])
        ),
        'matching `rtl` if `[dir=auto]`, ignoring BIDI text in styles, followed by RTL text'
      )

      assert.ok(
        matches(
          ':dir(ltr)',
          h('p', {dir: 'auto'}, [neutral, h('span', {dir: 'rtl'}, rtl), ltr])
        ),
        'matching `ltr` if `[dir=auto]`, ignoring elements with directions, followed by LTR text'
      )

      assert.ok(
        matches(
          ':dir(rtl)',
          h('p', {dir: 'auto'}, [neutral, h('span', {dir: 'ltr'}, ltr), rtl])
        ),
        'matching `rtl` if `[dir=auto]`, ignoring elements with directions, followed by RTL text'
      )

      assert.ok(
        matches(
          ':dir(ltr)',
          h('bdi', [neutral, h('span', {dir: 'rtl'}, rtl), ltr])
        ),
        'matching `ltr` on `bdi` elements, ignoring elements with directions, followed by LTR text'
      )

      assert.ok(
        matches(
          ':dir(rtl)',
          h('bdi', [neutral, h('span', {dir: 'ltr'}, ltr), rtl])
        ),
        'matching `rtl` on `bdi` elements, ignoring elements with directions, followed by RTL text'
      )
    })

    await t.test(':root', () => {
      assert.ok(matches(':root', h('html')), 'true if `<html>` in HTML space')

      assert.ok(
        !matches(':root', h('div')),
        'false if not `<html>` in HTML space'
      )

      assert.ok(
        matches(':root', s('svg'), 'svg'),
        'true if `<svg>` in SVG space'
      )

      assert.ok(
        !matches(':root', s('circle'), 'svg'),
        'false if not `<svg>` in SVG space'
      )
    })

    await t.test(':scope', () => {
      assert.ok(matches(':scope', h('html')), 'always true for elements')

      assert.ok(matches(':scope', h('p')), 'always true for elements')

      assert.ok(!matches(':scope', u('text', '!')), 'always true for elements')
    })

    await t.test(':read-write', () => {
      assert.ok(matches(':read-write', h('input')), 'true on input')

      assert.ok(matches(':read-write', h('input')), 'true on textarea')

      assert.ok(
        !matches(':read-write', h('input', {readOnly: true})),
        'false on input w/ readonly'
      )

      assert.ok(
        !matches(':read-write', h('textarea', {readOnly: true})),
        'false on textarea w/ readonly'
      )

      assert.ok(
        !matches(':read-write', h('input', {disabled: true})),
        'false on input w/ disabled'
      )

      assert.ok(
        !matches(':read-write', h('textarea', {disabled: true})),
        'false on textarea w/ disabled'
      )

      assert.ok(
        matches(':read-write', h('div', {contentEditable: 'true'})),
        'true on element w/ contenteditable'
      )
    })

    await t.test(':read-only', () => {
      assert.ok(!matches(':read-only', h('input')), 'false on input')

      assert.ok(!matches(':read-only', h('input')), 'false on textarea')

      assert.ok(
        matches(':read-only', h('input', {readOnly: true})),
        'true on input w/ readonly'
      )

      assert.ok(
        matches(':read-only', h('textarea', {readOnly: true})),
        'true on textarea w/ readonly'
      )

      assert.ok(
        matches(':read-only', h('input', {disabled: true})),
        'true on input w/ disabled'
      )

      assert.ok(
        matches(':read-only', h('textarea', {disabled: true})),
        'true on textarea w/ disabled'
      )

      assert.ok(
        !matches(':read-only', h('div', {contentEditable: 'true'})),
        'false on element w/ contenteditable'
      )
    })
  })
})
