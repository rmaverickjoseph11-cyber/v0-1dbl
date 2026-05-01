"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { createClient } from "@/lib/supabase/client"

interface RegistrationFormProps {
  onSuccess: () => void
}

interface RegistrationSettings {
  enabled: boolean
  start_date: string | null
  end_date: string | null
}

export function RegistrationForm({ onSuccess }: RegistrationFormProps) {
  const [name, setName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingSettings, setIsCheckingSettings] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(true)
  const [registrationMessage, setRegistrationMessage] = useState<string | null>(null)

  useEffect(() => {
    checkRegistrationWindow()
  }, [])

  const checkRegistrationWindow = async () => {
    setIsCheckingSettings(true)
    const supabase = createClient()
    
    const { data } = await supabase
      .from("settings")
      .select("*")
      .eq("key", "registration_window")
      .single()

    if (data) {
      const settings = data.value as RegistrationSettings
      const now = new Date()
      
      // Check if registration is enabled
      if (!settings.enabled) {
        setIsRegistrationOpen(false)
        setRegistrationMessage("Registration is currently closed.")
        setIsCheckingSettings(false)
        return
      }

      // Check start date
      if (settings.start_date) {
        const startDate = new Date(settings.start_date)
        if (now < startDate) {
          setIsRegistrationOpen(false)
          setRegistrationMessage(
            `Registration opens on ${startDate.toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}`
          )
          setIsCheckingSettings(false)
          return
        }
      }

      // Check end date
      if (settings.end_date) {
        const endDate = new Date(settings.end_date)
        if (now > endDate) {
          setIsRegistrationOpen(false)
          setRegistrationMessage("Registration has ended.")
          setIsCheckingSettings(false)
          return
        }
      }

      setIsRegistrationOpen(true)
      setRegistrationMessage(null)
    }

    setIsCheckingSettings(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim()) {
      setError("Please enter your name")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { error: insertError } = await supabase
        .from("players")
        .insert({ name: name.trim() })

      if (insertError) {
        throw insertError
      }

      setName("")
      onSuccess()
    } catch (err) {
      setError("Failed to register. Please try again.")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  if (isCheckingSettings) {
    return (
      <div className="flex items-center justify-center py-4">
        <Spinner className="size-6" />
      </div>
    )
  }

  if (!isRegistrationOpen) {
    return (
      <div className="bg-muted rounded-lg p-4 text-center">
        <p className="text-muted-foreground">{registrationMessage}</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-md">
      <div className="flex gap-3">
        <Input
          type="text"
          placeholder="Enter your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isLoading}
          className="flex-1 h-12 text-base"
        />
        <Button 
          type="submit" 
          disabled={isLoading}
          className="h-12 px-6 font-semibold"
        >
          {isLoading ? <Spinner className="size-5" /> : "Register"}
        </Button>
      </div>
      {error && (
        <p className="text-destructive text-sm">{error}</p>
      )}
    </form>
  )
}
