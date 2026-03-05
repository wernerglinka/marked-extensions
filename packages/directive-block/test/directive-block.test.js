import assert from 'node:assert';
import { describe, it } from 'mocha';
import { Marked } from 'marked';
import directiveBlock, {
  parseProps,
  extractPropsAndContent,
  parseCtaLinks,
} from '../index.js';

describe('directive-block helpers', () => {
  describe('parseProps', () => {
    it('parses key-value lines', () => {
      const result = parseProps('src: /audio.mp3\ntitle: Episode One');
      assert.deepStrictEqual(result, { src: '/audio.mp3', title: 'Episode One' });
    });

    it('handles values containing colons', () => {
      const result = parseProps('src: https://example.com/file.mp3');
      assert.strictEqual(result.src, 'https://example.com/file.mp3');
    });

    it('returns empty object for no props', () => {
      const result = parseProps('just some text');
      assert.deepStrictEqual(result, {});
    });
  });

  describe('extractPropsAndContent', () => {
    it('separates props from content', () => {
      const body = 'The quote text here.\ncite: Alan Kay';
      const { props, content } = extractPropsAndContent(body, ['cite']);
      assert.strictEqual(props.cite, 'Alan Kay');
      assert.strictEqual(content, 'The quote text here.');
    });

    it('returns all lines as content when no props match', () => {
      const body = 'Line one\nLine two';
      const { props, content } = extractPropsAndContent(body, ['cite']);
      assert.deepStrictEqual(props, {});
      assert.strictEqual(content, 'Line one\nLine two');
    });
  });

  describe('parseCtaLinks', () => {
    it('parses links with classes', () => {
      const body = '[Get Started](/start){.btn .btn-primary}\n[Learn More](/docs){.btn-link}';
      const links = parseCtaLinks(body);
      assert.strictEqual(links.length, 2);
      assert.strictEqual(links[0].text, 'Get Started');
      assert.strictEqual(links[0].href, '/start');
      assert.strictEqual(links[0].classes, 'btn btn-primary');
      assert.strictEqual(links[1].classes, 'btn-link');
    });

    it('parses links without classes', () => {
      const links = parseCtaLinks('[Plain](/url)');
      assert.strictEqual(links.length, 1);
      assert.strictEqual(links[0].classes, '');
    });

    it('returns empty array for no links', () => {
      assert.deepStrictEqual(parseCtaLinks('no links'), []);
    });
  });
});

describe('directive-block extension', () => {
  let instance;

  beforeEach(() => {
    instance = new Marked();
    instance.use({ extensions: [directiveBlock()] });
  });

  describe('tokenizer', () => {
    const extension = directiveBlock();

    it('returns -1 from start() when no directive present', () => {
      assert.strictEqual(extension.start('no directives'), -1);
    });

    it('finds the start index of a directive', () => {
      assert.strictEqual(extension.start('text\n:::audio\nsrc: x\n:::'), 5);
    });

    it('tokenizes a directive with classes', () => {
      const token = extension.tokenizer(':::audio{.featured}\nsrc: /a.mp3\n:::');
      assert.strictEqual(token.type, 'directiveBlock');
      assert.strictEqual(token.directiveType, 'audio');
      assert.strictEqual(token.classes, 'featured');
    });

    it('tokenizes a directive without classes', () => {
      const token = extension.tokenizer(':::cta\n[Link](/url)\n:::');
      assert.strictEqual(token.directiveType, 'cta');
      assert.strictEqual(token.classes, '');
    });

    it('returns undefined for non-directive text', () => {
      assert.strictEqual(extension.tokenizer('not a directive'), undefined);
    });
  });

  describe('CTA rendering', () => {
    it('renders CTA links in a container', () => {
      const html = instance.parse(':::cta\n[Go](/start){.btn}\n:::\n');
      assert.ok(html.includes('class="cta-container"'));
      assert.ok(html.includes('href="/start"'));
      assert.ok(html.includes('class="btn"'));
    });

    it('returns empty for CTA with no links', () => {
      const html = instance.parse(':::cta\nno links here\n:::\n');
      assert.ok(!html.includes('cta-container'));
    });
  });

  describe('audio rendering', () => {
    it('renders audio player', () => {
      const html = instance.parse(':::audio\nsrc: /episode.mp3\ntitle: Ep 1\n:::\n');
      assert.ok(html.includes('class="audio-player"'));
      assert.ok(html.includes('<audio controls src="/episode.mp3">'));
      assert.ok(html.includes('class="audio-title"'));
    });

    it('returns empty for audio without src', () => {
      const html = instance.parse(':::audio\ntitle: No Source\n:::\n');
      assert.ok(!html.includes('audio-player'));
    });
  });

  describe('video rendering', () => {
    it('renders video player', () => {
      const html = instance.parse(':::video\nsrc: /intro.mp4\nposter: /poster.jpg\n:::\n');
      assert.ok(html.includes('class="video-player"'));
      assert.ok(html.includes('src="/intro.mp4"'));
      assert.ok(html.includes('poster="/poster.jpg"'));
    });

    it('returns empty for video without src', () => {
      const html = instance.parse(':::video\nposter: /poster.jpg\n:::\n');
      assert.ok(!html.includes('video-player'));
    });
  });

  describe('quote rendering', () => {
    it('renders blockquote with citation', () => {
      const html = instance.parse(':::quote\nThe best way.\ncite: Alan Kay\n:::\n');
      assert.ok(html.includes('<blockquote'));
      assert.ok(html.includes('<cite>Alan Kay</cite>'));
      assert.ok(html.includes('The best way.'));
    });

    it('renders blockquote without citation', () => {
      const html = instance.parse(':::quote\nJust a quote.\n:::\n');
      assert.ok(html.includes('<blockquote'));
      assert.ok(!html.includes('<cite>'));
    });

    it('returns empty for empty quote', () => {
      const html = instance.parse(':::quote\ncite: Someone\n:::\n');
      assert.ok(!html.includes('blockquote'));
    });
  });

  describe('figure rendering', () => {
    it('renders figure with caption', () => {
      const html = instance.parse(':::figure{.wide}\n![Alt](/img.jpg)\ncaption: My photo\n:::\n');
      assert.ok(html.includes('<figure'));
      assert.ok(html.includes('class="figure wide"'));
      assert.ok(html.includes('<img src="/img.jpg" alt="Alt">'));
      assert.ok(html.includes('<figcaption>My photo</figcaption>'));
    });

    it('renders figure without caption', () => {
      const html = instance.parse(':::figure\n![Alt](/img.jpg)\n:::\n');
      assert.ok(html.includes('<figure'));
      assert.ok(!html.includes('<figcaption>'));
    });

    it('returns empty when no image present', () => {
      const html = instance.parse(':::figure\nno image\n:::\n');
      assert.ok(!html.includes('<figure'));
    });
  });

  describe('aside rendering', () => {
    it('renders aside element', () => {
      const html = instance.parse(':::aside{.warning}\nImportant note.\n:::\n');
      assert.ok(html.includes('<aside'));
      assert.ok(html.includes('class="aside warning"'));
      assert.ok(html.includes('Important note.'));
    });
  });

  describe('details rendering', () => {
    it('renders collapsible details', () => {
      const html = instance.parse(':::details\nsummary: How?\nThe answer is here.\n:::\n');
      assert.ok(html.includes('<details'));
      assert.ok(html.includes('<summary>How?</summary>'));
      assert.ok(html.includes('The answer is here.'));
    });

    it('returns empty without summary prop', () => {
      const html = instance.parse(':::details\nJust content, no summary.\n:::\n');
      assert.ok(!html.includes('<details'));
    });
  });

  describe('custom renderers', () => {
    it('uses custom renderer from options', () => {
      const customInstance = new Marked();
      customInstance.use({
        extensions: [
          directiveBlock({
            renderers: {
              pullquote: (body, classes) =>
                `<blockquote class="pullquote ${classes}">${body}</blockquote>`,
            },
          }),
        ],
      });

      const html = customInstance.parse(':::pullquote{.featured}\nSome quote.\n:::\n');
      assert.ok(html.includes('class="pullquote featured"'));
      assert.ok(html.includes('Some quote.'));
    });
  });

  describe('unknown directives', () => {
    it('returns empty for unknown directive type', () => {
      const html = instance.parse(':::unknown\ncontent\n:::\n');
      assert.ok(!html.includes('unknown'));
    });
  });
});
