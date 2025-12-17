"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/components/ui/button"
import {
    Menu,
    X,
    LogOut,
    User,
    Settings,
    Circle,
    Square as RectangleIcon,
    Pencil,
    Trash2,
    ArrowLeft
} from "lucide-react"
import { logout, getUser } from "@/lib/auth"

export type Tool = "circle" | "rect" | "pencil"

interface RoomNavbarProps {
    roomSlug?: string
    selectedTool: Tool
    onToolChange: (tool: Tool) => void
    onClearCanvas?: () => void
    isOwner?: boolean
}

export function RoomNavbar({
    roomSlug,
    selectedTool,
    onToolChange,
    onClearCanvas,
    isOwner = false
}: RoomNavbarProps) {
    const router = useRouter()
    const [menuOpen, setMenuOpen] = useState(false)
    const user = getUser()

    const handleLeaveRoom = () => {
        router.push("/rooms")
    }

    const handleLogout = () => {
        logout()
    }

    const tools: { id: Tool; icon: React.ReactNode; label: string }[] = [
        { id: "pencil", icon: <Pencil className="w-5 h-5" />, label: "Pencil" },
        { id: "rect", icon: <RectangleIcon className="w-5 h-5" />, label: "Rectangle" },
        { id: "circle", icon: <Circle className="w-5 h-5" />, label: "Circle" },
    ]

    return (
        <>
            <nav className="fixed top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur border-b border-border">
                <div className="flex items-center justify-between px-4 h-14">
                    {/* Left: Hamburger Menu */}
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setMenuOpen(!menuOpen)}
                            className="p-2 rounded-lg hover:bg-secondary transition-colors"
                        >
                            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                        <Link href="/" className="text-xl font-bold gradient-text">
                            DoodleChat
                        </Link>
                        {roomSlug && (
                            <span className="text-sm text-muted-foreground font-mono">
                                Room: {roomSlug}
                            </span>
                        )}
                    </div>

                    {/* Center: Tools */}
                    <div className="flex items-center gap-1 bg-secondary/50 rounded-lg p-1">
                        {tools.map((tool) => (
                            <button
                                key={tool.id}
                                onClick={() => onToolChange(tool.id)}
                                className={`p-2 rounded-md transition-all ${selectedTool === tool.id
                                    ? "bg-primary text-primary-foreground shadow-sm"
                                    : "hover:bg-secondary text-muted-foreground hover:text-foreground"
                                    }`}
                                title={tool.label}
                            >
                                {tool.icon}
                            </button>
                        ))}
                        {isOwner && onClearCanvas && (
                            <>
                                <div className="w-px h-6 bg-border mx-1" />
                                <button
                                    onClick={onClearCanvas}
                                    className="p-2 rounded-md hover:bg-destructive/10 text-destructive transition-all"
                                    title="Clear Canvas"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </>
                        )}
                    </div>

                    {/* Right: Leave Room */}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleLeaveRoom}
                        className="border-border hover:border-primary bg-transparent"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Leave Room
                    </Button>
                </div>
            </nav>

            {/* Hamburger Menu Dropdown */}
            {menuOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-40 bg-black/50"
                        onClick={() => setMenuOpen(false)}
                    />

                    {/* Menu Panel */}
                    <div className="fixed top-14 left-0 z-50 w-72 bg-card border-r border-border shadow-2xl">
                        <div className="p-4 border-b border-border">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                                    <User className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <p className="font-medium">{user?.username || "User"}</p>
                                    <p className="text-sm text-muted-foreground">{user?.email || ""}</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-2">
                            <button
                                onClick={() => { }}
                                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary transition-colors text-left"
                            >
                                <Settings className="w-4 h-4" />
                                Settings
                            </button>
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-destructive/10 text-destructive transition-colors text-left"
                            >
                                <LogOut className="w-4 h-4" />
                                Logout
                            </button>
                        </div>
                    </div>
                </>
            )}
        </>
    )
}
