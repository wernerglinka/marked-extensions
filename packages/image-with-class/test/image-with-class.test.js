import assert from 'node:assert';
import { describe, it } from 'mocha';
import { Marked } from 'marked';
import imageWithClass from '../index.js';

describe('image-with-class', () => {
  let instance;

  beforeEach(() => {
    instance = new Marked();
    instance.use({ extensions: [imageWithClass()] });
  });

  describe('tokenizer', () => {
    const extension = imageWithClass();

    it('returns -1 from start() when no image syntax present', () => {
      assert.strictEqual(extension.start('no images here'), -1);
    });

    it('finds the start index of image syntax', () => {
      assert.strictEqual(extension.start('text ![alt](src){.c}'), 5);
    });

    it('tokenizes an image with a single class', () => {
      const token = extension.tokenizer('![alt](/img.jpg){.hero}');
      assert.strictEqual(token.type, 'imageWithClass');
      assert.strictEqual(token.alt, 'alt');
      assert.strictEqual(token.src, '/img.jpg');
      assert.strictEqual(token.classes, 'hero');
    });

    it('tokenizes an image with multiple classes', () => {
      const token = extension.tokenizer('![alt](/img.jpg){.float-right .rounded}');
      assert.strictEqual(token.classes, 'float-right rounded');
    });

    it('tokenizes an image with a title', () => {
      const token = extension.tokenizer('![alt](/img.jpg "My Title"){.hero}');
      assert.strictEqual(token.title, 'My Title');
    });

    it('returns undefined for a regular image without classes', () => {
      const token = extension.tokenizer('![alt](/img.jpg)');
      assert.strictEqual(token, undefined);
    });

    it('returns undefined for non-image text', () => {
      const token = extension.tokenizer('just some text');
      assert.strictEqual(token, undefined);
    });
  });

  describe('rendering through marked', () => {
    it('renders image wrapped in a classed div', () => {
      const html = instance.parse('![photo](/hero.jpg){.float-right}\n');
      assert.ok(html.includes('class="float-right"'));
      assert.ok(html.includes('<img src="/hero.jpg" alt="photo">'));
    });

    it('renders multiple classes on the wrapper div', () => {
      const html = instance.parse('![alt](/img.jpg){.class-one .class-two}\n');
      assert.ok(html.includes('class="class-one class-two"'));
    });

    it('does not interfere with regular images', () => {
      const html = instance.parse('![alt](/img.jpg)\n');
      assert.ok(html.includes('<img'));
      assert.ok(!html.includes('class='));
    });
  });
});
