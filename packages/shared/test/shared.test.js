import assert from 'node:assert';
import { describe, it } from 'mocha';
import {
  parseClassNames,
  buildImageTag,
  wrapWithDiv,
  buildContainerClasses,
} from '../index.js';

describe('parseClassNames', () => {
  it('extracts a single class name', () => {
    assert.strictEqual(parseClassNames('.highlight'), 'highlight');
  });

  it('extracts multiple class names', () => {
    assert.strictEqual(
      parseClassNames('.float-right .rounded'),
      'float-right rounded'
    );
  });

  it('ignores tokens without a dot prefix', () => {
    assert.strictEqual(parseClassNames('.valid nope .also-valid'), 'valid also-valid');
  });

  it('handles extra whitespace between tokens', () => {
    assert.strictEqual(parseClassNames('.a   .b'), 'a b');
  });

  it('returns empty string when no valid classes found', () => {
    assert.strictEqual(parseClassNames('no-dots here'), '');
  });
});

describe('buildImageTag', () => {
  it('builds an img tag with src and alt', () => {
    const result = buildImageTag({ src: '/photo.jpg', alt: 'A photo' });
    assert.strictEqual(result, '<img src="/photo.jpg" alt="A photo">');
  });

  it('includes title attribute when provided', () => {
    const result = buildImageTag({
      src: '/photo.jpg',
      alt: 'A photo',
      title: 'My photo',
    });
    assert.strictEqual(
      result,
      '<img src="/photo.jpg" alt="A photo" title="My photo">'
    );
  });

  it('omits title attribute when empty', () => {
    const result = buildImageTag({ src: '/img.png', alt: 'test', title: '' });
    assert.strictEqual(result, '<img src="/img.png" alt="test">');
  });
});

describe('wrapWithDiv', () => {
  it('wraps content in a div with classes', () => {
    const result = wrapWithDiv('<img src="x.jpg">', 'hero');
    assert.strictEqual(result, '<div class="hero"><img src="x.jpg"></div>\n');
  });
});

describe('buildContainerClasses', () => {
  it('returns base class alone when extras are empty', () => {
    assert.strictEqual(buildContainerClasses('audio-player', ''), 'audio-player');
  });

  it('combines base and extra classes', () => {
    assert.strictEqual(
      buildContainerClasses('audio-player', 'featured'),
      'audio-player featured'
    );
  });

  it('handles undefined extras', () => {
    assert.strictEqual(buildContainerClasses('cta-container'), 'cta-container');
  });
});
