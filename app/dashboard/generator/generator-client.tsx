'use client'

import { useState, useMemo } from 'react'
import {
  Copy, CheckCircle2, Plus, X, Search,
  Building2, PenLine, ListOrdered,
  ChevronUp, ChevronDown, Edit2, Trash2, Layers,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  generateTemplateMessage,
  MessageTemplate,
  extractDynamicVariables,
  formatVariableLabel,
  parseMessageTemplates,
} from '@/lib/constants/templates'
import { Tables } from '@/types/supabase'
import {
  createMessageFlow,
  updateMessageFlow,
  deleteMessageFlow,
} from './actions'
import { createCommonTemplateInline } from '@/app/dashboard/templates/actions'

// ─── helpers ────────────────────────────────────────────────────────────────

function formatOrdinal(value: number | null | undefined) {
  if (value == null) return '...'
  const n = value % 100
  if (n >= 11 && n <= 13) return `${value}th`
  switch (value % 10) {
    case 1: return `${value}st`
    case 2: return `${value}nd`
    case 3: return `${value}rd`
    default: return `${value}th`
  }
}

// ─── types ───────────────────────────────────────────────────────────────────

interface FlowTemplateRef {
  source: 'common' | 'building'
  template_id: string
}

interface QueueItem {
  id: string
  templateId: string
  templateName: string
  message: string | null   // null = cần điền
}

function parseFlowItems(raw: unknown): FlowTemplateRef[] {
  if (!Array.isArray(raw)) return []
  return raw.filter(
    (item): item is FlowTemplateRef =>
      typeof item === 'object' && item !== null &&
      'source' in item && 'template_id' in item
  )
}

// ─── component ───────────────────────────────────────────────────────────────

export default function GeneratorClient({
  buildings, rooms, commonTemplates, initialFlows,
}: {
  buildings: Tables<'buildings'>[]
  rooms: Tables<'rooms'>[]
  commonTemplates: Tables<'common_templates'>[]
  initialFlows: Tables<'message_flows'>[]
}) {
  // context
  const [selectedBuildingId, setSelectedBuildingId] = useState('')
  const [selectedRoomId, setSelectedRoomId] = useState('')

  // tabs
  const [activeTab, setActiveTab] = useState<'browse' | 'flows' | 'queue'>('browse')

  // browse
  const [searchQuery, setSearchQuery] = useState('')

  // sheet (template fill panel)
  const [sheetTemplate, setSheetTemplate] = useState<MessageTemplate | null>(null)
  const [pendingQueueItemId, setPendingQueueItemId] = useState<string | null>(null)
  const [dynamicValues, setDynamicValues] = useState<Record<string, string>>({})
  const [sheetCopied, setSheetCopied] = useState(false)

  // queue
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [copiedQueueId, setCopiedQueueId] = useState<string | null>(null)

  // flows local state
  const [flows, setFlows] = useState(initialFlows)

  // local templates state (so new templates appear without page reload)
  const [localTemplates, setLocalTemplates] = useState(commonTemplates)

  // create template drawer
  const [createTplOpen, setCreateTplOpen] = useState(false)
  const [tplName, setTplName] = useState('')
  const [tplCategory, setTplCategory] = useState('')
  const [tplContent, setTplContent] = useState('')
  const [tplSaving, setTplSaving] = useState(false)
  const [tplError, setTplError] = useState<string | null>(null)

  // flow editor modal
  const [flowModalOpen, setFlowModalOpen] = useState(false)
  const [editingFlow, setEditingFlow] = useState<Tables<'message_flows'> | null>(null)
  const [flowName, setFlowName] = useState('')
  const [flowItems, setFlowItems] = useState<FlowTemplateRef[]>([])
  const [flowSearch, setFlowSearch] = useState('')
  const [isSavingFlow, setIsSavingFlow] = useState(false)
  const [flowError, setFlowError] = useState<string | null>(null)

  // ── derived ──────────────────────────────────────────────────────────────

  const filteredRooms = useMemo(
    () => rooms.filter(r => r.building_id === selectedBuildingId),
    [rooms, selectedBuildingId]
  )
  const selectedBuilding = buildings.find(b => b.id === selectedBuildingId)
  const selectedRoom = rooms.find(r => r.id === selectedRoomId)

  const allTemplates = useMemo(() => {
    const building: MessageTemplate[] = selectedBuilding
      ? parseMessageTemplates(selectedBuilding.custom_templates)
      : []
    const common: MessageTemplate[] = localTemplates.map(t => ({
      id: t.id, name: t.name, category: t.category, type: 'custom' as const, content: t.content,
    }))
    return [...building, ...common]
  }, [selectedBuilding, localTemplates])

  const filteredBrowseTemplates = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return allTemplates
    return allTemplates.filter(
      t => t.name.toLowerCase().includes(q) || t.category.toLowerCase().includes(q)
    )
  }, [allTemplates, searchQuery])

  const groupedBrowseTemplates = useMemo(() =>
    filteredBrowseTemplates.reduce((acc, t) => {
      if (!acc[t.category]) acc[t.category] = []
      acc[t.category].push(t)
      return acc
    }, {} as Record<string, MessageTemplate[]>)
  , [filteredBrowseTemplates])

  const dbVariables = useMemo((): Record<string, string> => {
    if (!selectedBuilding || !selectedRoom) return {}
    return {
      building_name: selectedBuilding.name,
      building_sign_name: selectedBuilding.sign_name || 'N/A',
      building_address: selectedBuilding.address,
      building_map_link: selectedBuilding.map_link || 'N/A',
      room_number: selectedRoom.room_number,
      floor: selectedRoom.floor.toString(),
      floor_ordinal: formatOrdinal(selectedRoom.floor),
      gate_password: selectedBuilding.gate_password || 'N/A',
      lockbox_password: selectedRoom.lockbox_password || 'N/A',
      wifi_name: selectedRoom.wifi_name || 'N/A',
      wifi_password: selectedRoom.wifi_password || 'N/A',
      lobby_wifi_name: selectedBuilding.lobby_wifi_name || 'N/A',
      lobby_wifi_password: selectedBuilding.lobby_wifi_password || 'N/A',
      drinking_water_note: selectedBuilding.drinking_water_note || '',
      washing_machine_floor: selectedRoom.washing_machine_floor?.toString() || 'N/A',
      washing_machine_floor_ordinal: formatOrdinal(selectedRoom.washing_machine_floor),
      dryer_floor: selectedRoom.dryer_floor?.toString() || 'N/A',
      dryer_floor_ordinal: formatOrdinal(selectedRoom.dryer_floor),
      room_note: selectedRoom.room_note || '',
      motorbike_parking_note: selectedBuilding.motorbike_parking_note || '',
    }
  }, [selectedBuilding, selectedRoom])

  const sheetDynamicKeys = useMemo(() => {
    if (!sheetTemplate) return []
    return extractDynamicVariables(sheetTemplate.content, sheetTemplate.type)
  }, [sheetTemplate])

  const canGenerate = Boolean(
    sheetTemplate &&
    (sheetTemplate.type === 'custom' || (selectedBuilding && selectedRoom))
  )

  const sheetMessage = useMemo(() => {
    if (!sheetTemplate) return ''
    if (sheetTemplate.type === 'custom')
      return generateTemplateMessage(sheetTemplate.content, {}, dynamicValues)
    if (!selectedBuilding || !selectedRoom) return ''
    return generateTemplateMessage(sheetTemplate.content, dbVariables, dynamicValues)
  }, [sheetTemplate, dynamicValues, dbVariables, selectedBuilding, selectedRoom])

  const hasUnfilledPlaceholders = useMemo(
    () => /\{\{[^}]+\}\}/.test(sheetMessage),
    [sheetMessage]
  )

  // flow editor: templates matching search
  const filteredFlowTemplates = useMemo(() => {
    const q = flowSearch.toLowerCase().trim()
    if (!q) return allTemplates
    return allTemplates.filter(
      t => t.name.toLowerCase().includes(q) || t.category.toLowerCase().includes(q)
    )
  }, [allTemplates, flowSearch])

  const groupedFlowTemplates = useMemo(() =>
    filteredFlowTemplates.reduce((acc, t) => {
      if (!acc[t.category]) acc[t.category] = []
      acc[t.category].push(t)
      return acc
    }, {} as Record<string, MessageTemplate[]>)
  , [filteredFlowTemplates])

  // ── create template handler ───────────────────────────────────────────────

  const saveNewTemplate = async () => {
    setTplError(null)
    setTplSaving(true)
    const result = await createCommonTemplateInline({ name: tplName, category: tplCategory, content: tplContent })
    setTplSaving(false)
    if ('error' in result) { setTplError(result.error); return }
    setLocalTemplates(prev => [...prev, result])
    setCreateTplOpen(false)
    setTplName(''); setTplCategory(''); setTplContent('')
  }

  const existingCategories = [...new Set(localTemplates.map(t => t.category))].sort()

  // ── sheet handlers ────────────────────────────────────────────────────────

  const openSheet = (template: MessageTemplate, pendingId?: string) => {
    setSheetTemplate(template)
    setPendingQueueItemId(pendingId ?? null)
    setDynamicValues({})
    setSheetCopied(false)
  }

  const closeSheet = () => {
    setSheetTemplate(null)
    setPendingQueueItemId(null)
    setDynamicValues({})
  }

  const confirmSheetMessage = () => {
    if (!sheetMessage || !sheetTemplate) return
    const finalMessage = hasUnfilledPlaceholders ? null : sheetMessage
    if (pendingQueueItemId) {
      setQueue(prev => prev.map(item =>
        item.id === pendingQueueItemId ? { ...item, message: finalMessage } : item
      ))
    } else {
      setQueue(prev => [...prev, {
        id: crypto.randomUUID(),
        templateId: sheetTemplate.id,
        templateName: sheetTemplate.name,
        message: finalMessage,
      }])
      setActiveTab('queue')
    }
    closeSheet()
  }

  const copySheetMessage = async () => {
    if (!sheetMessage) return
    await navigator.clipboard.writeText(sheetMessage)
    setSheetCopied(true)
    setTimeout(() => setSheetCopied(false), 2000)
  }

  // ── queue handlers ────────────────────────────────────────────────────────

  const copyQueueItem = async (item: QueueItem) => {
    if (!item.message) return
    await navigator.clipboard.writeText(item.message)
    setCopiedQueueId(item.id)
    setTimeout(() => setCopiedQueueId(null), 2000)
  }

  const moveQueueItem = (index: number, dir: 'up' | 'down') => {
    const target = dir === 'up' ? index - 1 : index + 1
    if (target < 0 || target >= queue.length) return
    const next = [...queue]
    ;[next[index], next[target]] = [next[target], next[index]]
    setQueue(next)
  }

  // ── flow load ─────────────────────────────────────────────────────────────

  const loadFlow = (flow: Tables<'message_flows'>) => {
    const refs = parseFlowItems(flow.items)
    const newItems: QueueItem[] = refs.flatMap(ref => {
      const tpl = allTemplates.find(t => t.id === ref.template_id)
      if (!tpl) return []
      const dynKeys = extractDynamicVariables(tpl.content, tpl.type)
      const canAuto = tpl.type === 'custom'
        ? dynKeys.length === 0
        : !!(selectedBuilding && selectedRoom && dynKeys.length === 0)
      return [{
        id: crypto.randomUUID(),
        templateId: tpl.id,
        templateName: tpl.name,
        message: canAuto
          ? generateTemplateMessage(tpl.content, tpl.type === 'building' ? dbVariables : {}, {})
          : null,
      }]
    })
    setQueue(newItems)
    setActiveTab('queue')
  }

  // ── flow editor ───────────────────────────────────────────────────────────

  const openFlowModal = (flow?: Tables<'message_flows'>) => {
    setEditingFlow(flow ?? null)
    setFlowName(flow?.name ?? '')
    setFlowItems(flow ? parseFlowItems(flow.items) : [])
    setFlowSearch('')
    setFlowError(null)
    setFlowModalOpen(true)
  }

  const addTemplateToFlow = (tpl: MessageTemplate) => {
    const source: 'common' | 'building' = tpl.type === 'custom' ? 'common' : 'building'
    setFlowItems(prev => [...prev, { source, template_id: tpl.id }])
  }

  const removeFlowItem = (index: number) => {
    setFlowItems(prev => prev.filter((_, i) => i !== index))
  }

  const moveFlowItem = (index: number, dir: 'up' | 'down') => {
    const target = dir === 'up' ? index - 1 : index + 1
    if (target < 0 || target >= flowItems.length) return
    const next = [...flowItems]
    ;[next[index], next[target]] = [next[target], next[index]]
    setFlowItems(next)
  }

  const saveFlow = async () => {
    if (!flowName.trim()) { setFlowError('Nhập tên luồng.'); return }
    if (flowItems.length === 0) { setFlowError('Thêm ít nhất 1 template.'); return }

    setIsSavingFlow(true)
    setFlowError(null)

    const formData = new FormData()
    formData.append('name', flowName.trim())
    formData.append('items', JSON.stringify(flowItems))

    const result = editingFlow
      ? await updateMessageFlow(editingFlow.id, formData)
      : await createMessageFlow(formData)

    if ('error' in result) {
      setFlowError(result.error || 'Lỗi khi lưu luồng.')
      setIsSavingFlow(false)
      return
    }

    if (result.data) {
      if (editingFlow) {
        setFlows(prev => prev.map(f => f.id === editingFlow.id ? result.data! : f))
      } else {
        setFlows(prev => [...prev, result.data!])
      }
    }

    setIsSavingFlow(false)
    setFlowModalOpen(false)
  }

  const handleDeleteFlow = async (id: string) => {
    if (!confirm('Xóa luồng này?')) return
    const result = await deleteMessageFlow(id)
    if ('error' in result) return
    setFlows(prev => prev.filter(f => f.id !== id))
  }

  // ─── render ───────────────────────────────────────────────────────────────

  const queuePendingCount = queue.filter(q => q.message === null).length

  return (
    <div className="flex flex-col gap-4 pb-6">

      {/* Context selectors */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tòa</p>
          <select
            className="flex h-11 w-full rounded-lg border-0 bg-black/5 px-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 dark:bg-white/10"
            value={selectedBuildingId}
            onChange={e => { setSelectedBuildingId(e.target.value); setSelectedRoomId('') }}
          >
            <option value="">Chỉ template chung</option>
            {buildings.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Phòng</p>
          <select
            className="flex h-11 w-full rounded-lg border-0 bg-black/5 px-3 text-sm disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 dark:bg-white/10"
            value={selectedRoomId}
            onChange={e => setSelectedRoomId(e.target.value)}
            disabled={!selectedBuildingId}
          >
            <option value="">Chọn phòng</option>
            {filteredRooms.map(r => <option key={r.id} value={r.id}>{r.room_number}</option>)}
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex rounded-lg bg-zinc-100 p-1 dark:bg-zinc-900">
        {([
          { id: 'browse', label: 'Template' },
          { id: 'flows', label: `Luồng${flows.length ? ` (${flows.length})` : ''}` },
          { id: 'queue', label: `Hàng${queue.length ? ` (${queue.length})` : ''}` },
        ] as const).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 rounded-md py-2.5 text-sm font-semibold transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-zinc-950 shadow-sm dark:bg-zinc-800 dark:text-zinc-50'
                : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Browse tab ── */}
      {activeTab === 'browse' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Tìm template..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="flex h-11 w-full rounded-lg border-0 bg-black/5 pl-9 pr-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 dark:bg-white/10"
              />
            </div>
            <button
              onClick={() => { setTplName(''); setTplCategory(''); setTplContent(''); setTplError(null); setCreateTplOpen(true) }}
              className="flex h-11 items-center gap-1.5 rounded-lg bg-zinc-950 px-3 text-sm font-semibold text-white transition-colors hover:bg-zinc-700 dark:bg-white dark:text-zinc-950"
            >
              <Plus className="size-4" /> Tạo
            </button>
          </div>

          {Object.keys(groupedBrowseTemplates).length === 0 ? (
            <div className="rounded-lg border border-dashed border-zinc-300 py-10 text-center text-sm text-muted-foreground dark:border-zinc-800">
              {searchQuery ? 'Không tìm thấy template.' : 'Chưa có template. Chọn tòa hoặc thêm template chung.'}
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedBrowseTemplates).map(([cat, tpls]) => (
                <div key={cat} className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{cat}</h3>
                  <div className="space-y-2">
                    {tpls.map(tpl => (
                      <button
                        key={tpl.id}
                        onClick={() => openSheet(tpl)}
                        className="w-full rounded-lg border border-zinc-200 bg-white p-3.5 text-left transition-colors hover:border-zinc-300 hover:bg-zinc-50 active:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700 dark:hover:bg-zinc-900"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="mb-1.5 flex items-center gap-1.5">
                              {tpl.type === 'building' ? (
                                <span className="inline-flex items-center gap-1 rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
                                  <Building2 className="size-2.5" /> Building
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
                                  <PenLine className="size-2.5" /> Common
                                </span>
                              )}
                            </div>
                            <p className="text-sm font-semibold leading-tight">{tpl.name}</p>
                            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                              {tpl.content.replace(/\{\{[^}]+\}\}/g, '…')}
                            </p>
                          </div>
                          <Plus className="mt-0.5 size-4 shrink-0 text-zinc-400" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Flows tab ── */}
      {activeTab === 'flows' && (
        <div className="space-y-3">
          <Button onClick={() => openFlowModal()} className="h-12 w-full rounded-lg">
            <Plus className="mr-2 size-4" /> Tạo luồng mới
          </Button>

          {flows.length === 0 ? (
            <div className="rounded-lg border border-dashed border-zinc-300 py-12 text-center dark:border-zinc-800">
              <Layers className="mx-auto mb-2 size-6 text-muted-foreground opacity-40" />
              <p className="text-sm text-muted-foreground">Chưa có luồng nào.</p>
              <p className="mt-1 text-xs text-muted-foreground">Tạo luồng để gửi nhanh nhiều tin nhắn.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {flows.map(flow => {
                const items = parseFlowItems(flow.items)
                return (
                  <div key={flow.id} className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
                    <div className="flex items-center gap-3 p-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold leading-tight">{flow.name}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {items.length} tin nhắn
                          {items.length > 0 && (
                            <span> · {items.map(ref => {
                              const tpl = allTemplates.find(t => t.id === ref.template_id)
                              return tpl?.name ?? '?'
                            }).slice(0, 3).join(', ')}{items.length > 3 ? '…' : ''}</span>
                          )}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          onClick={() => openFlowModal(flow)}
                          className="rounded-lg bg-zinc-100 p-2 text-zinc-500 transition-colors hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800"
                        >
                          <Edit2 className="size-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteFlow(flow.id)}
                          className="rounded-lg bg-red-500/10 p-2 text-red-500 transition-colors hover:bg-red-500/20"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </div>
                    <div className="border-t border-zinc-100 px-4 py-3 dark:border-zinc-900">
                      <Button
                        className="h-9 w-full rounded-lg text-sm"
                        onClick={() => loadFlow(flow)}
                        disabled={items.length === 0}
                      >
                        Tải vào hàng gửi
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Queue tab ── */}
      {activeTab === 'queue' && (
        <div className="space-y-3">
          {queue.length === 0 ? (
            <div className="rounded-lg border border-dashed border-zinc-300 py-12 text-center dark:border-zinc-800">
              <ListOrdered className="mx-auto mb-2 size-6 text-muted-foreground opacity-40" />
              <p className="text-sm text-muted-foreground">Chưa có tin nhắn.</p>
              <p className="mt-1 text-xs text-muted-foreground">Chọn template hoặc tải một luồng.</p>
            </div>
          ) : (
            <>
              {queuePendingCount > 0 && (
                <div className="rounded-lg bg-amber-50 p-3 text-xs font-medium text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
                  {queuePendingCount} tin nhắn cần điền thông tin trước khi gửi.
                </div>
              )}

              <div className="space-y-2">
                {queue.map((item, index) => (
                  <div
                    key={item.id}
                    className={`rounded-lg border bg-white dark:bg-zinc-950 ${
                      item.message === null
                        ? 'border-amber-200 dark:border-amber-800/50'
                        : 'border-zinc-200 dark:border-zinc-800'
                    }`}
                  >
                    <div className="flex items-center gap-2 border-b border-zinc-100 px-3 py-2.5 dark:border-zinc-900">
                      <div className="flex flex-col">
                        <button
                          onClick={() => moveQueueItem(index, 'up')}
                          disabled={index === 0}
                          className="rounded p-0.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-20 dark:hover:bg-zinc-900"
                        >
                          <ChevronUp className="size-3.5" />
                        </button>
                        <button
                          onClick={() => moveQueueItem(index, 'down')}
                          disabled={index === queue.length - 1}
                          className="rounded p-0.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-20 dark:hover:bg-zinc-900"
                        >
                          <ChevronDown className="size-3.5" />
                        </button>
                      </div>
                      <span className="text-xs font-semibold tabular-nums text-zinc-400">{index + 1}</span>
                      <span className="flex-1 truncate text-sm font-semibold">{item.templateName}</span>

                      {item.message === null ? (
                        <button
                          onClick={() => {
                            const tpl = allTemplates.find(t => t.id === item.templateId)
                            if (tpl) openSheet(tpl, item.id)
                          }}
                          className="flex items-center gap-1.5 rounded-md bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-amber-600"
                        >
                          Điền →
                        </button>
                      ) : (
                        <button
                          onClick={() => copyQueueItem(item)}
                          className="flex items-center gap-1.5 rounded-md bg-zinc-950 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-zinc-700 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
                        >
                          {copiedQueueId === item.id
                            ? <><CheckCircle2 className="size-3" /> Đã copy</>
                            : <><Copy className="size-3" /> Copy</>
                          }
                        </button>
                      )}

                      <button
                        onClick={() => setQueue(prev => prev.filter(q => q.id !== item.id))}
                        className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-900"
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>

                    {item.message !== null ? (
                      <p className="line-clamp-3 wrap-break-word whitespace-pre-wrap px-4 py-3 text-xs leading-relaxed text-muted-foreground">
                        {item.message}
                      </p>
                    ) : (
                      <p className="px-4 py-3 text-xs italic text-amber-600 dark:text-amber-400">
                        Chưa điền thông tin — bấm &quot;Điền →&quot; để hoàn thiện.
                      </p>
                    )}
                  </div>
                ))}
              </div>

              <Button variant="outline" className="w-full rounded-lg" onClick={() => setQueue([])}>
                Xóa hết
              </Button>
            </>
          )}
        </div>
      )}

      {/* ── Template Sheet ── */}
      {sheetTemplate && (
        <div
          className="fixed inset-0 z-200 flex items-end justify-center bg-black/50 backdrop-blur-sm"
          onClick={e => { if (e.target === e.currentTarget) closeSheet() }}
        >
          <div className="flex max-h-[92dvh] w-full max-w-130 flex-col rounded-t-2xl bg-white shadow-2xl dark:bg-zinc-950">
            {/* pill */}
            <div className="flex shrink-0 justify-center pt-3 pb-1">
              <div className="h-1 w-10 rounded-full bg-zinc-300 dark:bg-zinc-700" />
            </div>
            {/* header */}
            <div className="flex shrink-0 items-center justify-between px-4 pb-3 pt-1">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {sheetTemplate.category}
                </p>
                <h3 className="text-base font-semibold leading-tight">{sheetTemplate.name}</h3>
              </div>
              <button onClick={closeSheet} className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900">
                <X className="size-5" />
              </button>
            </div>

            {/* scrollable body */}
            <div className="flex-1 overflow-y-auto border-t border-zinc-100 px-4 py-4 dark:border-zinc-900">
              <div className="space-y-4">
                {sheetTemplate.type === 'building' && (!selectedBuilding || !selectedRoom) && (
                  <div className="rounded-lg bg-amber-50 p-3 text-xs font-medium text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
                    Chọn tòa và phòng ở trên để tự điền thông tin.
                  </div>
                )}

                {sheetDynamicKeys.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Điền vào</p>
                    {sheetDynamicKeys.map(key => (
                      <div key={key} className="space-y-1.5">
                        <label className="text-sm font-medium">{formatVariableLabel(key)}</label>
                        <Input
                          placeholder={`Nhập ${formatVariableLabel(key).toLowerCase()}...`}
                          value={dynamicValues[key] || ''}
                          onChange={e => setDynamicValues(prev => ({ ...prev, [key]: e.target.value }))}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {canGenerate && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Xem trước</p>
                    <div className="max-h-52 overflow-y-auto rounded-lg bg-black/5 p-3.5 dark:bg-white/5">
                      <p className="wrap-break-word whitespace-pre-wrap text-sm leading-7 text-zinc-800 dark:text-zinc-200">
                        {sheetMessage || (
                          <span className="italic text-muted-foreground">Tin nhắn hiện ở đây…</span>
                        )}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* sticky actions */}
            <div className="shrink-0 grid grid-cols-2 gap-3 border-t border-zinc-100 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] dark:border-zinc-900">
              <Button variant="outline" className="h-12 rounded-xl" disabled={!sheetMessage || hasUnfilledPlaceholders} onClick={copySheetMessage}>
                {sheetCopied ? <><CheckCircle2 className="mr-2 size-4" /> Đã copy</> : <><Copy className="mr-2 size-4" /> Copy ngay</>}
              </Button>
              <Button className="h-12 rounded-xl" disabled={!sheetMessage} onClick={confirmSheetMessage}>
                {pendingQueueItemId ? 'Xác nhận' : <><Plus className="mr-2 size-4" /> Thêm vào hàng</>}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Create Template Drawer ── */}
      {createTplOpen && (
        <div
          className="fixed inset-0 z-200 flex items-end justify-center bg-black/50 backdrop-blur-sm"
          onClick={e => { if (e.target === e.currentTarget) setCreateTplOpen(false) }}
        >
          <div className="flex max-h-[92dvh] w-full max-w-130 flex-col rounded-t-2xl bg-white shadow-2xl dark:bg-zinc-950">
            <div className="flex shrink-0 justify-center pt-3 pb-1">
              <div className="h-1 w-10 rounded-full bg-zinc-300 dark:bg-zinc-700" />
            </div>
            <div className="flex shrink-0 items-center justify-between px-4 pb-3 pt-1">
              <h3 className="text-base font-semibold">Tạo template mới</h3>
              <button onClick={() => setCreateTplOpen(false)} className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900">
                <X className="size-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto border-t border-zinc-100 px-4 py-4 dark:border-zinc-900">
              <div className="space-y-4">
                {tplError && (
                  <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">{tplError}</p>
                )}
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold">Tên template</label>
                  <input
                    value={tplName}
                    onChange={e => setTplName(e.target.value)}
                    placeholder="VD: Hướng dẫn check-in, Mật khẩu wifi..."
                    className="flex h-11 w-full rounded-lg border-0 bg-black/5 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 dark:bg-white/10"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold">Danh mục</label>
                  <input
                    value={tplCategory}
                    onChange={e => setTplCategory(e.target.value)}
                    placeholder="VD: Check-in, Wifi, Hướng dẫn..."
                    list="tpl-categories"
                    className="flex h-11 w-full rounded-lg border-0 bg-black/5 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 dark:bg-white/10"
                  />
                  <datalist id="tpl-categories">
                    {existingCategories.map(c => <option key={c} value={c} />)}
                  </datalist>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold">Nội dung</label>
                  <p className="text-xs text-zinc-400">Dùng <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">{'{{tên_biến}}'}</code> cho biến động</p>
                  <textarea
                    value={tplContent}
                    onChange={e => setTplContent(e.target.value)}
                    placeholder={'Xin chào {{tên_khách}}, chào mừng bạn đến...\n\nMật khẩu wifi: {{wifi_password}}'}
                    rows={7}
                    className="w-full resize-none rounded-lg border-0 bg-black/5 px-3 py-2.5 text-sm leading-relaxed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 dark:bg-white/10"
                  />
                </div>
              </div>
            </div>
            <div className="shrink-0 border-t border-zinc-100 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] dark:border-zinc-900">
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="h-12 rounded-xl" onClick={() => setCreateTplOpen(false)} disabled={tplSaving}>
                  Hủy
                </Button>
                <Button className="h-12 rounded-xl" onClick={saveNewTemplate} disabled={tplSaving || !tplName.trim() || !tplContent.trim()}>
                  {tplSaving ? 'Đang lưu...' : 'Lưu template'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Flow Editor Modal ── */}
      {flowModalOpen && (
        <div className="fixed inset-0 z-200 flex items-end justify-center bg-black/50 backdrop-blur-sm">
          <div className="flex max-h-[92dvh] w-full max-w-130 flex-col rounded-t-2xl bg-white shadow-2xl dark:bg-zinc-950">
            {/* pill */}
            <div className="flex shrink-0 justify-center pt-3 pb-1">
              <div className="h-1 w-10 rounded-full bg-zinc-300 dark:bg-zinc-700" />
            </div>
            {/* header */}
            <div className="flex shrink-0 items-center justify-between px-4 pb-3 pt-1">
              <h3 className="text-base font-semibold">
                {editingFlow ? 'Chỉnh sửa luồng' : 'Tạo luồng mới'}
              </h3>
              <button onClick={() => setFlowModalOpen(false)} className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900">
                <X className="size-5" />
              </button>
            </div>

            {/* scrollable body */}
            <div className="flex-1 overflow-y-auto border-t border-zinc-100 px-4 py-4 dark:border-zinc-900">
              <div className="space-y-5">
                {/* name */}
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold">Tên luồng</label>
                  <Input
                    value={flowName}
                    onChange={e => setFlowName(e.target.value)}
                    placeholder="VD: Check-in standard, Nhắc check-out..."
                  />
                </div>

                {/* current flow items */}
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    Tin nhắn trong luồng ({flowItems.length})
                  </p>
                  {flowItems.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-zinc-200 py-4 text-center text-xs text-muted-foreground dark:border-zinc-800">
                      Chưa có. Thêm từ danh sách bên dưới.
                    </p>
                  ) : (
                    <div className="space-y-1.5">
                      {flowItems.map((ref, index) => {
                        const tpl = allTemplates.find(t => t.id === ref.template_id)
                        return (
                          <div key={index} className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 dark:border-zinc-800 dark:bg-zinc-900">
                            <div className="flex flex-col">
                              <button
                                onClick={() => moveFlowItem(index, 'up')}
                                disabled={index === 0}
                                className="rounded p-0.5 text-zinc-400 hover:bg-zinc-200 disabled:opacity-20 dark:hover:bg-zinc-800"
                              >
                                <ChevronUp className="size-3.5" />
                              </button>
                              <button
                                onClick={() => moveFlowItem(index, 'down')}
                                disabled={index === flowItems.length - 1}
                                className="rounded p-0.5 text-zinc-400 hover:bg-zinc-200 disabled:opacity-20 dark:hover:bg-zinc-800"
                              >
                                <ChevronDown className="size-3.5" />
                              </button>
                            </div>
                            <span className="text-xs font-semibold tabular-nums text-zinc-400">{index + 1}</span>
                            <span className="flex-1 truncate text-sm font-medium">
                              {tpl?.name ?? <span className="italic text-red-500">Template không tồn tại</span>}
                            </span>
                            <button
                              onClick={() => removeFlowItem(index)}
                              className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700 dark:hover:bg-zinc-700"
                            >
                              <X className="size-3.5" />
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* template picker */}
                <div className="space-y-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Thêm template</p>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Tìm template..."
                      value={flowSearch}
                      onChange={e => setFlowSearch(e.target.value)}
                      className="flex h-10 w-full rounded-lg border-0 bg-black/5 pl-9 pr-4 text-sm focus-visible:outline-none dark:bg-white/10"
                    />
                  </div>

                  {allTemplates.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      Chọn tòa ở trên hoặc thêm template chung để hiện danh sách.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {Object.entries(groupedFlowTemplates).map(([cat, tpls]) => (
                        <div key={cat} className="space-y-1.5">
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{cat}</h4>
                          {tpls.map(tpl => (
                            <button
                              key={tpl.id}
                              onClick={() => addTemplateToFlow(tpl)}
                              className="flex w-full items-center gap-3 rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-left transition-colors hover:bg-zinc-50 active:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
                            >
                              <Plus className="size-4 shrink-0 text-zinc-400" />
                              <span className="flex-1 truncate text-sm font-medium">{tpl.name}</span>
                              {tpl.type === 'building' ? (
                                <span className="text-[10px] font-semibold text-zinc-400">Building</span>
                              ) : (
                                <span className="text-[10px] font-semibold text-zinc-400">Common</span>
                              )}
                            </button>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* sticky footer */}
            <div className="shrink-0 border-t border-zinc-100 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] dark:border-zinc-900">
              {flowError && (
                <p className="mb-2 text-xs text-red-500">{flowError}</p>
              )}
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="h-12 rounded-xl" onClick={() => setFlowModalOpen(false)} disabled={isSavingFlow}>
                  Hủy
                </Button>
                <Button className="h-12 rounded-xl" onClick={saveFlow} disabled={isSavingFlow}>
                  {isSavingFlow ? 'Đang lưu...' : 'Lưu luồng'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
