"use client";

import { useEffect, useRef, useState } from "react";
import { Circle, Pencil, RectangleHorizontalIcon } from "lucide-react";
import { Game } from "@/draw/Game";

export type Tool = "circle" | "rect" | "pencil";

interface CanvasProps {
    socket: WebSocket;
    roomId: string;
}


export function Canvas({ roomId, socket }: CanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [game, setGame] = useState<Game>();
    const [selectedTool, setSelectedTool] = useState<Tool>("circle");

    useEffect(() => {
        game?.setTool(selectedTool);
    }, [selectedTool, game]);

    useEffect(() => {
        if (canvasRef.current) {
            const g = new Game(canvasRef.current, roomId, socket);
            setGame(g);

            return () => {
                g.destroy();
            };
        }
    }, [canvasRef, roomId, socket]);

    return (
        <div style={{ height: "100vh", overflow: "hidden" }}>
            <canvas
                ref={canvasRef}
                width={typeof window !== 'undefined' ? window.innerWidth : 800}
                height={typeof window !== 'undefined' ? window.innerHeight : 600}
            />
            <Topbar setSelectedTool={setSelectedTool} selectedTool={selectedTool} />
        </div>
    );
}

interface TopbarProps {
    selectedTool: Tool;
    setSelectedTool: (s: Tool) => void;
}

function Topbar({ selectedTool, setSelectedTool }: TopbarProps) {
    return (
        <div style={{ position: "fixed", top: 10, left: 10 }}>
            <div className="flex gap-2 bg-card p-2 rounded-lg border border-border">
                <button
                    onClick={() => setSelectedTool("pencil")}
                    className={`p-2 rounded-md transition-all ${selectedTool === "pencil"
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-secondary"
                        }`}
                >
                    <Pencil className="w-5 h-5" />
                </button>
                <button
                    onClick={() => setSelectedTool("rect")}
                    className={`p-2 rounded-md transition-all ${selectedTool === "rect"
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-secondary"
                        }`}
                >
                    <RectangleHorizontalIcon className="w-5 h-5" />
                </button>
                <button
                    onClick={() => setSelectedTool("circle")}
                    className={`p-2 rounded-md transition-all ${selectedTool === "circle"
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-secondary"
                        }`}
                >
                    <Circle className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}