# CLAUDE.md

## Project Overview

This is a monorepo of `marked` extensions for rich content authoring in Markdown. The extensions add Pandoc-style class attributes to images, links, and paragraphs, plus a generic directive block system for embeds like audio, video, blockquotes, figures, asides, and collapsible details.

The primary use case is reducing YAML source complexity in Metalsmith static sites by moving content-heavy sections from structured YAML props to extended Markdown.

## Repository Structure

```
marked-extensions/
  packages/
    shared/                # Common utilities used by all extensions
    image-with-class/      # ![alt](src){.class} → <div class="..."><img></div>
    link-with-class/       # [text](url){.class} → <a class="...">
    paragraph-with-class/  # text {.class} → <p class="...">
    directive-block/       # :::type{.class} ... ::: → various HTML blocks
  package.json             # Workspace root
```

Managed with npm workspaces. Each package publishes independently to npm under the `@wernerglinka` scope.

## Dependency Graph

All extensions import shared utilities from `@wernerglinka/marked-extensions-shared`. No extension imports from another extension. The dependency flow is strictly one-directional:

```
shared ← image-with-class
shared ← link-with-class
shared ← paragraph-with-class
shared ← directive-block
```

`marked` is a peer dependency for all extension packages.

## Extension Architecture

Every `marked` extension follows the same contract with three functions:

- `start(source)` — returns the index where the extension should attempt to match, or -1
- `tokenizer(source)` — parses the source into a token object, or returns undefined if no match
- `renderer(token)` — converts the token into an HTML string

Extensions are either `block` level (paragraph-with-class, directive-block) or `inline` level (image-with-class, link-with-class). Block extensions run before inline extensions regardless of registration order.

## Shared Utilities

The `packages/shared` module exports:

- `parseClassNames(attributeString)` — extracts dot-prefixed class names from `{.class-one .class-two}` syntax
- `buildImageTag({ src, alt, title })` — builds an `<img>` element string
- `wrapWithDiv(innerHtml, classes)` — wraps content in a classed `<div>`
- `buildContainerClasses(baseClass, extraClasses)` — merges base and extra classes, filtering empties

Any new utility that would be used by more than one extension belongs here.

## Directive Block Registry

The directive-block extension uses a registry pattern. Built-in renderers: `cta`, `audio`, `video`, `quote`, `figure`, `aside`, `details`. Custom renderers are added through the options object:

```javascript
directiveBlock({
  renderers: {
    customType: (body, classes) => `<div class="${classes}">${body}</div>`
  }
})
```

Each renderer receives `(body, classes)` and returns an HTML string. Use `parseProps(body)` for key-value prop extraction and `extractPropsAndContent(body, propNames)` to separate props from free-form content.

## Coding Conventions

- **JavaScript only** — no TypeScript. Use JSDoc for type annotations.
- **ES modules** — all packages use `"type": "module"` with named and default exports.
- **Functional patterns** — pure functions, no mutation, explicit return values, composition over inheritance.
- **Single responsibility** — each function does one thing. Regex patterns are module-level constants with documented breakdowns.
- **Descriptive names** — `attributeString` not `attrs`, `error` not `err`, `containerClasses` not `cls`.
- **Strict equality** — always `===` and `!==`.
- **Nullish coalescing** — use `??` for defaults, not `||`.
- **Minimal dependencies** — only `marked` as a peer dep, shared utilities as the sole internal dep.
- **No try/catch in internal code** — let errors bubble. Only catch at boundaries.

## Testing

Tests use Mocha with `node:assert`. Run from the workspace root:

```bash
npm test                  # all packages
npm run test:shared       # just shared
npm run test:image        # just image-with-class
npm run test:link         # just link-with-class
npm run test:paragraph    # just paragraph-with-class
npm run test:directive    # just directive-block
```

Test files live in `packages/<name>/test/`. Each extension should have tests for:

- Successful tokenization and rendering of valid syntax
- Graceful non-matching (returns undefined) for invalid or unrelated syntax
- Edge cases: empty classes, missing attributes, mixed content
- No interference with standard Markdown (regular images, links, paragraphs pass through untouched)

## Known Gotchas

- **paragraph-with-class grabs image lines** — the `start` function and regex include guards to skip lines starting with `![` or `[`. Any new block extension that uses `{.class}` syntax needs similar guards.
- **Extension registration order matters** — `paragraphWithClass()` should be registered first in the extensions array since block extensions run before inline.
- **Directive closing fence** — the `:::` closing fence must be on its own line with no leading content. Indented closing fences won't match.

## Adding a New Extension

1. Create `packages/<name>/` with `index.js`, `package.json`, and `README.md`
2. Import utilities from `@wernerglinka/marked-extensions-shared`
3. Export a factory function (not the extension object directly) so consumers call `extensionName()`
4. Add the package to the workspace and add test scripts to root `package.json`
5. If the extension uses `{.class}` syntax, check for conflicts with paragraph-with-class

## Adding a New Directive Type

No new package needed. Either:

- Add a built-in renderer to `packages/directive-block/index.js` and export it
- Or pass a custom renderer through the options object at configuration time