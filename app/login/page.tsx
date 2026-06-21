"use client"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { login } from "./actions"
import { LumaMark } from "@/components/brand/luma-mark"

const formSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

type FormData = z.infer<typeof formSchema>

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "", password: "" },
  })

  const onSubmit = async (data: FormData) => {
    setIsLoading(true)
    setError(null)
    const formData = new FormData()
    formData.append("email", data.email)
    formData.append("password", data.password)

    const result = await login(formData)

    if (result?.error) {
      setError(result.error)
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-dvh items-end justify-center bg-zinc-100 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-4 sm:items-center dark:bg-zinc-950">
      <Card className="w-full max-w-[520px]">
        <CardHeader className="space-y-2 p-4 pb-3">
          <LumaMark className="mb-3 size-12" />
          <CardTitle className="text-2xl font-bold tracking-tight">
            Welcome back
          </CardTitle>
          <CardDescription>Quên mật khẩu thì alo Đức </CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" {...register("password")} />
              {errors.password && (
                <p className="text-sm text-red-500">
                  {errors.password.message}
                </p>
              )}
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-500 dark:bg-red-900/30">
                {error}
              </div>
            )}

            <Button
              className="h-12 w-full rounded-lg text-base"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
