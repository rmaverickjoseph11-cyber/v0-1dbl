"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Spinner } from "@/components/ui/spinner"

interface Player {
  id: string
  name: string
  created_at: string
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
        <ul className="space-y-2">
          {players.map((player, index) => (
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
                })}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
