'use client'

import { useMemo, useRef, useState } from 'react'
import { ChevronDown, Edit2, Plus, Trash2, X } from 'lucide-react'
import { Drawer } from 'vaul'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  MANUAL_VARIABLE_SUGGESTIONS,
  extractDynamicVariables,
  getTemplateSyntaxIssues,
} from '@/lib/constants/templates'
import { Tables } from '@/types/supabase'
import {
  createCommonTemplate,
  deleteCommonTemplate,
  updateCommonTemplate,
} from './actions'

function normalizeVarName(raw: string): string {
  return raw
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/^-+|-+$/g, '')
}

export default function TemplatesClient({
  initialTemplates,
}: {
  initialTemplates: Tables<'common_templates'>[]
}) {
  const [templates, setTemplates] = useState(initialTemplates)
  const [editingTemplate, setEditingTemplate] = useState<Tables<'common_templates'> | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [category, setCategory] = useState('Chung')
  const [content, setContent] = useState('')

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [customVarInput, setCustomVarInput] = useState('')

  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const [guideOpen, setGuideOpen] = useState(false)

  const groupedTemplates = useMemo(() => {
    return templates.reduce(
      (acc, t) => {
        if (!acc[t.category]) acc[t.category] = []
        acc[t.category].push(t)
        return acc
      },
      {} as Record<string, Tables<'common_templates'>[]>
    )
  }, [templates])

  const manualKeys = useMemo(() => extractDynamicVariables(content, 'custom'), [content])
  const syntaxIssues = useMemo(() => getTemplateSyntaxIssues(content), [content])

  const handleOpenModal = (template?: Tables<'common_templates'>) => {
    if (template) {
      setEditingTemplate(template)
      setName(template.name)
      setCategory(template.category)
      setContent(template.content)
    } else {
      setEditingTemplate(null)
      setName('')
      setCategory('Chung')
      setContent('')
    }
    setError(null)
    setIsModalOpen(true)
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

  const handleSave = async () => {
    if (!name.trim() || !category.trim() || !content.trim()) {
      setError('Vui lòng điền đầy đủ tên, danh mục và nội dung.')
      return
    }
    if (syntaxIssues.length > 0) {
      setError(syntaxIssues.join(' '))
      return
    }

    setIsLoading(true)
    setError(null)

    const formData = new FormData()
    formData.append('name', name)
    formData.append('category', category)
    formData.append('content', content)

    const result = editingTemplate
      ? await updateCommonTemplate(editingTemplate.id, formData)
      : await createCommonTemplate(formData)

    if ('error' in result) {
      setError(result.error || 'Không thể lưu template.')
      setIsLoading(false)
      return
    }

    window.location.reload()
  }

  const handleDelete = async (id: string) => {
    setIsLoading(true)
    const result = await deleteCommonTemplate(id)
    if ('error' in result) {
      setError(result.error || 'Không thể xóa template.')
      setIsLoading(false)
      return
    }
    setTemplates(prev => prev.filter(t => t.id !== id))
    setConfirmDeleteId(null)
    setIsLoading(false)
  }

  return (
    <div className="space-y-4 pb-3">
      <Button onClick={() => handleOpenModal()} className="h-12 w-full rounded-lg text-base">
        <Plus className="mr-2 size-4" /> Thêm template
      </Button>

      {error && (
        <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="space-y-7">
        {Object.entries(groupedTemplates).map(([cat, tpls]) => (
          <div key={cat} className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{cat}</h3>
            <div className="grid grid-cols-1 gap-3">
              {tpls.map(template => (
                <Card
                  key={template.id}
                  className="group relative transition-colors hover:border-zinc-300 dark:hover:border-zinc-700"
                >
                  <div className="absolute right-3 top-3 flex items-center gap-1">
                    {confirmDeleteId !== template.id && (
                      <button
                        onClick={() => handleOpenModal(template)}
                        className="rounded-lg bg-zinc-100 p-2 text-zinc-500 transition-colors hover:bg-zinc-200 hover:text-zinc-950 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
                      >
                        <Edit2 className="size-4" />
                      </button>
                    )}
                    {confirmDeleteId === template.id ? (
                      <>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="flex h-8 items-center rounded-lg bg-zinc-100 px-2.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                        >
                          Hủy
                        </button>
                        <button
                          onClick={() => handleDelete(template.id)}
                          disabled={isLoading}
                          className="flex h-8 items-center rounded-lg bg-red-500 px-2.5 text-xs font-semibold text-white disabled:opacity-50"
                        >
                          Xóa
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(template.id)}
                        disabled={isLoading}
                        className="rounded-lg bg-red-500/10 p-2 text-red-500 transition-colors hover:bg-red-500/20 disabled:opacity-50"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    )}
                  </div>
                  <CardHeader className="p-4 pb-2 pr-24">
                    <CardTitle className="text-base">{template.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <p className="line-clamp-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                      {template.content}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      {templates.length === 0 && (
        <div className="rounded-lg border border-dashed border-zinc-300 py-12 text-center text-sm text-muted-foreground dark:border-zinc-800">
          Chưa có template. Bấm &quot;Thêm template&quot; để tạo mới.
        </div>
      )}

      {/* Modal */}
      <Drawer.Root open={isModalOpen} onOpenChange={v => { if (!v) setIsModalOpen(false) }}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-200 bg-black/40 backdrop-blur-sm" />
          <Drawer.Content
            className="fixed bottom-0 left-0 right-0 z-200 flex max-h-[90svh] flex-col rounded-t-[2rem] bg-white/95 shadow-2xl backdrop-blur-3xl dark:bg-zinc-900/95 max-w-130 mx-auto"
            aria-label={editingTemplate ? 'Sửa template' : 'Template mới'}
          >
            {/* header */}
            <div className="shrink-0 px-4 pt-3 pb-3">
              <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-zinc-200 dark:bg-zinc-800" />
              <Drawer.Title className="text-lg font-semibold">
                {editingTemplate ? 'Sửa template' : 'Template mới'}
              </Drawer.Title>
            </div>

            {/* scrollable body */}
            <div className="flex-1 overflow-y-auto border-t border-zinc-100 px-4 py-4 dark:border-zinc-900">
              <div className="space-y-5">
                {/* Hướng dẫn sử dụng — collapsible */}
                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setGuideOpen(v => !v)}
                    className="flex w-full items-center justify-between px-4 py-3 text-left"
                  >
                    <span className="text-xs font-bold uppercase tracking-wide text-zinc-500">Hướng dẫn</span>
                    <ChevronDown
                      className={`size-4 text-zinc-400 transition-transform duration-200 ${guideOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {guideOpen && (
                    <ul className="space-y-1.5 border-t border-zinc-100 px-4 pb-4 pt-3 text-xs leading-relaxed text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
                      <li>
                        Dùng{' '}
                        <code className="rounded bg-zinc-100 px-1 py-0.5 font-mono dark:bg-zinc-800">
                          {'{{tên-biến}}'}
                        </code>{' '}
                        trong nội dung để tạo ô điền khi soạn tin.
                      </li>
                      <li>
                        Ví dụ:{' '}
                        <code className="rounded bg-zinc-100 px-1 py-0.5 font-mono dark:bg-zinc-800">
                          {'{{ten-khach}}'}
                        </code>{' '}
                        → hiện ô &quot;Ten Khach&quot; khi dùng template.
                      </li>
                      <li>Biến chỉ dùng chữ thường, số và dấu gạch ngang (-).</li>
                      <li>
                        Bấm{' '}
                        <span className="inline-flex items-center gap-0.5 rounded bg-zinc-100 px-1 py-0.5 font-mono dark:bg-zinc-800">
                          <Plus className="size-3" /> Chèn biến
                        </span>{' '}
                        bên cạnh &quot;Nội dung&quot; để chèn nhanh.
                      </li>
                    </ul>
                  )}
                </div>

                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label>Tên template</Label>
                    <Input
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="VD: Yêu cầu hộ chiếu"
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
                    className="flex min-h-52 w-full rounded-lg border-0 bg-black/5 px-4 py-3 text-base transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 dark:bg-white/10"
                    placeholder="Nội dung tin nhắn..."
                  />
                </div>

                {/* Biến đang dùng */}
                {(manualKeys.length > 0 || syntaxIssues.length > 0) && (
                  <div className="space-y-3 rounded-lg bg-black/5 p-4 text-sm dark:bg-white/5">
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
                    {syntaxIssues.length > 0 && (
                      <div className="rounded-lg bg-red-500/10 p-3 text-xs text-red-600 dark:text-red-300">
                        {syntaxIssues.join(' ')}
                      </div>
                    )}
                  </div>
                )}

                {error && <p className="text-sm text-red-500">{error}</p>}
              </div>
            </div>

            {/* sticky footer */}
            <div className="shrink-0 grid grid-cols-2 gap-3 border-t border-zinc-200 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] dark:border-zinc-800">
              <Button
                variant="outline"
                className="h-12 rounded-xl"
                onClick={() => setIsModalOpen(false)}
                disabled={isLoading}
              >
                Hủy
              </Button>
              <Button onClick={handleSave} className="h-12 rounded-xl" disabled={isLoading}>
                {isLoading ? 'Đang lưu...' : 'Lưu template'}
              </Button>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>

      {/* Variable Drawer (on top of modal) */}
      <Drawer.Root open={drawerOpen} onOpenChange={v => { if (!v) setDrawerOpen(false) }}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-300 bg-black/40 backdrop-blur-sm" />
          <Drawer.Content
            className="fixed bottom-0 left-0 right-0 z-300 flex max-h-[80svh] flex-col rounded-t-[2rem] bg-white/95 shadow-2xl backdrop-blur-3xl dark:bg-zinc-900/95 max-w-130 mx-auto"
            aria-label="Chèn biến"
          >
            {/* drag pill */}
            <div className="mx-auto mt-3 mb-1 h-1 w-10 rounded-full bg-zinc-300 dark:bg-zinc-600" />
            {/* header */}
            <div className="shrink-0 flex items-center justify-between px-4 pt-2 pb-3">
              <Drawer.Title className="font-semibold">Chèn biến</Drawer.Title>
              <button
                onClick={() => setDrawerOpen(false)}
                className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* scrollable body */}
            <div className="flex-1 overflow-y-auto border-t border-zinc-100 px-4 py-4 dark:border-zinc-900">
              {/* Biến thường dùng */}
              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Biến thường dùng
                </p>
                <div className="flex flex-wrap gap-2">
                  {MANUAL_VARIABLE_SUGGESTIONS.map(v => (
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

              {/* Biến tùy chỉnh */}
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    Biến tùy chỉnh
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    Gõ tên biến rồi bấm thêm. VD: <code className="font-mono">ten-wifi</code> → chèn{' '}
                    <code className="font-mono">{`{{ten-wifi}}`}</code>
                  </p>
                </div>
                <div className="flex gap-2">
                  <Input
                    value={customVarInput}
                    onChange={e => setCustomVarInput(normalizeVarName(e.target.value))}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); insertCustomVar() } }}
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
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </div>
  )
}
