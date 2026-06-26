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
  status?: "active" | "reserve"
  payment_status?: "paid" | "pending"
}

interface RegistrationSettings {
  enabled: boolean
  start_date: string | null
  end_date: string | null
  default_to_reserve: boolean
  max_players: number 
  show_registration_date: boolean // Added this property
}

interface GameDateSettings {
  date: string | null
}

interface BrandingSettings {
  title: string
  image_url: string | null
}

export default function AdminPage() {
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [players, setPlayers] = useState<Player[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeletingAll, setIsDeletingAll] = useState(false)
  const [settings, setSettings] = useState<RegistrationSettings>({
    enabled: true,
    start_date: null,
    end_date: null,
    default_to_reserve: false,
    max_players: 20,
    show_registration_date: true, // Added default value
  })
  const [isSavingSettings, setIsSavingSettings] = useState(false)
  const [gameDate, setGameDate] = useState<GameDateSettings>({
    date: null,
  })
  const [isSavingGameDate, setIsSavingGameDate] = useState(false)
  
const [computedFallback, setComputedFallback] = useState<string>("")

  useEffect(() => {
    if (isAuthorized) {
      setComputedFallback(getAutomaticGameDate())
    }
  }, [isAuthorized])

  const [rules, setRules] = useState("")
  const [isSavingRules, setIsSavingRules] = useState(false)

  const [branding, setBranding] = useState<BrandingSettings>({
    title: "1 Day Basketball League",
    image_url: null,
  })
  const [isSavingBranding, setIsSavingBranding] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
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
    
    const { data: playersData } = await supabase
      .from("players")
      .select("*")
      .order("created_at", { ascending: true })
    
    if (playersData) {
      setPlayers(playersData)
    }

    const { data: settingsData } = await supabase
      .from("settings")
      .select("*")
      .eq("key", "registration_window")
      .single()
    
    if (settingsData) {
      setSettings({
        ...{ enabled: true, start_date: null, end_date: null, default_to_reserve: false, max_players: 20, show_registration_date: true },
        ...(settingsData.value as RegistrationSettings)
      })
    }

    const { data: gameDateData } = await supabase
      .from("settings")
      .select("*")
      .eq("key", "game_date")
      .single()
    
    if (gameDateData) {
      setGameDate(gameDateData.value as GameDateSettings)
    }

    const { data: rulesData } = await supabase
      .from("settings")
      .select("*")
      .eq("key", "game_rules")
      .single()

    if (rulesData) {
      setRules(rulesData.value.text || "")
    }

    const { data: brandingData } = await supabase
      .from("settings")
      .select("*")
      .eq("key", "branding_config")
      .single()
    
    if (brandingData) {
      setBranding(brandingData.value as BrandingSettings)
    }

    setIsLoading(false)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    const supabase = createClient()
    
    const fileExt = file.name.split('.').pop()
    const fileName = `banner-${Math.random()}.${fileExt}`
    const filePath = `uploads/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from("branding")
      .upload(filePath, file)

    if (uploadError) {
      alert("Error uploading image")
      setIsUploading(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage
      .from("branding")
      .getPublicUrl(filePath)

    setBranding(prev => ({ ...prev, image_url: publicUrl }))
    setIsUploading(false)
  }

  const handleSaveBranding = async () => {
    setIsSavingBranding(true)
    const supabase = createClient()
    
    const { error } = await supabase
      .from("settings")
      .upsert({ 
        key: "branding_config",
        value: branding,
        updated_at: new Date().toISOString()
      }, { onConflict: 'key' })

    if (error) {
      alert("Failed to save branding")
    } else {
      alert("Branding updated successfully!")
    }
    setIsSavingBranding(false)
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

  const handleClearAllPlayers = async () => {
    const confirmation = prompt('To clear all registered players, please type "meridianadmin":')
    
    if (confirmation !== "meridianadmin") {
      if (confirmation !== null) alert("Incorrect keyword. Action cancelled.")
      return
    }

    if (!confirm("Are you ABSOLUTELY sure? This will permanently delete all player data for the current week.")) return

    setIsDeletingAll(true)
    const supabase = createClient()

    const { error } = await supabase
      .from("players")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000") 

    if (error) {
      console.error("Error clearing players:", error)
      alert("Failed to clear database.")
    } else {
      setPlayers([])
      alert("All player data has been cleared.")
    }
    setIsDeletingAll(false)
  }

  const handleSaveSettings = async () => {
    setIsSavingSettings(true)
    const supabase = createClient()
    
    const { error } = await supabase
      .from("settings")
      .upsert({ 
        key: "registration_window",
        value: settings,
        updated_at: new Date().toISOString()
      }, { onConflict: 'key' })

    if (error) {
      console.error("Failed to save settings:", error)
    } else {
      alert("Settings saved successfully!")
    }
    setIsSavingSettings(false)
  }
const getAutomaticGameDate = (): string => {
  const now = new Date()
  const dayOfWeek = now.getDay() // 0 = Sunday, 1 = Monday, 2 = Tuesday, 3 = Wednesday, 4 = Thursday, 5 = Friday, 6 = Saturday

  // Target days: 2 (Tuesday), 4 (Thursday), 6 (Saturday)
  const gameDays = [2, 4, 6]

  // If today is Tuesday, Thursday, or Saturday, use today's date
  if (gameDays.includes(dayOfWeek)) {
    return now.toISOString().split("T")[0]
  }

  // Otherwise, find how many days to add to get to the next game day
  let daysUntilNextGame = 1
  while (!gameDays.includes((dayOfWeek + daysUntilNextGame) % 7)) {
    daysUntilNextGame++
  }

  const nextGameDate = new Date(now)
  nextGameDate.setDate(now.getDate() + daysUntilNextGame)
  
  return nextGameDate.toISOString().split("T")[0]
}
  const handleSaveGameDate = async () => {
  setIsSavingGameDate(true)
  const supabase = createClient()
  
  // 1. Check if the selection is blank
  let dateToSave = gameDate.date
  if (!dateToSave) {
    dateToSave = getAutomaticGameDate()
    
    // Optimistically update the UI input field so the user sees what was selected
    setGameDate({ date: dateToSave })
  }

  // 2. Build the payload with the automatically calculated date if needed
  const payload = {
    date: dateToSave
  }
  
  const { error } = await supabase
    .from("settings")
    .upsert({ 
      key: "game_date",
      value: payload, // Saves the structured object to your JSONB value column
      updated_at: new Date().toISOString()
    }, { onConflict: 'key' })

  if (error) {
    console.error("Failed to save game date:", error)
    alert(`Error saving date: ${error.message}`)
  } else {
    alert(`Game date saved successfully as ${dateToSave}!`)
  }
  setIsSavingGameDate(false)
}

  const handleSaveRules = async () => {
    setIsSavingRules(true)
    const supabase = createClient()
    
    const { error } = await supabase
      .from("settings")
      .upsert(
        { 
          key: "game_rules", 
          value: { text: rules },
          updated_at: new Date().toISOString() 
        },
        { onConflict: 'key' }
      )

    if (error) {
      console.error("Error saving rules:", error)
      alert(`Error: ${error.message}`)
    } else {
      alert("Rules saved successfully!")
    }
    setIsSavingRules(false)
  }
  
  const handleToggleStatus = async (player: Player) => {
    const newStatus = player.status === "reserve" ? "active" : "reserve"
    const supabase = createClient()
    
    setPlayers(players.map(p => 
      p.id === player.id ? { ...p, status: newStatus } : p
    ))

    const { error } = await supabase
      .from("players")
      .update({ status: newStatus })
      .eq("id", player.id)

    if (error) {
      console.error("Error updating status:", error)
      setPlayers(players.map(p => 
        p.id === player.id ? { ...p, status: player.status } : p
      ))
    }
  }

  const handleTogglePayment = async (player: Player) => {
    const newPaymentStatus = player.payment_status === "paid" ? "pending" : "paid"
    const supabase = createClient()
    
    setPlayers(players.map(p => 
      p.id === player.id ? { ...p, payment_status: newPaymentStatus } : p
    ))

    const { error } = await supabase
      .from("players")
      .update({ payment_status: newPaymentStatus })
      .eq("id", player.id)

    if (error) {
      console.error("Error updating payment:", error)
      setPlayers(players.map(p => 
        p.id === player.id ? { ...p, payment_status: player.payment_status } : p
      ))
    }
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

  const activeCount = players.filter(p => p.status !== 'reserve').length;

  return (
    <main className="min-h-screen px-4 py-8 md:py-12">
      <div className="max-w-4xl mx-auto">
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
            
            <section className="bg-card rounded-lg border border-border p-6">
              <h2 className="text-xl font-semibold text-card-foreground mb-4">Header & Branding</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-card-foreground mb-1.5">League Title</label>
                  <Input 
                    value={branding.title}
                    onChange={(e) => setBranding({ ...branding, title: e.target.value })}
                    placeholder="e.g. 1 Day Basketball League"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-card-foreground mb-1.5">Banner Image</label>
                  <div className="flex flex-col gap-3">
                    {branding.image_url && (
                      <div className="relative w-full h-32 rounded-md overflow-hidden border border-border">
                        <img 
                          src={branding.image_url} 
                          alt="Banner Preview" 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleImageUpload} 
                        className="max-w-xs"
                      />
                      {isUploading && <Spinner className="size-5" />}
                    </div>
                    <p className="text-xs text-muted-foreground">Upload a photo to show on top of the home page</p>
                  </div>
                </div>

                <Button 
                  onClick={handleSaveBranding} 
                  disabled={isSavingBranding || isUploading}
                  className="w-fit"
                >
                  {isSavingBranding ? <Spinner className="size-5 mr-2" /> : null}
                  Update Branding
                </Button>
              </div>
            </section>

            <section className="bg-card rounded-lg border border-border p-6">
              <h2 className="text-xl font-semibold text-card-foreground mb-4">
                Game Date
              </h2>
              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-medium text-card-foreground mb-1.5">
                    Select Game Date
                  </label>
                  
                  {/* Flex row container to hold the input field and fallback label side by side */}
                  <div className="flex flex-wrap items-center gap-3">
                    <Input
                      type="date"
                      value={gameDate.date || ""}
                      onChange={(e) => setGameDate({ date: e.target.value || null })}
                      className="w-full max-w-xs"
                    />
                    
                    {/* Visual badge that displays automatically when input selection is empty */}
                    {!gameDate.date && computedFallback && (
                      <span className="text-xs font-semibold bg-blue-500/10 text-blue-600 border border-blue-500/20 px-2.5 py-1.5 rounded-md animate-pulse">
                        Will default to: {new Date(computedFallback).toLocaleDateString("en-US", {
                          weekday: "long",
                          month: "short",
                          day: "numeric",
                          year: "numeric"
                        })}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground mt-1.5">
                    This date will be displayed on the registration page. Leave blank to automatically select the nearest schedule.
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

            <section className="bg-card rounded-lg border border-border p-6">
              <h2 className="text-xl font-semibold text-card-foreground mb-4">
                Registration Settings
              </h2>
              
              <div className="flex flex-col gap-6">
                <div className="flex flex-col md:flex-row md:items-center gap-6">
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
                    <span className="text-card-foreground font-medium whitespace-nowrap">
                      Registration {settings.enabled ? "Enabled" : "Disabled"}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 flex-1">
                    <label className="text-sm font-medium text-card-foreground whitespace-nowrap">
                      Max Active Players:
                    </label>
                    <Input
                      type="number"
                      value={settings.max_players}
                      onChange={(e) => setSettings({ ...settings, max_players: parseInt(e.target.value) || 0 })}
                      className="w-20 h-9"
                    />
                    <span className={`text-xs font-bold px-2 py-1 rounded ${activeCount >= settings.max_players ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                      {activeCount} / {settings.max_players}
                    </span>
                  </div>
                </div>

                {/* --- START OF NEW DATE TOGGLE --- */}
                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-md border border-border/50">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.show_registration_date}
                      onChange={(e) => setSettings({ ...settings, show_registration_date: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                  </label>
                  <div className="flex flex-col">
                    <span className="text-card-foreground font-medium">
                      Show Registration Date to Public
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Enable to show the join date and time next to player names on the home page list.
                    </span>
                  </div>
                </div>
                {/* --- END OF NEW DATE TOGGLE --- */}

                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-md border border-border/50">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.default_to_reserve}
                      onChange={(e) => setSettings({ ...settings, default_to_reserve: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-orange-500/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                  </label>
                  <div className="flex flex-col">
                    <span className="text-card-foreground font-medium">
                      Force New Players to Reserve
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Manual override. Also triggers automatically if Max Players ({settings.max_players}) is reached.
                    </span>
                  </div>
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

            <section className="bg-card rounded-lg border border-border p-6">
              <h2 className="text-xl font-semibold text-card-foreground mb-4">Game Rules</h2>
              <div className="flex flex-col gap-4">
                <textarea
                  value={rules}
                  onChange={(e) => setRules(e.target.value)}
                  placeholder="Type the game rules here (e.g. 5v5, Winner stays...)"
                  className="w-full min-h-[150px] p-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <Button 
                  onClick={handleSaveRules} 
                  disabled={isSavingRules}
                  className="w-fit"
                >
                  {isSavingRules ? <Spinner className="size-5" /> : "Save Rules"}
                </Button>
                <p className="text-xs text-muted-foreground">
                  These rules will be shown on the home page under the registration button.
                </p>
              </div>
            </section>

            <section className="bg-card rounded-lg border border-border p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-card-foreground">
                  Registered Players ({players.length})
                </h2>
                {players.length > 0 && (
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={handleClearAllPlayers}
                    disabled={isDeletingAll}
                  >
                    {isDeletingAll ? <Spinner className="size-4 mr-2" /> : null}
                    Clear All Players
                  </Button>
                )}
              </div>

              {players.length === 0 ? (
                <p className="text-muted-foreground py-4">No players registered yet.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {players.map((player, index) => (
                    <li 
                      key={player.id} 
                      className={`py-3 flex items-center gap-4 ${player.status === 'reserve' ? 'opacity-80' : ''}`}
                    >
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
                          <div className="flex-1 flex items-center gap-3">
                            <span className="text-card-foreground font-medium">{player.name}</span>
                            
                            <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold ${
                              player.payment_status === 'paid' 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {player.payment_status || 'pending'}
                            </span>

                            {player.status === "reserve" && (
                              <span className="text-[10px] bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">
                                Reserve
                              </span>
                            )}
                          </div>

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
                              variant={player.payment_status === "paid" ? "default" : "outline"}
                              className={player.payment_status === "paid" ? "bg-green-600 hover:bg-green-700" : ""}
                              onClick={() => handleTogglePayment(player)}
                            >
                              {player.payment_status === "paid" ? "Mark Pending" : "Mark Paid"}
                            </Button>

                            <Button
                              size="sm"
                              variant={player.status === "reserve" ? "secondary" : "outline"}
                              onClick={() => handleToggleStatus(player)}
                            >
                              {player.status === "reserve" ? "Make Active" : "Make Reserve"}
                            </Button>
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