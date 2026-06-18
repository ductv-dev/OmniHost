'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Settings, MessageSquare, Home } from 'lucide-react'
import BuildingForm from '../building-form'

import RoomsTab from './rooms-tab'
import TemplatesTab from './templates-tab'
import { Tables } from '@/types/supabase'
import { parseMessageTemplates } from '@/lib/constants/templates'

export default function BuildingHubClient({ building, rooms }: { building: Tables<'buildings'>, rooms: Tables<'rooms'>[] }) {
  const [activeTab, setActiveTab] = useState<'rooms' | 'templates' | 'settings'>('rooms')
  const templateCount = parseMessageTemplates(building.custom_templates).length

  const tabs = [
    { id: 'rooms', label: 'Rooms', icon: Home },
    { id: 'templates', label: 'Templates', icon: MessageSquare },
    { id: 'settings', label: 'Settings', icon: Settings },
  ] as const

  return (
    <div className="space-y-4 pb-3">
      <div className="rounded-lg bg-zinc-950 p-4 text-white dark:bg-white dark:text-zinc-950">
        <div className="flex flex-col gap-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
              Building
            </p>
            <h1 className="mt-1 truncate text-2xl font-semibold tracking-tight">{building.name}</h1>
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-300 dark:text-zinc-600">{building.address}</p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div className="rounded-lg bg-white/10 px-3 py-2 dark:bg-zinc-950/10">
              <p className="text-xs text-zinc-400 dark:text-zinc-500">Rooms</p>
              <p className="font-semibold">{rooms.length}</p>
            </div>
            <div className="rounded-lg bg-white/10 px-3 py-2 dark:bg-zinc-950/10">
              <p className="text-xs text-zinc-400 dark:text-zinc-500">Templates</p>
              <p className="font-semibold">{templateCount}</p>
            </div>
            <div className="rounded-lg bg-white/10 px-3 py-2 dark:bg-zinc-950/10">
              <p className="text-xs text-zinc-400 dark:text-zinc-500">Gate</p>
              <p className="font-semibold">{building.gate_password || 'Not set'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex rounded-lg bg-zinc-100 p-1 dark:bg-zinc-900">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex-1 flex items-center justify-center gap-2 rounded-md py-3 text-sm font-semibold transition-colors ${isActive ? 'text-zinc-950 dark:text-zinc-50' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
            >
              <tab.icon className="size-4" />
              <span className="hidden sm:inline">{tab.label}</span>
              {isActive && (
                <motion.div
                  layoutId="hub-tab-indicator"
                  className="absolute inset-0 z-[-1] rounded-md bg-white shadow-sm dark:bg-zinc-800"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
            </button>
          )
        })}
      </div>

      <div className="relative">
        {activeTab === 'rooms' && <RoomsTab buildingId={building.id} initialRooms={rooms} />}
        {activeTab === 'templates' && <TemplatesTab building={building} />}
        {activeTab === 'settings' && <BuildingForm building={building} />}
      </div>
    </div>
  )
}
