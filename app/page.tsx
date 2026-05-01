"use client"

import { useState, useEffect } from "react"
import { RegistrationForm } from "@/components/registration-form"
import { PlayerList } from "@/components/player-list"
import { AdminLoginModal } from "@/components/admin-login-modal"
import { createClient } from "@/lib/supabase/client"

export default function Home() {
  const [refreshKey, setRefreshKey] = useState(0)
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false)
  const [gameDate, setGameDate] = useState<string | null>(null)

  useEffect(() => {
    const fetchGameDate = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from("settings")
        .select("value")
        .eq("key", "game_date")
        .single()
      
      if (data?.value?.date) {
        setGameDate(data.value.date)
      }
    }
    fetchGameDate()
  }, [])

  const handleRegistrationSuccess = () => {
    setRefreshKey((prev) => prev + 1)
  }

  return (
    <main className="min-h-screen flex flex-col px-4 py-8 md:py-12 relative">
      {/* Admin Icon - Top Right */}
      <button
        onClick={() => setIsAdminModalOpen(true)}
        className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted"
        aria-label="Admin Login"
      >
        <svg
          className="w-5 h-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      </button>

      {/* Header */}
      <header className="text-center mb-8">
        <img
          src="/1dbl-logo.jpg"
          alt="1DBL - 1 Day Basketball League"
          className="h-20 md:h-24 w-auto mx-auto mb-3"
        />
        <h1 className="text-3xl md:text-4xl font-bold text-foreground text-balance">
          1 Day Basketball League
        </h1>
        {gameDate && (
          <p className="text-lg md:text-xl text-primary font-semibold mt-2">
            {new Date(gameDate).toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          </p>
        )}
      </header>

      {/* Two Column Layout */}
      <div className="flex flex-col md:flex-row gap-8 w-full max-w-4xl mx-auto flex-1">
        {/* Left Side - Player List */}
        <section className="flex-1 md:border-r md:border-border md:pr-8">
          <PlayerList refreshKey={refreshKey} />
        </section>

        {/* Right Side - Registration Form */}
        <section className="flex-1 md:pl-8">
          <h2 className="text-xl font-semibold text-foreground mb-4">
            Player Registration
          </h2>
          <p className="text-muted-foreground mb-6">
            Enter your name below to join the competition.
          </p>
          <RegistrationForm onSuccess={handleRegistrationSuccess} />
        </section>
      </div>

      {/* Admin Login Modal */}
      <AdminLoginModal 
        isOpen={isAdminModalOpen} 
        onClose={() => setIsAdminModalOpen(false)} 
      />
    </main>
  )
}
