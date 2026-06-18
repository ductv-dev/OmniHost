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
    <div className="space-y-4">
      <div className="rounded-lg bg-zinc-950 p-4 text-white dark:bg-white dark:text-zinc-950">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
          Property data
        </p>
        <div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Buildings</h1>
          <p className="mt-2 text-sm text-zinc-300 dark:text-zinc-600">
            {buildings?.length || 0} saved building{buildings?.length === 1 ? '' : 's'}
          </p>
        </div>
      </div>

      <div>
        <Link href="/dashboard/buildings/new">
          <Button className="h-12 w-full rounded-lg text-base">
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
              className="group relative overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm transition-colors active:scale-[0.99] dark:border-zinc-800 dark:bg-zinc-950"
            >
              <Link
                href={`/dashboard/buildings/${building.id}`}
                className="block p-4 pr-14"
              >
                <div className="min-w-0">
                  <h3 className="truncate text-lg font-semibold">
                    {building.name}
                  </h3>
                  <div className="mt-2 flex min-w-0 items-start gap-2 text-sm text-zinc-500">
                    <MapPin className="mt-0.5 size-4 shrink-0" />
                    <span className="line-clamp-2">{building.address}</span>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3 text-xs text-zinc-500">
                  <span className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-2 py-1 dark:bg-zinc-900">
                    <KeyRound className="size-3.5" />
                    {building.gate_password || 'No gate code'}
                  </span>
                  <ChevronRight className="size-5 text-zinc-400" />
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
                    className="size-9 rounded-lg text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
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
