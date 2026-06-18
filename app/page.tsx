import Link from 'next/link'
import { ArrowRight, Building2, Key, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-zinc-950 text-zinc-50">
      {/* Background Effects */}
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-zinc-950 to-zinc-950"></div>
      <div className="fixed top-[-20%] left-[-10%] h-[500px] w-[500px] rounded-full bg-zinc-800/30 blur-[120px]"></div>
      
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-6 sm:px-12">
        <div className="flex items-center gap-2">
          <Building2 className="h-6 w-6 text-zinc-100" />
          <span className="text-xl font-bold tracking-tight">OmniHost</span>
        </div>
        <nav className="flex items-center gap-6">
          <Link href="/login" className="text-sm font-medium text-zinc-400 transition-colors hover:text-zinc-100">
            Sign In
          </Link>
          <Link href="/dashboard">
            <Button variant="secondary" size="sm" className="rounded-full bg-zinc-800 text-zinc-100 hover:bg-zinc-700">
              Dashboard
            </Button>
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="flex flex-1 flex-col items-center justify-center px-4 text-center pb-24">
        <div className="max-w-4xl space-y-10">
          <div className="animate-fade-in inline-flex items-center rounded-full border border-zinc-800 bg-zinc-900/50 px-4 py-1.5 text-sm text-zinc-300 backdrop-blur-xl transition-all hover:bg-zinc-800/50">
            <span className="relative flex h-2.5 w-2.5 mr-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
            </span>
            System Online & Ready
          </div>
          
          <h1 className="text-5xl font-extrabold tracking-tighter sm:text-7xl md:text-8xl">
            Elevate Your <br />
            <span className="bg-gradient-to-r from-zinc-200 to-zinc-500 bg-clip-text text-transparent">Hosting</span> Experience
          </h1>
          
          <p className="mx-auto max-w-2xl text-lg text-zinc-400 sm:text-xl md:text-2xl font-light leading-relaxed">
            Manage your properties, automate dynamic check-in instructions, and provide a seamless, professional experience for your guests.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4 pt-6">
            <Link href="/dashboard">
              <Button size="lg" className="h-14 rounded-full bg-white px-8 text-base font-semibold text-zinc-950 transition-all hover:scale-105 hover:bg-zinc-200">
                Go to Dashboard <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/dashboard/generator">
              <Button size="lg" variant="outline" className="h-14 rounded-full border-zinc-800 bg-transparent px-8 text-base font-semibold text-zinc-300 transition-all hover:scale-105 hover:bg-zinc-900 hover:text-white">
                <MessageSquare className="mr-2 h-5 w-5" /> Try Generator
              </Button>
            </Link>
          </div>
        </div>
      </main>

      {/* Feature Footers */}
      <footer className="border-t border-zinc-900 bg-zinc-950/50 px-6 py-8 backdrop-blur-sm sm:px-12">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-6 sm:flex-row text-center sm:text-left">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900">
              <Building2 className="h-5 w-5 text-zinc-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-200">Property Management</p>
              <p className="text-xs text-zinc-500">Organize buildings & rooms.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900">
              <Key className="h-5 w-5 text-zinc-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-200">Smart Access</p>
              <p className="text-xs text-zinc-500">Manage passcodes securely.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900">
              <MessageSquare className="h-5 w-5 text-zinc-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-200">Dynamic Templates</p>
              <p className="text-xs text-zinc-500">Auto-generate instructions.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
