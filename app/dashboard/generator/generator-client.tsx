'use client'

import { useState, useMemo } from 'react'
import { Copy, CheckCircle2, MessageSquareText, Settings2 } from 'lucide-react'
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
  commonTemplates,
}: {
  buildings: Tables<'buildings'>[]
  rooms: Tables<'rooms'>[]
  commonTemplates: Tables<'common_templates'>[]
}) {
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>('')
  const [selectedRoomId, setSelectedRoomId] = useState<string>('')
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<string>('')
  
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

  const commonMessageTemplates: MessageTemplate[] = useMemo(() => {
    return commonTemplates.map(template => ({
      id: template.id,
      name: template.name,
      category: template.category,
      type: 'custom',
      content: template.content,
    }))
  }, [commonTemplates])

  const selectedTemplate = useMemo(() => {
    if (!selectedTemplateKey) return null

    const [source, id] = selectedTemplateKey.split(':')
    if (source === 'common') {
      return commonMessageTemplates.find(template => template.id === id) ?? null
    }

    return buildingTemplates.find(template => template.id === id) ?? null
  }, [buildingTemplates, commonMessageTemplates, selectedTemplateKey])

  const selectedTemplateSource = selectedTemplateKey.startsWith('common:') ? 'common' : 'building'

  const selectedTemplateType = selectedTemplate?.type ?? 'building'
  const isCustomTemplate = selectedTemplateType === 'custom'
  const canPreview = Boolean(
    selectedTemplate &&
    (selectedTemplateSource === 'common' || isCustomTemplate || selectedRoom)
  )

  // Group templates by category for the select dropdown
  const groupedBuildingTemplates = useMemo(() => {
    return buildingTemplates.reduce((acc, tpl) => {
      if (!acc[tpl.category]) acc[tpl.category] = []
      acc[tpl.category].push(tpl)
      return acc
    }, {} as Record<string, MessageTemplate[]>)
  }, [buildingTemplates])

  const groupedCommonTemplates = useMemo(() => {
    return commonMessageTemplates.reduce((acc, tpl) => {
      if (!acc[tpl.category]) acc[tpl.category] = []
      acc[tpl.category].push(tpl)
      return acc
    }, {} as Record<string, MessageTemplate[]>)
  }, [commonMessageTemplates])

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
    if (!selectedTemplate || !templateString) return ''

    if (selectedTemplate.type === 'custom') {
      return generateTemplateMessage(templateString, {}, dynamicValues)
    }

    if (!selectedBuilding) return ''
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
    <div className="grid gap-4 pb-3">
      <div className="space-y-4">
        <Card className="rounded-lg">
          <CardHeader className="p-4 pb-3">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-900">
                <Settings2 className="size-5" />
              </div>
              <div>
                <CardTitle>Setup</CardTitle>
                <CardDescription>Pick only what this message needs.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 p-4 pt-0">
            <div className="space-y-2">
              <Label>Building</Label>
              <select
                className="flex h-12 w-full rounded-lg border-0 bg-black/5 px-3 py-2 text-base transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 dark:bg-white/10"
                value={selectedBuildingId}
                onChange={(e) => {
                  setSelectedBuildingId(e.target.value)
                  setSelectedRoomId('')
                  if (selectedTemplateKey.startsWith('building:')) {
                    setSelectedTemplateKey('')
                  }
                  setDynamicValues({})
                }}
              >
                <option value="">No building / common only</option>
                {buildings.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Template</Label>
              <select
                className="flex h-12 w-full rounded-lg border-0 bg-black/5 px-3 py-2 text-base font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 dark:bg-white/10"
                value={selectedTemplateKey}
                onChange={(e) => {
                  const nextTemplateKey = e.target.value
                  const [source, id] = nextTemplateKey.split(':')
                  const nextTemplate =
                    source === 'common'
                      ? commonMessageTemplates.find(template => template.id === id)
                      : buildingTemplates.find(template => template.id === id)

                  setSelectedTemplateKey(nextTemplateKey)
                  if (source === 'common' || nextTemplate?.type === 'custom') {
                    setSelectedRoomId('')
                  }
                  setDynamicValues({})
                }}
              >
                <option value="" disabled>Select a template</option>
                {Object.entries(groupedCommonTemplates).map(([category, tpls]) => (
                  <optgroup key={`common-${category}`} label={`COMMON - ${category.toUpperCase()}`}>
                    {tpls.map(template => (
                      <option key={`common:${template.id}`} value={`common:${template.id}`}>
                        {template.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
                {selectedBuilding && Object.entries(groupedBuildingTemplates).map(([category, tpls]) => (
                  <optgroup key={`building-${category}`} label={`${selectedBuilding.name.toUpperCase()} - ${category.toUpperCase()}`}>
                    {tpls.map(template => (
                      <option key={`building:${template.id}`} value={`building:${template.id}`}>
                        {template.type === 'custom' ? `${template.name} (custom)` : template.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Room</Label>
              <select
                className="flex h-12 w-full rounded-lg border-0 bg-black/5 px-3 py-2 text-base transition-all disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 dark:bg-white/10"
                value={selectedRoomId}
                onChange={(e) => setSelectedRoomId(e.target.value)}
                disabled={!selectedBuildingId || selectedTemplateSource === 'common' || isCustomTemplate}
              >
                <option value="" disabled>
                  {selectedTemplateSource === 'common' || isCustomTemplate ? 'Not needed for this template' : 'Select a room'}
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
                <CardHeader className="p-4 pb-3">
                  <CardTitle>Manual Fields</CardTitle>
                  <CardDescription>Fill only changing guest details.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 p-4 pt-0">
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

      <div>
        <Card className="min-h-[380px] rounded-lg">
          <CardHeader className="flex flex-row items-center justify-between gap-3 border-b border-zinc-200 p-4 dark:border-zinc-800">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <MessageSquareText className="size-4 text-zinc-500" />
                <CardTitle>Preview</CardTitle>
              </div>
              <CardDescription>
                {selectedTemplate ? selectedTemplate.name : 'Select a template to generate a reply.'}
              </CardDescription>
            </div>
            <Button size="lg" onClick={handleCopy} disabled={!generatedMessage} className="h-11 shrink-0 rounded-lg px-4">
              {copied ? (
                <>
                  <CheckCircle2 className="size-4" /> Copied
                </>
              ) : (
                <>
                  <Copy className="size-4" /> Copy
                </>
              )}
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {generatedMessage ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="whitespace-pre-wrap p-4 text-[15px] leading-7"
              >
                {generatedMessage}
              </motion.div>
            ) : (
              <div className="flex min-h-[320px] items-center justify-center p-8 text-center text-sm text-zinc-500">
                Choose a template, then select a building and room only when required.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
