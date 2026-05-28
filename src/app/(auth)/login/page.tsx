'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Image from 'next/image'
import { BarChart3, FolderKanban, Sparkles } from 'lucide-react'
import api from '@/lib/api'
import type { LoginResponse } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import logo from '@/assets/logo.png'

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
      <div className="relative hidden flex-1 overflow-hidden lg:flex">
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(221,83%,45%)] via-[hsl(226,80%,38%)] to-[hsl(235,60%,28%)]" />
        <div className="absolute inset-0 opacity-[0.18] [background:radial-gradient(circle_at_20%_10%,rgba(255,255,255,0.35),transparent_55%),radial-gradient(circle_at_90%_30%,rgba(255,255,255,0.25),transparent_50%),radial-gradient(circle_at_35%_85%,rgba(255,255,255,0.18),transparent_55%)]" />
        <div className="absolute inset-0 opacity-[0.12] [background-image:linear-gradient(to_right,rgba(255,255,255,0.25)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.25)_1px,transparent_1px)] [background-size:56px_56px]" />

        <div className="relative flex w-full flex-col justify-between px-14 py-12 text-white">
          <div className="flex items-center gap-3">
            <Image
              src={logo}
              alt="PulsePlay"
              className="h-12 w-auto max-w-[240px] object-contain"
              priority
            />
          </div>

          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/90 ring-1 ring-white/15">
              <Sparkles className="h-3.5 w-3.5" />
              PulsePlay Client Dashboard
            </div>

            <h2 className="mt-5 text-4xl font-semibold leading-tight tracking-tight">
              Survey panel management,
              <br />
              built for speed.
            </h2>
            <p className="mt-4 max-w-lg text-sm leading-relaxed text-white/80">
              Move from setup → profiling → field monitoring without jumping between tools.
              Everything you need for day-to-day delivery is in one place.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl bg-white/10 p-4 ring-1 ring-white/15 backdrop-blur-sm">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <FolderKanban className="h-4 w-4 text-white/90" />
                  Projects & target groups
                </div>
                <p className="mt-2 text-xs leading-relaxed text-white/75">
                  Clear structure and quick navigation for day-to-day ops.
                </p>
              </div>
              <div className="rounded-xl bg-white/10 p-4 ring-1 ring-white/15 backdrop-blur-sm">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <BarChart3 className="h-4 w-4 text-white/90" />
                  Pricing & rate cards
                </div>
                <p className="mt-2 text-xs leading-relaxed text-white/75">
                  Apply CPI straight from the matrix — just like Cint.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-white/60">
            <span>© PulsePlay · Client Dashboard</span>
            <span className="hidden sm:inline">Secure access · JWT</span>
          </div>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-[400px]">
          <div className="rounded-2xl border border-border bg-card p-7 shadow-card">
            <div className="mb-6 flex justify-center">
              <Image
                src={logo}
                alt="PulsePlay"
                className="h-12 w-auto max-w-[240px] object-contain"
                priority
              />
            </div>

            <h1 className="text-2xl font-semibold text-foreground">Sign in</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Enter your credentials to access the dashboard.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="mt-7 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="pp-label">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                className="h-11 border-border bg-secondary shadow-sm"
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
                className="h-11 border-border bg-secondary shadow-sm"
                {...register('password')}
              />
              {errors.password && (
                <p className="text-xs text-red-500">{errors.password.message}</p>
              )}
            </div>
            {error && (
              <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
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
    </div>
  )
}
