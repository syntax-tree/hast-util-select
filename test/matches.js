'use strict'

var test = require('tape')
var u = require('unist-builder')
var h = require('hastscript')
var matches = require('..').matches

test('select.matches()', function(t) {
  t.test('invalid selector', function(st) {
    st.throws(
      function() {
        matches()
      },
      /Error: Expected `string` as selector, not `undefined`/,
      'should throw without selector'
    )

    st.throws(
      function() {
        matches([], h())
      },
      /Error: Expected `string` as selector, not ``/,
      'should throw w/ invalid selector (1)'
    )

    st.throws(
      function() {
        matches('@supports (transform-origin: 5% 5%) {}', h())
      },
      /Error: Rule expected but "@" found./,
      'should throw w/ invalid selector (2)'
    )

    st.throws(
      function() {
        matches('[foo%=bar]', h())
      },
      /Error: Expected "=" but "%" found./,
      'should throw on invalid attribute operators'
    )

    st.throws(
      function() {
        matches(':active', h())
      },
      /Error: Unknown pseudo-selector `active`/,
      'should throw on invalid pseudo classes'
    )

    st.throws(
      function() {
        matches(':nth-foo(2n+1)', h())
      },
      /Error: Unknown pseudo-selector `nth-foo`/,
      'should throw on invalid pseudo class “functions”'
    )

    st.throws(
      function() {
        matches('::before', h())
      },
      /Error: Unexpected pseudo-element or empty pseudo-class/,
      'should throw on invalid pseudo elements'
    )

    st.throws(
      function() {
        matches('foo bar', h())
      },
      /Error: Expected selector without nesting/,
      'should throw on nested selectors (descendant)'
    )

    st.throws(
      function() {
        matches('foo > bar', h())
      },
      /Error: Expected selector without nesting/,
      'should throw on nested selectors (direct child)'
    )

    st.end()
  })

  t.test('parent-sensitive pseudo-selectors', function(st) {
    ;[
      'first-child',
      'last-child',
      'only-child',
      'first-of-type',
      'last-of-type',
      'only-of-type'
    ].forEach(function(pseudo) {
      st.throws(
        function() {
          matches(':' + pseudo, h())
        },
        new RegExp('Error: Cannot use `:' + pseudo + '` without parent'),
        'should throw on `' + pseudo + '`'
      )
    })
    ;['nth-child', 'nth-last-child', 'nth-of-type', 'nth-last-of-type'].forEach(
      function(pseudo) {
        st.throws(
          function() {
            matches(':' + pseudo + '()', h())
          },
          new RegExp('Error: Cannot use `:' + pseudo + '` without parent'),
          'should throw on `' + pseudo + '()`'
        )
      }
    )

    st.end()
  })

  t.test('general', function(st) {
    st.notOk(matches('', h()), 'false for the empty string as selector')
    st.notOk(matches(' ', h()), 'false for a white-space only selector')
    st.notOk(matches('*'), 'false if not given a node')
    st.notOk(
      matches('*', {type: 'text', value: 'a'}),
      'false if not given an element'
    )

    st.end()
  })

  t.test('multiple selectors', function(st) {
    st.ok(matches('b, i', h('b')), 'true for string')
    st.notOk(matches('i, s', h('b')), 'false for string')

    st.end()
  })

  t.test('tag-names: `div`, `*`', function(st) {
    st.ok(matches('*', h()), 'true for `*`')
    st.ok(matches('b', h('b')), 'true if tag-names matches')
    st.notOk(matches('b', h('i')), 'false if tag-names don’t matches')

    st.end()
  })

  t.test('id: `#id`', function(st) {
    st.notOk(matches('#one', h()), 'false if no id exists')
    st.ok(matches('#one', h('#one')), 'true for matchesing id’s')
    st.notOk(matches('#two', h('#one')), 'false for mismatchesed id’s')
    st.ok(
      matches('#two#one', h('#one')),
      'should prefer the last id if multiple id’s are specified (1)'
    )
    st.notOk(
      matches('#one#two', h('#one')),
      'should prefer the last id if multiple id’s are specified (2)'
    )

    st.end()
  })

  t.test('class: `.class`', function(st) {
    st.notOk(matches('.one', h()), 'false if no class-name exists')
    st.ok(matches('.one', h('.one')), 'true for matchesing class-name')
    st.ok(
      matches('.one', h('.one.two')),
      'true when matchesing in multiple class-name'
    )
    st.notOk(
      matches('.one.two', h('.one')),
      'false if not all class-names exist'
    )

    st.end()
  })

  t.test('attributes, existance: `[attr]`', function(st) {
    st.ok(matches('[class]', h('.one')), 'true if attribute exists')
    st.notOk(matches('[for]', h('.one')), 'false if attribute does not exist')
    st.ok(
      matches('[accesskey]', h('div', {accessKey: ['a']})),
      'true if attribute exists (2)'
    )
    st.ok(
      matches('[data-foo]', h('div', {dataFoo: 'bar'})),
      'true if attribute exists (3)'
    )
    st.notOk(
      matches('[data-bar]', h('div', {dataFoo: 'bar'})),
      'false if attribute does not exist (2)'
    )

    st.end()
  })

  t.test('attributes, equality: `[attr=value]`', function(st) {
    st.ok(
      matches('[id=one]', h('#one')),
      'true if attribute matches (string value)'
    )
    st.ok(
      matches('[class=one]', h('.one')),
      'true if attribute matches (space-separated list, 1)'
    )
    st.ok(
      matches('[class=one two]', h('.one.two')),
      'true if attribute matches (space-separated list, 2)'
    )
    st.ok(
      matches('[srcset=cat-big.jpg]', h('source', {srcSet: ['cat-big.jpg']})),
      'true if attribute matches (comma-separated list)'
    )
    st.ok(
      matches('[hidden=hidden]', h('div', {hidden: true})),
      'true if attribute matches (boolean)'
    )
    st.ok(
      matches('[download=download]', h('a', {download: true})),
      'true if attribute matches (overloaded boolean, 1)'
    )
    st.ok(
      matches('[download=image.png]', h('a', {download: 'image.png'})),
      'true if attribute matches (overloaded boolean, 2)'
    )
    st.ok(
      matches('[tabindex=-1]', h('div', {tabIndex: -1})),
      'true if attribute matches (numeric)'
    )
    st.ok(
      matches('[minlength=3]', h('input', {minLength: 3})),
      'true if attribute matches (positive numeric)'
    )

    st.notOk(
      matches('[id=two]', h('#one')),
      'false if attribute does not matches (string value)'
    )
    st.notOk(
      matches('[class=two]', h('.one')),
      'false if attribute does not matches (space-separated list, 1)'
    )
    st.notOk(
      matches('[class=three four]', h('.one.two')),
      'false if attribute does not matches (space-separated list, 2)'
    )
    st.notOk(
      matches('[srcset=cat-small.jpg]', h('source', {srcSet: ['cat-big.jpg']})),
      'false if attribute does not matches (comma-separated list)'
    )
    st.notOk(
      matches('[hidden=hidden]', h('div', {hidden: false})),
      'false if attribute does not matches (boolean)'
    )
    st.notOk(
      matches('[download=download]', h('a', {download: false})),
      'false if attribute does not matches (overloaded boolean, 1)'
    )
    st.notOk(
      matches('[download=image.png]', h('a', {download: 'photo.png'})),
      'false if attribute does not matches (overloaded boolean, 2)'
    )
    st.notOk(
      matches('[tabindex=-1]', h('div', {tabIndex: -2})),
      'false if attribute does not matches (numeric)'
    )
    st.notOk(
      matches('[minlength=3]', h('input', {minLength: 2})),
      'false if attribute does not matches (positive numeric)'
    )

    st.end()
  })

  t.test('attributes, begins: `[attr^=value]`', function(st) {
    st.ok(
      matches('[id^=one]', h('#one')),
      'true if attribute matches (string value)'
    )
    st.ok(
      matches('[id^=on]', h('#one')),
      'true if attribute starts with (string value)'
    )
    st.ok(
      matches('[class^=one]', h('.one.two')),
      'true if attribute starts with (space-separated list)'
    )
    st.ok(
      matches('[srcset^=cat]', h('source', {srcSet: ['cat-big.jpg']})),
      'true if attribute starts with (comma-separated list)'
    )
    st.ok(
      matches('[hidden^=hid]', h('div', {hidden: true})),
      'true if attribute starts with (boolean)'
    )
    st.ok(
      matches('[download^=down]', h('a', {download: true})),
      'true if attribute starts with (overloaded boolean)'
    )
    st.ok(
      matches('[download^=ima]', h('a', {download: 'image.png'})),
      'true if attribute starts with (overloaded boolean, 2)'
    )
    st.ok(
      matches('[tabindex^=-]', h('div', {tabIndex: -1})),
      'true if attribute starts with (numeric)'
    )
    st.ok(
      matches('[minlength^=1]', h('input', {minLength: 10})),
      'true if attribute starts with (positive numeric)'
    )

    st.notOk(
      matches('[id^=t]', h('#one')),
      'false if attribute does not start with (string value)'
    )
    st.notOk(
      matches('[class^=t]', h('.one')),
      'false if attribute does not start with (space-separated list)'
    )
    st.notOk(
      matches('[srcset^=dog]', h('source', {srcSet: ['cat-big.jpg']})),
      'false if attribute does not start with (comma-separated list)'
    )
    st.notOk(
      matches('[hidden^=hid]', h('div', {hidden: false})),
      'false if attribute does not start with (boolean)'
    )
    st.notOk(
      matches('[download^=down]', h('a', {download: false})),
      'false if attribute does not start with (overloaded boolean, 1)'
    )
    st.notOk(
      matches('[download^=image]', h('a', {download: 'photo.png'})),
      'false if attribute does not start with (overloaded boolean, 2)'
    )
    st.notOk(
      matches('[tabindex^=-]', h('div', {tabIndex: 2})),
      'false if attribute does not start with (numeric)'
    )
    st.notOk(
      matches('[minlength^=1]', h('input', {minLength: 2})),
      'false if attribute does not start with (positive numeric)'
    )

    st.end()
  })

  t.test('attributes, ends: `[attr$=value]`', function(st) {
    st.ok(
      matches('[id$=one]', h('#one')),
      'true if attribute matches (string value)'
    )
    st.ok(
      matches('[id$=ne]', h('#one')),
      'true if attribute ends with (string value)'
    )
    st.ok(
      matches('[class$=wo]', h('.one.two')),
      'true if attribute ends with (space-separated list)'
    )
    st.ok(
      matches('[srcset$=jpg]', h('source', {srcSet: ['cat-big.jpg']})),
      'true if attribute ends with (comma-separated list)'
    )
    st.ok(
      matches('[hidden$=den]', h('div', {hidden: true})),
      'true if attribute ends with (boolean)'
    )
    st.ok(
      matches('[download$=load]', h('a', {download: true})),
      'true if attribute ends with (overloaded boolean)'
    )
    st.ok(
      matches('[download$=png]', h('a', {download: 'image.png'})),
      'true if attribute ends with (overloaded boolean, 2)'
    )
    st.ok(
      matches('[tabindex$=1]', h('div', {tabIndex: -1})),
      'true if attribute ends with (numeric)'
    )
    st.ok(
      matches('[minlength$=0]', h('input', {minLength: 10})),
      'true if attribute ends with (positive numeric)'
    )

    st.notOk(
      matches('[id$=wo]', h('#one')),
      'false if attribute does not end with (string value)'
    )
    st.notOk(
      matches('[class$=wo]', h('.one')),
      'false if attribute does not end with (space-separated list)'
    )
    st.notOk(
      matches('[srcset$=png]', h('source', {srcSet: ['cat-big.jpg']})),
      'false if attribute does not end with (comma-separated list)'
    )
    st.notOk(
      matches('[hidden$=den]', h('div', {hidden: false})),
      'false if attribute does not end with (boolean)'
    )
    st.notOk(
      matches('[download$=load]', h('a', {download: false})),
      'false if attribute does not end with (overloaded boolean, 1)'
    )
    st.notOk(
      matches('[download$=jpg]', h('a', {download: 'photo.png'})),
      'false if attribute does not end with (overloaded boolean, 2)'
    )
    st.notOk(
      matches('[tabindex$=2]', h('div', {tabIndex: -1})),
      'false if attribute does not end with (numeric)'
    )
    st.notOk(
      matches('[minlength$=1]', h('input', {minLength: 2})),
      'false if attribute does not start with (positive numeric)'
    )

    st.end()
  })

  t.test('attributes, contains: `[attr*=value]`', function(st) {
    st.ok(
      matches('[id*=one]', h('#one')),
      'true if attribute matches (string value)'
    )
    st.ok(
      matches('[id*=n]', h('#one')),
      'true if attribute contains (string value)'
    )
    st.ok(
      matches('[class*=w]', h('.one.two')),
      'true if attribute contains (space-separated list)'
    )
    st.ok(
      matches('[srcset*=big]', h('source', {srcSet: ['cat-big.jpg']})),
      'true if attribute contains (comma-separated list)'
    )
    st.ok(
      matches('[hidden*=dd]', h('div', {hidden: true})),
      'true if attribute contains (boolean)'
    )
    st.ok(
      matches('[download*=nl]', h('a', {download: true})),
      'true if attribute contains (overloaded boolean)'
    )
    st.ok(
      matches('[download*=age]', h('a', {download: 'image.png'})),
      'true if attribute contains (overloaded boolean, 2)'
    )
    st.ok(
      matches('[tabindex*=1]', h('div', {tabIndex: -12})),
      'true if attribute contains (numeric)'
    )
    st.ok(
      matches('[minlength*=0]', h('input', {minLength: 102})),
      'true if attribute contains (positive numeric)'
    )

    st.notOk(
      matches('[id*=w]', h('#one')),
      'false if attribute does not contain (string value)'
    )
    st.notOk(
      matches('[class*=w]', h('.one')),
      'false if attribute does not contain (space-separated list)'
    )
    st.notOk(
      matches('[srcset*=small]', h('source', {srcSet: ['cat-big.jpg']})),
      'false if attribute does not contain (comma-separated list)'
    )

    st.notOk(
      matches('[hidden*=dd]', h('div', {hidden: false})),
      'false if attribute does not contain (boolean)'
    )
    st.notOk(
      matches('[download*=nl]', h('a', {download: false})),
      'false if attribute does not contain (overloaded boolean, 1)'
    )
    st.notOk(
      matches('[download*=age]', h('a', {download: 'photo.png'})),
      'false if attribute does not contain (overloaded boolean, 2)'
    )
    st.notOk(
      matches('[tabindex*=3]', h('div', {tabIndex: -12})),
      'false if attribute does not contain (numeric)'
    )
    st.notOk(
      matches('[minlength*=3]', h('input', {minLength: 102})),
      'false if attribute does not contain (positive numeric)'
    )

    st.end()
  })

  t.test(
    'attributes, contains in space-separated list: `[attr~=value]`',
    function(st) {
      st.ok(
        matches('[id~=one]', h('#one')),
        'true if attribute matches (string value)'
      )
      st.ok(
        matches('[class~=one]', h('.one')),
        'true if attribute matches (space-separated list, 1)'
      )
      st.ok(
        matches('[class~=one two]', h('.one.two')),
        'true if attribute matches (space-separated list, 2)'
      )
      st.ok(
        matches(
          '[srcset~=cat-big.jpg]',
          h('source', {srcSet: ['cat-big.jpg']})
        ),
        'true if attribute matches (comma-separated list)'
      )
      st.ok(
        matches('[hidden~=hidden]', h('div', {hidden: true})),
        'true if attribute matches (boolean)'
      )
      st.ok(
        matches('[download~=download]', h('a', {download: true})),
        'true if attribute matches (overloaded boolean, 1)'
      )
      st.ok(
        matches('[download~=image.png]', h('a', {download: 'image.png'})),
        'true if attribute matches (overloaded boolean, 2)'
      )
      st.ok(
        matches('[tabindex~=-1]', h('div', {tabIndex: -1})),
        'true if attribute matches (numeric)'
      )
      st.ok(
        matches('[minlength~=3]', h('input', {minLength: 3})),
        'true if attribute matches (positive numeric)'
      )

      st.notOk(
        matches('[id~=two]', h('#one')),
        'false if attribute does not matches (string value)'
      )
      st.notOk(
        matches('[class~=two]', h('.one')),
        'false if attribute does not matches (space-separated list, 1)'
      )
      st.notOk(
        matches('[class~=three four]', h('.one.two')),
        'false if attribute does not matches (space-separated list, 2)'
      )
      st.notOk(
        matches(
          '[srcset~=cat-small.jpg]',
          h('source', {srcSet: ['cat-big.jpg']})
        ),
        'false if attribute does not matches (comma-separated list)'
      )
      st.notOk(
        matches('[hidden~=hidden]', h('div', {hidden: false})),
        'false if attribute does not matches (boolean)'
      )
      st.notOk(
        matches('[download~=download]', h('a', {download: false})),
        'false if attribute does not matches (overloaded boolean, 1)'
      )
      st.notOk(
        matches('[download~=image.png]', h('a', {download: 'photo.png'})),
        'false if attribute does not matches (overloaded boolean, 2)'
      )
      st.notOk(
        matches('[tabindex~=-1]', h('div', {tabIndex: -2})),
        'false if attribute does not matches (numeric)'
      )
      st.notOk(
        matches('[minlength~=3]', h('input', {minLength: 2})),
        'false if attribute does not matches (positive numeric)'
      )

      st.ok(
        matches('[class~=one]', h('.one.two')),
        'true if attribute part exists (space-separated list, 1)'
      )
      st.ok(
        matches('[class~=two]', h('.one.two')),
        'true if attribute part exists (space-separated list, 2)'
      )
      st.notOk(
        matches('[class~=three]', h('.one.two')),
        'false if attribute part does not exist (space-separated list)'
      )

      st.end()
    }
  )

  t.test('attributes, starts or prefixes: `[attr|=value]`', function(st) {
    st.ok(
      matches('[id|=one]', h('#one')),
      'true if attribute matches (string value)'
    )
    st.ok(
      matches('[class|=one]', h('.one')),
      'true if attribute matches (space-separated list, 1)'
    )
    st.ok(
      matches('[class|=one two]', h('.one.two')),
      'true if attribute matches (space-separated list, 2)'
    )
    st.ok(
      matches('[srcset|=cat-big.jpg]', h('source', {srcSet: ['cat-big.jpg']})),
      'true if attribute matches (comma-separated list)'
    )
    st.ok(
      matches('[hidden|=hidden]', h('div', {hidden: true})),
      'true if attribute matches (boolean)'
    )
    st.ok(
      matches('[download|=download]', h('a', {download: true})),
      'true if attribute matches (overloaded boolean, 1)'
    )
    st.ok(
      matches('[download|=image.png]', h('a', {download: 'image.png'})),
      'true if attribute matches (overloaded boolean, 2)'
    )
    st.ok(
      matches('[tabindex|=-1]', h('div', {tabIndex: -1})),
      'true if attribute matches (numeric)'
    )
    st.ok(
      matches('[minlength|=3]', h('input', {minLength: 3})),
      'true if attribute matches (positive numeric)'
    )

    st.notOk(
      matches('[id|=two]', h('#one')),
      'false if attribute does not matches (string value)'
    )
    st.notOk(
      matches('[class|=two]', h('.one')),
      'false if attribute does not matches (space-separated list, 1)'
    )
    st.notOk(
      matches('[class|=three four]', h('.one.two')),
      'false if attribute does not matches (space-separated list, 2)'
    )
    st.notOk(
      matches(
        '[srcset|=cat-small.jpg]',
        h('source', {srcSet: ['cat-big.jpg']})
      ),
      'false if attribute does not matches (comma-separated list)'
    )
    st.notOk(
      matches('[hidden|=hidden]', h('div', {hidden: false})),
      'false if attribute does not matches (boolean)'
    )
    st.notOk(
      matches('[download|=download]', h('a', {download: false})),
      'false if attribute does not matches (overloaded boolean, 1)'
    )
    st.notOk(
      matches('[download|=image.png]', h('a', {download: 'photo.png'})),
      'false if attribute does not matches (overloaded boolean, 2)'
    )
    st.notOk(
      matches('[tabindex|=-1]', h('div', {tabIndex: -2})),
      'false if attribute does not matches (numeric)'
    )
    st.notOk(
      matches('[minlength|=3]', h('input', {minLength: 2})),
      'false if attribute does not matches (positive numeric)'
    )

    st.ok(
      matches('[alpha|=bravo]', h('div', {alpha: 'bravo'})),
      'true if value starts with'
    )
    st.ok(
      matches('[alpha|=bravo]', h('div', {alpha: 'bravo-charlie'})),
      'true if value prefixes'
    )
    st.notOk(
      matches('[alpha|=bravo]', h('div', {alpha: 'bravocharlie'})),
      'false if value does not prefix'
    )
    st.notOk(
      matches('[alpha|=charlie]', h('div', {alpha: 'bravo'})),
      'false if value does start with'
    )

    st.end()
  })

  t.test('pseudo-classes', function(st) {
    ;[':any', ':matches'].forEach(function(pseudo) {
      st.test(pseudo, function(sst) {
        sst.ok(
          matches(pseudo + '(a, [title], .class)', h('a')),
          'true if any matches (type)'
        )
        sst.ok(
          matches(pseudo + '(a, [title], .class)', h('.class')),
          'true if any matches (.class)'
        )
        sst.ok(
          matches(pseudo + '(a, [title], .class)', h('div', {title: '1'})),
          'true if any matches (attribute existance)'
        )
        sst.notOk(
          matches(pseudo + '(a, [title], .class)', h('i')),
          'false if nothing matches'
        )

        sst.end()
      })
    })

    st.test(':not()', function(sst) {
      sst.notOk(
        matches(':not(a, [title], .class)', h('a')),
        'false if any matches (type)'
      )
      sst.notOk(
        matches(':not(a, [title], .class)', h('.class')),
        'false if any matches (.class)'
      )
      sst.notOk(
        matches(':not(a, [title], .class)', h('div', {title: '1'})),
        'false if any matches (attribute existance)'
      )
      sst.ok(
        matches(':not(a, [title], .class)', h('i')),
        'true if nothing matches'
      )

      sst.end()
    })

    st.test(':any-link', function(sst) {
      ;['a', 'area', 'link'].forEach(function(name) {
        sst.ok(
          matches(':any-link', h(name, {href: '#'})),
          'true if w/ href on ' + name
        )
        sst.notOk(matches(':any-link', h(name)), 'false if w/o href on ' + name)
      })

      sst.end()
    })

    st.test(':checked', function(sst) {
      sst.ok(
        matches(':checked', h('input', {type: 'checkbox', checked: true})),
        'true for checkbox inputs w/ `checked`'
      )
      sst.ok(
        matches(':checked', h('input', {type: 'radio', checked: true})),
        'true for radio inputs w/ `checked`'
      )
      sst.ok(
        matches(':checked', h('menuitem', {type: 'checkbox', checked: true})),
        'true for checkbox menuitems w/ `checked`'
      )
      sst.ok(
        matches(':checked', h('menuitem', {type: 'radio', checked: true})),
        'true for radio menuitems w/ `checked`'
      )
      sst.ok(
        matches(':checked', h('option', {selected: true})),
        'true for options w/ `selected`'
      )

      sst.notOk(
        matches(':checked', h('input', {type: 'checkbox', checked: false})),
        'false for checkbox inputs w/o `checked`'
      )
      sst.notOk(
        matches(':checked', h('input', {type: 'radio', checked: false})),
        'false for radio inputs w/o `checked`'
      )
      sst.notOk(
        matches(':checked', h('menuitem', {type: 'checkbox', checked: false})),
        'false for checkbox menuitems w/o `checked`'
      )
      sst.notOk(
        matches(':checked', h('menuitem', {type: 'radio', checked: false})),
        'false for radio menuitems w/o `checked`'
      )
      sst.notOk(
        matches(':checked', h('option', {selected: false})),
        'false for options w/o `selected`'
      )

      sst.notOk(matches(':checked', h()), 'false for other nodes')

      sst.end()
    })

    st.test(':disabled', function(sst) {
      ;[
        'button',
        'input',
        'select',
        'textarea',
        'optgroup',
        'option',
        'menuitem',
        'fieldset'
      ].forEach(function(name) {
        sst.ok(
          matches(':disabled', h(name, {disabled: true})),
          'true if w/ disabled on ' + name
        )
        sst.notOk(
          matches(':disabled', h(name)),
          'false if w/o disabled on ' + name
        )
      })

      sst.end()
    })

    st.test(':enabled', function(sst) {
      ;[
        'button',
        'input',
        'select',
        'textarea',
        'optgroup',
        'option',
        'menuitem',
        'fieldset'
      ].forEach(function(name) {
        sst.ok(matches(':enabled', h(name)), 'true if w/o disabled on ' + name)
        sst.notOk(
          matches(':enabled', h(name, {disabled: true})),
          'false if w/ disabled on ' + name
        )
      })

      sst.end()
    })

    st.test(':required', function(sst) {
      ;['input', 'textarea', 'select'].forEach(function(name) {
        sst.ok(
          matches(':required', h(name, {required: true})),
          'true if w/ required on ' + name
        )
        sst.notOk(
          matches(':required', h(name)),
          'false if w/o required on ' + name
        )
      })

      sst.end()
    })

    st.test(':optional', function(sst) {
      ;['input', 'textarea', 'select'].forEach(function(name) {
        sst.ok(matches(':optional', h(name)), 'true if w/o required on ' + name)
        sst.notOk(
          matches(':optional', h(name, {required: true})),
          'false if w/ required on ' + name
        )
      })

      sst.end()
    })

    st.test(':empty', function(sst) {
      sst.ok(matches(':empty', h()), 'true if w/o children')
      sst.ok(
        matches(':empty', h(null, u('comment', '?'))),
        'true if w/o elements or texts'
      )
      sst.notOk(matches(':empty', h(null, h())), 'false if w/ elements')
      sst.notOk(matches(':empty', h(null, u('text', '.'))), 'false if w/ text')
      sst.notOk(
        matches(':empty', h(null, u('text', ' '))),
        'false if w/ white-space text'
      )

      sst.end()
    })

    st.test(':blank', function(sst) {
      sst.ok(matches(':blank', h()), 'true if w/o children')
      sst.ok(
        matches(':blank', h(null, u('comment', '?'))),
        'true if w/o elements or texts'
      )
      sst.ok(
        matches(':blank', h(null, u('text', ' '))),
        'true if w/ white-space text'
      )
      sst.notOk(matches(':blank', h(null, h())), 'false if w/ elements')
      sst.notOk(matches(':blank', h(null, u('text', '.'))), 'false if w/ text')

      sst.end()
    })

    st.end()
  })

  t.end()
})
