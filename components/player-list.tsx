"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Spinner } from "@/components/ui/spinner"

interface Player {
  id: string
  name: string
  created_at: string
  status?: "active" | "reserve" // Added status field
}

interface PlayerListProps {
  refreshKey: number
}

export function PlayerList({ refreshKey }: PlayerListProps) {
  const [players, setPlayers] = useState<Player[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
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

    fetchPlayers()
  }, [refreshKey])

  // Separate players into two lists
  const activePlayers = players.filter((p) => p.status !== "reserve")
  const reservePlayers = players.filter((p) => p.status === "reserve")

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
                className="flex items-center justify-between py-2 border-b border-border last:border-b-0"
              >
                <span className="text-foreground">
                  <span className="font-medium text-primary mr-2">{index + 1}.</span>
                  {player.name}
                </span>
                <span className="text-sm text-muted-foreground">
                  {new Date(player.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
              </li>
            ))}
          </ul>

          {/* Reserve List Section - Only shows if reserves exist */}
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
                    className="flex items-center justify-between py-2 border-b border-border last:border-b-0 opacity-70"
                  >
                    <span className="text-foreground italic">
                      <span className="font-medium text-muted-foreground mr-2">R{index + 1}.</span>
                      {player.name}
                    </span>
                    <span className="text-[10px] bg-muted px-2 py-0.5 rounded text-muted-foreground uppercase font-semibold">
                      Waiting
                    </span>
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