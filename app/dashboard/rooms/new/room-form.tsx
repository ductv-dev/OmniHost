'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { createRoom } from '../actions'

const formSchema = z.object({
  building_id: z.string().uuid('Please select a building'),
  room_number: z.string().min(1, 'Room number is required'),
  floor: z.coerce.number().min(0),
  lockbox_password: z.string().optional(),
  wifi_name: z.string().optional(),
  wifi_password: z.string().optional(),
  washing_machine_floor: z.preprocess(
    value => (value === '' || value === null ? undefined : value),
    z.coerce.number().optional()
  ),
  dryer_floor: z.preprocess(
    value => (value === '' || value === null ? undefined : value),
    z.coerce.number().optional()
  ),
  room_note: z.string().optional(),
})

type FormInput = z.input<typeof formSchema>
type FormData = z.output<typeof formSchema>

export default function RoomForm({ buildings }: { buildings: { id: string, name: string }[] }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormInput, unknown, FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      building_id: '',
      room_number: '',
      floor: 1,
      lockbox_password: '',
      wifi_name: '',
      wifi_password: '',
      washing_machine_floor: '',
      dryer_floor: '',
      room_note: '',
    },
  })

  const onSubmit = async (data: FormData) => {
    setIsLoading(true)
    setError(null)
    
    const formData = new FormData()
    formData.append('building_id', data.building_id)
    formData.append('room_number', data.room_number)
    formData.append('floor', data.floor.toString())
    formData.append('lockbox_password', data.lockbox_password || '')
    formData.append('wifi_name', data.wifi_name || '')
    formData.append('wifi_password', data.wifi_password || '')
    formData.append('washing_machine_floor', data.washing_machine_floor?.toString() || '')
    formData.append('dryer_floor', data.dryer_floor?.toString() || '')
    formData.append('room_note', data.room_note || '')
    
    const result = await createRoom(formData)
    
    if (result?.error) {
      setError(result.error)
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Room Details</CardTitle>
        <CardDescription>Enter the information for the new room.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="building_id">Building</Label>
            <select
              id="building_id"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              {...register('building_id')}
            >
              <option value="" disabled>Select a building</option>
              {buildings.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
            {errors.building_id && <p className="text-sm text-red-500">{errors.building_id.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="room_number">Room Number</Label>
              <Input id="room_number" placeholder="e.g. 101 or p101" {...register('room_number')} />
              {errors.room_number && <p className="text-sm text-red-500">{errors.room_number.message}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="floor">Floor</Label>
              <Input id="floor" type="number" placeholder="1" {...register('floor')} />
              {errors.floor && <p className="text-sm text-red-500">{errors.floor.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="lockbox_password">Lockbox Password (Optional)</Label>
            <Input id="lockbox_password" placeholder="e.g. 4321" {...register('lockbox_password')} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="wifi_name">Wi-Fi Name</Label>
              <Input id="wifi_name" placeholder="Network Name" {...register('wifi_name')} />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="wifi_password">Wi-Fi Password</Label>
              <Input id="wifi_password" placeholder="Password" {...register('wifi_password')} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="washing_machine_floor">Washing Machine Floor</Label>
              <Input id="washing_machine_floor" type="number" placeholder="5" {...register('washing_machine_floor')} />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="dryer_floor">Dryer Floor</Label>
              <Input id="dryer_floor" type="number" placeholder="5" {...register('dryer_floor')} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="room_note">Room Note</Label>
            <textarea
              id="room_note"
              className="flex min-h-24 w-full rounded-lg border-0 bg-black/5 px-4 py-3 text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 dark:bg-white/10"
              placeholder="p101 and p501 use the washing machine and dryer on the 5th floor."
              {...register('room_note')}
            />
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-500 dark:bg-red-900/30">
              {error}
            </div>
          )}

          <div className="flex gap-4 pt-4">
            <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Room'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
