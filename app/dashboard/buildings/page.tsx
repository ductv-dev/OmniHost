import Link from 'next/link'
import { Building2, ChevronRight, KeyRound, MapPin, Plus, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { deleteBuilding } from './actions'

export default async function BuildingsPage() {
  const supabase = await createClient()
  
  const { data: buildings } = await supabase
    .from('buildings')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Buildings</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {buildings?.length || 0} saved building{buildings?.length === 1 ? '' : 's'}
          </p>
        </div>
        <Link href="/dashboard/buildings/new">
          <Button className="w-full rounded-lg sm:w-auto">
            <Plus className="mr-2 size-4" /> Add Building
          </Button>
        </Link>
      </div>

      <div className="grid gap-3">
        {!buildings || buildings.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-950">
            <Building2 className="mb-3 size-9 text-zinc-400" />
            <p className="font-medium">No buildings yet</p>
            <p className="mt-1 text-sm text-zinc-500">Add a building before creating rooms and message templates.</p>
          </div>
        ) : (
          buildings.map((building) => (
            <div
              key={building.id}
              className="group relative overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm transition-colors hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700"
            >
              <Link
                href={`/dashboard/buildings/${building.id}`}
                className="grid gap-3 p-4 pr-14 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:p-5 sm:pr-16"
              >
                <div className="min-w-0">
                  <h3 className="truncate text-base font-semibold transition-colors group-hover:text-zinc-700 dark:group-hover:text-zinc-200">
                    {building.name}
                  </h3>
                  <div className="mt-2 flex min-w-0 items-start gap-2 text-sm text-zinc-500">
                    <MapPin className="mt-0.5 size-4 shrink-0" />
                    <span className="line-clamp-2">{building.address}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs text-zinc-500">
                  <span className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-2 py-1 dark:bg-zinc-900">
                    <KeyRound className="size-3.5" />
                    {building.gate_password || 'No gate code'}
                  </span>
                  <ChevronRight className="hidden size-5 text-zinc-400 transition-colors group-hover:text-zinc-900 dark:group-hover:text-zinc-100 sm:block" />
                </div>
              </Link>

              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <form action={async () => {
                  'use server'
                  await deleteBuilding(building.id)
                }}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 rounded-lg text-zinc-400 opacity-100 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 sm:opacity-0 sm:group-hover:opacity-100"
                    aria-label={`Delete ${building.name}`}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </form>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
