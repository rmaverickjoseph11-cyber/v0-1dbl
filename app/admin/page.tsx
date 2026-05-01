"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { createClient } from "@/lib/supabase/client"

interface Player {
  id: string
  name: string
  created_at: string
}

interface RegistrationSettings {
  enabled: boolean
  start_date: string | null
  end_date: string | null
}

interface GameDateSettings {
  date: string | null
}

export default function AdminPage() {
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [players, setPlayers] = useState<Player[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [settings, setSettings] = useState<RegistrationSettings>({
    enabled: true,
    start_date: null,
    end_date: null,
  })
  const [isSavingSettings, setIsSavingSettings] = useState(false)
  const [gameDate, setGameDate] = useState<GameDateSettings>({
    date: null,
  })
  const [isSavingGameDate, setIsSavingGameDate] = useState(false)

  useEffect(() => {
    // Check if admin is logged in
    const isAdmin = sessionStorage.getItem("isAdmin")
    if (isAdmin !== "true") {
      router.push("/")
      return
    }
    setIsAuthorized(true)
    fetchData()
  }, [router])

  const fetchData = async () => {
    setIsLoading(true)
    const supabase = createClient()
    
    // Fetch players
    const { data: playersData } = await supabase
      .from("players")
      .select("*")
      .order("created_at", { ascending: true })
    
    if (playersData) {
      setPlayers(playersData)
    }

    // Fetch settings
    const { data: settingsData } = await supabase
      .from("settings")
      .select("*")
      .eq("key", "registration_window")
      .single()
    
    if (settingsData) {
      setSettings(settingsData.value as RegistrationSettings)
    }

    // Fetch game date
    const { data: gameDateData } = await supabase
      .from("settings")
      .select("*")
      .eq("key", "game_date")
      .single()
    
    if (gameDateData) {
      setGameDate(gameDateData.value as GameDateSettings)
    }

    setIsLoading(false)
  }

  const handleEditPlayer = (player: Player) => {
    setEditingId(player.id)
    setEditName(player.name)
  }

  const handleSavePlayer = async (id: string) => {
    if (!editName.trim()) return

    setIsSaving(true)
    const supabase = createClient()
    
    const { error } = await supabase
      .from("players")
      .update({ name: editName.trim() })
      .eq("id", id)

    if (!error) {
      setPlayers(players.map(p => p.id === id ? { ...p, name: editName.trim() } : p))
      setEditingId(null)
      setEditName("")
    }
    setIsSaving(false)
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditName("")
  }

  const handleDeletePlayer = async (id: string) => {
    if (!confirm("Are you sure you want to delete this player?")) return

    const supabase = createClient()
    const { error } = await supabase.from("players").delete().eq("id", id)

    if (!error) {
      setPlayers(players.filter(p => p.id !== id))
    }
  }

  const handleSaveSettings = async () => {
    setIsSavingSettings(true)
    const supabase = createClient()
    
    const { error } = await supabase
      .from("settings")
      .update({ 
        value: settings,
        updated_at: new Date().toISOString()
      })
      .eq("key", "registration_window")

    if (error) {
      console.error("Failed to save settings:", error)
    }
    setIsSavingSettings(false)
  }

  const handleSaveGameDate = async () => {
    setIsSavingGameDate(true)
    const supabase = createClient()
    
    // Try to update first, if it doesn't exist, insert
    const { data: existing } = await supabase
      .from("settings")
      .select("*")
      .eq("key", "game_date")
      .single()

    if (existing) {
      const { error } = await supabase
        .from("settings")
        .update({ 
          value: gameDate,
          updated_at: new Date().toISOString()
        })
        .eq("key", "game_date")

      if (error) {
        console.error("Failed to save game date:", error)
      }
    } else {
      const { error } = await supabase
        .from("settings")
        .insert({ 
          key: "game_date",
          value: gameDate,
          updated_at: new Date().toISOString()
        })

      if (error) {
        console.error("Failed to save game date:", error)
      }
    }
    setIsSavingGameDate(false)
  }

  const handleLogout = () => {
    sessionStorage.removeItem("isAdmin")
    router.push("/")
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner className="size-8" />
      </div>
    )
  }

  return (
    <main className="min-h-screen px-4 py-8 md:py-12">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-1">Manage players and registration settings</p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner className="size-8" />
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {/* Game Date Settings */}
            <section className="bg-card rounded-lg border border-border p-6">
              <h2 className="text-xl font-semibold text-card-foreground mb-4">
                Game Date
              </h2>
              
              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-medium text-card-foreground mb-1.5">
                    Select Game Date
                  </label>
                  <Input
                    type="date"
                    value={gameDate.date || ""}
                    onChange={(e) => setGameDate({ date: e.target.value || null })}
                    className="w-full max-w-xs"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    This date will be displayed on the registration page
                  </p>
                </div>

                <Button 
                  onClick={handleSaveGameDate} 
                  disabled={isSavingGameDate}
                  className="w-fit"
                >
                  {isSavingGameDate ? <Spinner className="size-5" /> : "Save Game Date"}
                </Button>
              </div>
            </section>

            {/* Registration Settings */}
            <section className="bg-card rounded-lg border border-border p-6">
              <h2 className="text-xl font-semibold text-card-foreground mb-4">
                Registration Settings
              </h2>
              
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.enabled}
                      onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                  <span className="text-card-foreground font-medium">
                    Registration {settings.enabled ? "Enabled" : "Disabled"}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-card-foreground mb-1.5">
                      Start Date & Time
                    </label>
                    <Input
                      type="datetime-local"
                      value={settings.start_date || ""}
                      onChange={(e) => setSettings({ ...settings, start_date: e.target.value || null })}
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Leave empty for no start restriction
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-card-foreground mb-1.5">
                      End Date & Time
                    </label>
                    <Input
                      type="datetime-local"
                      value={settings.end_date || ""}
                      onChange={(e) => setSettings({ ...settings, end_date: e.target.value || null })}
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Leave empty for no end restriction
                    </p>
                  </div>
                </div>

                <Button 
                  onClick={handleSaveSettings} 
                  disabled={isSavingSettings}
                  className="w-fit"
                >
                  {isSavingSettings ? <Spinner className="size-5" /> : "Save Settings"}
                </Button>
              </div>
            </section>

            {/* Player Management */}
            <section className="bg-card rounded-lg border border-border p-6">
              <h2 className="text-xl font-semibold text-card-foreground mb-4">
                Registered Players ({players.length})
              </h2>

              {players.length === 0 ? (
                <p className="text-muted-foreground py-4">No players registered yet.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {players.map((player, index) => (
                    <li key={player.id} className="py-3 flex items-center gap-4">
                      <span className="text-primary font-medium w-8">{index + 1}.</span>
                      
                      {editingId === player.id ? (
                        <div className="flex-1 flex items-center gap-2">
                          <Input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="flex-1"
                            autoFocus
                          />
                          <Button 
                            size="sm" 
                            onClick={() => handleSavePlayer(player.id)}
                            disabled={isSaving}
                          >
                            {isSaving ? <Spinner className="size-4" /> : "Save"}
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={handleCancelEdit}
                            disabled={isSaving}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <>
                          <span className="flex-1 text-card-foreground">{player.name}</span>
                          <span className="text-sm text-muted-foreground">
                            {new Date(player.created_at).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditPlayer(player)}
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeletePlayer(player.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              Delete
                            </Button>
                          </div>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </div>
    </main>
  )
}
