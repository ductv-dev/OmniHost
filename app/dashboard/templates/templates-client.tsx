'use client'

import { useMemo, useState } from 'react'
import { Edit2, Info, PenLine, Plus, Trash2 } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
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

export default function TemplatesClient({
  initialTemplates,
}: {
  initialTemplates: Tables<'common_templates'>[]
}) {
  const [templates, setTemplates] = useState(initialTemplates)
  const [editingTemplate, setEditingTemplate] = useState<Tables<'common_templates'> | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [category, setCategory] = useState('General')
  const [content, setContent] = useState('')

  const groupedTemplates = useMemo(() => {
    return templates.reduce((acc, template) => {
      if (!acc[template.category]) acc[template.category] = []
      acc[template.category].push(template)
      return acc
    }, {} as Record<string, Tables<'common_templates'>[]>)
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
      setCategory('General')
      setContent('')
    }
    setError(null)
    setIsModalOpen(true)
  }

  const insertVariable = (key: string) => {
    const token = `{{${key}}}`
    setContent(current => (current ? `${current}\n${token}` : token))
  }

  const handleSave = async () => {
    if (!name.trim() || !category.trim() || !content.trim()) {
      setError('Please fill in template name, category, and message content.')
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
      setError(result.error || 'Could not save this template.')
      setIsLoading(false)
      return
    }

    window.location.reload()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this common template?')) return

    setIsLoading(true)
    const result = await deleteCommonTemplate(id)
    if ('error' in result) {
      setError(result.error || 'Could not delete this template.')
      setIsLoading(false)
      return
    }

    setTemplates(current => current.filter(template => template.id !== id))
    setIsLoading(false)
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Reusable Messages</h2>
        <Button onClick={() => handleOpenModal()} className="rounded-lg">
          <Plus className="mr-2 size-4" /> Add Template
        </Button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="space-y-7">
        {Object.entries(groupedTemplates).map(([cat, tpls]) => (
          <div key={cat} className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">{cat}</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {tpls.map(template => (
                <Card key={template.id} className="group relative transition-colors hover:border-zinc-300 dark:hover:border-zinc-700">
                  <div className="absolute right-3 top-3 flex gap-1">
                    <button onClick={() => handleOpenModal(template)} className="rounded-lg bg-zinc-100 p-2 text-zinc-500 transition-colors hover:bg-zinc-200 hover:text-zinc-950 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-50">
                      <Edit2 className="size-4" />
                    </button>
                    <button onClick={() => handleDelete(template.id)} disabled={isLoading} className="rounded-lg bg-red-500/10 p-2 text-red-500 transition-colors hover:bg-red-500/20 disabled:opacity-50">
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                  <CardHeader className="pb-2 pr-24">
                    <span className="inline-flex w-fit items-center gap-1 rounded-md bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                      <PenLine className="size-3" /> Common
                    </span>
                    <CardTitle className="text-base">{template.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="line-clamp-4 whitespace-pre-wrap text-sm text-muted-foreground">
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
        <div className="rounded-lg border border-dashed border-zinc-300 py-12 text-center text-muted-foreground dark:border-zinc-800">
          No common templates yet. Click &quot;Add Template&quot; to create one.
        </div>
      )}

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center sm:p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="max-h-[90vh] w-full max-w-3xl space-y-6 overflow-y-auto rounded-t-xl bg-white p-5 pb-7 shadow-2xl dark:bg-zinc-950 sm:rounded-xl"
            >
              <h2 className="text-xl font-semibold">
                {editingTemplate ? 'Edit Common Template' : 'New Common Template'}
              </h2>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Template Name</Label>
                  <Input value={name} onChange={event => setName(event.target.value)} placeholder="e.g., Ask Check-in Time" />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Input value={category} onChange={event => setCategory(event.target.value)} placeholder="e.g., Check-in" />
                </div>
              </div>

              <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                  <Info className="size-4" />
                  Manual variables
                </div>
                <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-300">
                  Any variable like <code className="rounded bg-white/50 px-1 dark:bg-black/50">{'{{guest_name}}'}</code> becomes a manual field in Messages. Common templates never require a building or room.
                </p>
              </div>

              <div className="space-y-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
                <div>
                  <p className="text-sm font-semibold">Quick Insert</p>
                  <p className="text-xs text-muted-foreground">
                    Click to append a manual variable to the message.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {MANUAL_VARIABLE_SUGGESTIONS.map(variable => (
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
                  onChange={event => setContent(event.target.value)}
                  className="flex min-h-[300px] w-full rounded-lg border-0 bg-black/5 px-4 py-3 text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 dark:bg-white/10"
                  placeholder="Hello! Please update me with your estimated check-in time..."
                />
              </div>

              {(manualKeys.length > 0 || syntaxIssues.length > 0) && (
                <div className="space-y-3 rounded-lg bg-black/5 p-4 text-sm dark:bg-white/5">
                  {manualKeys.length > 0 && (
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Manual fields</p>
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

              {error && <p className="text-sm text-red-500">{error}</p>}

              <div className="flex gap-4 border-t border-zinc-200 pt-4 dark:border-zinc-800">
                <Button variant="outline" className="flex-1 rounded-lg" onClick={() => setIsModalOpen(false)} disabled={isLoading}>
                  Cancel
                </Button>
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
