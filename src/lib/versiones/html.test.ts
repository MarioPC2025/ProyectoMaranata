import { describe, expect, it } from 'vitest'
import { esUrlSegura } from './html'

describe('esUrlSegura', () => {
  it('acepta URLs relativas, anclas y esquemas web', () => {
    expect(esUrlSegura('/lector/JHN.3')).toBe(true)
    expect(esUrlSegura('#v16')).toBe(true)
    expect(esUrlSegura('https://www.bible.com')).toBe(true)
    expect(esUrlSegura('HTTP://ejemplo.org')).toBe(true)
    expect(esUrlSegura('mailto:alguien@ejemplo.org')).toBe(true)
  })

  it('rechaza esquemas que ejecutan código', () => {
    expect(esUrlSegura('javascript:alert(1)')).toBe(false)
    expect(esUrlSegura('data:text/html,<script>alert(1)</script>')).toBe(false)
    expect(esUrlSegura('vbscript:msgbox(1)')).toBe(false)
  })

  it('no se deja engañar por mayúsculas, espacios ni caracteres de control', () => {
    expect(esUrlSegura('  JavaScript:alert(1)')).toBe(false)
    expect(esUrlSegura('java\tscript:alert(1)')).toBe(false)
    expect(esUrlSegura('\u0001data:text/html,x')).toBe(false)
  })
})
