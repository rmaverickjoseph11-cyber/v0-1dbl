"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { useRouter } from "next/navigation"

interface AdminLoginModalProps {
  isOpen: boolean
  onClose: () => void
}

const ADMIN_PASSWORD = "meridianadmin"

export function AdminLoginModal({ isOpen, onClose }: AdminLoginModalProps) {
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    // Simple password check
    if (password === ADMIN_PASSWORD) {
      // Store admin session in sessionStorage
      sessionStorage.setItem("isAdmin", "true")
      router.push("/admin")
    } else {
      setError("Incorrect password")
    }
    
    setIsLoading(false)
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
      setPassword("")
      setError(null)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-foreground/50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-card rounded-lg shadow-lg w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-card-foreground">Admin Login</h2>
          <button
            onClick={() => {
              onClose()
              setPassword("")
              setError(null)
            }}
            className="text-muted-foreground hover:text-foreground transition-colors"
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
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-card-foreground mb-1.5">
              Password
            </label>
            <Input
              id="password"
              type="password"
              placeholder="Enter admin password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              className="w-full"
            />
          </div>
          
          {error && (
            <p className="text-destructive text-sm">{error}</p>
          )}
          
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? <Spinner className="size-5" /> : "Login"}
          </Button>
        </form>
      </div>
    </div>
  )
}
