<!--lint disable no-html-->

# hast-util-select [![Build Status][travis-badge]][travis] [![Coverage Status][codecov-badge]][codecov]

`querySelector`, `querySelectorAll`, and `matches` for [HAST][] nodes.

One notable difference between DOM and HAST is that DOM nodes have references
to their parents, meaning that `document.body.matches(':last-child')` can
be evaluated.  This information is not stored in HAST, so selectors like
that don’t work.

[View the list of supported selectors »][support]

## Installation

[npm][]:

```bash
npm install hast-util-select
```

## API

### `select.matches(selector, node[, space])`

This only checks the element itself, not the surrounding tree.  Thus, nesting
in selectors is not supported (`p b`, `p > b`), neither are selectors like
`:first-child`, etc.  This simply checks that the given element matches the
selector.

##### Usage

```js
var h = require('hastscript')
var matches = require('hast-util-select').matches

matches('b, i', h('b')) // => true
matches(':any-link', h('a')) // => false
matches(':any-link', h('a', {href: '#'})) // => true
matches('.classy', h('a', {className: ['classy']})) // => true
matches('#id', h('a', {id: 'id'})) // => true
matches('[lang|=en]', h('a', {lang: 'en'})) // => true
matches('[lang|=en]', h('a', {lang: 'en-GB'})) // => true
// ...
```

##### Parameters

*   `selector` (`string`)
    — CSS selectors (`,` is also supported)
*   `node` (`Node`)
    — Thing to check, could be anything, but should be an [element][]
*   `space` (enum, `'svg'` or `'html'`, default: `'html'`)
    — Which space the node exists in

##### Returns

`boolean` — Whether the node matches the selector.

### `select.select(selector, tree[, space])`

##### Usage

```js
var h = require('hastscript')
var select = require('hast-util-select').select

console.log(
  select(
    'h1 ~ :nth-child(even)',
    h('section', [
      h('p', 'Alpha'),
      h('p', 'Bravo'),
      h('h1', 'Charlie'),
      h('p', 'Delta'),
      h('p', 'Echo')
    ])
  )
)
```

Yields:

```js
{ type: 'element',
  tagName: 'p',
  properties: {},
  children: [ { type: 'text', value: 'Delta' } ] }
```

Select the first node matching `selector` in the given `tree` (could be the
tree itself).

##### Parameters

*   `selector` (`string`) — CSS selectors (`,` is also supported)
*   `tree` (`Node`) — Thing to search.
*   `space` (enum, `'svg'` or `'html'`, default: `'html'`)
    — Which v the tree exists in

##### Returns

`Element?` — The found element, if any.

### `select.selectAll(selector, tree[, space])`

Select all nodes matching `selector` in the given `tree` (could include the
tree itself).

##### Usage

```js
var h = require('hastscript')
var selectAll = require('hast-util-select').selectAll

console.log(
  selectAll(
    'h1 ~ :nth-child(even)',
    h('section', [
      h('p', 'Alpha'),
      h('p', 'Bravo'),
      h('h1', 'Charlie'),
      h('p', 'Delta'),
      h('p', 'Echo'),
      h('p', 'Foxtrot'),
      h('p', 'Golf')
    ])
  )
)
```

Yields:

```js
[ { type: 'element',
    tagName: 'p',
    properties: {},
    children: [ { type: 'text', value: 'Delta' } ] },
  { type: 'element',
    tagName: 'p',
    properties: {},
    children: [ { type: 'text', value: 'Foxtrot' } ] } ]
```

##### Parameters

*   `selector` (`string`) — CSS selectors (`,` is also supported)
*   `tree` (`Node`) — Thing to search.
*   `space` (enum, `'svg'` or `'html'`, default: `'html'`)
    — Which space the tree exists in

##### Returns

`Array.<Element>` — All found elements, if any.

## Support

*   [x] `*` (universal selector)
*   [x] `,` (multiple selector)
*   [x] `p` (type selector)
*   [x] `.class` (class selector)
*   [x] `#id` (id selector)
*   [x] `article p` (combinator: descendant selector)
*   [x] `article > p` (combinator: child selector)
*   [x] `h1 + p` (combinator: adjacent sibling selector)
*   [x] `h1 ~ p` (combinator: general sibling selector)
*   [x] `[attr]` (attribute existence)
*   [x] `[attr=value]` (attribute equality)
*   [x] `[attr~=value]` (attribute contains in space-separated list)
*   [x] `[attr|=value]` (attribute equality or prefix)
*   [x] `[attr^=value]` (attribute begins with)
*   [x] `[attr$=value]` (attribute ends with)
*   [x] `[attr*=value]` (attribute contains)
*   [x] `:any()` (functional pseudo-class, use `:matches` instead)
*   [x] `:dir()` (functional pseudo-class)
*   [x] `:has()` (functional pseudo-class)
*   [x] `:lang()` (functional pseudo-class)
*   [x] `:matches()` (functional pseudo-class)
*   [x] `:not()` (functional pseudo-class)
*   [x] `:any-link` (pseudo-class)
*   [x] `:blank` (pseudo-class)
*   [x] `:checked` (pseudo-class)
*   [x] `:disabled` (pseudo-class)
*   [x] `:empty` (pseudo-class)
*   [x] `:enabled` (pseudo-class)
*   [x] `:optional` (pseudo-class)
*   [x] `:read-only` (pseudo-class)
*   [x] `:read-write` (pseudo-class)
*   [x] `:required` (pseudo-class)
*   [x] `:root` (pseudo-class)
*   [x] `:scope` (pseudo-class):
*   [x] \* `:first-child` (pseudo-class)
*   [x] \* `:first-of-type` (pseudo-class)
*   [x] \* `:last-child` (pseudo-class)
*   [x] \* `:last-of-type` (pseudo-class)
*   [x] \* `:only-child` (pseudo-class)
*   [x] \* `:only-of-type` (pseudo-class)
*   [x] \* `:nth-child()` (functional pseudo-class)
*   [x] \* `:nth-last-child()` (functional pseudo-class)
*   [x] \* `:nth-last-of-type()` (functional pseudo-class)
*   [x] \* `:nth-of-type()` (functional pseudo-class)

## Unsupported

*   [ ] † `||` (column combinator)
*   [ ] ‡ `ns|E` (namespace type selector)
*   [ ] ‡ `*|E` (any namespace type selector)
*   [ ] ‡ `|E` (no namespace type selector)
*   [ ] ‡ `[ns|attr]` (namespace attribute)
*   [ ] ‡ `[*|attr]` (any namespace attribute)
*   [ ] ‡ `[|attr]` (no namespace attribute)
*   [ ] ‡ `[attr=value i]` (attribute case-insensitive)
*   [ ] ‡ `:has()` (functional pseudo-class).
    <small>Relative selectors (`:has(> img)`) are not supported, but scope is
    (`:has(:scope > img)`) </small>
*   [ ] ‖ `:nth-child(n of S)` (functional pseudo-class).
    <small>Scoping to parents is not supported</small>
*   [ ] ‖ `:nth-last-child(n of S)` (scoped to parent S).
    <small>Scoping to parents is not supported</small>
*   [ ] † `:active` (pseudo-class)
*   [ ] † `:current` (pseudo-class)
*   [ ] † `:current()` (functional pseudo-class)
*   [ ] † `:default` (pseudo-class)
*   [ ] † `:defined` (pseudo-class)
*   [ ] † `:drop` (pseudo-class)
*   [ ] † `:drop()` (functional pseudo-class)
*   [ ] † `:focus` (pseudo-class)
*   [ ] † `:focus-visible` (pseudo-class)
*   [ ] † `:focus-within` (pseudo-class)
*   [ ] † `:fullscreen` (pseudo-class)
*   [ ] † `:future` (pseudo-class)
*   [ ] ‖ `:host()` (functional pseudo-class)
*   [ ] ‖ `:host-context()` (functional pseudo-class)
*   [ ] † `:hover` (pseudo-class)
*   [ ] § `:in-range` (pseudo-class)
*   [ ] † `:indeterminate` (pseudo-class)
*   [ ] § `:invalid` (pseudo-class)
*   [ ] † `:link` (pseudo-class)
*   [ ] † `:local-link` (pseudo-class)
*   [ ] † `:nth-column()` (functional pseudo-class)
*   [ ] † `:nth-last-column()` (functional pseudo-class)
*   [ ] § `:out-of-range` (pseudo-class)
*   [ ] † `:past` (pseudo-class)
*   [ ] † `:paused` (pseudo-class)
*   [ ] † `:placeholder-shown` (pseudo-class)
*   [ ] † `:playing` (pseudo-class)
*   [ ] ‖ `:something()` (functional pseudo-class)
*   [ ] † `:target` (pseudo-class)
*   [ ] † `:target-within` (pseudo-class)
*   [ ] † `:user-error` (pseudo-class)
*   [ ] † `:user-invalid` (pseudo-class)
*   [ ] § `:valid` (pseudo-class)
*   [ ] † `:visited` (pseudo-class)
*   [ ] † `::before` (pseudo-elements: none are supported)

###### Notes

*   \* — Not supported in `matches`.
*   † — Needs a user, browser, interactivity, or scripting to make sense
*   ‡ — Not supported by the underlying algorithm
*   § — Not very interested in writing / including the code for this
*   ‖ — Too new, the spec is still changing

## Contribute

See [`contributing.md` in `syntax-tree/hast`][contributing] for ways to get
started.

This organisation has a [Code of Conduct][coc].  By interacting with this
repository, organisation, or community you agree to abide by its terms.

## License

[MIT][license] © [Titus Wormer][author]

<!-- Definitions -->

[travis-badge]: https://img.shields.io/travis/syntax-tree/hast-util-select.svg

[travis]: https://travis-ci.org/syntax-tree/hast-util-select

[codecov-badge]: https://img.shields.io/codecov/c/github/syntax-tree/hast-util-select.svg

[codecov]: https://codecov.io/github/syntax-tree/hast-util-select

[npm]: https://docs.npmjs.com/cli/install

[license]: license

[author]: http://wooorm.com

[hast]: https://github.com/syntax-tree/hast

[element]: https://github.com/syntax-tree/hast#element

[support]: #support

[contributing]: https://github.com/syntax-tree/hast/blob/master/contributing.md

[coc]: https://github.com/syntax-tree/hast/blob/master/code-of-conduct.md
