'use client'

import { useMemo, useRef, useState } from 'react'
import { Plus, Edit2, Trash2, Building2, PenLine, X } from 'lucide-react'
import {
  DB_VARIABLES,
  MANUAL_VARIABLE_SUGGESTIONS,
  MessageTemplate,
  TemplateType,
  extractDatabaseVariables,
  extractDynamicVariables,
  getTemplateSyntaxIssues,
  parseMessageTemplates,
} from '@/lib/constants/templates'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { updateBuildingTemplates } from '../actions'
import { Tables } from '@/types/supabase'

function normalizeVarName(raw: string): string {
  return raw
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/^-+|-+$/g, '')
}

export default function TemplatesTab({ building }: { building: Tables<'buildings'> }) {
  const [templates, setTemplates] = useState<MessageTemplate[]>(() =>
    parseMessageTemplates(building.custom_templates)
  )

  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [type, setType] = useState<TemplateType>('building')
  const [content, setContent] = useState('')

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [customVarInput, setCustomVarInput] = useState('')

  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleOpenModal = (template?: MessageTemplate) => {
    if (template) {
      setEditingTemplate(template)
      setName(template.name)
      setCategory(template.category)
      setType(template.type ?? 'building')
      setContent(template.content)
    } else {
      setEditingTemplate(null)
      setName('')
      setCategory('Check-in')
      setType('building')
      setContent('')
    }
    setError(null)
    setIsModalOpen(true)
  }

  const saveToDb = async (newTemplates: MessageTemplate[]) => {
    setIsLoading(true)
    setError(null)
    const formData = new FormData()
    formData.append('custom_templates', JSON.stringify(newTemplates))
    const result = await updateBuildingTemplates(building.id, formData)

    if (result?.error) {
      setError(result.error)
      setIsLoading(false)
      return
    }

    setTemplates(newTemplates)
    setIsLoading(false)
    setIsModalOpen(false)
  }

  const handleSave = async () => {
    if (!name.trim() || !category.trim() || !content.trim()) {
      setError('Vui lòng điền tên, danh mục và nội dung.')
      return
    }

    const syntaxIssues = getTemplateSyntaxIssues(content)
    if (syntaxIssues.length > 0) {
      setError(syntaxIssues.join(' '))
      return
    }

    let newTemplates = [...templates]
    if (editingTemplate) {
      newTemplates = newTemplates.map(t =>
        t.id === editingTemplate.id
          ? { ...t, name: name.trim(), category: category.trim(), type, content }
          : t
      )
    } else {
      newTemplates.push({
        id: `tpl_${globalThis.crypto.randomUUID()}`,
        name: name.trim(),
        category: category.trim(),
        type,
        content,
      })
    }
    await saveToDb(newTemplates)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Xóa template này?')) return
    const newTemplates = templates.filter(t => t.id !== id)
    await saveToDb(newTemplates)
  }

  const insertVariable = (key: string) => {
    const token = `{{${key}}}`
    const textarea = textareaRef.current
    if (textarea) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const newContent = content.slice(0, start) + token + content.slice(end)
      setContent(newContent)
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + token.length
        textarea.focus()
      }, 0)
    } else {
      setContent(c => (c ? `${c}\n${token}` : token))
    }
    setDrawerOpen(false)
  }

  const insertCustomVar = () => {
    const normalized = normalizeVarName(customVarInput)
    if (!normalized || !/^[a-z]/.test(normalized)) return
    insertVariable(normalized)
    setCustomVarInput('')
  }

  const groupedTemplates = templates.reduce(
    (acc, tpl) => {
      if (!acc[tpl.category]) acc[tpl.category] = []
      acc[tpl.category].push(tpl)
      return acc
    },
    {} as Record<string, MessageTemplate[]>
  )

  const databaseKeys = useMemo(() => extractDatabaseVariables(content, type), [content, type])
  const manualKeys = useMemo(() => extractDynamicVariables(content, type), [content, type])

  const variableSuggestions =
    type === 'building' ? DB_VARIABLES : MANUAL_VARIABLE_SUGGESTIONS

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Message Templates</h2>
        <Button onClick={() => handleOpenModal()} className="rounded-lg">
          <Plus className="mr-2 size-4" /> Add Template
        </Button>
      </div>

      <div className="space-y-7">
        {Object.entries(groupedTemplates).map(([cat, tpls]) => (
          <div key={cat} className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{cat}</h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {tpls.map(tpl => (
                <Card
                  key={tpl.id}
                  className="group relative transition-colors hover:border-zinc-300 dark:hover:border-zinc-700"
                >
                  <div className="absolute right-3 top-3 flex gap-1">
                    <button
                      onClick={() => handleOpenModal(tpl)}
                      className="rounded-lg bg-zinc-100 p-2 text-zinc-500 transition-colors hover:bg-zinc-200 hover:text-zinc-950 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
                    >
                      <Edit2 className="size-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(tpl.id)}
                      className="rounded-lg bg-red-500/10 p-2 text-red-500 transition-colors hover:bg-red-500/20"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                  <CardHeader className="pb-2 pr-24">
                    <div className="flex items-center gap-2">
                      {(tpl.type ?? 'building') === 'building' ? (
                        <span className="inline-flex items-center gap-1 rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
                          <Building2 className="size-2.5" /> Building
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
                          <PenLine className="size-2.5" /> Custom
                        </span>
                      )}
                    </div>
                    <CardTitle className="text-base">{tpl.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="line-clamp-3 whitespace-pre-wrap text-sm text-muted-foreground">
                      {tpl.content}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
        {templates.length === 0 && (
          <div className="rounded-lg border border-dashed border-zinc-300 py-12 text-center text-muted-foreground dark:border-zinc-800">
            No templates found. Click &quot;Add Template&quot; to create one.
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-200 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="flex max-h-[92dvh] w-full max-w-130 flex-col rounded-t-2xl bg-white shadow-2xl dark:bg-zinc-950 sm:rounded-xl">
            {/* header */}
            <div className="shrink-0 px-4 pt-3 pb-3">
              <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-zinc-200 dark:bg-zinc-800 sm:hidden" />
              <h2 className="text-lg font-semibold">
                {editingTemplate ? 'Sửa template' : 'Template mới'}
              </h2>
            </div>

            {/* scrollable body */}
            <div className="flex-1 overflow-y-auto border-t border-zinc-100 px-4 py-4 dark:border-zinc-900">
              <div className="space-y-5">
                {/* Loại template */}
                <div className="space-y-2">
                  <Label>Loại template</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setType('building')}
                      className={`flex flex-col items-center gap-2 rounded-lg border p-4 transition-all ${
                        type === 'building'
                          ? 'border-zinc-950 bg-zinc-100 dark:border-zinc-50 dark:bg-zinc-900'
                          : 'border-zinc-200 dark:border-zinc-800'
                      }`}
                    >
                      <Building2
                        className={`size-6 ${type === 'building' ? 'text-zinc-950 dark:text-zinc-50' : 'text-zinc-400'}`}
                      />
                      <div className="text-center">
                        <p className="text-sm font-semibold">Building</p>
                        <p className="text-xs text-muted-foreground">Tự điền từ DB tòa/phòng</p>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setType('custom')}
                      className={`flex flex-col items-center gap-2 rounded-lg border p-4 transition-all ${
                        type === 'custom'
                          ? 'border-zinc-950 bg-zinc-100 dark:border-zinc-50 dark:bg-zinc-900'
                          : 'border-zinc-200 dark:border-zinc-800'
                      }`}
                    >
                      <PenLine
                        className={`size-6 ${type === 'custom' ? 'text-zinc-950 dark:text-zinc-50' : 'text-zinc-400'}`}
                      />
                      <div className="text-center">
                        <p className="text-sm font-semibold">Custom</p>
                        <p className="text-xs text-muted-foreground">Toàn bộ điền tay</p>
                      </div>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tên template</Label>
                    <Input
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="VD: Check-in cuối tuần"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Danh mục</Label>
                    <Input
                      value={category}
                      onChange={e => setCategory(e.target.value)}
                      placeholder="VD: Check-in"
                    />
                  </div>
                </div>

                {/* Nội dung + nút chèn biến */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Nội dung tin nhắn</Label>
                    <button
                      type="button"
                      onClick={() => setDrawerOpen(true)}
                      className="flex items-center gap-1 rounded-lg bg-zinc-100 px-2.5 py-1.5 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    >
                      <Plus className="size-3.5" /> Chèn biến
                    </button>
                  </div>
                  <textarea
                    ref={textareaRef}
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    className="flex min-h-52 w-full rounded-lg border-0 bg-black/5 px-4 py-3 text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 dark:bg-white/10"
                    placeholder="Nội dung tin nhắn..."
                  />
                </div>

                {/* Biến phát hiện */}
                {(databaseKeys.length > 0 || manualKeys.length > 0) && (
                  <div className="space-y-3 rounded-lg bg-black/5 p-4 text-sm dark:bg-white/5">
                    {databaseKeys.length > 0 && (
                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                          Tự điền từ phòng
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {databaseKeys.map(key => (
                            <span
                              key={key}
                              className="rounded-md bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
                            >
                              {`{{${key}}}`}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {manualKeys.length > 0 && (
                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                          Ô điền tay khi dùng
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {manualKeys.map(key => (
                            <span
                              key={key}
                              className="rounded-md bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
                            >
                              {`{{${key}}}`}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {error && (
                  <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-500">{error}</div>
                )}
              </div>
            </div>

            {/* sticky footer */}
            <div className="shrink-0 grid grid-cols-2 gap-3 border-t border-zinc-200 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] dark:border-zinc-800">
              <Button
                variant="outline"
                className="h-12 rounded-xl"
                onClick={() => setIsModalOpen(false)}
              >
                Hủy
              </Button>
              <Button onClick={handleSave} className="h-12 rounded-xl" disabled={isLoading}>
                {isLoading ? 'Đang lưu...' : 'Lưu template'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Variable Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-300 flex items-end">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="relative z-10 flex max-h-[80dvh] w-full flex-col rounded-t-2xl bg-white shadow-2xl dark:bg-zinc-950">
            {/* header */}
            <div className="shrink-0 flex items-center justify-between px-4 pt-4 pb-3">
              <h3 className="font-semibold">Chèn biến</h3>
              <button
                onClick={() => setDrawerOpen(false)}
                className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* scrollable body */}
            <div className="flex-1 overflow-y-auto border-t border-zinc-100 px-4 py-4 dark:border-zinc-900">
              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  {type === 'building' ? 'Biến tòa/phòng (tự điền)' : 'Biến thường dùng'}
                </p>
                <div className="flex flex-wrap gap-2">
                  {variableSuggestions.map(v => (
                    <button
                      key={v.key}
                      type="button"
                      onClick={() => insertVariable(v.key)}
                      title={v.description}
                      className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium transition-colors hover:border-zinc-300 hover:bg-zinc-50 active:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700 dark:hover:bg-zinc-800"
                    >
                      {`{{${v.key}}}`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="my-4 border-t border-zinc-100 dark:border-zinc-900" />

              <div className="space-y-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    Biến tùy chỉnh
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    Gõ tên biến rồi bấm thêm. VD:{' '}
                    <code className="font-mono">ten-wifi</code> →{' '}
                    <code className="font-mono">{`{{ten-wifi}}`}</code>
                  </p>
                </div>
                <div className="flex gap-2">
                  <Input
                    value={customVarInput}
                    onChange={e => setCustomVarInput(normalizeVarName(e.target.value))}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        insertCustomVar()
                      }
                    }}
                    placeholder="ten-bien-tuy-chinh"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    onClick={insertCustomVar}
                    disabled={!customVarInput || !/^[a-z]/.test(customVarInput)}
                    className="shrink-0"
                  >
                    <Plus className="size-4" />
                  </Button>
                </div>
                {customVarInput && /^[a-z]/.test(customVarInput) && (
                  <p className="text-xs text-zinc-500">
                    Sẽ chèn:{' '}
                    <code className="rounded bg-zinc-100 px-1 font-mono dark:bg-zinc-900">
                      {`{{${customVarInput}}}`}
                    </code>
                  </p>
                )}
              </div>
            </div>

            {/* sticky footer */}
            <div className="shrink-0 border-t border-zinc-100 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] dark:border-zinc-900">
              <Button className="h-11 w-full rounded-xl" onClick={() => setDrawerOpen(false)}>
                Xong
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
