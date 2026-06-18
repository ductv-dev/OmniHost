'use client'

import { useMemo, useState } from 'react'
import { Plus, Edit2, Trash2, Info, Building2, PenLine } from 'lucide-react'
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
import { motion, AnimatePresence } from 'framer-motion'
import { Tables } from '@/types/supabase'

export default function TemplatesTab({ building }: { building: Tables<'buildings'> }) {
  const [templates, setTemplates] = useState<MessageTemplate[]>(() =>
    parseMessageTemplates(building.custom_templates)
  )

  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form State
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [type, setType] = useState<TemplateType>('building')
  const [content, setContent] = useState('')

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
      setCategory('General')
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
      setError('Please fill in template name, category, and message content.')
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
    if (!confirm('Are you sure you want to delete this template?')) return
    const newTemplates = templates.filter(t => t.id !== id)
    await saveToDb(newTemplates)
  }

  const groupedTemplates = templates.reduce((acc, tpl) => {
    if (!acc[tpl.category]) acc[tpl.category] = []
    acc[tpl.category].push(tpl)
    return acc
  }, {} as Record<string, MessageTemplate[]>)

  const databaseKeys = useMemo(() => extractDatabaseVariables(content, type), [content, type])
  const manualKeys = useMemo(() => extractDynamicVariables(content, type), [content, type])
  const syntaxIssues = useMemo(() => getTemplateSyntaxIssues(content), [content])
  const variableSuggestions =
    type === 'building' ? [...DB_VARIABLES, ...MANUAL_VARIABLE_SUGGESTIONS] : MANUAL_VARIABLE_SUGGESTIONS

  const insertVariable = (key: string) => {
    const token = `{{${key}}}`
    setContent(current => (current ? `${current}\n${token}` : token))
  }

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
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">{cat}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tpls.map(tpl => (
                <Card key={tpl.id} className="relative group transition-colors hover:border-zinc-300 dark:hover:border-zinc-700">
                  <div className="absolute right-3 top-3 flex gap-1">
                    <button onClick={() => handleOpenModal(tpl)} className="rounded-lg bg-zinc-100 p-2 text-zinc-500 transition-colors hover:bg-zinc-200 hover:text-zinc-950 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-50">
                      <Edit2 className="size-4" />
                    </button>
                    <button onClick={() => handleDelete(tpl.id)} className="rounded-lg bg-red-500/10 p-2 text-red-500 transition-colors hover:bg-red-500/20">
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                  <CardHeader className="pb-2 pr-24">
                    <div className="flex items-center gap-2">
                      {/* Badge loại template */}
                      {(tpl.type ?? 'building') === 'building' ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                          <Building2 className="size-3" /> Building
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                          <PenLine className="size-3" /> Custom
                        </span>
                      )}
                    </div>
                    <CardTitle className="text-base">{tpl.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-3 whitespace-pre-wrap">
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
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center sm:p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="max-h-[90vh] w-full max-w-3xl space-y-6 overflow-y-auto rounded-t-xl bg-white p-5 pb-7 shadow-2xl dark:bg-zinc-950 sm:rounded-xl"
            >
              <h2 className="text-xl font-semibold">{editingTemplate ? 'Edit Template' : 'New Template'}</h2>

              <div className="space-y-4">
                {/* Type Selector */}
                <div className="space-y-2">
                  <Label>Template Type</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setType('building')}
                      className={`flex flex-col items-center gap-2 rounded-lg border p-4 transition-all ${type === 'building' ? 'border-zinc-950 bg-zinc-100 dark:border-zinc-50 dark:bg-zinc-900' : 'border-zinc-200 dark:border-zinc-800'}`}
                    >
                      <Building2 className={`size-6 ${type === 'building' ? 'text-zinc-950 dark:text-zinc-50' : 'text-zinc-400'}`} />
                      <div className="text-center">
                        <p className="text-sm font-semibold">Building</p>
                        <p className="text-xs text-muted-foreground">Tự điền từ DB tòa/phòng</p>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setType('custom')}
                      className={`flex flex-col items-center gap-2 rounded-lg border p-4 transition-all ${type === 'custom' ? 'border-zinc-950 bg-zinc-100 dark:border-zinc-50 dark:bg-zinc-900' : 'border-zinc-200 dark:border-zinc-800'}`}
                    >
                      <PenLine className={`size-6 ${type === 'custom' ? 'text-zinc-950 dark:text-zinc-50' : 'text-zinc-400'}`} />
                      <div className="text-center">
                        <p className="text-sm font-semibold">Custom</p>
                        <p className="text-xs text-muted-foreground">Toàn bộ điền tay</p>
                      </div>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Template Name</Label>
                    <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Weekend Check-in" />
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Input value={category} onChange={e => setCategory(e.target.value)} placeholder="e.g., Check-in" />
                  </div>
                </div>

                {/* Variable hint */}
                <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                    <Info className="size-4" />
                    {type === 'building' ? 'Building Variables (auto-fill)' : 'Custom Variables (manual input)'}
                  </div>
                  {type === 'building' ? (
                    <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-300">
                      Các biến DB tự điền: <code className="bg-white/50 dark:bg-black/50 px-1 rounded">{'{{building_name}}'}</code> <code className="bg-white/50 dark:bg-black/50 px-1 rounded">{'{{room_number}}'}</code> <code className="bg-white/50 dark:bg-black/50 px-1 rounded">{'{{gate_password}}'}</code> <code className="bg-white/50 dark:bg-black/50 px-1 rounded">{'{{wifi_name}}'}</code> ...<br/>
                      Biến tùy chỉnh (sinh ô nhập): <code className="bg-white/50 dark:bg-black/50 px-1 rounded">{'{{ten_khach}}'}</code> <code className="bg-white/50 dark:bg-black/50 px-1 rounded">{'{{so_dem}}'}</code> ...
                    </p>
                  ) : (
                    <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-300">
                      Tất cả biến <code className="bg-white/50 dark:bg-black/50 px-1 rounded">{'{{...}}'}</code> đều sinh ô nhập tay trong Generator. Không cần chọn phòng.<br/>
                      Ví dụ: <code className="bg-white/50 dark:bg-black/50 px-1 rounded">{'{{ten_khach}}'}</code> <code className="bg-white/50 dark:bg-black/50 px-1 rounded">{'{{so_dien_thoai}}'}</code> <code className="bg-white/50 dark:bg-black/50 px-1 rounded">{'{{tien_coc}}'}</code>
                    </p>
                  )}
                </div>

                <div className="space-y-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
                  <div>
                    <p className="text-sm font-semibold">Quick Insert</p>
                    <p className="text-xs text-muted-foreground">
                      Bấm để thêm biến vào cuối nội dung, rồi kéo về đúng vị trí nếu cần.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {variableSuggestions.map(variable => (
                      <button
                        key={variable.key}
                        type="button"
                        onClick={() => insertVariable(variable.key)}
                        className="rounded-md bg-black/5 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15"
                        title={variable.description}
                      >
                        {`{{${variable.key}}}`}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Message Content</Label>
                  <textarea
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    className="flex min-h-[300px] w-full rounded-lg border-0 bg-black/5 px-4 py-3 text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 dark:bg-white/10"
                  />
                </div>

                {(databaseKeys.length > 0 || manualKeys.length > 0 || syntaxIssues.length > 0) && (
                  <div className="space-y-3 rounded-lg bg-black/5 p-4 text-sm dark:bg-white/5">
                    {databaseKeys.length > 0 && (
                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                          Auto-fill from room
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {databaseKeys.map(key => (
                            <span key={key} className="rounded-md bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                              {`{{${key}}}`}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {manualKeys.length > 0 && (
                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                          Manual fields
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {manualKeys.map(key => (
                            <span key={key} className="rounded-md bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
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

                {error && (
                  <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-500">
                    {error}
                  </div>
                )}
              </div>

              <div className="flex gap-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <Button variant="outline" className="flex-1 rounded-lg" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button onClick={handleSave} className="flex-1 rounded-lg" disabled={isLoading}>
                  {isLoading ? 'Saving...' : 'Save Template'}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
