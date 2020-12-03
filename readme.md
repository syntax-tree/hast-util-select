<!--lint disable no-html-->

# hast-util-select

[![Build][build-badge]][build]
[![Coverage][coverage-badge]][coverage]
[![Downloads][downloads-badge]][downloads]
[![Size][size-badge]][size]
[![Sponsors][sponsors-badge]][collective]
[![Backers][backers-badge]][collective]
[![Chat][chat-badge]][chat]

[**hast**][hast] utility with equivalents `querySelector`, `querySelectorAll`,
and `matches`.

One notable difference between DOM and hast is that DOM nodes have references
to their parents, meaning that `document.body.matches(':last-child')` can
be evaluated.
This information is not stored in hast, so selectors like that don’t work.

[View the list of supported selectors »][support]

## Install

[npm][]:

```sh
npm install hast-util-select
```

## API

### `select.matches(selector, node[, space])`

Check that the given `node` matches `selector`.
Returns boolean, whether the node matches or not.

This only checks the element itself, not the surrounding tree.
Thus, nesting in selectors is not supported (`p b`, `p > b`), neither are
selectors like `:first-child`, etc.
This only checks that the given element matches the selector.

##### Use

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
*   `node` ([`Node`][node])
    — Thing to check, could be anything, but should be an [*element*][element]
*   `space` (enum, `'svg'` or `'html'`, default: `'html'`)
    — Which space the node exists in

##### Returns

`boolean` — Whether the node matches the selector.

### `select.select(selector, tree[, space])`

Select the first `node` matching `selector` in the given `tree` (could be the
tree itself).
Searches the [*tree*][tree] in [*preorder*][preorder].

##### Use

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

##### Parameters

*   `selector` (`string`) — CSS selectors (`,` is also supported)
*   `tree` ([`Node`][node]) — [*Tree*][tree] to search
*   `space` (enum, `'svg'` or `'html'`, default: `'html'`)
    — Which space the tree exists in

##### Returns

[`Element?`][element] — The found element, if any.

### `select.selectAll(selector, tree[, space])`

Select all nodes matching `selector` in the given `tree` (could include the tree
itself).
Searches the [*tree*][tree] in [*preorder*][preorder].

##### Use

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
*   `tree` ([`Node`][node]) — [*Tree*][tree] to search
*   `space` (enum, `'svg'` or `'html'`, default: `'html'`)
    — Which space the tree exists in

##### Returns

[`Array.<Element>`][element] — All found elements, if any.

## Support

*   [x] `*` (universal selector)
*   [x] `,` (multiple selector)
*   [x] `p` (type selector)
*   [x] `.class` (class selector)
*   [x] `#id` (id selector)
*   [x] `article p` (combinator: descendant selector)
*   [x] `article > p` (combinator: child selector)
*   [x] `h1 + p` (combinator: next-sibling selector)
*   [x] `h1 ~ p` (combinator: subsequent sibling selector)
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

*   \* — Not supported in `matches`
*   † — Needs a user, browser, interactivity, or scripting to make sense
*   ‡ — Not supported by the underlying algorithm
*   § — Not very interested in writing / including the code for this
*   ‖ — Too new, the spec is still changing

## Security

`hast-util-select` does not change the syntax tree so there are no openings for
[cross-site scripting (XSS)][xss] attacks.

## Related

*   [`unist-util-select`](https://github.com/syntax-tree/unist-util-select)
    — select unist nodes with CSS-like selectors
*   [`hast-util-find-and-replace`](https://github.com/syntax-tree/hast-util-find-and-replace)
    — find and replace text in a hast tree
*   [`hast-util-parse-selector`](https://github.com/syntax-tree/hast-util-parse-selector)
    — create an element from a simple CSS selector
*   [`hast-util-from-selector`](https://github.com/syntax-tree/hast-util-from-selector)
    — create an element from a complex CSS selector

## Contribute

See [`contributing.md` in `syntax-tree/.github`][contributing] for ways to get
started.
See [`support.md`][help] for ways to get help.

This project has a [code of conduct][coc].
By interacting with this repository, organization, or community you agree to
abide by its terms.

## License

[MIT][license] © [Titus Wormer][author]

<!-- Definitions -->

[build-badge]: https://github.com/syntax-tree/hast-util-select/workflows/main/badge.svg

[build]: https://github.com/syntax-tree/hast-util-select/actions

[coverage-badge]: https://img.shields.io/codecov/c/github/syntax-tree/hast-util-select.svg

[coverage]: https://codecov.io/github/syntax-tree/hast-util-select

[downloads-badge]: https://img.shields.io/npm/dm/hast-util-select.svg

[downloads]: https://www.npmjs.com/package/hast-util-select

[size-badge]: https://img.shields.io/bundlephobia/minzip/hast-util-select.svg

[size]: https://bundlephobia.com/result?p=hast-util-select

[sponsors-badge]: https://opencollective.com/unified/sponsors/badge.svg

[backers-badge]: https://opencollective.com/unified/backers/badge.svg

[collective]: https://opencollective.com/unified

[chat-badge]: https://img.shields.io/badge/chat-discussions-success.svg

[chat]: https://github.com/syntax-tree/unist/discussions

[npm]: https://docs.npmjs.com/cli/install

[license]: license

[author]: https://wooorm.com

[contributing]: https://github.com/syntax-tree/.github/blob/HEAD/contributing.md

[help]: https://github.com/syntax-tree/.github/blob/HEAD/support.md

[coc]: https://github.com/syntax-tree/.github/blob/HEAD/code-of-conduct.md

[tree]: https://github.com/syntax-tree/unist#tree

[preorder]: https://github.com/syntax-tree/unist#preorder

[hast]: https://github.com/syntax-tree/hast

[node]: https://github.com/syntax-tree/hast#nodes

[element]: https://github.com/syntax-tree/hast#element

[xss]: https://en.wikipedia.org/wiki/Cross-site_scripting

[support]: #support
