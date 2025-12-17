"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import axios from "axios"
import { Button } from "@/components/components/ui/button"
import { Input } from "@/components/components/ui/input"
import { Plus, DoorOpen, LogOut, Loader2 } from "lucide-react"
import { isAuthenticated, logout, getToken } from "@/lib/auth"

const API_URL = "http://localhost:3001"

export default function RoomsPage() {
  const router = useRouter()
  const [roomSlug, setRoomSlug] = useState("")
  const [error, setError] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [isJoining, setIsJoining] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login")
      return
    }
    setIsLoading(false)
  }, [router])

  const handleCreateRoom = async () => {
    setError("")
    setIsCreating(true)

    try {
      const roomName = Math.random().toString(36).substring(2, 8).toUpperCase()

      const response = await axios.post(
        `${API_URL}/room`,
        { name: roomName },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      )

      if (response.data.room) {
        router.push(`/rooms/${response.data.room.id}`)
      }
    } catch (err: any) {
      const message = err.response?.data?.message || "Failed to create room"
      setError(message)
    } finally {
      setIsCreating(false)
    }
  }

  const handleJoinRoom = async () => {
    if (!roomSlug.trim()) {
      setError("Please enter a room code")
      return
    }

    setError("")
    setIsJoining(true)

    try {
      const response = await axios.get(`${API_URL}/room/${roomSlug.toUpperCase()}`)

      if (response.data.room) {
        router.push(`/rooms/${response.data.room.id}`)
      } else {
        setError("Room not found")
      }
    } catch (err: any) {
      const message = err.response?.data?.message || "Room not found"
      setError(message)
    } finally {
      setIsJoining(false)
    }
  }

  const handleRoomSlugChange = (value: string) => {
    setRoomSlug(value.toUpperCase())
    setError("")
  }

  const handleLogout = () => {
    logout()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 relative">
      {/* Logout Button */}
      <div className="absolute top-6 right-6">
        <Button
          variant="outline"
          className="border-border hover:border-primary bg-transparent"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>

      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <Link href="/" className="text-3xl font-bold gradient-text inline-block mb-4">
            DoodleChat
          </Link>
          <h1 className="text-4xl font-bold mb-2">Get Started</h1>
          <p className="text-[#A1A1A1] text-lg">Create a new room or join an existing one</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-destructive/10 text-destructive text-sm p-3 rounded-lg border border-destructive/20 text-center">
            {error}
          </div>
        )}

        {/* Two Options */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Create Room Card */}
          <div
            className="bg-card border border-border rounded-xl p-8 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group"
            onClick={!isCreating ? handleCreateRoom : undefined}
          >
            <div className="text-center space-y-6">
              <div className="w-20 h-20 rounded-full gradient-button flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                {isCreating ? (
                  <Loader2 className="w-10 h-10 text-black animate-spin" />
                ) : (
                  <Plus className="w-10 h-10 text-black" />
                )}
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2">Create New Room</h2>
                <p className="text-[#A1A1A1]">Start a fresh canvas and invite others</p>
              </div>
              <Button
                className="w-full gradient-button text-black font-semibold hover:opacity-90 transition-opacity"
                disabled={isCreating}
              >
                {isCreating ? "Creating..." : "Create Room"}
              </Button>
            </div>
          </div>

          {/* Join Room Card */}
          <div className="bg-card border border-border rounded-xl p-8 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
            <div className="text-center space-y-6">
              <div className="w-20 h-20 rounded-full gradient-button flex items-center justify-center mx-auto">
                <DoorOpen className="w-10 h-10 text-black" />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2">Join Existing Room</h2>
                <p className="text-[#A1A1A1]">Enter a room code to join</p>
              </div>
              <div className="space-y-3">
                <Input
                  type="text"
                  placeholder="ROOM CODE"
                  value={roomSlug}
                  onChange={(e) => handleRoomSlugChange(e.target.value)}
                  className="bg-input border-border focus:border-primary transition-colors text-center text-lg font-mono tracking-widest uppercase"
                  maxLength={10}
                />
              </div>
              <Button
                onClick={handleJoinRoom}
                className="w-full gradient-button text-black font-semibold hover:opacity-90 transition-opacity"
                disabled={isJoining}
              >
                {isJoining ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Joining...
                  </>
                ) : (
                  "Join Room"
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Recent Rooms Section */}
        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground">No recent rooms yet. Create or join one to get started!</p>
        </div>
      </div>
    </div>
  )
}
