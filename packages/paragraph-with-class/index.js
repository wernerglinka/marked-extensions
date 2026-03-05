/**
 * marked extension: paragraph-with-class
 *
 * Adds class attributes to paragraphs when the paragraph text
 * ends with a curly-brace class declaration.
 *
 * Syntax:
 *   My New Website {.lead-in}
 *
 *   This is a special paragraph {.highlight .large}
 *
 * Output:
 *   <p class="lead-in">My New Website</p>
 *
 *   <p class="highlight large">This is a special paragraph</p>
 *
 * Usage:
 *   import { marked } from 'marked';
 *   import paragraphWithClass from '@wernerglinka/marked-paragraph-with-class';
 *
 *   marked.use({ extensions: [paragraphWithClass()] });
 *
 * @module @wernerglinka/marked-paragraph-with-class
 */

import { parseClassNames } from '@wernerglinka/marked-extensions-shared';

/**
 * Pattern for matching a paragraph line ending with class attributes.
 * Uses negative lookahead to skip image and link syntax, which have
 * their own extensions for handling class attributes.
 *
 * Captures: paragraph text, class attributes
 *
 * Breakdown:
 *   ^(?!!\[)(?!\[)         - negative lookahead: skip images and links
 *   ([^\n]+?)              - paragraph text (non-greedy)
 *   \s*\{([^}]+)\}         - class attributes in curly braces
 *   \s*$                   - optional trailing whitespace
 */
const PARAGRAPH_WITH_CLASS_PATTERN = /^(?!!\[)(?!\[)([^\n]+?)\s*\{([^}]+)\}\s*(?:\n|$)/;

/**
 * Create the marked extension object for paragraph-with-class.
 *
 * @returns {Object} A marked block extension definition
 */
function paragraphWithClass() {
  return {
    name: 'paragraphWithClass',
    level: 'block',

    /**
     * Find the start index of a potential paragraph-with-class token.
     * Scans for '{.' which signals a class attribute on the line.
     * Skips lines that start with image or link syntax.
     *
     * @param {string} source - Raw Markdown source text
     * @returns {number} Index of potential match start, or -1
     */
    start(source) {
      let searchFrom = 0;

      while (searchFrom < source.length) {
        const index = source.indexOf('{.', searchFrom);
        if (index === -1) {
          return -1;
        }

        // Walk back to the start of the line
        const lineStart = source.lastIndexOf('\n', index - 1) + 1;
        const lineContent = source.slice(lineStart).trimStart();

        // Skip lines that are image or link syntax
        if (!lineContent.startsWith('![') && !lineContent.startsWith('[')) {
          return lineStart;
        }

        // Continue searching after this occurrence
        searchFrom = index + 2;
      }

      return -1;
    },

    /**
     * Tokenize a paragraph-with-class from the source string.
     *
     * @param {string} source - Remaining Markdown source
     * @returns {Object|undefined} Token object or undefined if no match
     */
    tokenizer(source) {
      const match = PARAGRAPH_WITH_CLASS_PATTERN.exec(source);

      if (!match) {
        return undefined;
      }

      const [raw, text, attributes] = match;
      const classes = parseClassNames(attributes);

      // Only match if we actually got valid class names
      if (!classes) {
        return undefined;
      }

      return {
        type: 'paragraphWithClass',
        raw,
        text: text.trim(),
        classes,
      };
    },

    /**
     * Render the paragraph-with-class token as HTML.
     *
     * @param {Object} token - Parsed token from the tokenizer
     * @returns {string} HTML paragraph with class attribute
     */
    renderer(token) {
      return `<p class="${token.classes}">${token.text}</p>\n`;
    },
  };
}

export default paragraphWithClass;
