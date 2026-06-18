"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { createBuilding, updateBuilding } from "./actions"
import { Tables } from "@/types/supabase"

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  sign_name: z.string().optional().or(z.literal("")),
  address: z.string().min(1, "Address is required"),
  map_link: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  gate_password: z.string().optional().or(z.literal("")),
  lobby_wifi_name: z.string().optional().or(z.literal("")),
  lobby_wifi_password: z.string().optional().or(z.literal("")),
  drinking_water_note: z.string().optional().or(z.literal("")),
  motorbike_parking_note: z.string().optional().or(z.literal("")),
})

type FormData = z.infer<typeof formSchema>

export default function BuildingForm({ building }: { building?: Tables<"buildings"> }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const isEditing = !!building

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: building?.name || "",
      sign_name: building?.sign_name || "",
      address: building?.address || "",
      map_link: building?.map_link || "",
      gate_password: building?.gate_password || "",
      lobby_wifi_name: building?.lobby_wifi_name || "",
      lobby_wifi_password: building?.lobby_wifi_password || "",
      drinking_water_note: building?.drinking_water_note || "",
      motorbike_parking_note: building?.motorbike_parking_note || "",
    },
  })

  const onSubmit = async (data: FormData) => {
    setIsLoading(true)
    setError(null)

    const formData = new FormData()
    formData.append("name", data.name)
    formData.append("sign_name", data.sign_name || "")
    formData.append("address", data.address)
    formData.append("map_link", data.map_link || "")
    formData.append("gate_password", data.gate_password || "")
    formData.append("lobby_wifi_name", data.lobby_wifi_name || "")
    formData.append("lobby_wifi_password", data.lobby_wifi_password || "")
    formData.append("drinking_water_note", data.drinking_water_note || "")
    formData.append("motorbike_parking_note", data.motorbike_parking_note || "")
    // custom_templates preservation is handled in the action OR here
    if (isEditing && building.custom_templates) {
      formData.append(
        "custom_templates",
        typeof building.custom_templates === "string"
          ? building.custom_templates
          : JSON.stringify(building.custom_templates)
      )
    }

    let result
    if (building) {
      result = await updateBuilding(building.id, formData)
    } else {
      result = await createBuilding(formData)
    }

    if (result?.error) {
      setError(result.error)
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4 pb-3">
      <div className="rounded-lg bg-zinc-950 p-4 text-white dark:bg-white dark:text-zinc-950">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
          {isEditing ? "Edit data" : "New data"}
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          {isEditing ? "Edit Building" : "Add Building"}
        </h1>
      </div>

      <Card>
        <CardHeader className="p-4 pb-3">
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col space-y-4"
          >
            <div className="space-y-2">
              <Label>Building Name</Label>
              <Input placeholder="Sunset Apartments" {...register("name")} />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Sign Name (Optional)</Label>
              <Input placeholder="NM House Da Nang" {...register("sign_name")} />
            </div>

            <div className="space-y-2">
              <Label>Address</Label>
              <Input placeholder="123 Main St" {...register("address")} />
              {errors.address && (
                <p className="text-sm text-red-500">{errors.address.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Map Link (Optional)</Label>
              <Input placeholder="https://maps.google.com/..." {...register("map_link")} />
              {errors.map_link && (
                <p className="text-sm text-red-500">{errors.map_link.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Gate Password (Optional)</Label>
              <Input placeholder="1234*" {...register("gate_password")} />
            </div>

            <div className="grid gap-4">
              <div className="space-y-2">
                <Label>Lobby Wi-Fi Name (Optional)</Label>
                <Input placeholder="29 AT39" {...register("lobby_wifi_name")} />
              </div>
              <div className="space-y-2">
                <Label>Lobby Wi-Fi Password (Optional)</Label>
                <Input placeholder="TP888888" {...register("lobby_wifi_password")} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Drinking Water Note (Optional)</Label>
              <textarea
                className="flex min-h-24 w-full rounded-lg border-0 bg-black/5 px-4 py-3 text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 dark:bg-white/10"
                placeholder="And this faucet is water you can drink, it has been filtered by machine."
                {...register("drinking_water_note")}
              />
            </div>

            <div className="space-y-2">
              <Label>Motorbike Parking Note (Optional)</Label>
              <textarea
                className="flex min-h-24 w-full rounded-lg border-0 bg-black/5 px-4 py-3 text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 dark:bg-white/10"
                placeholder="If you have a motorbike, please park it on the first floor at night. Please keep your helmet safe."
                {...register("motorbike_parking_note")}
              />
            </div>

            {error && (
              <div className="rounded-2xl bg-red-500/10 p-3 text-sm text-red-500">
                {error}
              </div>
            )}

            <div className="mt-auto flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1 rounded-lg"
                onClick={() => router.back()}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 rounded-lg"
                disabled={isLoading}
              >
                {isLoading
                  ? "Saving..."
                  : isEditing
                    ? "Save Changes"
                    : "Create"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
