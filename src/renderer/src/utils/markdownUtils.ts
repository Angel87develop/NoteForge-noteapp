/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/explicit-function-return-type */

import { highlightCode, getDisplayLanguageName } from './markdown/codeHighlight'

// Función para sanitizar contenido: eliminar caracteres invisibles y normalizar
export const sanitizeContent = (text: string): string => {
  if (!text) return ''
  
  return text
    // Eliminar caracteres de ancho cero (zero-width characters)
    .replace(/[\u200B-\u200D\uFEFF\u00AD]/g, '')
    // Eliminar espacios no separables (non-breaking spaces) y reemplazar con espacios normales
    .replace(/\u00A0/g, ' ')
    // Normalizar saltos de línea: convertir \r\n y \r a \n
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Eliminar espacios al final de línea
    .replace(/[ \t]+$/gm, '')
    // Eliminar caracteres de control excepto tab, newline, y carriage return
    .split('')
    .filter((char) => {
      const code = char.charCodeAt(0)
      // Permitir: tab (9), newline (10), carriage return (13), y caracteres imprimibles (32+)
      // Bloquear: otros caracteres de control (0-8, 11-12, 14-31, 127)
      return code === 9 || code === 10 || code === 13 || (code >= 32 && code !== 127)
    })
    .join('')
}

// Función para procesar markdown inline (bold, itálico, código, links, strikethrough) como HTML
export const processInlineMarkdownHTML = (text: string): string => {
  const escapeHtml = (str: string) => {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
  }

  if (!text) return ''

  // Procesar en orden: código inline primero (para evitar conflictos), luego links, bold, strikethrough, italic
  type PartType = 'text' | 'bold' | 'italic' | 'code' | 'link' | 'strikethrough'
  const parts: Array<{ type: PartType; content: string; url?: string }> = []
  let lastIndex = 0

  // Procesar código inline (`code`)
  const codeInlineRegex = /`([^`]+)`/g
  const codeMatches: Array<{ index: number; length: number; content: string }> = []
  let codeMatch

  while ((codeMatch = codeInlineRegex.exec(text)) !== null) {
    codeMatches.push({
      index: codeMatch.index,
      length: codeMatch[0].length,
      content: codeMatch[1]
    })
  }

  // Procesar links [text](url)
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g
  const linkMatches: Array<{ index: number; length: number; text: string; url: string }> = []
  let linkMatch

  while ((linkMatch = linkRegex.exec(text)) !== null) {
    linkMatches.push({
      index: linkMatch.index,
      length: linkMatch[0].length,
      text: linkMatch[1],
      url: linkMatch[2]
    })
  }

  // Procesar bold (**text** o __text__)
  const boldRegex = /(\*\*|__)(.+?)\1/g
  const boldMatches: Array<{ index: number; length: number; content: string }> = []
  let boldMatch

  while ((boldMatch = boldRegex.exec(text)) !== null) {
    boldMatches.push({
      index: boldMatch.index,
      length: boldMatch[0].length,
      content: boldMatch[2]
    })
  }

  // Procesar strikethrough (~~text~~)
  const strikethroughRegex = /~~(.+?)~~/g
  const strikethroughMatches: Array<{ index: number; length: number; content: string }> = []
  let strikethroughMatch

  while ((strikethroughMatch = strikethroughRegex.exec(text)) !== null) {
    strikethroughMatches.push({
      index: strikethroughMatch.index,
      length: strikethroughMatch[0].length,
      content: strikethroughMatch[1]
    })
  }

  // Procesar itálico (*text* o _text_) - solo si no está dentro de bold
  const italicRegex = /(?<!\*)\*(?!\*)(.+?)\*(?!\*)|(?<!_)_(?!_)(.+?)_(?!_)/g
  const italicMatches: Array<{ index: number; length: number; content: string }> = []
  let italicMatch

  while ((italicMatch = italicRegex.exec(text)) !== null) {
    const content = italicMatch[1] || italicMatch[2]
    // Verificar que no esté dentro de un bold
    const isInsideBold = boldMatches.some(bm => 
      italicMatch.index! >= bm.index && italicMatch.index! < bm.index + bm.length
    )
    if (!isInsideBold) {
      italicMatches.push({
        index: italicMatch.index!,
        length: italicMatch[0].length,
        content
      })
    }
  }

  // Combinar todos los matches y ordenarlos por índice
  const allMatches: Array<{ index: number; length: number; type: PartType; content: string; url?: string }> = [
    ...codeMatches.map(m => ({ ...m, type: 'code' as PartType })),
    ...linkMatches.map(m => ({ ...m, type: 'link' as PartType, content: m.text, url: m.url })),
    ...boldMatches.map(m => ({ ...m, type: 'bold' as PartType })),
    ...strikethroughMatches.map(m => ({ ...m, type: 'strikethrough' as PartType })),
    ...italicMatches.map(m => ({ ...m, type: 'italic' as PartType }))
  ].sort((a, b) => a.index - b.index)

  // Construir partes sin solapamientos
  allMatches.forEach((match) => {
    // Agregar texto antes del match
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: text.substring(lastIndex, match.index) })
    }

    // Agregar el match
    parts.push({ 
      type: match.type, 
      content: match.content,
      url: match.url
    })
    lastIndex = match.index + match.length
  })

  // Agregar texto restante
  if (lastIndex < text.length) {
    parts.push({ type: 'text', content: text.substring(lastIndex) })
  }

  // Si no hay matches, procesar todo como texto
  if (parts.length === 0) {
    parts.push({ type: 'text', content: text })
  }

  // Convertir a HTML
  return parts.map((part) => {
    switch (part.type) {
      case 'code':
        return `<span style="color: #a78bfa; background-color: #2a2a2a; padding: 0.125rem 0.25rem; border-radius: 0.25rem; font-family: ui-monospace, monospace;">\`${escapeHtml(part.content)}\`</span>`
      case 'link':
        return `<span style="color: #60a5fa; text-decoration: underline; cursor: pointer;">[${escapeHtml(part.content)}](${escapeHtml(part.url || '')})</span>`
      case 'bold':
        return `<span style="color: #c084fc; font-weight: 700;">**${escapeHtml(part.content)}**</span>`
      case 'strikethrough':
        return `<span style="color: #9ca3af; text-decoration: line-through;">~~${escapeHtml(part.content)}~~</span>`
      case 'italic':
        return `<span style="color: #7dd3fc; font-style: italic;">*${escapeHtml(part.content)}*</span>`
      default:
        return escapeHtml(part.content)
    }
  }).join('')
}

// Función para renderizar markdown con colores en modo edición (como HTML string)
export const renderMarkdownWithColorsHTML = (text: string): string => {
  if (!text) return ''

  // Sanitizar el contenido antes de renderizar
  const sanitizedText = sanitizeContent(text)
  const lines = sanitizedText.split('\n')
  const htmlLines: string[] = []
  let inCodeBlock = false
  let codeBlockLines: string[] = []
  let codeBlockLanguage = ''

  const escapeHtml = (str: string) => {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
  }

  lines.forEach((line) => {
    // Detectar inicio/fin de code blocks (```)
    const codeBlockMatch = line.match(/^```([\w-]*)$/)
    if (codeBlockMatch) {
      if (inCodeBlock) {
        // Cerrar code block: aplicar resaltado de sintaxis si hay lenguaje
        const codeContent = codeBlockLines.join('\n')
        const langLabel = codeBlockLanguage ? getDisplayLanguageName(codeBlockLanguage) : ''
        const langTag = langLabel ? `<span class="md-code-lang">${escapeHtml(langLabel)}</span>` : ''
        const highlighted = codeBlockLanguage
          ? highlightCode(codeContent, codeBlockLanguage)
          : escapeHtml(codeContent)
        htmlLines.push(
          `<div class="md-code-block">${langTag}${highlighted}</div>`
        )
        inCodeBlock = false
        codeBlockLines = []
        codeBlockLanguage = ''
      } else {
        // Abrir code block y capturar el lenguaje
        inCodeBlock = true
        codeBlockLanguage = codeBlockMatch[1] || ''
      }
      return
    }

    // Si estamos dentro de un code block, agregar la línea al contenido
    if (inCodeBlock) {
      codeBlockLines.push(line)
      return
    }

    // Línea vacía: renderizar como div vacío para mantener la altura correcta
    // Usar un espacio no separable para mantener la altura de línea
    if (line === '') {
      htmlLines.push(`<div style="font-size: 0.875rem; line-height: 2.5rem; height: 2.5rem; margin: 0; padding: 0; display: flex; align-items: center; box-sizing: border-box;"> </div>`)
      return
    }

    // Detectar blockquotes (>)
    const blockquoteMatch = line.match(/^>\s*(.+)$/)
    if (blockquoteMatch) {
      const processedContent = processInlineMarkdownHTML(blockquoteMatch[1])
      htmlLines.push(
        `<div style="font-size: 0.875rem; line-height: 2.5rem; height: 2.5rem; margin: 0; padding-left: 1rem; border-left: 3px solid #60a5fa; color: #cbd5e1; display: flex; align-items: center; box-sizing: border-box;">${processedContent}</div>`
      )
      return
    }

    // Detectar títulos (h1-h6)
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/)
    if (headingMatch) {
      const level = headingMatch[1].length
      const content = headingMatch[2]
      const headingColors = ['#6886b7', '#6886b7', '#6886b7', '#60a5fa', '#7dd3fc', '#a78bfa']
      const headingColor = headingColors[Math.min(level - 1, headingColors.length - 1)]
      
      // Procesar contenido para permitir formateo inline (bold, italic, etc.)
      const processedContent = processInlineMarkdownHTML(content)
      
      // Usar clases CSS para aplicar tamaños grandes a los títulos
      const headingClass = `markdown-h${level}`
      htmlLines.push(
        `<div class="${headingClass}" style="color: ${headingColor};"><span style="color: ${headingColor};">${headingMatch[1]}</span> <span style="color: ${headingColor};">${processedContent}</span></div>`
      )
      return
    }

    // Detectar listas (con o sin contenido)
    const ulMatch = line.match(/^(\s*)([-*+])\s+(.*)$/)
    const olMatch = line.match(/^(\s*)(\d+\.)\s+(.*)$/)

    if (ulMatch || olMatch) {
      const match = ulMatch || olMatch
      const marker = ulMatch ? ulMatch[2] : olMatch![2]
      const content = ulMatch ? ulMatch[3] : olMatch![3]
      const indent = match![1].length

      // Procesar contenido para bold e itálico (puede estar vacío)
      const processedContent = content ? processInlineMarkdownHTML(content) : ' '

      // Color especial para marcadores de lista
      const markerColor = '#a78bfa' // violet-400

      htmlLines.push(
        `<div style="font-size: 0.875rem; line-height: 2.5rem; height: 2.5rem; margin-left: ${indent * 1.5}rem; margin-top: 0; margin-bottom: 0; margin-right: 0; padding: 0; color: #e0e0e0; display: flex; align-items: center; box-sizing: border-box;"><span style="color: ${markerColor}; font-weight: 600;">${escapeHtml(marker)}</span> <span>${processedContent}</span></div>`
      )
      return
    }

    // Procesar línea normal con bold e itálico
    const processedLine = processInlineMarkdownHTML(line)
    htmlLines.push(`<div style="font-size: 0.875rem; line-height: 2.5rem; height: 2.5rem; margin: 0; padding: 0; display: flex; align-items: center; box-sizing: border-box;">${processedLine}</div>`)
  })

  // Si el code block no se cerró, renderizarlo (con resaltado si hay lenguaje)
  if (inCodeBlock && codeBlockLines.length > 0) {
    const codeContent = codeBlockLines.join('\n')
    const langLabel = codeBlockLanguage ? getDisplayLanguageName(codeBlockLanguage) : ''
    const langTag = langLabel ? `<span class="md-code-lang">${escapeHtml(langLabel)}</span>` : ''
    const highlighted = codeBlockLanguage
      ? highlightCode(codeContent, codeBlockLanguage)
      : escapeHtml(codeContent)
    htmlLines.push(
      `<div class="md-code-block">${langTag}${highlighted}</div>`
    )
  }

  return htmlLines.join('')
}
