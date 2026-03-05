# marked-extensions

A collection of [marked](https://marked.js.org/) extensions for rich content authoring in Markdown. These extensions add support for CSS class attributes on images, links, and paragraphs, plus a generic directive block system for embeds like audio players, video, blockquotes with citations, figures with captions, and more.

## Packages

| Package | Description |
|---------|-------------|
| [@wernerglinka/marked-extensions-shared](./packages/shared) | Shared utilities for parsing class attributes and building HTML |
| [@wernerglinka/marked-image-with-class](./packages/image-with-class) | Images with CSS class attributes: `![alt](src){.class}` |
| [@wernerglinka/marked-link-with-class](./packages/link-with-class) | Links with CSS class attributes: `[text](url){.class}` |
| [@wernerglinka/marked-paragraph-with-class](./packages/paragraph-with-class) | Paragraphs with CSS class attributes: `text {.class}` |
| [@wernerglinka/marked-directive-block](./packages/directive-block) | Block-level directives: `:::type ... :::` |

## Quick Start

```javascript
import { marked } from 'marked';
import imageWithClass from '@wernerglinka/marked-image-with-class';
import linkWithClass from '@wernerglinka/marked-link-with-class';
import paragraphWithClass from '@wernerglinka/marked-paragraph-with-class';
import directiveBlock from '@wernerglinka/marked-directive-block';

marked.use({
  extensions: [
    paragraphWithClass(),
    imageWithClass(),
    linkWithClass(),
    directiveBlock()
  ]
});

const html = marked.parse(`
My New Website {.lead-in}

# Hello World

And here, it begins {.sub-title}

Some introductory prose here about the project.

![factory photo](/images/ruhr-valley.jpg){.float-right .rounded}

More prose wrapping around the image...

:::audio{.featured}
src: /media/episode-01.mp3
title: The First Episode
:::

:::cta
[Get Started](/start){.btn .btn-primary}
[Learn More](/docs){.btn-link}
:::
`);
```

## Syntax Reference

### Image with Class

```markdown
![alt text](image.jpg){.classname}
![alt text](image.jpg){.class-one .class-two}
```

Renders as a `<div>` wrapping an `<img>` with the specified classes.

### Link with Class

```markdown
[Link Text](/url){.classname}
[Link Text](/url){.btn .btn-primary}
```

Renders as an inline `<a>` element with the specified classes.

### Paragraph with Class

```markdown
My lead-in text {.lead-in}
A subtitle goes here {.sub-title}
```

Renders as a `<p>` element with the specified classes.

### Directive Blocks

All directive blocks use the triple-colon fence syntax:

```markdown
:::type{.optional-classes}
content or props here
:::
```

#### CTA (Call to Action)

```markdown
:::cta
[Get Started](/start){.btn .btn-primary}
[Learn More](/docs){.btn-link}
:::
```

#### Audio

```markdown
:::audio{.featured}
src: /media/episode-01.mp3
title: The First Episode
:::
```

#### Video

```markdown
:::video
src: /media/intro.mp4
poster: /images/intro-poster.jpg
:::
```

#### Quote

```markdown
:::quote{.highlight}
The best way to predict the future is to invent it.
cite: Alan Kay
:::
```

#### Figure

```markdown
:::figure{.wide}
![Ruhr Valley factory](/images/factory.jpg)
caption: Dortmund steelworks, 1973
:::
```

#### Aside

```markdown
:::aside{.warning}
This requires Node.js 20 or higher.
:::
```

#### Details

```markdown
:::details
summary: How does this work?
The build pipeline processes each section sequentially,
running the body through the extended marked instance.
:::
```

#### Custom Directives

Add your own directive types through the renderers option:

```javascript
directiveBlock({
  renderers: {
    pullquote: (body, classes) =>
      `<blockquote class="pullquote ${classes}">${body}</blockquote>`
  }
})
```

## Class Attribute Convention

All extensions use the Pandoc/kramdown convention for class attributes:

- `.classname` — dot prefix for class names, mirrors CSS selector syntax
- Multiple classes separated by spaces: `{.class-one .class-two}`
- Placed in curly braces after the element they modify

## Development

This is a monorepo managed with npm workspaces.

```bash
# Install dependencies
npm install

# Run all tests
npm test

# Run tests for a specific package
npm run test:image
npm run test:link
npm run test:paragraph
npm run test:directive
```

## License

MIT
