"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Spinner } from "@/components/ui/spinner"
import { Trash2 } from "lucide-react" // Ensure lucide-react is installed

interface Player {
  id: string
  name: string
  created_at: string
  status?: "active" | "reserve"
  code: string // Added to interface for verification
}

interface PlayerListProps {
  refreshKey: number
  onRefreshRequest?: () => void // Added to trigger parent state update if needed
}

export function PlayerList({ refreshKey, onRefreshRequest }: PlayerListProps) {
  const [players, setPlayers] = useState<Player[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchPlayers = async () => {
    setIsLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from("players")
      .select("*")
      .order("created_at", { ascending: true })

    if (error) {
      console.error("Error fetching players:", error)
    } else {
      setPlayers(data || [])
    }
    setIsLoading(false)
  }

  useEffect(() => {
    fetchPlayers()
  }, [refreshKey])

  const handleDelete = async (player: Player) => {
    const inputCode = window.prompt(`Enter 4-digit code to remove "${player.name}":`)
    
    if (inputCode === null) return // User cancelled

    if (inputCode !== player.code) {
      alert("Incorrect code. Action unauthorized.")
      return
    }

    const confirmDelete = window.confirm("Are you sure you want to delete your registration?")
    if (!confirmDelete) return

    const supabase = createClient()
    const { error } = await supabase
      .from("players")
      .delete()
      .eq("id", player.id)

    if (error) {
      alert("Failed to delete. Please try again.")
    } else {
      // Refresh the list immediately after successful deletion
      fetchPlayers()
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
          {/* Main Roster Section */}
          <ul className="space-y-2">
            {activePlayers.map((player, index) => (
              <li 
                key={player.id} 
                className="flex items-center justify-between py-2 border-b border-border last:border-b-0 group"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium text-primary">{index + 1}.</span>
                  <span className="text-foreground">{player.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-[10px] md:text-sm text-muted-foreground">
                    {formatDate(player.created_at)}
                  </span>
                  <button
                    onClick={() => handleDelete(player)}
                    className="text-muted-foreground hover:text-destructive transition-colors p-1"
                    title="Delete registration"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>

          {/* Reserve List Section */}
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
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-[10px] md:text-sm text-muted-foreground">
                        {formatDate(player.created_at)}
                      </span>
                      <button
                        onClick={() => handleDelete(player)}
                        className="text-muted-foreground hover:text-destructive transition-colors p-1"
                        title="Delete registration"
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
