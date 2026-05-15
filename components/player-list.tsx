"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Spinner } from "@/components/ui/spinner"
import { Trash2 } from "lucide-react"

interface Player {
  id: string
  name: string
  created_at: string
  status?: "active" | "reserve"
  payment_status?: "paid" | "pending"
  code: string 
}

interface RegistrationSettings {
  show_registration_date: boolean
}

interface PlayerListProps {
  refreshKey: number
  onRefreshRequest?: () => void 
}

export function PlayerList({ refreshKey, onRefreshRequest }: PlayerListProps) {
  const [players, setPlayers] = useState<Player[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showDate, setShowDate] = useState(true)

  const fetchData = async () => {
    setIsLoading(true)
    const supabase = createClient()
    
    // 1. Fetch Players
    const { data: playerData, error: playerError } = await supabase
      .from("players")
      .select("*")
      .order("created_at", { ascending: true })

    if (playerError) {
      console.error("Error fetching players:", playerError)
    } else {
      // FIXED: Changed 'data' to 'playerData'
      setPlayers(playerData || [])
    }

    // 2. Fetch Settings
    try {
      const { data: settingsData } = await supabase
        .from("settings")
        .select("value")
        .eq("key", "registration_window")
        .single()

      if (settingsData?.value) {
        const config = settingsData.value as RegistrationSettings
        setShowDate(config.show_registration_date !== false)
      }
    } catch (err) {
      console.error("Settings fetch error:", err)
    }

    setIsLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [refreshKey])

  const handleDelete = async (player: Player) => {
    const inputCode = window.prompt(`Enter 4-digit code to remove "${player.name}":`)
    if (inputCode === null) return 

    if (inputCode !== player.code) {
      alert("Incorrect code. Action unauthorized.")
      return
    }

    if (!window.confirm("Are you sure you want to delete your registration?")) return

    const supabase = createClient()
    const { error } = await supabase
      .from("players")
      .delete()
      .eq("id", player.id)

    if (error) {
      alert("Failed to delete. Please try again.")
    } else {
      fetchData()
      if (onRefreshRequest) onRefreshRequest()
    }
  }

  const activePlayers = players.filter((p) => p.status !== "reserve")
  const reservePlayers = players.filter((p) => p.status === "reserve")

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })
  }

  return (
    <div className="w-full">
      <h2 className="text-xl font-semibold text-foreground mb-4">
        Registered Players {players.length > 0 && `(${players.length})`}
      </h2>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Spinner className="size-6 text-primary" />
        </div>
      ) : players.length === 0 ? (
        <p className="text-muted-foreground py-4">
          No players registered yet. Be the first to sign up!
        </p>
      ) : (
        <div className="space-y-8">
          <ul className="space-y-2">
            {activePlayers.map((player, index) => (
              <li 
                key={player.id} 
                className="flex items-center justify-between py-2 border-b border-border last:border-b-0 group"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium text-primary">{index + 1}.</span>
                  <span className="text-foreground">{player.name}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full uppercase tracking-tighter font-bold border ${
                    player.payment_status === 'paid' 
                      ? 'bg-green-100 text-green-700 border-green-200' 
                      : 'bg-yellow-50 text-yellow-600 border-yellow-100'
                  }`}>
                    {player.payment_status || 'pending'}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  {showDate && (
                    <span className="text-[10px] md:text-sm text-muted-foreground">
                      {formatDate(player.created_at)}
                    </span>
                  )}
                  <button
                    onClick={() => handleDelete(player)}
                    className="text-muted-foreground hover:text-destructive transition-colors p-1"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>

          {reservePlayers.length > 0 && (
            <div className="pt-4 border-t-2 border-dashed border-border">
              <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                Reserve List ({reservePlayers.length})
              </h3>
              <ul className="space-y-2">
                {reservePlayers.map((player, index) => (
                  <li 
                    key={player.id} 
                    className="flex items-center justify-between py-2 border-b border-border last:border-b-0 group opacity-80"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-muted-foreground">R{index + 1}.</span>
                      <span className="text-foreground italic">{player.name}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full uppercase tracking-tighter font-bold border ${
                        player.payment_status === 'paid' 
                          ? 'bg-green-100 text-green-700 border-green-200' 
                          : 'bg-yellow-50 text-yellow-600 border-yellow-100'
                      }`}>
                        {player.payment_status || 'pending'}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      {showDate && (
                        <span className="text-[10px] md:text-sm text-muted-foreground">
                          {formatDate(player.created_at)}
                        </span>
                      )}
                      <button
                        onClick={() => handleDelete(player)}
                        className="text-muted-foreground hover:text-destructive transition-colors p-1"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}