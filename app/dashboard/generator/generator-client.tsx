'use client'

import { useState, useMemo } from 'react'
import { Copy, CheckCircle2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { 
  generateTemplateMessage, 
  MessageTemplate, 
  extractDynamicVariables, 
  formatVariableLabel,
  parseMessageTemplates,
} from '@/lib/constants/templates'
import { motion, AnimatePresence } from 'framer-motion'
import { Tables } from '@/types/supabase'

function formatOrdinal(value: number | null | undefined) {
  if (value === null || value === undefined) return '...'

  const lastTwoDigits = value % 100
  if (lastTwoDigits >= 11 && lastTwoDigits <= 13) return `${value}th`

  switch (value % 10) {
    case 1:
      return `${value}st`
    case 2:
      return `${value}nd`
    case 3:
      return `${value}rd`
    default:
      return `${value}th`
  }
}

export default function GeneratorClient({
  buildings,
  rooms,
}: {
  buildings: Tables<'buildings'>[]
  rooms: Tables<'rooms'>[]
}) {
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>('')
  const [selectedRoomId, setSelectedRoomId] = useState<string>('')
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')
  
  // Dynamic State for user inputs
  const [dynamicValues, setDynamicValues] = useState<Record<string, string>>({})
  const [copied, setCopied] = useState(false)

  const filteredRooms = useMemo(() => {
    return rooms.filter(room => room.building_id === selectedBuildingId)
  }, [rooms, selectedBuildingId])

  const selectedBuilding = buildings.find(b => b.id === selectedBuildingId)
  const selectedRoom = rooms.find(r => r.id === selectedRoomId)

  const buildingTemplates: MessageTemplate[] = useMemo(() => {
    if (!selectedBuilding) return []
    return parseMessageTemplates(selectedBuilding.custom_templates)
  }, [selectedBuilding])

  const selectedTemplate = useMemo(() => {
    return buildingTemplates.find(t => t.id === selectedTemplateId) ?? null
  }, [buildingTemplates, selectedTemplateId])

  const selectedTemplateType = selectedTemplate?.type ?? 'building'
  const isCustomTemplate = selectedTemplateType === 'custom'
  const canPreview = Boolean(selectedTemplate && (isCustomTemplate || selectedRoom))

  // Group templates by category for the select dropdown
  const groupedTemplates = useMemo(() => {
    return buildingTemplates.reduce((acc, tpl) => {
      if (!acc[tpl.category]) acc[tpl.category] = []
      acc[tpl.category].push(tpl)
      return acc
    }, {} as Record<string, MessageTemplate[]>)
  }, [buildingTemplates])

  // 1. Get the raw template string
  const templateString = useMemo(() => {
    return selectedTemplate?.content ?? ''
  }, [selectedTemplate])

  // 2. Extract dynamic variables from the template string
  const dynamicKeys = useMemo(() => {
    return extractDynamicVariables(templateString, selectedTemplateType)
  }, [templateString, selectedTemplateType])

  const handleDynamicChange = (key: string, value: string) => {
    setDynamicValues(prev => ({ ...prev, [key]: value }))
  }

  // 3. Generate the final message
  const generatedMessage = useMemo(() => {
    if (!selectedTemplate || !selectedBuilding || !templateString) return ''

    if (selectedTemplate.type === 'custom') {
      return generateTemplateMessage(templateString, {}, dynamicValues)
    }

    if (!selectedRoom) return ''
    
    // DB values that auto-fill
    const dbVariables: Record<string, string> = {
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
    
    return generateTemplateMessage(templateString, dbVariables, dynamicValues)
  }, [selectedBuilding, selectedRoom, selectedTemplate, templateString, dynamicValues])

  const handleCopy = async () => {
    if (!generatedMessage) return
    try {
      await navigator.clipboard.writeText(generatedMessage)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  return (
    <div className="grid gap-6 pb-8 lg:grid-cols-[minmax(320px,420px)_minmax(0,1fr)]">
      <div className="space-y-4">
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>Message Setup</CardTitle>
            <CardDescription>Select the source data for this reply.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label>Building</Label>
              <select
                className="flex h-11 w-full rounded-lg border-0 bg-black/5 px-3 py-2 text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 dark:bg-white/10"
                value={selectedBuildingId}
                onChange={(e) => {
                  setSelectedBuildingId(e.target.value)
                  setSelectedRoomId('')
                  setSelectedTemplateId('')
                  setDynamicValues({})
                }}
              >
                <option value="" disabled>Select a building</option>
                {buildings.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>

            <AnimatePresence>
              {selectedBuilding && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2 overflow-hidden"
                >
                  <Label>Template</Label>
                  <select
                    className="flex h-11 w-full rounded-lg border-0 bg-black/5 px-3 py-2 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 dark:bg-white/10"
                    value={selectedTemplateId}
                    onChange={(e) => {
                      const nextTemplateId = e.target.value
                      const nextTemplate = buildingTemplates.find(t => t.id === nextTemplateId)
                      setSelectedTemplateId(nextTemplateId)
                      if (nextTemplate?.type === 'custom') {
                        setSelectedRoomId('')
                      }
                      setDynamicValues({})
                    }}
                  >
                    <option value="" disabled>Select a template</option>
                    {Object.entries(groupedTemplates).map(([category, tpls]) => (
                      <optgroup key={category} label={category.toUpperCase()}>
                        {tpls.map(t => (
                          <option key={t.id} value={t.id}>
                            {t.type === 'custom' ? `${t.name} (custom)` : t.name}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-2">
              <Label>Room</Label>
              <select
                className="flex h-11 w-full rounded-lg border-0 bg-black/5 px-3 py-2 text-sm transition-all disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 dark:bg-white/10"
                value={selectedRoomId}
                onChange={(e) => setSelectedRoomId(e.target.value)}
                disabled={!selectedBuildingId || isCustomTemplate}
              >
                <option value="" disabled>
                  {isCustomTemplate ? 'Not needed for custom template' : 'Select a room'}
                </option>
                {filteredRooms.map((r) => (
                  <option key={r.id} value={r.id}>{r.room_number}</option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        <AnimatePresence>
          {dynamicKeys.length > 0 && canPreview && (
            <motion.div
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              <Card className="rounded-lg">
                <CardHeader>
                  <CardTitle>Manual Fields</CardTitle>
                  <CardDescription>Fill only the changing guest details.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                  {dynamicKeys.map((key) => (
                    <motion.div
                      key={key}
                      layout
                      initial={{ scale: 0.98, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="space-y-2"
                    >
                      <Label>{formatVariableLabel(key)}</Label>
                      <Input
                        placeholder={`Enter ${formatVariableLabel(key).toLowerCase()}...`}
                        value={dynamicValues[key] || ''}
                        onChange={(e) => handleDynamicChange(key, e.target.value)}
                      />
                    </motion.div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="lg:sticky lg:top-24 lg:self-start">
        <Card className="min-h-[420px] rounded-lg">
          <CardHeader className="flex flex-row items-center justify-between gap-4 border-b border-zinc-200 pb-4 dark:border-zinc-800">
            <div>
              <CardTitle>Preview</CardTitle>
              <CardDescription>
                {selectedTemplate ? selectedTemplate.name : 'Select a template to generate a reply.'}
              </CardDescription>
            </div>
            <Button size="sm" onClick={handleCopy} disabled={!generatedMessage} className="shrink-0 rounded-lg">
              {copied ? (
                <>
                  <CheckCircle2 className="mr-2 size-4" /> Copied
                </>
              ) : (
                <>
                  <Copy className="mr-2 size-4" /> Copy
                </>
              )}
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {generatedMessage ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="whitespace-pre-wrap p-5 text-sm leading-7"
              >
                {generatedMessage}
              </motion.div>
            ) : (
              <div className="flex min-h-[320px] items-center justify-center p-8 text-center text-sm text-zinc-500">
                Choose a building, template, and room when required.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
