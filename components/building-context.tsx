'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface BuildingOption {
  id: string
  name: string
}

interface BuildingContextValue {
  buildings: BuildingOption[]
  selectedId: string | null
  selectedBuilding: BuildingOption | null
  setSelectedId: (id: string) => void
  loading: boolean
}

const BuildingContext = createContext<BuildingContextValue | null>(null)

const STORAGE_KEY = 'omnihost_building'

export function BuildingProvider({ children }: { children: ReactNode }) {
  const [buildings, setBuildings] = useState<BuildingOption[]>([])
  const [selectedId, setSelectedIdState] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('buildings')
      .select('id, name')
      .order('name')
      .then(({ data }) => {
        const list = (data ?? []) as BuildingOption[]
        setBuildings(list)
        const saved = localStorage.getItem(STORAGE_KEY)
        const valid = saved && list.find(b => b.id === saved) ? saved : (list[0]?.id ?? null)
        setSelectedIdState(valid)
        if (valid) localStorage.setItem(STORAGE_KEY, valid)
        setLoading(false)
      })
  }, [])

  function setSelectedId(id: string) {
    setSelectedIdState(id)
    localStorage.setItem(STORAGE_KEY, id)
  }

  const selectedBuilding = buildings.find(b => b.id === selectedId) ?? null

  return (
    <BuildingContext.Provider value={{ buildings, selectedId, selectedBuilding, setSelectedId, loading }}>
      {children}
    </BuildingContext.Provider>
  )
}

export function useBuilding() {
  const ctx = useContext(BuildingContext)
  if (!ctx) throw new Error('useBuilding must be inside BuildingProvider')
  return ctx
}
