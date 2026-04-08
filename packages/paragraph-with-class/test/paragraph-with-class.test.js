import assert from 'node:assert';
import { describe, it } from 'mocha';
import { Marked } from 'marked';
import paragraphWithClass from '../index.js';

describe('paragraph-with-class', () => {
  let instance;

  beforeEach(() => {
    instance = new Marked();
    instance.use({ extensions: [paragraphWithClass()] });
  });

  describe('tokenizer', () => {
    const extension = paragraphWithClass();

    it('returns -1 from start() when no class syntax present', () => {
      assert.strictEqual(extension.start('plain text'), -1);
    });

    it('finds the start index of paragraph-with-class syntax', () => {
      const index = extension.start('Hello World {.lead}\n');
      assert.ok(index >= 0);
    });

    it('skips image lines in start()', () => {
      const result = extension.start('![alt](/img.jpg){.hero}\n');
      assert.strictEqual(result, -1);
    });

    it('skips link lines in start()', () => {
      const result = extension.start('[text](/url){.btn}\n');
      assert.strictEqual(result, -1);
    });

    it('tokenizes a paragraph with a single class', () => {
      const token = extension.tokenizer('Hello World {.lead}\n');
      assert.strictEqual(token.type, 'paragraphWithClass');
      assert.strictEqual(token.text, 'Hello World');
      assert.strictEqual(token.classes, 'lead');
    });

    it('tokenizes a paragraph with multiple classes', () => {
      const token = extension.tokenizer('Subtitle {.sub .italic}\n');
      assert.strictEqual(token.classes, 'sub italic');
    });

    it('returns undefined for plain text without classes', () => {
      const token = extension.tokenizer('just a paragraph\n');
      assert.strictEqual(token, undefined);
    });

    it('returns undefined when curly braces have no valid class names', () => {
      const token = extension.tokenizer('text {no-dots}\n');
      assert.strictEqual(token, undefined);
    });

    it('skips {.class} inside backticks in start()', () => {
      const result = extension.start('Use `{.classname}` for classes\n');
      assert.strictEqual(result, -1);
    });

    it('returns undefined from tokenizer when {.class} is inside backticks', () => {
      const token = extension.tokenizer('Use `{.classname}` for classes\n');
      assert.strictEqual(token, undefined);
    });
  });

  describe('rendering through marked', () => {
    it('renders a paragraph with classes', () => {
      const html = instance.parse('My Title {.lead-in}\n');
      assert.ok(html.includes('<p class="lead-in">My Title</p>'));
    });

    it('renders multiple classes', () => {
      const html = instance.parse('Subtitle {.sub .large}\n');
      assert.ok(html.includes('class="sub large"'));
    });

    it('does not interfere with regular paragraphs', () => {
      const html = instance.parse('Just a plain paragraph.\n');
      assert.ok(html.includes('<p>'));
      assert.ok(!html.includes('class='));
    });

    it('does not consume {.class} inside inline code', () => {
      const html = instance.parse('Use `{.classname}` on the opening fence.\n');
      assert.ok(html.includes('<code>{.classname}</code>'));
      assert.ok(!html.includes('class="classname"'));
    });
  });
});
