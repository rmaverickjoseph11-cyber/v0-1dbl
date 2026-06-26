"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { RegistrationForm } from "@/components/registration-form"
import { PlayerList } from "@/components/player-list"
import { AdminLoginModal } from "@/components/admin-login-modal"
import { createClient } from "@/lib/supabase/client"

// Interface to match our Admin settings
interface BrandingSettings {
  title: string
  image_url: string | null
}
const getAutomaticGameDate = (): string => {
  const now = new Date()
  const dayOfWeek = now.getDay() // 0 = Sun, 1 = Mon, 2 = Tue, 3 = Wed, 4 = Thu, 5 = Fri, 6 = Sat
  const gameDays = [2, 4, 6] // Tuesday, Thursday, Saturday

  // If today is Tuesday, Thursday, or Saturday, use today's date
  if (gameDays.includes(dayOfWeek)) {
    return now.toISOString().split("T")[0]
  }

  // Find how many days to look forward to hit the next game day
  let daysUntilNextGame = 1
  while (!gameDays.includes((dayOfWeek + daysUntilNextGame) % 7)) {
    daysUntilNextGame++
  }

  const nextGameDate = new Date(now)
  nextGameDate.setDate(now.getDate() + daysUntilNextGame)
  return nextGameDate.toISOString().split("T")[0]
}

export default function Home() {
  const [refreshKey, setRefreshKey] = useState(0)
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false)
  const [gameDate, setGameDate] = useState<string | null>(null)
  const [rules, setRules] = useState<string | null>(null)
  
  // NEW: State to prevent the "flash" of old content
  const [isLoading, setIsLoading] = useState(true)
  
  // NEW: Branding State
  const [branding, setBranding] = useState<BrandingSettings>({
    title: "1 Day Basketball League",
    image_url: null,
  })

  useEffect(() => {
  const fetchData = async () => {
    const supabase = createClient()
    
    try {
      // 1. REPLACED: Fetch Game Date with Automated Checker
      const { data: dateData } = await supabase
        .from("settings")
        .select("value")
        .eq("key", "game_date")
        .single()
      
      const todayStr = new Date().toISOString().split("T")[0]
      let currentDbDate = dateData?.value?.date

      // If the database date is blank OR it is a date in the past, auto-generate and auto-save it!
      if (!currentDbDate || currentDbDate < todayStr) {
        const automatedTrailingDate = getAutomaticGameDate()
        
        // Silently save it directly to the database behind the scenes
        await supabase
          .from("settings")
          .upsert({ 
            key: "game_date",
            value: { date: automatedTrailingDate },
            updated_at: new Date().toISOString()
          }, { onConflict: 'key' })

        setGameDate(automatedTrailingDate)
      } else {
        // If it's already an upcoming/valid game day, just display it
        setGameDate(currentDbDate)
      }

      // 2. UNCHANGED: Fetch Game Rules
      const { data: rulesData } = await supabase
        .from("settings")
        .select("value")
        .eq("key", "game_rules")
        .single()

      if (rulesData?.value?.text) {
        setRules(rulesData.value.text)
      }

      // 3. UNCHANGED: Fetch Branding Configuration (Title & Banner)
      const { data: brandingData } = await supabase
        .from("settings")
        .select("value")
        .eq("key", "branding_config")
        .single()
      
      if (brandingData?.value) {
        setBranding(brandingData.value as BrandingSettings)
      }
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      // Data fetching is done, stop showing the loading screen
      setIsLoading(false)
    }
  }
  fetchData()
}, [])

  

  const handleRegistrationSuccess = () => {
    setRefreshKey((prev) => prev + 1)
  }

  // Recommended: Show a simple loading state so the user doesn't see the "swap"
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-48 bg-muted rounded mb-4"></div>
          <div className="h-4 w-32 bg-muted rounded"></div>
        </div>
      </div>
    )
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
      <header className="text-center mb-12">
        <div className="relative h-40 md:h-56 w-full max-w-2xl mx-auto mb-6">
          <Image
            // Use the uploaded image if available, otherwise fallback to your local logo
            src={branding.image_url || "/1dbl-logo.jpg"}
            alt={branding.title}
            fill
            style={{ objectFit: 'contain' }}
            priority
          />
        </div>
        
        {/* Dynamic Title from Admin */}
        <h1 className="text-3xl md:text-5xl font-bold text-foreground text-balance">
          {branding.title}
        </h1>

        <div className="min-h-[28px]">
          {gameDate && (
            <p className="text-xl md:text-2xl text-primary font-semibold mt-3">
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
            Enter your name below to join.
          </p>
          <p className="text-sm text-amber-600 dark:text-amber-500 font-medium mb-6 italic">
            Note: Code will be used if you want to delete your name.
          </p>
          
          <RegistrationForm onSuccess={handleRegistrationSuccess} />

          {/* Display Game Rules Section */}
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