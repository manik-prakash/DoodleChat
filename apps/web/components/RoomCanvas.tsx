"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { RoomLayout } from "./RoomLayout";
import { ChatPanel } from "./ChatPanel";
import { Tool } from "./RoomNavbar";
import { Game } from "@/draw/Game";
import { getToken, isAuthenticated, getUser } from "@/lib/auth";
import { Loader2 } from "lucide-react";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080';

interface ChatMessage {
    id: string;
    message: string;
    username: string;
    userId: string;
    createdAt: string;
}

interface RoomInfo {
    id: string;
    slug: string;
    ownerId: string;
}

export function RoomCanvas({ roomId }: { roomId: string }) {
    const router = useRouter();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const [game, setGame] = useState<Game | null>(null);
    const [selectedTool, setSelectedTool] = useState<Tool>("circle");
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [roomJoined, setRoomJoined] = useState(false);
    const [error, setError] = useState("");

    const user = getUser();
    const currentUserId = user?.id;
    const isOwner = roomInfo?.ownerId === currentUserId;

    // Handle incoming chat messages
    const handleChatMessage = useCallback((message: any) => {
        const newMessage: ChatMessage = {
            id: message.id || Date.now().toString(),
            message: message.message,
            username: message.username,
            userId: message.userId,
            createdAt: message.createdAt || new Date().toISOString()
        };
        setChatMessages(prev => [...prev, newMessage]);
    }, []);

    // Check auth
    useEffect(() => {
        if (!isAuthenticated()) {
            router.push("/login");
            return;
        }
    }, [router]);

    // Connect to WebSocket
    useEffect(() => {
        if (!isAuthenticated()) return;

        const token = getToken();
        if (!token) {
            setError("Not authenticated");
            setIsLoading(false);
            return;
        }

        const ws = new WebSocket(`${WS_URL}?token=${token}`);
        let joinTimeout: NodeJS.Timeout;

        ws.onopen = () => {
            console.log("WebSocket connected");
            setSocket(ws);

            // Join the room
            console.log("Sending join_room for:", roomId);
            ws.send(JSON.stringify({
                type: "join_room",
                roomId
            }));

            // Fallback: if no room_joined confirmation after 2 seconds, proceed anyway
            joinTimeout = setTimeout(() => {
                console.log("Join timeout - proceeding without confirmation");
                setRoomJoined(true);
                setIsLoading(false);
            }, 2000);
        };

        // Handle initial messages (before Game takes over)
        ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            console.log("WebSocket message received:", message);

            if (message.type === "room_joined") {
                console.log("Room joined successfully:", message.roomId);
                clearTimeout(joinTimeout);
                // Set room info from the server response
                setRoomInfo({
                    id: message.roomId,
                    slug: message.slug,
                    ownerId: message.ownerId
                });
                setRoomJoined(true);
                setIsLoading(false);
            } else if (message.type === "error") {
                console.error("WebSocket error:", message.message);
                clearTimeout(joinTimeout);
                if (message.message === "Room not found") {
                    setError("Room not found");
                    setIsLoading(false);
                }
            }
        };

        ws.onerror = (event) => {
            console.error("WebSocket error:", event);
            setError("Failed to connect to server");
            setIsLoading(false);
        };

        ws.onclose = () => {
            console.log("WebSocket disconnected");
            setSocket(null);
            setRoomJoined(false);
        };

        return () => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    type: "leave_room",
                    roomId
                }));
                ws.close();
            }
        };
    }, [roomId]);

    // Initialize game when socket is ready AND room is joined
    useEffect(() => {
        if (socket && canvasRef.current && roomJoined) {
            console.log("Creating Game instance for canvas:", canvasRef.current);

            // Destroy existing game if any
            if (game) {
                game.destroy();
            }

            const g = new Game(canvasRef.current, roomId, socket, handleChatMessage);
            setGame(g);

            return () => {
                g.destroy();
            };
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [socket, roomId, roomJoined]); // Removed game from deps to allow recreation

    // Update tool when changed
    useEffect(() => {
        game?.setTool(selectedTool);
    }, [selectedTool, game]);

    // Handle sending chat messages
    const handleSendMessage = (message: string) => {
        if (game && socket?.readyState === WebSocket.OPEN && roomJoined) {
            game.sendChatMessage(message);
        }
    };

    // Handle clear canvas
    const handleClearCanvas = () => {
        if (game && socket?.readyState === WebSocket.OPEN && roomJoined) {
            game.clearAllShapes();
        }
    };

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <p className="text-destructive mb-4">{error}</p>
                    <button
                        onClick={() => router.push("/rooms")}
                        className="text-primary hover:underline"
                    >
                        Back to Rooms
                    </button>
                </div>
            </div>
        );
    }

    if (isLoading || !socket || !roomJoined) {
        return (
            <div className="min-h-screen flex items-center justify-center flex-col gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                <p className="text-muted-foreground">Connecting to room...</p>
            </div>
        );
    }

    return (
        <RoomLayout
            roomSlug={roomInfo?.slug}
            selectedTool={selectedTool}
            onToolChange={setSelectedTool}
            onClearCanvas={handleClearCanvas}
            isOwner={isOwner}
            canvasElement={
                <canvas
                    ref={canvasRef}
                    width={typeof window !== 'undefined' ? window.innerWidth - 320 : 800}
                    height={typeof window !== 'undefined' ? window.innerHeight - 56 : 600}
                    className="block absolute inset-0 cursor-crosshair"
                    style={{ touchAction: 'none' }}
                    onClick={(e) => console.log("[Canvas] Direct click at:", e.clientX, e.clientY)}
                />
            }
            chatElement={
                <ChatPanel
                    messages={chatMessages}
                    onSendMessage={handleSendMessage}
                    currentUserId={currentUserId}
                />
            }
        />
    );
}