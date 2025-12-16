import Link from "next/link"
import { Button } from "@/components/components/ui/button"
import { Paintbrush, MessageSquare, Zap } from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Floating Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="text-xl font-bold gradient-text">DrawChat</div>
          <Link href="/login">
            <Button variant="ghost" className="text-foreground hover:bg-secondary">
              Login
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="flex-1 flex items-center justify-center px-6 py-32">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h1 className="text-5xl md:text-7xl font-bold text-balance leading-tight">
            Draw Together. <span className="gradient-text">Chat Together.</span>
          </h1>

          <p className="text-xl md:text-2xl text-[#A1A1A1] max-w-2xl mx-auto text-pretty">
            A collaborative whiteboard with real-time chat. Create, sketch, and communicate seamlessly.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Link href="/signup">
              <Button
                size="lg"
                className="gradient-button text-black font-semibold hover:opacity-90 transition-all hover:scale-105 px-8"
              >
                Get Started
              </Button>
            </Link>
            <Link href="/rooms">
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-border hover:border-primary hover:bg-secondary transition-all px-8 bg-transparent"
              >
                View Demo
              </Button>
            </Link>
          </div>

          {/* Preview Mockup */}
          <div className="pt-12 animate-fade-in">
            <div className="bg-card border border-border rounded-xl p-6 shadow-2xl max-w-3xl mx-auto">
              <div className="flex gap-4 h-64">
                <div className="flex-1 bg-secondary rounded-lg border border-border flex items-center justify-center">
                  <Paintbrush className="w-16 h-16 text-muted-foreground" />
                </div>
                <div className="w-64 bg-secondary rounded-lg border border-border flex items-center justify-center">
                  <MessageSquare className="w-12 h-12 text-muted-foreground" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-12">
            {/* Feature 1 */}
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full gradient-button flex items-center justify-center mx-auto">
                <Paintbrush className="w-8 h-8 text-black" />
              </div>
              <h3 className="text-xl font-semibold">Real-time Collaboration</h3>
              <p className="text-[#A1A1A1] text-pretty">
                Multiple users can draw simultaneously on the same canvas with instant synchronization.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full gradient-button flex items-center justify-center mx-auto">
                <MessageSquare className="w-8 h-8 text-black" />
              </div>
              <h3 className="text-xl font-semibold">Integrated Chat</h3>
              <p className="text-[#A1A1A1] text-pretty">
                Communicate with your team while drawing. No need to switch between apps.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full gradient-button flex items-center justify-center mx-auto">
                <Zap className="w-8 h-8 text-black" />
              </div>
              <h3 className="text-xl font-semibold">Instant Rooms</h3>
              <p className="text-[#A1A1A1] text-pretty">
                Create or join rooms instantly with a simple code. No setup required.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex gap-8 text-sm text-muted-foreground">
              <Link href="#" className="hover:text-foreground transition-colors">
                About
              </Link>
              <Link href="#" className="hover:text-foreground transition-colors">
                Privacy
              </Link>
              <Link href="#" className="hover:text-foreground transition-colors">
                Terms
              </Link>
            </div>
            <p className="text-sm text-muted-foreground">Built with ❤️ using Next.js & WebSockets</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
