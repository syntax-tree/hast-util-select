import test from 'tape'
import {u} from 'unist-builder'
import {h, s} from 'hastscript'
import {matches} from '../index.js'

test('select.matches()', (t) => {
  t.test('invalid selector', (t) => {
    t.throws(
      () => {
        // @ts-expect-error runtime.
        matches()
      },
      /Error: Expected `string` as selector, not `undefined`/,
      'should throw without selector'
    )

    t.throws(
      () => {
        // @ts-expect-error runtime.
        matches([], h(''))
      },
      /Error: Expected `string` as selector, not ``/,
      'should throw w/ invalid selector (1)'
    )

    t.throws(
      () => {
        matches('@supports (transform-origin: 5% 5%) {}', h(''))
      },
      /Error: Rule expected but "@" found./,
      'should throw w/ invalid selector (2)'
    )

    t.throws(
      () => {
        matches('[foo%=bar]', h(''))
      },
      /Error: Expected "=" but "%" found./,
      'should throw on invalid attribute operators'
    )

    t.throws(
      () => {
        matches(':active', h(''))
      },
      /Error: Unknown pseudo-selector `active`/,
      'should throw on invalid pseudo classes'
    )

    t.throws(
      () => {
        matches(':nth-foo(2n+1)', h(''))
      },
      /Error: Unknown pseudo-selector `nth-foo`/,
      'should throw on invalid pseudo class “functions”'
    )

    t.throws(
      () => {
        matches('::before', h(''))
      },
      /Error: Unexpected pseudo-element or empty pseudo-class/,
      'should throw on invalid pseudo elements'
    )

    t.throws(
      () => {
        matches('foo bar', h(''))
      },
      /Error: Expected selector without nesting/,
      'should throw on nested selectors (descendant)'
    )

    t.throws(
      () => {
        matches('foo > bar', h(''))
      },
      /Error: Expected selector without nesting/,
      'should throw on nested selectors (direct child)'
    )

    t.end()
  })

  t.test('parent-sensitive pseudo-selectors', (t) => {
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
      t.throws(
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
      t.throws(
        () => {
          matches(':' + pseudo + '()', h(''))
        },
        /n-th rule couldn't be parsed/,
        'should throw on `' + pseudo + '()`'
      )
    }

    t.end()
  })

  t.test('general', (t) => {
    t.notOk(matches('', h('')), 'false for the empty string as selector')
    t.notOk(matches(' ', h('')), 'false for a white-space only selector')
    t.notOk(matches('*'), 'false if not given a node')
    t.notOk(
      matches('*', {type: 'text', value: 'a'}),
      'false if not given an element'
    )

    t.end()
  })

  t.test('multiple selectors', (t) => {
    t.ok(matches('b, i', h('b')), 'true for string')
    t.notOk(matches('i, s', h('b')), 'false for string')

    t.end()
  })

  t.test('tag-names: `div`, `*`', (t) => {
    t.ok(matches('*', h('')), 'true for `*`')
    t.ok(matches('b', h('b')), 'true if tag-names matches')
    t.notOk(matches('b', h('i')), 'false if tag-names don’t matches')

    t.end()
  })

  t.test('id: `#id`', (t) => {
    t.notOk(matches('#one', h('')), 'false if no id exists')
    t.ok(matches('#one', h('#one')), 'true for matchesing id’s')
    t.notOk(matches('#two', h('#one')), 'false for mismatchesed id’s')
    t.ok(
      matches('#two#one', h('#one')),
      'should prefer the last id if multiple id’s are specified (1)'
    )
    t.notOk(
      matches('#one#two', h('#one')),
      'should prefer the last id if multiple id’s are specified (2)'
    )

    t.end()
  })

  t.test('class: `.class`', (t) => {
    t.notOk(matches('.one', h('')), 'false if no class-name exists')
    t.ok(matches('.one', h('.one')), 'true for matchesing class-name')
    t.ok(
      matches('.one', h('.one.two')),
      'true when matchesing in multiple class-name'
    )
    t.notOk(
      matches('.one.two', h('.one')),
      'false if not all class-names exist'
    )

    t.end()
  })

  t.test('attributes, existence: `[attr]`', (t) => {
    t.ok(matches('[class]', h('.one')), 'true if attribute exists')
    t.notOk(matches('[for]', h('.one')), 'false if attribute does not exist')
    t.ok(
      matches('[accesskey]', h('div', {accessKey: ['a']})),
      'true if attribute exists (2)'
    )
    t.ok(
      matches('[data-foo]', h('div', {dataFoo: 'bar'})),
      'true if attribute exists (3)'
    )
    t.notOk(
      matches('[data-bar]', h('div', {dataFoo: 'bar'})),
      'false if attribute does not exist (2)'
    )

    t.end()
  })

  t.test('attributes, equality: `[attr=value]`', (t) => {
    t.ok(
      matches('[id=one]', h('#one')),
      'true if attribute matches (string value)'
    )
    t.ok(
      matches('[class=one]', h('.one')),
      'true if attribute matches (space-separated list, 1)'
    )
    t.ok(
      matches('[class=one two]', h('.one.two')),
      'true if attribute matches (space-separated list, 2)'
    )
    t.ok(
      matches(
        '[accept=audio/*]',
        h('input', {type: 'file', accept: ['audio/*']})
      ),
      'true if attribute matches (comma-separated list)'
    )
    t.ok(
      matches('[hidden=hidden]', h('div', {hidden: true})),
      'true if attribute matches (boolean)'
    )
    t.ok(
      matches('[download=download]', h('a', {download: true})),
      'true if attribute matches (overloaded boolean, 1)'
    )
    t.ok(
      matches('[download=image.png]', h('a', {download: 'image.png'})),
      'true if attribute matches (overloaded boolean, 2)'
    )
    t.ok(
      matches('[tabindex=-1]', h('div', {tabIndex: -1})),
      'true if attribute matches (numeric)'
    )
    t.ok(
      matches('[minlength=3]', h('input', {minLength: 3})),
      'true if attribute matches (positive numeric)'
    )

    t.notOk(
      matches('[id=two]', h('#one')),
      'false if attribute does not matches (string value)'
    )
    t.notOk(
      matches('[class=two]', h('.one')),
      'false if attribute does not matches (space-separated list, 1)'
    )
    t.notOk(
      matches('[class=three four]', h('.one.two')),
      'false if attribute does not matches (space-separated list, 2)'
    )
    t.notOk(
      matches(
        '[accept=image/*]',
        h('input', {type: 'file', accept: ['audio/*']})
      ),
      'false if attribute does not matches (comma-separated list)'
    )
    t.notOk(
      matches('[hidden=hidden]', h('div', {hidden: false})),
      'false if attribute does not matches (boolean)'
    )
    t.notOk(
      matches('[download=download]', h('a', {download: false})),
      'false if attribute does not matches (overloaded boolean, 1)'
    )
    t.notOk(
      matches('[download=image.png]', h('a', {download: 'photo.png'})),
      'false if attribute does not matches (overloaded boolean, 2)'
    )
    t.notOk(
      matches('[tabindex=-1]', h('div', {tabIndex: -2})),
      'false if attribute does not matches (numeric)'
    )
    t.notOk(
      matches('[minlength=3]', h('input', {minLength: 2})),
      'false if attribute does not matches (positive numeric)'
    )

    t.end()
  })

  t.test('attributes, begins: `[attr^=value]`', (t) => {
    t.ok(
      matches('[id^=one]', h('#one')),
      'true if attribute matches (string value)'
    )
    t.ok(
      matches('[id^=on]', h('#one')),
      'true if attribute starts with (string value)'
    )
    t.ok(
      matches('[class^=one]', h('.one.two')),
      'true if attribute starts with (space-separated list)'
    )
    t.ok(
      matches(
        '[accept^=audio]',
        h('input', {type: 'file', accept: ['audio/*']})
      ),
      'true if attribute starts with (comma-separated list)'
    )
    t.ok(
      matches('[hidden^=hid]', h('div', {hidden: true})),
      'true if attribute starts with (boolean)'
    )
    t.ok(
      matches('[download^=down]', h('a', {download: true})),
      'true if attribute starts with (overloaded boolean)'
    )
    t.ok(
      matches('[download^=ima]', h('a', {download: 'image.png'})),
      'true if attribute starts with (overloaded boolean, 2)'
    )
    t.ok(
      matches('[tabindex^=-]', h('div', {tabIndex: -1})),
      'true if attribute starts with (numeric)'
    )
    t.ok(
      matches('[minlength^=1]', h('input', {minLength: 10})),
      'true if attribute starts with (positive numeric)'
    )

    t.notOk(
      matches('[id^=t]', h('#one')),
      'false if attribute does not start with (string value)'
    )
    t.notOk(
      matches('[class^=t]', h('.one')),
      'false if attribute does not start with (space-separated list)'
    )
    t.notOk(
      matches(
        '[accept^=video]',
        h('input', {type: 'file', accept: ['audio/*']})
      ),
      'false if attribute does not start with (comma-separated list)'
    )
    t.notOk(
      matches('[hidden^=hid]', h('div', {hidden: false})),
      'false if attribute does not start with (boolean)'
    )
    t.notOk(
      matches('[download^=down]', h('a', {download: false})),
      'false if attribute does not start with (overloaded boolean, 1)'
    )
    t.notOk(
      matches('[download^=image]', h('a', {download: 'photo.png'})),
      'false if attribute does not start with (overloaded boolean, 2)'
    )
    t.notOk(
      matches('[tabindex^=-]', h('div', {tabIndex: 2})),
      'false if attribute does not start with (numeric)'
    )
    t.notOk(
      matches('[minlength^=1]', h('input', {minLength: 2})),
      'false if attribute does not start with (positive numeric)'
    )

    t.end()
  })

  t.test('attributes, ends: `[attr$=value]`', (t) => {
    t.ok(
      matches('[id$=one]', h('#one')),
      'true if attribute matches (string value)'
    )
    t.ok(
      matches('[id$=ne]', h('#one')),
      'true if attribute ends with (string value)'
    )
    t.ok(
      matches('[class$=wo]', h('.one.two')),
      'true if attribute ends with (space-separated list)'
    )
    t.ok(
      matches('[accept$=*]', h('input', {type: 'file', accept: ['audio/*']})),
      'true if attribute ends with (comma-separated list)'
    )
    t.ok(
      matches('[hidden$=den]', h('div', {hidden: true})),
      'true if attribute ends with (boolean)'
    )
    t.ok(
      matches('[download$=load]', h('a', {download: true})),
      'true if attribute ends with (overloaded boolean)'
    )
    t.ok(
      matches('[download$=png]', h('a', {download: 'image.png'})),
      'true if attribute ends with (overloaded boolean, 2)'
    )
    t.ok(
      matches('[tabindex$=1]', h('div', {tabIndex: -1})),
      'true if attribute ends with (numeric)'
    )
    t.ok(
      matches('[minlength$=0]', h('input', {minLength: 10})),
      'true if attribute ends with (positive numeric)'
    )

    t.notOk(
      matches('[id$=wo]', h('#one')),
      'false if attribute does not end with (string value)'
    )
    t.notOk(
      matches('[class$=wo]', h('.one')),
      'false if attribute does not end with (space-separated list)'
    )
    t.notOk(
      matches('[accept$=doc]', h('input', {type: 'file', accept: ['audio/*']})),
      'false if attribute does not end with (comma-separated list)'
    )
    t.notOk(
      matches('[hidden$=den]', h('div', {hidden: false})),
      'false if attribute does not end with (boolean)'
    )
    t.notOk(
      matches('[download$=load]', h('a', {download: false})),
      'false if attribute does not end with (overloaded boolean, 1)'
    )
    t.notOk(
      matches('[download$=jpg]', h('a', {download: 'photo.png'})),
      'false if attribute does not end with (overloaded boolean, 2)'
    )
    t.notOk(
      matches('[tabindex$=2]', h('div', {tabIndex: -1})),
      'false if attribute does not end with (numeric)'
    )
    t.notOk(
      matches('[minlength$=1]', h('input', {minLength: 2})),
      'false if attribute does not start with (positive numeric)'
    )

    t.end()
  })

  t.test('attributes, contains: `[attr*=value]`', (t) => {
    t.ok(
      matches('[id*=one]', h('#one')),
      'true if attribute matches (string value)'
    )
    t.ok(
      matches('[id*=n]', h('#one')),
      'true if attribute contains (string value)'
    )
    t.ok(
      matches('[class*=w]', h('.one.two')),
      'true if attribute contains (space-separated list)'
    )
    t.ok(
      matches(
        '[accept*=audio/*]',
        h('input', {type: 'file', accept: ['audio/*']})
      ),
      'true if attribute contains (comma-separated list)'
    )
    t.ok(
      matches('[hidden*=dd]', h('div', {hidden: true})),
      'true if attribute contains (boolean)'
    )
    t.ok(
      matches('[download*=nl]', h('a', {download: true})),
      'true if attribute contains (overloaded boolean)'
    )
    t.ok(
      matches('[download*=age]', h('a', {download: 'image.png'})),
      'true if attribute contains (overloaded boolean, 2)'
    )
    t.ok(
      matches('[tabindex*=1]', h('div', {tabIndex: -12})),
      'true if attribute contains (numeric)'
    )
    t.ok(
      matches('[minlength*=0]', h('input', {minLength: 102})),
      'true if attribute contains (positive numeric)'
    )

    t.notOk(
      matches('[id*=w]', h('#one')),
      'false if attribute does not contain (string value)'
    )
    t.notOk(
      matches('[class*=w]', h('.one')),
      'false if attribute does not contain (space-separated list)'
    )
    t.notOk(
      matches(
        '[accept*=video/*]',
        h('input', {type: 'file', accept: ['audio/*']})
      ),
      'false if attribute does not contain (comma-separated list)'
    )

    t.notOk(
      matches('[hidden*=dd]', h('div', {hidden: false})),
      'false if attribute does not contain (boolean)'
    )
    t.notOk(
      matches('[download*=nl]', h('a', {download: false})),
      'false if attribute does not contain (overloaded boolean, 1)'
    )
    t.notOk(
      matches('[download*=age]', h('a', {download: 'photo.png'})),
      'false if attribute does not contain (overloaded boolean, 2)'
    )
    t.notOk(
      matches('[tabindex*=3]', h('div', {tabIndex: -12})),
      'false if attribute does not contain (numeric)'
    )
    t.notOk(
      matches('[minlength*=3]', h('input', {minLength: 102})),
      'false if attribute does not contain (positive numeric)'
    )

    t.end()
  })

  t.test(
    'attributes, contains in space-separated list: `[attr~=value]`',
    (t) => {
      t.ok(
        matches('[id~=one]', h('#one')),
        'true if attribute matches (string value)'
      )
      t.ok(
        matches('[class~=one]', h('.one')),
        'true if attribute matches (space-separated list, 1)'
      )
      t.ok(
        matches('[class~=one two]', h('.one.two')),
        'true if attribute matches (space-separated list, 2)'
      )
      t.ok(
        matches(
          '[accept~=audio/*]',
          h('input', {type: 'file', accept: ['audio/*']})
        ),
        'true if attribute matches (comma-separated list)'
      )
      t.ok(
        matches('[hidden~=hidden]', h('div', {hidden: true})),
        'true if attribute matches (boolean)'
      )
      t.ok(
        matches('[download~=download]', h('a', {download: true})),
        'true if attribute matches (overloaded boolean, 1)'
      )
      t.ok(
        matches('[download~=image.png]', h('a', {download: 'image.png'})),
        'true if attribute matches (overloaded boolean, 2)'
      )
      t.ok(
        matches('[tabindex~=-1]', h('div', {tabIndex: -1})),
        'true if attribute matches (numeric)'
      )
      t.ok(
        matches('[minlength~=3]', h('input', {minLength: 3})),
        'true if attribute matches (positive numeric)'
      )

      t.notOk(
        matches('[id~=two]', h('#one')),
        'false if attribute does not matches (string value)'
      )
      t.notOk(
        matches('[class~=two]', h('.one')),
        'false if attribute does not matches (space-separated list, 1)'
      )
      t.notOk(
        matches('[class~=three four]', h('.one.two')),
        'false if attribute does not matches (space-separated list, 2)'
      )
      t.notOk(
        matches(
          '[accept~=video/*]',
          h('input', {type: 'file', accept: ['audio/*']})
        ),
        'false if attribute does not matches (comma-separated list)'
      )
      t.notOk(
        matches('[hidden~=hidden]', h('div', {hidden: false})),
        'false if attribute does not matches (boolean)'
      )
      t.notOk(
        matches('[download~=download]', h('a', {download: false})),
        'false if attribute does not matches (overloaded boolean, 1)'
      )
      t.notOk(
        matches('[download~=image.png]', h('a', {download: 'photo.png'})),
        'false if attribute does not matches (overloaded boolean, 2)'
      )
      t.notOk(
        matches('[tabindex~=-1]', h('div', {tabIndex: -2})),
        'false if attribute does not matches (numeric)'
      )
      t.notOk(
        matches('[minlength~=3]', h('input', {minLength: 2})),
        'false if attribute does not matches (positive numeric)'
      )

      t.ok(
        matches('[class~=one]', h('.one.two')),
        'true if attribute part exists (space-separated list, 1)'
      )
      t.ok(
        matches('[class~=two]', h('.one.two')),
        'true if attribute part exists (space-separated list, 2)'
      )
      t.notOk(
        matches('[class~=three]', h('.one.two')),
        'false if attribute part does not exist (space-separated list)'
      )

      t.end()
    }
  )

  t.test('attributes, starts or prefixes: `[attr|=value]`', (t) => {
    t.ok(
      matches('[id|=one]', h('#one')),
      'true if attribute matches (string value)'
    )
    t.ok(
      matches('[class|=one]', h('.one')),
      'true if attribute matches (space-separated list, 1)'
    )
    t.ok(
      matches('[class|=one two]', h('.one.two')),
      'true if attribute matches (space-separated list, 2)'
    )
    t.ok(
      matches(
        '[accept|=audio/*]',
        h('input', {type: 'file', accept: ['audio/*']})
      ),
      'true if attribute matches (comma-separated list)'
    )
    t.ok(
      matches('[hidden|=hidden]', h('div', {hidden: true})),
      'true if attribute matches (boolean)'
    )
    t.ok(
      matches('[download|=download]', h('a', {download: true})),
      'true if attribute matches (overloaded boolean, 1)'
    )
    t.ok(
      matches('[download|=image.png]', h('a', {download: 'image.png'})),
      'true if attribute matches (overloaded boolean, 2)'
    )
    t.ok(
      matches('[tabindex|=-1]', h('div', {tabIndex: -1})),
      'true if attribute matches (numeric)'
    )
    t.ok(
      matches('[minlength|=3]', h('input', {minLength: 3})),
      'true if attribute matches (positive numeric)'
    )

    t.notOk(
      matches('[id|=two]', h('#one')),
      'false if attribute does not matches (string value)'
    )
    t.notOk(
      matches('[class|=two]', h('.one')),
      'false if attribute does not matches (space-separated list, 1)'
    )
    t.notOk(
      matches('[class|=three four]', h('.one.two')),
      'false if attribute does not matches (space-separated list, 2)'
    )
    t.notOk(
      matches(
        '[accept|=video/*]',
        h('input', {type: 'file', accept: ['audio/*']})
      ),
      'false if attribute does not matches (comma-separated list)'
    )
    t.notOk(
      matches('[hidden|=hidden]', h('div', {hidden: false})),
      'false if attribute does not matches (boolean)'
    )
    t.notOk(
      matches('[download|=download]', h('a', {download: false})),
      'false if attribute does not matches (overloaded boolean, 1)'
    )
    t.notOk(
      matches('[download|=image.png]', h('a', {download: 'photo.png'})),
      'false if attribute does not matches (overloaded boolean, 2)'
    )
    t.notOk(
      matches('[tabindex|=-1]', h('div', {tabIndex: -2})),
      'false if attribute does not matches (numeric)'
    )
    t.notOk(
      matches('[minlength|=3]', h('input', {minLength: 2})),
      'false if attribute does not matches (positive numeric)'
    )

    t.ok(
      matches('[alpha|=bravo]', h('div', {alpha: 'bravo'})),
      'true if value starts with'
    )
    t.ok(
      matches('[alpha|=bravo]', h('div', {alpha: 'bravo-charlie'})),
      'true if value prefixes'
    )
    t.notOk(
      matches('[alpha|=bravo]', h('div', {alpha: 'bravocharlie'})),
      'false if value does not prefix'
    )
    t.notOk(
      matches('[alpha|=charlie]', h('div', {alpha: 'bravo'})),
      'false if value does start with'
    )

    t.end()
  })

  t.test('pseudo-classes', (t) => {
    const anyMatchesPseudos = [':any', ':matches']
    let index = -1

    while (++index < anyMatchesPseudos.length) {
      const pseudo = anyMatchesPseudos[index]

      t.test(pseudo, (t) => {
        t.ok(
          matches(pseudo + '(a, [title], .class)', h('a')),
          'true if any matches (type)'
        )
        t.ok(
          matches(pseudo + '(a, [title], .class)', h('.class')),
          'true if any matches (.class)'
        )
        t.ok(
          matches(pseudo + '(a, [title], .class)', h('div', {title: '1'})),
          'true if any matches (attribute existence)'
        )
        t.notOk(
          matches(pseudo + '(a, [title], .class)', h('i')),
          'false if nothing matches'
        )
        t.notOk(
          matches(pseudo + '(a, [title], .class)', h('div', h('i.class'))),
          'false if children match'
        )

        t.end()
      })
    }

    t.test(':not()', (t) => {
      t.notOk(
        matches(':not(a, [title], .class)', h('a')),
        'false if any matches (type)'
      )
      t.notOk(
        matches(':not(a, [title], .class)', h('.class')),
        'false if any matches (.class)'
      )
      t.notOk(
        matches(':not(a, [title], .class)', h('div', {title: '1'})),
        'false if any matches (attribute existence)'
      )
      t.ok(
        matches(':not(a, [title], .class)', h('i')),
        'true if nothing matches'
      )
      t.ok(
        matches(':not(a, [title], .class)', h('div', h('i.class'))),
        'true if children match'
      )

      t.end()
    })

    t.test(':has', (t) => {
      t.doesNotThrow(() => {
        matches('section:not(:has())', h('p'))
      }, 'should not throw on empty selectors')

      t.doesNotThrow(() => {
        matches('section:has()', h('p'))
      }, 'should not throw on empty selectors')

      t.notOk(
        matches('p:has(p)', h('p', h('s'))),
        'should not match the scope element (#1)'
      )
      t.ok(
        matches('p:has(p)', h('p', h('p'))),
        'should not match the scope element (#2)'
      )
      t.ok(
        matches('a:has(img)', h('a', h('img'))),
        'true if children match the descendant selector'
      )
      t.notOk(
        matches('a:has(img)', h('a', h('span'))),
        'false if no children match the descendant selector'
      )
      t.ok(
        matches('a:has(img)', h('a', h('span'), h('img'))),
        'true if descendants match the descendant selector'
      )
      t.notOk(
        matches('a:has(img)', h('a', h('span', h('span')))),
        'false if no descendants match the descendant selector'
      )

      t.ok(
        matches('dd:has(dt + dd)', h('dd', [h('dt'), h('dd')])),
        'should support a nested next-sibling selector (#1)'
      )

      t.notOk(
        matches('dd:has(dt + dd)', h('dd', [h('dt'), h('dt')])),
        'should support a nested next-sibling selector (#2)'
      )

      t.ok(
        matches('a:has([title])', h('a', h('s', {title: 'a'}))),
        'should add `:scope` to sub-selectors (#1)'
      )
      t.notOk(
        matches('a:has([title])', h('a', {title: '!'}, h('s'))),
        'should add `:scope` to sub-selectors (#2)'
      )
      t.notOk(
        matches('a:has(a, :scope i)', h('a', h('s'))),
        'should add `:scope` to all sub-selectors (#2)'
      )

      t.ok(
        matches('section:not(:has(h1, h2, h3, h4, h5, h6))', h('section', [])),
        'should add `:scope` to all sub-selectors (#3)'
      )

      t.ok(
        matches(
          'section:not(:has(h1, h2, h3, h4, h5, h6))',
          h('section', [h('p', '!')])
        ),
        'should add `:scope` to all sub-selectors (#4)'
      )

      t.notOk(
        matches(
          'section:has(:lang(en, fr))',
          h('section', [h('q', {lang: 'de'})])
        ),
        'should ignore commas in parens (#1)'
      )
      t.ok(
        matches(
          'section:has(:lang(en, fr))',
          h('section', [h('q', {lang: 'en'})])
        ),
        'should ignore commas in parens (#2)'
      )

      t.notOk(
        matches(
          'section:has(:matches(i), :matches(b))',
          h('section', [h('s')])
        ),
        'should support multiple relative selectors (#1)'
      )
      t.ok(
        matches(
          'section:has(:matches(i), :matches(b))',
          h('section', [h('b')])
        ),
        'should support multiple relative selectors (#2)'
      )

      // This checks white-space.
      t.ok(matches('a:has( img)', h('a', h('img'))), 'assertion (#1)')
      t.ok(matches('a:has( img  )', h('a', h('img'))), 'assertion (#2)')
      t.ok(matches('a:has(img )', h('a', h('img'))), 'assertion (#3)')
      t.ok(matches('a:has( img  ,\t p )', h('a', h('img'))), 'assertion (#4)')

      // Note: These should be unquoted, but that’s not supported by the CSS
      // parser:
      //
      // t.ok(
      //   matches('a:has(> img)', h('a', h('img'))),
      //   'true for relative direct child selector'
      // )
      // t.notOk(
      //   matches('a:has(> img)', h('a', h('span', h('img')))),
      //   'false for relative direct child selectors'
      // )
      // t.ok(
      //   matches('a:has(> img, > span)', h('a', h('span', h('span')))),
      //   'should support a list of relative selectors'
      // )

      t.end()
    })

    t.test(':any-link', (t) => {
      const links = ['a', 'area', 'link']
      let index = -1

      while (++index < links.length) {
        const name = links[index]

        t.ok(
          matches(':any-link', h(name, {href: '#'})),
          'true if w/ href on ' + name
        )
        t.notOk(matches(':any-link', h(name)), 'false if w/o href on ' + name)
      }

      t.end()
    })

    t.test(':checked', (t) => {
      t.ok(
        matches(':checked', h('input', {type: 'checkbox', checked: true})),
        'true for checkbox inputs w/ `checked`'
      )
      t.ok(
        matches(':checked', h('input', {type: 'radio', checked: true})),
        'true for radio inputs w/ `checked`'
      )
      t.ok(
        matches(':checked', h('menuitem', {type: 'checkbox', checked: true})),
        'true for checkbox menuitems w/ `checked`'
      )
      t.ok(
        matches(':checked', h('menuitem', {type: 'radio', checked: true})),
        'true for radio menuitems w/ `checked`'
      )
      t.ok(
        matches(':checked', h('option', {selected: true})),
        'true for options w/ `selected`'
      )

      t.notOk(
        matches(':checked', h('input', {type: 'checkbox', checked: false})),
        'false for checkbox inputs w/o `checked`'
      )
      t.notOk(
        matches(':checked', h('input', {type: 'radio', checked: false})),
        'false for radio inputs w/o `checked`'
      )
      t.notOk(
        matches(':checked', h('menuitem', {type: 'checkbox', checked: false})),
        'false for checkbox menuitems w/o `checked`'
      )
      t.notOk(
        matches(':checked', h('menuitem', {type: 'radio', checked: false})),
        'false for radio menuitems w/o `checked`'
      )
      t.notOk(
        matches(':checked', h('option', {selected: false})),
        'false for options w/o `selected`'
      )

      t.notOk(matches(':checked', h('')), 'false for other nodes')

      t.end()
    })

    t.test(':disabled', (t) => {
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

        t.ok(
          matches(':disabled', h(name, {disabled: true})),
          'true if w/ disabled on ' + name
        )
        t.notOk(
          matches(':disabled', h(name)),
          'false if w/o disabled on ' + name
        )
      }

      t.end()
    })

    t.test(':enabled', (t) => {
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
        t.ok(matches(':enabled', h(name)), 'true if w/o disabled on ' + name)
        t.notOk(
          matches(':enabled', h(name, {disabled: true})),
          'false if w/ disabled on ' + name
        )
      }

      t.end()
    })

    t.test(':required', (t) => {
      const things = ['input', 'textarea', 'select']
      let index = -1

      while (++index < things.length) {
        const name = things[index]
        t.ok(
          matches(':required', h(name, {required: true})),
          'true if w/ required on ' + name
        )
        t.notOk(
          matches(':required', h(name)),
          'false if w/o required on ' + name
        )
      }

      t.end()
    })

    t.test(':optional', (t) => {
      const things = ['input', 'textarea', 'select']

      let index = -1

      while (++index < things.length) {
        const name = things[index]
        t.ok(matches(':optional', h(name)), 'true if w/o required on ' + name)
        t.notOk(
          matches(':optional', h(name, {required: true})),
          'false if w/ required on ' + name
        )
      }

      t.end()
    })

    t.test(':empty', (t) => {
      t.ok(matches(':empty', h('')), 'true if w/o children')
      t.ok(
        matches(':empty', h('', u('comment', '?'))),
        'true if w/o elements or texts'
      )
      t.notOk(matches(':empty', h('', h(''))), 'false if w/ elements')
      t.notOk(matches(':empty', h('', u('text', '.'))), 'false if w/ text')
      t.notOk(
        matches(':empty', h('', u('text', ' '))),
        'false if w/ white-space text'
      )

      t.end()
    })

    t.test(':blank', (t) => {
      t.ok(matches(':blank', h('')), 'true if w/o children')
      t.ok(
        matches(':blank', h('', u('comment', '?'))),
        'true if w/o elements or texts'
      )
      t.ok(
        matches(':blank', h('', u('text', ' '))),
        'true if w/ white-space text'
      )
      t.notOk(matches(':blank', h('', h(''))), 'false if w/ elements')
      t.notOk(matches(':blank', h('', u('text', '.'))), 'false if w/ text')

      t.end()
    })

    t.test(':lang()', (t) => {
      t.ok(
        matches(':lang(de, en)', h('html', {xmlLang: 'en'})),
        'true if the element has an `xml:lang` attribute'
      )

      t.ok(
        matches(':lang(de, en)', h('html', {lang: 'de'})),
        'true if the element has a `lang` attribute'
      )

      t.notOk(
        matches(':lang(de, en)', h('html', {xmlLang: 'jp'})),
        'false if the element has an different language set'
      )

      t.notOk(
        matches(':lang(de, en)', h('html', {xmlLang: 'jp', lang: 'de'})),
        'should prefer `xmlLang` over `lang` (#1)'
      )

      t.ok(
        matches(':lang(de, en)', h('html', {xmlLang: 'de', lang: 'jp'})),
        'should prefer `xmlLang` over `lang` (#2)'
      )

      t.notOk(
        matches(':lang(de, en)', h('html', {xmlLang: 'jp'})),
        'false if the element has an different language set'
      )

      t.ok(
        matches(':lang("*")', h('html', {lang: 'en'})),
        'should support wildcards'
      )

      t.notOk(
        matches(':lang(en)', h('html', {lang: ''})),
        'false if [lang] is an empty string (means unknown language)'
      )

      t.notOk(
        matches(':lang(*)', h('html', {lang: ''})),
        'false with wildcard if [lang] is an empty string (means unknown language)'
      )

      t.ok(
        matches(':lang("de-*-DE")', h('html', {lang: 'de-Latn-DE'})),
        'should support non-primary wildcard subtags (#1)'
      )

      // Not supported by `css-selector-parser` yet :(
      //
      // t.ok(
      //   matches(':lang("fr-BE", "de-*-DE")', h('html', {lang: 'de-Latn-DE'})),
      //   'should support non-primary wildcard subtags (#2)'
      // )

      t.end()
    })

    t.test(':dir()', (t) => {
      const ltr = 'a'
      const rtl = 'أ'
      const neutral = '!'

      t.ok(
        matches(':dir(ltr)', h('html', {dir: 'ltr'})),
        'matching `ltr` if the element has a matching explicit `dir` attribute'
      )

      t.ok(
        matches(':dir(rtl)', h('html', {dir: 'rtl'})),
        'matching `rtl` if the element has a matching explicit `dir` attribute'
      )

      t.ok(
        matches(':dir(ltr)', h('html')),
        'matching `ltr` if the element is `html` with no `dir` attribute'
      )

      t.ok(
        matches(':dir(ltr)', h('html', {dir: 'foo'})),
        'matching `ltr` if the element is `html` with an invalid `dir` attribute'
      )

      t.ok(
        matches(':dir(ltr)', h('input', {type: 'tel'})),
        'matching `ltr` if the element is `input[type=tel]` with no `dir` attribute'
      )

      t.ok(
        matches(':dir(ltr)', h('input', {type: 'tel', dir: 'foo'})),
        'matching `ltr` if the element is `input[type=tel]` with an invalid `dir` attribute'
      )

      t.ok(
        matches(':dir(ltr)', h('textarea', {dir: 'auto'}, ltr)),
        'matching `ltr` if `[dir=auto]` on a textarea and it’s content is BIDI LTR'
      )

      t.ok(
        matches(':dir(rtl)', h('textarea', {dir: 'auto'}, rtl)),
        'matching `rtl` if `[dir=auto]` on a textarea and it’s content is BIDI RTL'
      )

      t.ok(
        matches(':dir(ltr)', h('textarea', {dir: 'auto'}, neutral)),
        'matching `ltr` if `[dir=auto]` on a textarea and it’s content is BIDI neutral'
      )

      t.ok(
        matches(':dir(ltr)', h('input', {dir: 'auto', value: ltr})),
        'matching `ltr` if `[dir=auto]` on a text input and it’s value is BIDI LTR'
      )

      t.ok(
        matches(
          ':dir(rtl)',
          h('input', {type: 'search', dir: 'auto', value: rtl})
        ),
        'matching `rtl` if `[dir=auto]` on a search input and it’s value is BIDI RTL'
      )

      t.ok(
        matches(
          ':dir(ltr)',
          h('input', {type: 'url', dir: 'auto', value: neutral})
        ),
        'matching `ltr` if `[dir=auto]` on a URL input and it’s value is BIDI neutral'
      )

      t.ok(
        matches(':dir(ltr)', h('input', {type: 'email', dir: 'auto'})),
        'matching `ltr` if `[dir=auto]` on an email input without value'
      )

      t.ok(
        matches(':dir(ltr)', h('p', {dir: 'auto'}, ltr)),
        'matching `ltr` if `[dir=auto]` and the element has BIDI LTR text'
      )

      t.ok(
        matches(':dir(rtl)', h('p', {dir: 'auto'}, rtl)),
        'matching `rtl` if `[dir=auto]` and the element has BIDI RTL text'
      )

      t.ok(
        matches(':dir(ltr)', h('p', {dir: 'auto'}, neutral)),
        'matching `ltr` if `[dir=auto]` and the element has BIDI neutral text'
      )

      t.ok(
        matches(':dir(ltr)', h('p', {dir: 'auto'}, [neutral, ltr, rtl])),
        'matching `ltr` if `[dir=auto]` and the element has BIDI neutral text followed by LTR text'
      )

      t.ok(
        matches(':dir(rtl)', h('p', {dir: 'auto'}, [neutral, rtl, ltr])),
        'matching `rtl` if `[dir=auto]` and the element has BIDI neutral text followed by RTL text'
      )

      t.ok(
        matches(
          ':dir(ltr)',
          h('p', {dir: 'auto'}, [neutral, h('script', rtl), ltr])
        ),
        'matching `ltr` if `[dir=auto]`, ignoring BIDI text in scripts, followed by LTR text'
      )

      t.ok(
        matches(
          ':dir(rtl)',
          h('p', {dir: 'auto'}, [neutral, h('style', ltr), rtl])
        ),
        'matching `rtl` if `[dir=auto]`, ignoring BIDI text in styles, followed by RTL text'
      )

      t.ok(
        matches(
          ':dir(ltr)',
          h('p', {dir: 'auto'}, [neutral, h('span', {dir: 'rtl'}, rtl), ltr])
        ),
        'matching `ltr` if `[dir=auto]`, ignoring elements with directions, followed by LTR text'
      )

      t.ok(
        matches(
          ':dir(rtl)',
          h('p', {dir: 'auto'}, [neutral, h('span', {dir: 'ltr'}, ltr), rtl])
        ),
        'matching `rtl` if `[dir=auto]`, ignoring elements with directions, followed by RTL text'
      )

      t.ok(
        matches(
          ':dir(ltr)',
          h('bdi', [neutral, h('span', {dir: 'rtl'}, rtl), ltr])
        ),
        'matching `ltr` on `bdi` elements, ignoring elements with directions, followed by LTR text'
      )

      t.ok(
        matches(
          ':dir(rtl)',
          h('bdi', [neutral, h('span', {dir: 'ltr'}, ltr), rtl])
        ),
        'matching `rtl` on `bdi` elements, ignoring elements with directions, followed by RTL text'
      )

      t.end()
    })

    t.test(':root', (t) => {
      t.ok(matches(':root', h('html')), 'true if `<html>` in HTML space')

      t.notOk(matches(':root', h('div')), 'false if not `<html>` in HTML space')

      t.ok(matches(':root', s('svg'), 'svg'), 'true if `<svg>` in SVG space')

      t.notOk(
        matches(':root', s('circle'), 'svg'),
        'false if not `<svg>` in SVG space'
      )

      t.end()
    })

    t.test(':scope', (t) => {
      t.ok(matches(':scope', h('html')), 'always true for elements')
      t.ok(matches(':scope', h('p')), 'always true for elements')
      t.notOk(matches(':scope', u('text', '!')), 'always true for elements')
      t.end()
    })

    t.test(':read-write', (t) => {
      t.ok(matches(':read-write', h('input')), 'true on input')
      t.ok(matches(':read-write', h('input')), 'true on textarea')
      t.notOk(
        matches(':read-write', h('input', {readOnly: true})),
        'false on input w/ readonly'
      )
      t.notOk(
        matches(':read-write', h('textarea', {readOnly: true})),
        'false on textarea w/ readonly'
      )
      t.notOk(
        matches(':read-write', h('input', {disabled: true})),
        'false on input w/ disabled'
      )
      t.notOk(
        matches(':read-write', h('textarea', {disabled: true})),
        'false on textarea w/ disabled'
      )
      t.ok(
        matches(':read-write', h('div', {contentEditable: 'true'})),
        'true on element w/ contenteditable'
      )

      t.end()
    })

    t.test(':read-only', (t) => {
      t.notOk(matches(':read-only', h('input')), 'false on input')
      t.notOk(matches(':read-only', h('input')), 'false on textarea')
      t.ok(
        matches(':read-only', h('input', {readOnly: true})),
        'true on input w/ readonly'
      )
      t.ok(
        matches(':read-only', h('textarea', {readOnly: true})),
        'true on textarea w/ readonly'
      )
      t.ok(
        matches(':read-only', h('input', {disabled: true})),
        'true on input w/ disabled'
      )
      t.ok(
        matches(':read-only', h('textarea', {disabled: true})),
        'true on textarea w/ disabled'
      )
      t.notOk(
        matches(':read-only', h('div', {contentEditable: 'true'})),
        'false on element w/ contenteditable'
      )

      t.end()
    })

    t.end()
  })

  t.end()
})
