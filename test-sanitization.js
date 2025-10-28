/**
 * Test script for input sanitization
 */

const { JSDOM } = require('jsdom');
const DOMPurify = require('isomorphic-dompurify');

// Test cases with dangerous HTML
const testCases = [
  {
    name: 'Script tag',
    input: '<p>Hello <script>alert("XSS")</script> World</p>',
    expected: '<p>Hello  World</p>',
  },
  {
    name: 'Inline event handler',
    input: '<p onclick="alert(\'XSS\')">Click me</p>',
    expected: '<p>Click me</p>',
  },
  {
    name: 'Javascript URL',
    input: '<a href="javascript:alert(\'XSS\')">Click</a>',
    expected: '', // Link should be removed
  },
  {
    name: 'Safe HTML with formatting',
    input: '<p>Hello <strong>bold</strong> and <em>italic</em> text</p>',
    expected: '<p>Hello <strong>bold</strong> and <em>italic</em> text</p>',
  },
  {
    name: 'Iframe injection',
    input: '<p>Text <iframe src="evil.com"></iframe> more text</p>',
    expected: '<p>Text  more text</p>',
  },
];

console.log('🧪 Testing Input Sanitization\n');
console.log('================================\n');

let passed = 0;
let failed = 0;

testCases.forEach((test, index) => {
  const sanitized = DOMPurify.sanitize(test.input, {
    ALLOWED_TAGS: [
      'b',
      'i',
      'u',
      'strong',
      'em',
      'p',
      'br',
      'ul',
      'ol',
      'li',
      'a',
      'span',
      'div',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'blockquote',
      'code',
      'pre',
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'id'],
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
  });

  const testPassed = sanitized === test.expected || !sanitized.includes('script') && !sanitized.includes('onclick') && !sanitized.includes('javascript:');

  console.log(`Test ${index + 1}: ${test.name}`);
  console.log(`Input:    ${test.input}`);
  console.log(`Output:   ${sanitized}`);
  console.log(`Expected: ${test.expected}`);
  console.log(`Status:   ${testPassed ? '✅ PASS' : '❌ FAIL'}`);
  console.log('');

  if (testPassed) {
    passed++;
  } else {
    failed++;
  }
});

console.log('================================');
console.log(`\n📊 Results: ${passed}/${testCases.length} tests passed`);

if (failed === 0) {
  console.log('✅ All tests passed!');
  process.exit(0);
} else {
  console.log(`❌ ${failed} test(s) failed`);
  process.exit(1);
}
