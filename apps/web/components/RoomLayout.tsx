"use client"

import { ReactNode } from "react"
import { RoomNavbar, Tool } from "./RoomNavbar"

interface RoomLayoutProps {
    roomSlug?: string
    selectedTool: Tool
    onToolChange: (tool: Tool) => void
    onClearCanvas?: () => void
    isOwner?: boolean
    canvasElement: ReactNode
    chatElement: ReactNode
}

export function RoomLayout({
    roomSlug,
    selectedTool,
    onToolChange,
    onClearCanvas,
    isOwner = false,
    canvasElement,
    chatElement
}: RoomLayoutProps) {
    return (
        <div className="h-screen flex flex-col overflow-hidden">
            {/* Navbar */}
            <RoomNavbar
                roomSlug={roomSlug}
                selectedTool={selectedTool}
                onToolChange={onToolChange}
                onClearCanvas={onClearCanvas}
                isOwner={isOwner}
            />

            {/* Main Content - Split View */}
            <div className="flex-1 flex pt-14 overflow-hidden">
                {/* Canvas Section - Left */}
                <div className="flex-1 relative bg-black overflow-hidden">
                    {canvasElement}
                </div>

                {/* Chat Section - Right */}
                <div className="w-80 border-l border-border bg-card flex flex-col">
                    {chatElement}
                </div>
            </div>
        </div>
    )
}
