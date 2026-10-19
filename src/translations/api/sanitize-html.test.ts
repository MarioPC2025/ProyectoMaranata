import { describe, expect, it } from 'vitest';
import { isSafeUrl, sanitizeHtml } from './sanitize-html.ts';

describe('isSafeUrl', () => {
  it('acepta URLs relativas, anclas y esquemas web', () => {
    expect(isSafeUrl('/lector/JHN.3')).toBe(true);
    expect(isSafeUrl('#v16')).toBe(true);
    expect(isSafeUrl('https://www.bible.com')).toBe(true);
    expect(isSafeUrl('HTTP://ejemplo.org')).toBe(true);
    expect(isSafeUrl('mailto:alguien@ejemplo.org')).toBe(true);
  });

  it('rechaza esquemas que ejecutan código', () => {
    expect(isSafeUrl('javascript:alert(1)')).toBe(false);
    expect(isSafeUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
    expect(isSafeUrl('vbscript:msgbox(1)')).toBe(false);
  });

  it('no se deja engañar por mayúsculas, espacios ni caracteres de control', () => {
    expect(isSafeUrl('  JavaScript:alert(1)')).toBe(false);
    expect(isSafeUrl('java\tscript:alert(1)')).toBe(false);
    expect(isSafeUrl('\u0001data:text/html,x')).toBe(false);
  });
});

describe('sanitizeHtml', () => {
  it('deja el texto, los párrafos y los versículos como llegaron', () => {
    const html = '<p class="p"><span class="v">16</span>Porque de tal manera amó Dios.</p>';
    expect(sanitizeHtml(html)).toBe(html);
  });

  it('quita scripts, iframes y otras etiquetas que ejecutan o incrustan', () => {
    const limpio = sanitizeHtml('<p>texto</p><script>alert(1)</script><iframe></iframe>');
    expect(limpio).toBe('<p>texto</p>');
  });

  it('quita los atributos de eventos y las URL que ejecutan código', () => {
    const limpio = sanitizeHtml(
      '<p onclick="alert(1)"><a href="javascript:alert(1)">uno</a><a href="https://a.org">dos</a></p>',
    );
    expect(limpio).not.toContain('onclick');
    expect(limpio).not.toContain('javascript:');
    expect(limpio).toContain('<a href="https://a.org">dos</a>');
  });
});
