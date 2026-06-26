"use client"

import { useState, useEffect } from "react"
// 1. Import useSearchParams to read URL parameters
import { useSearchParams } from "next/navigation" 
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
  default_to_reserve?: boolean
}

export function RegistrationForm({ onSuccess }: RegistrationFormProps) {
  // 2. Initialize search params to detect "?bypass=meridian_vip"
  const searchParams = useSearchParams()
  // Change this line at the top of your registration component
const isQROverride = searchParams.get("id") === "7492"

  const [name, setName] = useState("")
  const [code, setCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingSettings, setIsCheckingSettings] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(true)
  const [registrationMessage, setRegistrationMessage] = useState<string | null>(null)
  const [isReserveOnly, setIsReserveOnly] = useState(false)

  useEffect(() => {
    // Prevent access if this mobile device already registered
    const deviceRegistered = localStorage.getItem("device_registered")
    if (deviceRegistered === "true") {
      setIsRegistrationOpen(false)
      setRegistrationMessage("This device has already registered. Only 1 registration per mobile is allowed.")
      setIsCheckingSettings(false)
      return
    }

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
      
      if (settings.default_to_reserve) {
        setIsReserveOnly(true)
      }

      // 3. MODIFIED CHECK: Skip standard validation flags if QR code bypass is present
      if (isQROverride) {
        setIsRegistrationOpen(true)
        setRegistrationMessage(null)
        setIsCheckingSettings(false)
        return
      }

      // Standard gate checking logic below
      if (!settings.enabled) {
        setIsRegistrationOpen(false)
        setRegistrationMessage("Registration is currently closed.")
        setIsCheckingSettings(false)
        return
      }

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

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "")
    if (val.length <= 4) {
      setCode(val)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim()) {
      setError("Please enter your name")
      return
    }
    if (code.length !== 4) {
      setError("Please enter a 4-digit code")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const initialStatus = isReserveOnly ? "reserve" : "active"

      const { error: insertError } = await supabase
        .from("players")
        .insert({ 
          name: name.trim(),
          code: code,
          status: initialStatus 
        })

      if (insertError) {
        throw insertError
      }

      // Store flags locally on the device upon a successful submission
      localStorage.setItem("device_registered", "true")
      document.cookie = "device_registered=true; max-age=31536000; path=/; SameSite=Strict; Secure"

      setName("")
      setCode("")
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
      <div className="bg-muted rounded-lg p-4 text-center max-w-md mx-auto border border-amber-500/20 bg-amber-500/5">
        <p className="text-muted-foreground font-medium">{registrationMessage}</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-md">

      {isReserveOnly && (
        <div className="bg-orange-500/10 border border-orange-500/20 rounded-md p-2 text-center">
           <p className="text-[11px] font-semibold text-orange-600 uppercase tracking-wider">
              Adding to Reserve List
           </p>
        </div>
      )}
      
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium px-1">Full Name</label>
          <Input
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isLoading}
            className="h-12 text-base"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium px-1">4-Digit Code</label>
          <div className="flex gap-3">
            <Input
              type="text"
              inputMode="numeric"
              placeholder="e.g. 1234"
              value={code}
              onChange={handleCodeChange}
              disabled={isLoading}
              className="flex-1 h-12 text-base tracking-[0.5em] font-mono text-center"
              maxLength={4}
            />
            <Button 
              type="submit" 
              disabled={isLoading}
              className="h-12 px-8 font-semibold"
            >
              {isLoading ? <Spinner className="size-5" /> : "Register"}
            </Button>
          </div>
        </div>
      </div>

      {error && (
        <p className="text-destructive text-sm font-medium bg-destructive/10 p-2 rounded border border-destructive/20">
          {error}
        </p>
      )}
    </form>
  )
}