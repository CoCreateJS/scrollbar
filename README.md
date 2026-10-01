# CoCreate Scrollbar

A declarative custom scrollbar for native scroll containers with configurable
axes, track positions, visibility, and automatic DOM lifecycle handling.

The component preserves browser-native scrolling, including wheel, keyboard,
touch, and programmatic scrolling. It hides the native scrollbar and adds
custom overlay tracks and draggable thumbs.

## Installation

```shell
npm install @cocreate/scrollbar
```

```shell
yarn add @cocreate/scrollbar
```

Importing the package loads its styles and initializes every element with a
`scrollbar` attribute.

```js
import CoCreateScrollbar from "@cocreate/scrollbar";
```

## Usage

Give the scrollbar host a constrained width and height. Its first element child
becomes the native scrolling viewport.

```html
<div scrollbar style="height: 300px">
  <div>
    <!-- Scrollable content -->
  </div>
</div>
```

The host owns the generated tracks. Keep asynchronously loaded content inside
the viewport rather than placing `src` on the scrollbar host:

```html
<div scrollbar style="height: 300px">
  <div>
    <div src="/components/content.html"></div>
  </div>
</div>
```

This prevents fetched content from replacing the viewport and generated track
structure.

## Attributes

| Attribute | Values | Default | Purpose |
| --- | --- | --- | --- |
| `scrollbar` | Boolean attribute | — | Initializes the component. |
| `scrollbar-type` | `scrollx`, `scrolly`, or both | `scrollx scrolly` | Enables the requested axes. |
| `scrollbar-pos` | `left` or `right`, plus `top` or `bottom` | `right bottom` | Positions the vertical and horizontal tracks. |
| `scrollbar-visible` | `auto` or `show` | `auto` | Shows tracks contextually or keeps them visible. |

### Vertical scrolling only

```html
<div scrollbar scrollbar-type="scrolly" style="height: 300px">
  <div>...</div>
</div>
```

### Tracks on the top and left

```html
<div scrollbar scrollbar-pos="top left" style="height: 300px">
  <div>...</div>
</div>
```

### Always-visible tracks

```html
<div scrollbar scrollbar-visible="show" style="height: 300px">
  <div>...</div>
</div>
```

Attribute changes are applied dynamically. Adding or removing the `scrollbar`
attribute initializes or destroys the instance, while changing an option
attribute refreshes it.

## JavaScript API

```js
const element = document.querySelector("[scrollbar]");

const instance = CoCreateScrollbar.init(element);
CoCreateScrollbar.get(element);
CoCreateScrollbar.destroy(element);
CoCreateScrollbar.initAll();
```

`init()` accepts an element, a selector, or an array-like collection. Elements
inserted into or removed from the document are also initialized and destroyed
automatically through `@cocreate/observer`.

## Update event

The host dispatches `cocreate-scroll-update` whenever its scrollbar geometry is
recalculated.

```js
element.addEventListener("cocreate-scroll-update", (event) => {
  console.log(event.detail.scrollTop, event.detail.maxScrollY);
});
```

The event detail includes:

- `scrollTop` and `scrollLeft`
- `maxScrollY` and `maxScrollX`
- `clientHeight` and `clientWidth`
- `thumbVHeight` and `thumbHWidth`

## Styling

Customize the tracks with CSS variables on the scrollbar host:

```css
.my-scrollbar {
  --cc-track-bg: rgb(0 0 0 / 8%);
  --cc-thumb-bg: rgb(99 102 241 / 75%);
  --cc-thumb-hover-bg: rgb(129 140 248);
}
```

The stylesheet also includes `theme-indigo`, `theme-emerald`, `theme-rose`,
`theme-amber`, `theme-glass`, and `theme-dark` preset classes.

## Project links

- [Documentation](https://cocreate.app/docs/scrollbar)
- [Issues](https://github.com/CoCreate-app/CoCreate-scrollbar/issues)
- [Releases](https://github.com/CoCreate-app/CoCreate-scrollbar/releases)
- [Contributing](https://github.com/CoCreate-app/CoCreate-scrollbar/blob/master/CONTRIBUTING.md)

## License

[MIT](https://github.com/CoCreate-app/CoCreate-scrollbar/blob/master/LICENSE)
