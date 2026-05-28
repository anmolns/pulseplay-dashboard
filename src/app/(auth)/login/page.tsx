'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Layers } from 'lucide-react'
import api from '@/lib/api'
import type { LoginResponse } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'jonn@inqvita.se',
      password: 'demo1234',
    },
  })

  const onSubmit = async (values: LoginForm) => {
    setError(null)
    setLoading(true)
    try {
      const { data } = await api.post<LoginResponse>('/auth/login', values)
      localStorage.setItem('pp_token', data.access_token)
      router.push('/projects')
    } catch {
      setError('Invalid email or password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      <div className="hidden flex-1 flex-col justify-between bg-gradient-to-br from-[hsl(276,65%,42%)] via-[hsl(285,55%,38%)] to-[hsl(260,50%,28%)] p-12 text-white lg:flex">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15 backdrop-blur">
            <Layers className="h-5 w-5" />
          </div>
          <span className="text-xl font-semibold">PulsePlay</span>
        </div>
        <div>
          <h2 className="text-3xl font-semibold leading-tight">
            Survey panel management,
            <br />
            built for speed.
          </h2>
          <p className="mt-4 max-w-md text-sm text-white/75">
            Manage projects, target groups, profiling, and field performance —
            all in one client dashboard.
          </p>
        </div>
        <p className="text-xs text-white/50">© PulsePlay · Client Dashboard</p>
      </div>

      <div className="flex flex-1 items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-[400px]">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary">
              <Layers className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-semibold text-[hsl(276,45%,28%)]">
              PulsePlay
            </span>
          </div>

          <h1 className="text-2xl font-semibold text-[hsl(276,45%,28%)]">
            Sign in
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter your credentials to access the dashboard.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="pp-label">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                className="h-11 border-border bg-white shadow-sm"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="pp-label">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                className="h-11 border-border bg-white shadow-sm"
                {...register('password')}
              />
              {errors.password && (
                <p className="text-xs text-red-500">{errors.password.message}</p>
              )}
            </div>
            {error && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}
            <Button
              type="submit"
              className="h-11 w-full bg-primary shadow-sm hover:bg-primary/90"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
