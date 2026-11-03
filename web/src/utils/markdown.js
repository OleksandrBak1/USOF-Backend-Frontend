/**
 * Lightweight, safe Markdown-to-HTML parser for USOF.
 * Handles code blocks, inline code, headings, bold, italic, lists, quotes, and links.
 */
export function renderMarkdown(content) {
  if (!content) return '';

  // If content is already rich HTML (e.g. from previous TinyMCE posts with multiple tags)
  const hasHtmlTags = /<(?:p|pre|code|div|h[1-6]|ul|ol|li|blockquote)[\s>]/i.test(content);
  if (hasHtmlTags && !content.includes('```')) {
    return content;
  }

  // Normalize Windows CRLF to LF
  let text = String(content).replace(/\r\n/g, '\n');

  // 1. Extract and protect code blocks (language is optional)
  const codeBlocks = [];
  text = text.replace(/```([a-zA-Z0-9_-]*)[ \t]*\n([\s\S]*?)\n?[ \t]*```/g, (match, lang, code) => {
    const escapedCode = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    const placeholder = `XUSOFCODEBLOCK${codeBlocks.length}X`;
    codeBlocks.push(
      `<pre><code class="language-${lang || 'plaintext'}">${escapedCode.trim()}</code></pre>`
    );
    return placeholder;
  });

  // 2. Extract and protect inline code
  const inlineCodes = [];
  text = text.replace(/`([^`\n]+)`/g, (match, code) => {
    const escaped = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    const placeholder = `XUSOFINLINECODE${inlineCodes.length}X`;
    inlineCodes.push(`<code>${escaped}</code>`);
    return placeholder;
  });

  // 3. Headings: ### Title, ## Title, # Title
  text = text.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  text = text.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  text = text.replace(/^# (.*$)/gim, '<h1>$1</h1>');

  // 4. Blockquotes: > quote
  text = text.replace(/^\> (.*$)/gim, '<blockquote>$1</blockquote>');

  // 5. Bold & Italic (placeholders have no underscores or asterisks, so they won't match)
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/__([^_]+)__/g, '<strong>$1</strong>');
  text = text.replace(/\*([^\*\n]+)\*/g, '<em>$1</em>');
  text = text.replace(/_([^_\n]+)_/g, '<em>$1</em>');

  // 6. Links: [text](url)
  text = text.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s\)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
  );

  // 7. Unordered lists: - item or * item
  text = text.replace(/(?:^[ \t]*[-*][ \t]+[^\n]+(?:\n|$))+/gm, (list) => {
    const items = list
      .trim()
      .split('\n')
      .map((item) => `<li>${item.replace(/^[ \t]*[-*][ \t]+/, '')}</li>`)
      .join('');
    return `<ul>${items}</ul>`;
  });

  // 8. Paragraphs: double newlines
  const paragraphs = text
    .split(/\n{2,}/)
    .map((p) => {
      const trimmed = p.trim();
      if (!trimmed) return '';
      // Don't wrap tags that are already block-level
      if (/^<(?:h[1-6]|ul|ol|pre|blockquote)/i.test(trimmed) || trimmed.startsWith('XUSOFCODEBLOCK')) {
        return trimmed;
      }
      return `<p>${trimmed.replace(/\n/g, '<br/>')}</p>`;
    })
    .join('\n');

  // 9. Restore code blocks and inline code
  let result = paragraphs;
  inlineCodes.forEach((code, i) => {
    result = result.replace(new RegExp(`XUSOFINLINECODE${i}X`, 'g'), code);
  });
  codeBlocks.forEach((block, i) => {
    result = result.replace(new RegExp(`XUSOFCODEBLOCK${i}X`, 'g'), block);
  });

  return result;
}

/**
 * Strips markdown and HTML syntax for clean plain text snippets.
 */
export function stripMarkdown(content) {
  if (!content) return '';
  return String(content)
    .replace(/```[\s\S]*?```/g, ' ') // remove large code blocks
    .replace(/`([^`]+)`/g, '$1') // unwrap inline code
    .replace(/^#{1,6}\s+/gm, '') // remove headings ###
    .replace(/(\*\*|__)(.*?)\1/g, '$2') // remove bold
    .replace(/(\*|_)(.*?)\1/g, '$2') // remove italic
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // links
    .replace(/^\s*[-*]\s+/gm, '') // list bullets
    .replace(/^\>\s+/gm, '') // blockquotes
    .replace(/<[^>]+>/g, ' ') // HTML tags
    .replace(/\s+/g, ' ')
    .trim();
}
