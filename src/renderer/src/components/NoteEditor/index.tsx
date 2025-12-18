/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable prettier/prettier */
import { useState, useEffect, useRef, useCallback } from 'react'
import { Note, Notebook } from '../../types/note'
import { sanitizeContent } from '../../utils/markdownUtils'
import { useSettings } from '../../contexts/SettingsContext'
import NoteEditorHeader from './NoteEditorHeader'
import TagsModal from './TagsModal'
import MarkdownEditor from './MarkdownEditor'
import NoteContentRenderer from './NoteContentRenderer'

interface NoteEditorProps {
  note: Note | null
  notebooks?: Notebook[]
  tags?: Record<string, string>
  onNoteUpdate: (note: Note) => void
  onTagUpdate?: (tagName: string, color: string) => void
}

const statusOptions: Array<{ value: Note['status']; label: string }> = [
  { value: 'active', label: 'Active' },
  { value: 'on-hold', label: 'On Hold' },
  { value: 'completed', label: 'Completed' },
  { value: 'dropped', label: 'Dropped' }
]

const tagColors = [
  '#f59e0b', // amber
  '#22c55e', // green
  '#3b82f6', // blue
  '#ef4444', // red
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16'  // lime
]

export default function NoteEditor({
  note,
  notebooks = [],
  tags = {},
  onNoteUpdate,
  onTagUpdate
}: NoteEditorProps) {
  const { settings, updateEditorBehavior } = useSettings()
  const [editedContent, setEditedContent] = useState(() => note?.content ?? '')
  const [editedTitle, setEditedTitle] = useState(() => note?.title ?? '')
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [showStatusDropdown, setShowStatusDropdown] = useState(false)
  const [showTagsModal, setShowTagsModal] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState(tagColors[0])
  const statusDropdownRef = useRef<HTMLDivElement | null>(null)
  const tagsModalRef = useRef<HTMLDivElement | null>(null)
  const previousNoteIdRef = useRef<string | null>(null)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastSavedContentRef = useRef<string>('')
  const lastSavedTitleRef = useRef<string>('')

  // Función de guardado
  const handleSave = useCallback(() => {
    if (note && (editedContent !== lastSavedContentRef.current || editedTitle !== lastSavedTitleRef.current)) {
      console.log('Guardando nota:', note.id, 'Título:', editedTitle)
      lastSavedContentRef.current = editedContent
      lastSavedTitleRef.current = editedTitle
      onNoteUpdate({
        ...note,
        title: editedTitle,
        content: editedContent,
        updatedAt: new Date().toISOString()
      })
    } else {
      console.log('No hay cambios para guardar')
    }
  }, [note, editedContent, editedTitle, onNoteUpdate])

  // Sincronizar cuando cambia la nota
  useEffect(() => {
    if (!note) return
    
    const currentNoteId = note.id
    const noteIdChanged = previousNoteIdRef.current !== currentNoteId
    
    if (noteIdChanged) {
      if (previousNoteIdRef.current && saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
        handleSave()
      }
      
      previousNoteIdRef.current = currentNoteId
      const sanitizedContent = sanitizeContent(note.content)
      const isNewNote = note.title === 'Untitled Note' && note.content === ''
      
      requestAnimationFrame(() => {
        setEditedContent(sanitizedContent)
        setEditedTitle(note.title)
        // Activar edición del título automáticamente si es una nueva nota
        setIsEditingTitle(isNewNote)
      })
      lastSavedContentRef.current = sanitizedContent
      lastSavedTitleRef.current = note.title
    }
  }, [note?.id, note, handleSave])

  // Cerrar dropdowns al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
        setShowStatusDropdown(false)
      }
      if (tagsModalRef.current && !tagsModalRef.current.contains(event.target as Node)) {
        setShowTagsModal(false)
      }
    }

    if (showStatusDropdown || showTagsModal) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
    return undefined
  }, [showStatusDropdown, showTagsModal])

  // Guardado automático con debouncing
  useEffect(() => {
    if (!note) return
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    
    if (editedContent !== lastSavedContentRef.current || editedTitle !== lastSavedTitleRef.current) {
      saveTimeoutRef.current = setTimeout(() => {
        handleSave()
      }, 300)
    }
    
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [editedContent, editedTitle, note, handleSave])

  // Guardar al perder foco
  useEffect(() => {
    const onBlur = () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
      handleSave()
    }
    const onVisibility = () => {
      if (document.hidden) {
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
        handleSave()
      }
    }
    window.addEventListener('blur', onBlur)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.removeEventListener('blur', onBlur)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [handleSave])

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
      handleSave()
    }
  }, [handleSave])

  // Escuchar evento de toggle preview desde shortcuts y actualizar el modo de vista global
  useEffect(() => {
    const handleTogglePreview = (): void => {
      const currentView = settings.editor.behavior.view

      let nextView: typeof currentView
      switch (currentView) {
        case 'editor-only':
          // Mostrar editor + preview cuando actualmente solo se ve el editor
          nextView = 'editor-preview'
          break
        case 'preview-only':
          // Volver a editor + preview cuando solo se ve la preview
          nextView = 'editor-preview'
          break
        case 'editor-preview':
        default:
          // Si ya estamos en editor + preview, volver a solo editor
          nextView = 'editor-only'
          break
      }

      updateEditorBehavior({ view: nextView })
    }

    window.addEventListener('toggle-preview', handleTogglePreview as EventListener)
    return () => {
      window.removeEventListener('toggle-preview', handleTogglePreview as EventListener)
    }
  }, [settings.editor.behavior.view, updateEditorBehavior])

  const handleTitleSave = (title: string) => {
    if (note) {
      setEditedTitle(title)
      onNoteUpdate({ ...note, title, updatedAt: new Date().toISOString() })
      setIsEditingTitle(false)
    }
  }

  const handleTitleCancel = () => {
    if (note) {
      setEditedTitle(note.title)
      setIsEditingTitle(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsEditingTitle(false)
      if (note) {
        setEditedContent(note.content)
        setEditedTitle(note.title)
      }
    }
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
      handleSave()
    }
  }

  const handleStatusChange = (newStatus: Note['status']): void => {
    if (note) {
      onNoteUpdate({ ...note, status: newStatus, updatedAt: new Date().toISOString() })
      setShowStatusDropdown(false)
    }
  }

  const handleAddTag = (): void => {
    if (note && newTagName.trim()) {
      const tagName = newTagName.trim()
      const updatedTags = note.tags?.includes(tagName) ? note.tags : [...(note.tags || []), tagName]
      onNoteUpdate({ ...note, tags: updatedTags, updatedAt: new Date().toISOString() })
      if (onTagUpdate && !tags[tagName]) {
        onTagUpdate(tagName, newTagColor)
      }
      setNewTagName('')
      setShowTagsModal(false)
    }
  }

  // Detectar tags en el contenido
  useEffect(() => {
    if (!note || !editedContent) return

    const tagRegex = /(?:^|\s)([#@])(\w+)/g
    const matches = Array.from(editedContent.matchAll(tagRegex))
    const detectedTags = new Set<string>()
    
    matches.forEach((match) => {
      detectedTags.add(match[2])
    })

    if (detectedTags.size > 0) {
      const currentTags = note.tags || []
      const newTags = Array.from(detectedTags).filter((tag) => !currentTags.includes(tag))
      
      if (newTags.length > 0) {
        const updatedTags = [...currentTags, ...newTags]
        
        if (onTagUpdate) {
          newTags.forEach((tagName) => {
            if (!tags[tagName]) {
              const colorIndex = Object.keys(tags).length % tagColors.length
              onTagUpdate(tagName, tagColors[colorIndex])
            }
          })
        }
        
        onNoteUpdate({ ...note, tags: updatedTags, updatedAt: new Date().toISOString() })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editedContent])

  const handleRemoveTag = (tagName: string): void => {
    if (note) {
      onNoteUpdate({ ...note, tags: note.tags?.filter((t) => t !== tagName), updatedAt: new Date().toISOString() })
    }
  }

  if (!note) {
    return (
      <div className="flex-1 h-full bg-linear-to-br from-ink-900 to-ink-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 rounded-2xl bg-ink-800 flex items-center justify-center mx-auto mb-6 shadow-lg">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="text-text-muted">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <h3 className="text-xl font-serif text-text-primary mb-2">No note selected</h3>
          <p className="text-text-muted text-sm max-w-xs">
            Select a note from the list or create a new one to start writing
          </p>
        </div>
      </div>
    )
  }

  const wordCount = note.content.split(/\s+/).filter((word) => word.length > 0).length
  const charCount = note.content.length
  const currentStatus = note.status || 'active'
  const statusLabel = statusOptions.find((s) => s.value === currentStatus)?.label || 'Active'

  return (
    <div className="flex-1 h-full bg-linear-to-br from-ink-900 via-ink-900 to-ink-950 flex flex-col overflow-hidden">
      {/* Header / Top Bar (visibilidad controlada por ajustes de UI) */}
      {settings.ui.visibility.showTopBar && (
        <NoteEditorHeader
          note={note}
          notebooks={notebooks}
          tags={tags}
          isEditingTitle={isEditingTitle}
          statusLabel={statusLabel}
          showStatusDropdown={showStatusDropdown}
          statusDropdownRef={statusDropdownRef}
          wordCount={wordCount}
          charCount={charCount}
          onTitleEditStart={() => setIsEditingTitle(true)}
          onTitleSave={handleTitleSave}
          onTitleCancel={handleTitleCancel}
          onStatusToggle={() => setShowStatusDropdown(!showStatusDropdown)}
          onStatusChange={handleStatusChange}
          onRemoveTag={handleRemoveTag}
          onAddTagClick={() => setShowTagsModal(true)}
        />
      )
    }

    {/* Tags Modal */}
      <TagsModal
        isOpen={showTagsModal}
        newTagName={newTagName}
        newTagColor={newTagColor}
        tagColors={tagColors}
        modalRef={tagsModalRef}
        onTagNameChange={setNewTagName}
        onTagColorChange={setNewTagColor}
        onAdd={handleAddTag}
        onCancel={() => { setShowTagsModal(false); setNewTagName('') }}
      />

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto scrollbar-hide relative">
        {settings.editor.behavior.view === 'editor-only' && (
          <div
            className="w-full h-full p-0"
            style={{
              fontFamily:
                settings.editor.appearance.fontFamily === 'custom'
                  ? `'${settings.editor.appearance.customFontFamily}', ui-monospace, monospace`
                  : "'JetBrains Mono', ui-monospace, monospace",
              fontSize: `${settings.editor.appearance.fontSize}px`,
              lineHeight: settings.editor.appearance.lineHeight,
              maxWidth: settings.editor.appearance.maxTextWidth ? '800px' : '100%',
              margin: settings.editor.appearance.maxTextWidth ? '0 auto' : '0',
              padding: settings.editor.appearance.maxTextWidth ? '0 2rem' : '0'
            }}
          >
            <MarkdownEditor
              content={editedContent}
              onContentChange={setEditedContent}
              onSave={() => {
                if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
                handleSave()
              }}
              onKeyDown={handleKeyDown}
            />
          </div>
        )}

        {settings.editor.behavior.view === 'preview-only' && (
          <div className="max-w-3xl mx-auto px-8 pt-4 pb-8">
            <NoteContentRenderer content={editedContent} />
          </div>
        )}

        {settings.editor.behavior.view === 'editor-preview' && (
          <div className="flex h-full px-6 pt-4 pb-6 gap-6">
            <div
              className="flex-1 min-w-0"
              style={{
                fontFamily:
                  settings.editor.appearance.fontFamily === 'custom'
                    ? `'${settings.editor.appearance.customFontFamily}', ui-monospace, monospace`
                    : "'JetBrains Mono', ui-monospace, monospace",
                fontSize: `${settings.editor.appearance.fontSize}px`,
                lineHeight: settings.editor.appearance.lineHeight
              }}
            >
              <MarkdownEditor
                content={editedContent}
                onContentChange={setEditedContent}
                onSave={() => {
                  if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
                  handleSave()
                }}
                onKeyDown={handleKeyDown}
              />
            </div>
            <div className="flex-1 min-w-0 max-w-3xl mx-auto border-l border-ink-800 pl-6">
              <NoteContentRenderer content={editedContent} />
            </div>
          </div>
        )}

        {/* View Mode Toggle (cambia el modo global de vista) */}
        <button
          onClick={() => {
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
            handleSave()

            const currentView = settings.editor.behavior.view
            let nextView: typeof currentView

            // Ciclo sencillo: editor-only -> editor-preview -> preview-only -> editor-only
            if (currentView === 'editor-only') {
              nextView = 'editor-preview'
            } else if (currentView === 'editor-preview') {
              nextView = 'preview-only'
            } else {
              nextView = 'editor-only'
            }

            updateEditorBehavior({ view: nextView })
          }}
          className="absolute bottom-6 right-6 w-12 h-12 rounded-xl bg-ink-700 hover:bg-ink-600 border border-ink-600 flex items-center justify-center text-text-muted hover:text-amber transition-all shadow-lg hover:shadow-glow z-10 group"
          title={
            settings.editor.behavior.view === 'editor-only'
              ? 'Editor + live preview'
              : settings.editor.behavior.view === 'editor-preview'
                ? 'Preview only'
                : 'Editor only'
          }
        >
          {settings.editor.behavior.view === 'preview-only' ? (
            // Icono de modo edición
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              className="group-hover:scale-110 transition-transform"
            >
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          ) : (
            // Icono de ojo (modo preview / mixto)
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              className="group-hover:scale-110 transition-transform"
            >
              <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
              <path
                d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </svg>
          )}
        </button>
      </div>
    </div>
  )
}
