"use client"

import { useState, useEffect, useRef } from "react"
import { Send } from "lucide-react"
import { Button } from "@/components/components/ui/button"
import { Input } from "@/components/components/ui/input"

interface ChatMessage {
    id: string
    message: string
    username: string
    userId: string
    createdAt: string
}

interface ChatPanelProps {
    messages: ChatMessage[]
    onSendMessage: (message: string) => void
    currentUserId?: string
}

export function ChatPanel({ messages, onSendMessage, currentUserId }: ChatPanelProps) {
    const [newMessage, setNewMessage] = useState("")
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (newMessage.trim()) {
            onSendMessage(newMessage.trim())
            setNewMessage("")
        }
    }

    const formatTime = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }

    return (
        <div className="flex flex-col h-full">
            {/* Chat Header */}
            <div className="p-3 border-b border-border">
                <h3 className="font-semibold text-sm">Chat</h3>
                <p className="text-xs text-muted-foreground">{messages.length} messages</p>
            </div>

            {/* Messages List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {messages.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                        No messages yet. Start the conversation!
                    </p>
                ) : (
                    messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`flex flex-col ${msg.userId === currentUserId ? "items-end" : "items-start"
                                }`}
                        >
                            <div
                                className={`max-w-[85%] rounded-lg px-3 py-2 ${msg.userId === currentUserId
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-secondary"
                                    }`}
                            >
                                {msg.userId !== currentUserId && (
                                    <p className="text-xs font-medium opacity-70 mb-1">
                                        {msg.username}
                                    </p>
                                )}
                                <p className="text-sm wrap-break-word">{msg.message}</p>
                            </div>
                            <span className="text-[10px] text-muted-foreground mt-1 px-1">
                                {formatTime(msg.createdAt)}
                            </span>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <form onSubmit={handleSubmit} className="p-3 border-t border-border">
                <div className="flex gap-2">
                    <Input
                        type="text"
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        className="flex-1 bg-input border-border text-sm"
                    />
                    <Button
                        type="submit"
                        size="icon"
                        className="gradient-button"
                        disabled={!newMessage.trim()}
                    >
                        <Send className="w-4 h-4 text-black" />
                    </Button>
                </div>
            </form>
        </div>
    )
}
