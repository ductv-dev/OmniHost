'use client'

import { useBuilding } from '@/components/building-context'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import BuildingHubClient from '../buildings/[id]/hub-client'
import type { Tables } from '@/types/supabase'
import { Building2 } from 'lucide-react'
import { AppLoading } from '@/components/ui/app-loading'

export default function MyBuildingPage() {
  const { selectedId, loading: buildingLoading } = useBuilding()

  const { data, isLoading } = useQuery({
    queryKey: ['building-hub', selectedId],
    queryFn: async () => {
      const supabase = createClient()
      const [buildingRes, roomsRes] = await Promise.all([
        supabase.from('buildings').select('*').eq('id', selectedId!).single(),
        supabase
          .from('rooms')
          .select('*')
          .eq('building_id', selectedId!)
          .order('sort_order')
          .order('room_number'),
      ])
      return {
        building: buildingRes.data as Tables<'buildings'>,
        rooms: (roomsRes.data ?? []) as Tables<'rooms'>[],
      }
    },
    enabled: !!selectedId,
  })

  if (buildingLoading || (!!selectedId && isLoading)) {
    return <AppLoading compact label="Đang tải thông tin tòa nhà" />
  }

  if (!selectedId) {
    return (
      <div className="flex h-60 flex-col items-center justify-center gap-3 text-center">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800">
          <Building2 className="size-7 text-zinc-400" />
        </div>
        <div>
          <p className="font-semibold text-zinc-800 dark:text-zinc-200">Chưa chọn tòa nhà</p>
          <p className="mt-1 text-sm text-zinc-500">Nhấn vào tên tòa nhà trên header để chọn</p>
        </div>
      </div>
    )
  }

  if (!data?.building) return null

  return <BuildingHubClient building={data.building} rooms={data.rooms} />
}
