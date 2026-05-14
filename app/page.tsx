"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { RegistrationForm } from "@/components/registration-form"
import { PlayerList } from "@/components/player-list"
import { AdminLoginModal } from "@/components/admin-login-modal"
import { createClient } from "@/lib/supabase/client"

export default function Home() {
  const [refreshKey, setRefreshKey] = useState(0)
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false)
  const [gameDate, setGameDate] = useState<string | null>(null)
  
  // NEW: State for Game Rules
  const [rules, setRules] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      
      // Fetch Game Date
      const { data: dateData } = await supabase
        .from("settings")
        .select("value")
        .eq("key", "game_date")
        .single()
      
      if (dateData?.value?.date) {
        setGameDate(dateData.value.date)
      }

      // NEW: Fetch Game Rules
      const { data: rulesData } = await supabase
        .from("settings")
        .select("value")
        .eq("key", "game_rules")
        .single()

      if (rulesData?.value?.text) {
        setRules(rulesData.value.text)
      }
    }
    fetchData()
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
        <div className="relative h-20 md:h-24 w-40 mx-auto mb-3">
          <Image
            src="/1dbl-logo.jpg"
            alt="1DBL - 1 Day Basketball League"
            fill
            style={{ objectFit: 'contain' }}
            priority
          />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-foreground text-balance">
          1 Day Basketball League
        </h1>
        <div className="min-h-[28px]">
          {gameDate && (
            <p className="text-lg md:text-xl text-primary font-semibold mt-2">
              {new Date(gameDate + "T00:00:00").toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          )}
        </div>
      </header>

      {/* Two Column Layout */}
      <div className="flex flex-col md:flex-row gap-8 w-full max-w-4xl mx-auto flex-1">
        {/* Left Side - Player List */}
        <section className="flex-1 md:border-r md:border-border md:pr-8">
          <PlayerList refreshKey={refreshKey} />
        </section>

        {/* Right Side - Registration Form & Rules */}
        <section className="flex-1 md:pl-8">
          <h2 className="text-xl font-semibold text-foreground mb-4">
            Player Registration
          </h2>
          <p className="text-muted-foreground mb-2">
            Enter your name below to join the competition.
          </p>
          <p className="text-sm text-amber-600 dark:text-amber-500 font-medium mb-6 italic">
            Note: Code will be used if you want to delete your name.
          </p>
          
          <RegistrationForm onSuccess={handleRegistrationSuccess} />

          {/* NEW: Display Game Rules Section */}
          {rules && (
            <div className="mt-8 p-4 bg-muted/50 rounded-lg border border-border">
              <h3 className="text-sm font-bold uppercase tracking-wider text-foreground mb-2">
                Game Rules & Info
              </h3>
              <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                {rules}
              </div>
            </div>
          )}
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
