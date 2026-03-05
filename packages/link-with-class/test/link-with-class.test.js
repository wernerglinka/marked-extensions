import assert from 'node:assert';
import { describe, it } from 'mocha';
import { Marked } from 'marked';
import linkWithClass from '../index.js';
import { buildAnchorTag } from '../index.js';

describe('link-with-class', () => {
  let instance;

  beforeEach(() => {
    instance = new Marked();
    instance.use({ extensions: [linkWithClass()] });
  });

  describe('buildAnchorTag', () => {
    it('builds a basic anchor tag', () => {
      const result = buildAnchorTag({
        href: '/page',
        text: 'Click',
        classes: 'btn',
      });
      assert.strictEqual(result, '<a href="/page" class="btn">Click</a>');
    });

    it('includes title when provided', () => {
      const result = buildAnchorTag({
        href: '/page',
        text: 'Click',
        classes: 'btn',
        title: 'Go',
      });
      assert.strictEqual(
        result,
        '<a href="/page" class="btn" title="Go">Click</a>'
      );
    });
  });

  describe('tokenizer', () => {
    const extension = linkWithClass();

    it('returns -1 from start() when no link syntax present', () => {
      assert.strictEqual(extension.start('no links here'), -1);
    });

    it('finds the start index of link syntax', () => {
      assert.strictEqual(extension.start('text [link](/url){.c}'), 5);
    });

    it('skips image syntax in start()', () => {
      const source = '![img](/src) [link](/url){.c}';
      const index = extension.start(source);
      assert.strictEqual(index, 13);
    });

    it('tokenizes a link with a single class', () => {
      const token = extension.tokenizer('[Click](/page){.btn}');
      assert.strictEqual(token.type, 'linkWithClass');
      assert.strictEqual(token.text, 'Click');
      assert.strictEqual(token.href, '/page');
      assert.strictEqual(token.classes, 'btn');
    });

    it('tokenizes a link with multiple classes', () => {
      const token = extension.tokenizer('[Go](/url){.btn .btn-primary}');
      assert.strictEqual(token.classes, 'btn btn-primary');
    });

    it('tokenizes a link with a title', () => {
      const token = extension.tokenizer('[Go](/url "Title"){.btn}');
      assert.strictEqual(token.title, 'Title');
    });

    it('returns undefined for a regular link without classes', () => {
      const token = extension.tokenizer('[text](/url)');
      assert.strictEqual(token, undefined);
    });

    it('returns undefined for image syntax', () => {
      const token = extension.tokenizer('![alt](/img.jpg){.hero}');
      assert.strictEqual(token, undefined);
    });
  });

  describe('rendering through marked', () => {
    it('renders a link with classes', () => {
      const html = instance.parse('[Sign Up](/register){.btn .btn-primary}\n');
      assert.ok(html.includes('class="btn btn-primary"'));
      assert.ok(html.includes('href="/register"'));
      assert.ok(html.includes('>Sign Up</a>'));
    });

    it('does not interfere with regular links', () => {
      const html = instance.parse('[text](/url)\n');
      assert.ok(html.includes('href="/url"'));
      assert.ok(!html.includes('class='));
    });
  });
});
