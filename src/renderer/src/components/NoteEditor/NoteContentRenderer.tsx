/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { useRef } from 'react'
import type { ReactNode, HTMLAttributes } from 'react'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import rehypeRaw from 'rehype-raw'
import type { PluggableList } from 'unified'
import { useSettings } from '../../contexts/SettingsContext'
import { renderCodeBlock } from '../../utils/markdown/codeHighlight'

import 'katex/dist/katex.min.css'

interface NoteContentRendererProps {
  content: string
}

export default function NoteContentRenderer({ content }: NoteContentRendererProps) {
  const { settings } = useSettings()
  const containerRef = useRef<HTMLDivElement | null>(null)

  const markdownSettings = settings.editor.markdown

  const remarkPlugins: PluggableList = []

  // Dialecto y extensiones GFM (tablas, task lists, footnotes)
  if (markdownSettings.dialect === 'gfm' && (markdownSettings.tables || markdownSettings.taskLists || markdownSettings.footnotes)) {
    remarkPlugins.push(remarkGfm)
  }

  // Soporte de matemáticas
  if (markdownSettings.mathSupport) {
    remarkPlugins.push(remarkMath)
  }

  const rehypePlugins: PluggableList = []

  // Renderizado de HTML embebido
  if (markdownSettings.htmlEmbedded) {
    rehypePlugins.push(rehypeRaw)
  }

  // Renderizado de KaTeX
  if (markdownSettings.mathSupport) {
    rehypePlugins.push(rehypeKatex)
  }

  type CodeProps = {
    className?: string
    children?: ReactNode
  } & HTMLAttributes<HTMLElement>

  // Extraer texto plano de nodos React (children puede ser string, número, o array)
  const nodeToText = (node: ReactNode): string => {
    if (node === null || node === undefined) return ''
    if (typeof node === 'string') return node
    if (typeof node === 'number') return String(node)
    if (Array.isArray(node)) return node.map(nodeToText).join('')
    if (typeof node === 'object' && 'props' in node) {
      return nodeToText((node as { props: { children?: ReactNode } }).props.children)
    }
    return ''
  }

  const components: Components = {
    // Asegurar que las listas se rendericen correctamente
    ul: ({ children, ...props }) => <ul {...props}>{children}</ul>,
    ol: ({ children, ...props }) => <ol {...props}>{children}</ol>,
    li: ({ children, ...props }) => <li {...props}>{children}</li>,
    // Asegurar que los blockquotes se rendericen correctamente
    blockquote: ({ children, ...props }) => <blockquote {...props}>{children}</blockquote>,
    // Componente pre: detecta bloques de código
    pre(rawProps) {
      const { children } = rawProps as HTMLAttributes<HTMLElement> & { children?: ReactNode }

      // En react-markdown v10, <pre><code class="language-xxx">...</code></pre>
      // Extraer el elemento <code> hijo y su className
      const codeChild = Array.isArray(children) ? children[0] : children
      let language = ''
      let codeContent = ''

      if (codeChild && typeof codeChild === 'object' && 'props' in codeChild) {
        const codeProps = (codeChild as { props: { className?: string; children?: ReactNode } }).props
        const match = /language-(\w+)/.exec(codeProps.className || '')
        language = match?.[1] || ''
        codeContent = nodeToText(codeProps.children).replace(/\n$/, '')
      } else {
        codeContent = nodeToText(children).replace(/\n$/, '')
      }

      // Bloques de código con resaltado de sintaxis
      const html = renderCodeBlock(codeContent, language)
      return <div key={`code-${language}-${codeContent.length}`} dangerouslySetInnerHTML={{ __html: html }} />
    },
    // Inline code
    code(rawProps) {
      const { className, children, ...props } = rawProps as CodeProps

      // Si tiene className con language- es un bloque (ya manejado por pre), ignorar
      const match = /language-(\w+)/.exec(className || '')
      if (match) {
        return <code className={className} {...props}>{children}</code>
      }

      // Inline code
      return (
        <code className={className} {...props}>
          {children}
        </code>
      )
    }
  }

  return (
    <div className="markdown-content min-h-full" ref={containerRef}>
      {content ? (
        <ReactMarkdown
          remarkPlugins={remarkPlugins}
          rehypePlugins={rehypePlugins}
          components={components}
        >
          {content}
        </ReactMarkdown>
      ) : (
        <p className="text-[#a0a0a0] italic">Start writing in Markdown...</p>
      )}
    </div>
  )
}
