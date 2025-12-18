/* eslint-disable react-hooks/static-components */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { useState, useEffect, useRef } from 'react'
import { Note, Notebook } from '../types/note'

interface SidebarProps {
  notes: Note[]
  notebooks: Notebook[]
  tags?: Record<string, string>
  selectedNotebook?: string | null
  selectedStatus?: Note['status'] | null
  selectedTag?: string | null
  onNotebookSelect?: (id: string | null) => void
  onStatusSelect?: (status: Note['status'] | null) => void
  onTagSelect?: (tagName: string | null) => void
  onCreateNotebook: (name: string, parentId?: string) => Promise<void>
  onDeleteNotebook: (notebookId: string, isSubnotebook: boolean, parentId?: string) => void
  onTagUpdate?: (tagName: string, color: string) => void
  onTagDelete?: (tagName: string) => void
  onFilterChange?: (filterType: 'all' | 'pinned' | 'notebook' | 'status' | 'tag') => void
  onSettingsClick?: () => void
}

// Modern SVG Icons
const AllNotesIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 4h16v16H4V4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" fill="none"/>
    <path d="M4 9h16M9 9v11" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
)

const PinnedIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2l2.4 7.4h7.6l-6 4.6 2.3 7-6.3-4.6-6.3 4.6 2.3-7-6-4.6h7.6L12 2z" 
          stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" fill="none"/>
  </svg>
)

const TrashIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 7h16M10 11v6M14 11v6M5 7l1 12a2 2 0 002 2h8a2 2 0 002-2l1-12M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" 
          stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const StatusIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const TagsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 4h7l9 9-7 7-9-9V4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    <circle cx="8" cy="8" r="1.5" fill="currentColor"/>
  </svg>
)

const BookIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 19.5A2.5 2.5 0 016.5 17H20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
)

const ChevronRight = ({ className = '' }: { className?: string }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const PlusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
)

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

export default function Sidebar({
  notes,
  notebooks,
  tags = {},
  selectedNotebook,
  selectedStatus,
  selectedTag,
  onNotebookSelect,
  onStatusSelect,
  onTagSelect,
  onCreateNotebook,
  onDeleteNotebook,
  onTagUpdate,
  onTagDelete,
  onFilterChange,
  onSettingsClick
}: SidebarProps) {
  const [expandedNotebooks, setExpandedNotebooks] = useState<Set<string>>(new Set())
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['notebooks', 'status', 'tags']))
  const [showCreateModal, setShowCreateModal] = useState<{ parentId?: string; isSubnotebook: boolean } | null>(null)
  const [newNotebookName, setNewNotebookName] = useState('')
  const [contextMenu, setContextMenu] = useState<{ notebookId: string; isSubnotebook: boolean; parentId?: string; x: number; y: number } | null>(null)
  const [tagContextMenu, setTagContextMenu] = useState<{ tagName: string; x: number; y: number } | null>(null)
  const [showTagColorPicker, setShowTagColorPicker] = useState<string | null>(null)
  const modalRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const tagMenuRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (showCreateModal && inputRef.current) {
      inputRef.current.focus()
    }
  }, [showCreateModal])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setShowCreateModal(null)
        setNewNotebookName('')
      }
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setContextMenu(null)
      }
      if (tagMenuRef.current && !tagMenuRef.current.contains(event.target as Node)) {
        setTagContextMenu(null)
        setShowTagColorPicker(null)
      }
    }

    if (showCreateModal || contextMenu || tagContextMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
    return undefined
  }, [showCreateModal, contextMenu, tagContextMenu])

  const toggleNotebook = (id: string) => {
    const newExpanded = new Set(expandedNotebooks)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedNotebooks(newExpanded)
  }

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(section)) {
      newExpanded.delete(section)
    } else {
      newExpanded.add(section)
    }
    setExpandedSections(newExpanded)
  }

  const handleCreateNotebook = async () => {
    if (newNotebookName.trim()) {
      await onCreateNotebook(newNotebookName.trim(), showCreateModal?.parentId)
      setNewNotebookName('')
      setShowCreateModal(null)
    }
  }

  const handleCreateClick = (e: React.MouseEvent, parentId?: string) => {
    e.stopPropagation()
    setShowCreateModal({ parentId, isSubnotebook: !!parentId })
  }

  const handleContextMenu = (e: React.MouseEvent, notebookId: string, isSubnotebook: boolean, parentId?: string) => {
    e.preventDefault()
    e.stopPropagation()
    setContextMenu({ notebookId, isSubnotebook, parentId, x: e.clientX, y: e.clientY })
  }

  const handleDeleteNotebook = () => {
    if (contextMenu) {
      onDeleteNotebook(contextMenu.notebookId, contextMenu.isSubnotebook, contextMenu.parentId)
      setContextMenu(null)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleCreateNotebook()
    else if (e.key === 'Escape') {
      setShowCreateModal(null)
      setNewNotebookName('')
    }
  }

  const allNotesCount = notes.length
  const pinnedNotesCount = notes.filter((n) => n.pinned).length

  const statusCounts = {
    active: notes.filter((n) => n.status === 'active').length,
    'on-hold': notes.filter((n) => n.status === 'on-hold').length,
    completed: notes.filter((n) => n.status === 'completed').length,
    dropped: notes.filter((n) => n.status === 'dropped').length
  }

  const allTags = Array.from(new Set(notes.flatMap((n) => n.tags || [])))
  const tagCounts = allTags.reduce((acc, tag) => {
    acc[tag] = notes.filter((n) => n.tags?.includes(tag)).length
    return acc
  }, {} as Record<string, number>)

  const handleTagContextMenu = (e: React.MouseEvent, tagName: string) => {
    e.preventDefault()
    e.stopPropagation()
    setTagContextMenu({ tagName, x: e.clientX, y: e.clientY })
  }

  const handleTagColorChange = (tagName: string, color: string) => {
    if (onTagUpdate) onTagUpdate(tagName, color)
    setShowTagColorPicker(null)
    setTagContextMenu(null)
  }

  const handleTagDelete = () => {
    if (tagContextMenu && onTagDelete) {
      onTagDelete(tagContextMenu.tagName)
      setTagContextMenu(null)
    }
  }

  const SectionHeader = ({ title, icon, section, onAdd }: { title: string; icon: React.ReactNode; section: string; onAdd?: (e: React.MouseEvent) => void }) => (
    <div 
      className="flex items-center justify-between px-3 py-2 cursor-pointer group"
      onClick={() => toggleSection(section)}
    >
      <div className="flex items-center gap-2">
        <ChevronRight className={`text-text-muted transition-transform duration-200 ${expandedSections.has(section) ? 'rotate-90' : ''}`} />
        <span className="text-text-muted">{icon}</span>
        <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">{title}</span>
      </div>
      {onAdd && (
        <button
          onClick={onAdd}
          className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-amber transition-all p-1 rounded hover:bg-ink-700"
        >
          <PlusIcon />
        </button>
      )}
    </div>
  )

  const NavItem = ({ icon, label, count, isActive, onClick }: { icon: React.ReactNode; label: string; count?: number; isActive?: boolean; onClick: () => void }) => (
    <div
      className={`flex items-center justify-between px-4 py-2.5 mx-2 rounded-lg cursor-pointer transition-all duration-150 ${
        isActive 
          ? 'bg-amber-muted border-l-2 border-amber text-text-primary' 
          : 'hover:bg-ink-700 text-text-secondary hover:text-text-primary'
      }`}
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <span className={isActive ? 'text-amber' : 'text-text-muted'}>{icon}</span>
        <span className="text-sm font-medium">{label}</span>
      </div>
      {count !== undefined && (
        <span className={`text-xs px-2 py-0.5 rounded-full ${isActive ? 'bg-amber/20 text-amber' : 'bg-ink-700 text-text-muted'}`}>
          {count}
        </span>
      )}
    </div>
  )

  return (
    <div className="sidebar w-64 h-full bg-linear-to-b from-ink-850 to-ink-900 border-r border-ink-700 flex flex-col overflow-hidden">
      {/* Logo/Brand */}
      <div className="p-5 border-b border-ink-700">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-serif font-semibold text-text-primary tracking-tight">
              <span className="text-gradient">Inkdrop</span>
            </h1>
            <p className="text-xs text-text-muted mt-1">Your thoughts, beautifully organized</p>
          </div>
          <button
            onClick={onSettingsClick}
            className="p-2 text-text-muted hover:text-amber hover:bg-ink-700 rounded-lg transition-all"
            title="Settings"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
              <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* Quick Access */}
      <div className="py-3 border-b border-ink-700">
        <NavItem
          icon={<AllNotesIcon />}
          label="All Notes"
          count={allNotesCount}
          isActive={!selectedNotebook && !selectedStatus && !selectedTag}
          onClick={() => {
            if (onNotebookSelect) onNotebookSelect(null)
            if (onFilterChange) onFilterChange('all')
          }}
        />
        <NavItem
          icon={<PinnedIcon />}
          label="Starred"
          count={pinnedNotesCount}
          onClick={() => {
            if (onNotebookSelect) onNotebookSelect(null)
            if (onFilterChange) onFilterChange('pinned')
          }}
        />
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto scrollbar-hide py-2">
        {/* Notebooks Section */}
        <div className="mb-2">
          <SectionHeader 
            title="Notebooks" 
            icon={<BookIcon />} 
            section="notebooks"
            onAdd={(e) => handleCreateClick(e)}
          />
          {expandedSections.has('notebooks') && (
            <div className="mt-1 animate-fade-in">
              {notebooks.map((notebook) => (
                <div key={notebook.id}>
                  <div
                    className={`group flex items-center justify-between px-4 py-2 mx-2 rounded-lg cursor-pointer transition-all ${
                      selectedNotebook === notebook.id 
                        ? 'bg-amber-muted border-l-2 border-amber' 
                        : 'hover:bg-ink-700'
                    }`}
                    onClick={() => {
                      if (notebook.children) toggleNotebook(notebook.id)
                      if (onNotebookSelect) onNotebookSelect(notebook.id)
                      if (onFilterChange) onFilterChange('notebook')
                    }}
                    onContextMenu={(e) => handleContextMenu(e, notebook.id, false)}
                  >
                    <div className="flex items-center gap-2">
                      {notebook.children && (
                        <ChevronRight className={`text-text-muted transition-transform ${expandedNotebooks.has(notebook.id) ? 'rotate-90' : ''}`} />
                      )}
                      <span className={`text-sm ${selectedNotebook === notebook.id ? 'text-text-primary font-medium' : 'text-text-secondary'}`}>
                        {notebook.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-text-muted">{notebook.count || 0}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleCreateClick(e, notebook.id) }}
                        className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-amber transition-all p-0.5 rounded"
                      >
                        <PlusIcon />
                      </button>
                    </div>
                  </div>
                  {notebook.children && expandedNotebooks.has(notebook.id) && (
                    <div className="ml-6 mt-1 space-y-0.5 animate-fade-in">
                      {notebook.children.map((child: Notebook) => (
                        <div
                          key={child.id}
                          className={`flex items-center justify-between px-3 py-1.5 mx-2 rounded cursor-pointer transition-all ${
                            selectedNotebook === child.id ? 'bg-amber-muted text-text-primary' : 'hover:bg-ink-700 text-text-secondary'
                          }`}
                          onClick={() => {
                            if (onNotebookSelect) onNotebookSelect(child.id)
                            if (onFilterChange) onFilterChange('notebook')
                          }}
                          onContextMenu={(e) => handleContextMenu(e, child.id, true, notebook.id)}
                        >
                          <span className="text-sm">{child.name}</span>
                          <span className="text-xs text-text-muted">{child.count || 0}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Status Section */}
        <div className="mb-2">
          <SectionHeader title="Status" icon={<StatusIcon />} section="status" />
          {expandedSections.has('status') && (
            <div className="mt-1 space-y-0.5 animate-fade-in">
              {[
                { value: 'active' as const, label: 'Active', color: '#22c55e' },
                { value: 'on-hold' as const, label: 'On Hold', color: '#f59e0b' },
                { value: 'completed' as const, label: 'Completed', color: '#3b82f6' },
                { value: 'dropped' as const, label: 'Dropped', color: '#6b7280' },
              ].map(({ value, label, color }) => (
                <div
                  key={value}
                  className={`flex items-center justify-between px-4 py-2 mx-2 rounded-lg cursor-pointer transition-all ${
                    selectedStatus === value ? 'bg-amber-muted' : 'hover:bg-ink-700'
                  }`}
                  onClick={() => {
                    if (onStatusSelect) onStatusSelect(selectedStatus === value ? null : value)
                    if (onFilterChange) onFilterChange(selectedStatus === value ? 'all' : 'status')
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}` }} />
                    <span className={`text-sm ${selectedStatus === value ? 'text-text-primary font-medium' : 'text-text-secondary'}`}>{label}</span>
                  </div>
                  <span className="text-xs text-text-muted">{statusCounts[value]}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tags Section */}
        <div className="mb-2">
          <SectionHeader title="Tags" icon={<TagsIcon />} section="tags" />
          {expandedSections.has('tags') && (
            <div className="mt-1 space-y-0.5 animate-fade-in">
              {allTags.slice(0, 10).map((tag) => {
                const tagColor = tags[tag] || '#f59e0b'
                return (
                  <div
                    key={tag}
                    onContextMenu={(e) => handleTagContextMenu(e, tag)}
                    onClick={() => {
                      if (onTagSelect) onTagSelect(selectedTag === tag ? null : tag)
                      if (onFilterChange) onFilterChange(selectedTag === tag ? 'all' : 'tag')
                    }}
                    className={`flex items-center justify-between px-4 py-2 mx-2 rounded-lg cursor-pointer transition-all ${
                      selectedTag === tag ? 'bg-amber-muted' : 'hover:bg-ink-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: tagColor, boxShadow: `0 0 6px ${tagColor}` }} />
                      <span className={`text-sm ${selectedTag === tag ? 'text-text-primary font-medium' : 'text-text-secondary'}`}>{tag}</span>
                    </div>
                    <span className="text-xs text-text-muted">{tagCounts[tag] || 0}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Trash */}
        <div className="mt-4 pt-4 border-t border-ink-700">
          <NavItem
            icon={<TrashIcon />}
            label="Trash"
            onClick={() => {}}
          />
        </div>
      </div>

      {/* Create Notebook Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div
            ref={modalRef}
            className="bg-ink-800 border border-ink-600 rounded-xl p-6 w-96 shadow-2xl animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-text-primary mb-4">
              {showCreateModal.isSubnotebook ? 'New Subnotebook' : 'New Notebook'}
            </h3>
            <input
              ref={inputRef}
              type="text"
              value={newNotebookName}
              onChange={(e) => setNewNotebookName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter notebook name..."
              className="w-full px-4 py-3 bg-ink-900 border border-ink-600 rounded-lg text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-amber focus:ring-2 focus:ring-amber/20 mb-4 transition-all"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => { setShowCreateModal(null); setNewNotebookName('') }}
                className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateNotebook}
                className="px-4 py-2 bg-linear-to-r from-amber to-amber-dark text-ink-900 text-sm font-semibold rounded-lg hover:shadow-glow transition-all"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Context Menu */}
      {contextMenu && (
        <div
          ref={menuRef}
          className="fixed bg-ink-700 border border-ink-600 rounded-lg shadow-xl z-50 min-w-[160px] py-1 animate-fade-in"
          style={{ left: `${contextMenu.x}px`, top: `${contextMenu.y}px` }}
        >
          <button
            onClick={handleDeleteNotebook}
            className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-ink-600 transition-colors"
          >
            Delete {contextMenu.isSubnotebook ? 'Subnotebook' : 'Notebook'}
          </button>
        </div>
      )}

      {/* Tag Context Menu */}
      {tagContextMenu && (
        <div
          ref={tagMenuRef}
          className="fixed bg-ink-700 border border-ink-600 rounded-lg shadow-xl z-50 min-w-[160px] py-1 animate-fade-in"
          style={{ left: `${tagContextMenu.x}px`, top: `${tagContextMenu.y}px` }}
        >
          <button
            onClick={() => setShowTagColorPicker(tagContextMenu.tagName)}
            className="w-full px-4 py-2 text-left text-sm text-text-secondary hover:bg-ink-600 hover:text-text-primary transition-colors"
          >
            Change Color
          </button>
          <button
            onClick={handleTagDelete}
            className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-ink-600 transition-colors"
          >
            Delete Tag
          </button>
        </div>
      )}

      {/* Tag Color Picker */}
      {showTagColorPicker && (
        <div
          ref={tagMenuRef}
          className="fixed bg-ink-700 border border-ink-600 rounded-lg shadow-xl z-50 p-4 animate-fade-in"
          style={{ left: `${tagContextMenu?.x || 0}px`, top: `${(tagContextMenu?.y || 0) + 80}px` }}
        >
          <div className="text-xs text-text-muted mb-3 font-medium">Select Color</div>
          <div className="flex gap-2 flex-wrap">
            {tagColors.map((color) => (
              <button
                key={color}
                onClick={() => handleTagColorChange(showTagColorPicker, color)}
                className={`w-7 h-7 rounded-full transition-all hover:scale-110 ${
                  tags[showTagColorPicker] === color ? 'ring-2 ring-white ring-offset-2 ring-offset-ink-700' : ''
                }`}
                style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}40` }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="p-4 border-t border-ink-700 bg-ink-900/50">
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <div className="w-2 h-2 rounded-full bg-status-active animate-pulse" />
          <span>Synced</span>
        </div>
      </div>
    </div>
  )
}
