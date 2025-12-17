import { Tool } from "@/components/RoomNavbar";
import { getExistingShapes, ShapeData } from "./http";

export class Game {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private existingShapes: ShapeData[];
    private roomId: string;
    private clicked: boolean;
    private startX = 0;
    private startY = 0;
    private selectedTool: Tool = "circle";
    private onChatMessage?: (message: any) => void;

    socket: WebSocket;

    constructor(
        canvas: HTMLCanvasElement,
        roomId: string,
        socket: WebSocket,
        onChatMessage?: (message: any) => void
    ) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d")!;
        this.existingShapes = [];
        this.roomId = roomId;
        this.socket = socket;
        this.clicked = false;
        this.onChatMessage = onChatMessage;
        this.init();
        this.initHandlers();
        this.initMouseHandlers();
    }

    destroy() {
        this.canvas.removeEventListener("mousedown", this.mouseDownHandler);
        this.canvas.removeEventListener("mouseup", this.mouseUpHandler);
        this.canvas.removeEventListener("mousemove", this.mouseMoveHandler);
    }

    setTool(tool: "circle" | "pencil" | "rect") {
        this.selectedTool = tool;
    }

    async init() {
        this.existingShapes = await getExistingShapes(this.roomId);
        console.log("Loaded shapes:", this.existingShapes);
        this.clearCanvas();
    }

    initHandlers() {
        this.socket.onmessage = (event) => {
            const message = JSON.parse(event.data);

            // Handle draw messages (shapes)
            if (message.type === "draw") {
                this.existingShapes.push(message.shape);
                this.clearCanvas();
            }

            // Handle canvas cleared
            if (message.type === "canvas_cleared") {
                this.existingShapes = [];
                this.clearCanvas();
            }

            // Handle chat messages - forward to callback
            if (message.type === "chat" && this.onChatMessage) {
                this.onChatMessage(message);
            }

            // Handle user events
            if (message.type === "user_joined" || message.type === "user_left") {
                console.log(`${message.type}: ${message.username}`);
            }

            // Handle errors
            if (message.type === "error") {
                console.error("WebSocket error:", message.message);
            }
        };
    }

    clearCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = "rgba(0, 0, 0)";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.existingShapes.forEach((shape) => {
            this.drawShape(shape);
        });
    }

    private drawShape(shape: ShapeData) {
        this.ctx.strokeStyle = "rgba(255, 255, 255)";
        this.ctx.lineWidth = 2;

        if (shape.type === "rect") {
            this.ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
        } else if (shape.type === "circle") {
            this.ctx.beginPath();
            this.ctx.arc(shape.centerX, shape.centerY, Math.abs(shape.radius), 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.closePath();
        } else if (shape.type === "pencil") {
            this.ctx.beginPath();
            this.ctx.moveTo(shape.startX, shape.startY);
            this.ctx.lineTo(shape.endX, shape.endY);
            this.ctx.stroke();
            this.ctx.closePath();
        }
    }

    mouseDownHandler = (e: MouseEvent) => {
        this.clicked = true;
        this.startX = e.clientX;
        this.startY = e.clientY - 56; // Account for navbar height
    };

    mouseUpHandler = (e: MouseEvent) => {
        this.clicked = false;
        const endX = e.clientX;
        const endY = e.clientY - 56; // Account for navbar height
        const width = endX - this.startX;
        const height = endY - this.startY;

        const selectedTool = this.selectedTool;
        let shape: ShapeData | null = null;

        if (selectedTool === "rect") {
            shape = {
                type: "rect",
                x: this.startX,
                y: this.startY,
                height,
                width
            };
        } else if (selectedTool === "circle") {
            const radius = Math.max(Math.abs(width), Math.abs(height)) / 2;
            shape = {
                type: "circle",
                radius: radius,
                centerX: this.startX + radius,
                centerY: this.startY + radius,
            };
        } else if (selectedTool === "pencil") {
            shape = {
                type: "pencil",
                startX: this.startX,
                startY: this.startY,
                endX,
                endY
            };
        }

        if (!shape) {
            return;
        }

        this.existingShapes.push(shape);
        this.clearCanvas();

        // Send as 'draw' type to WebSocket
        this.socket.send(JSON.stringify({
            type: "draw",
            shape,
            roomId: this.roomId
        }));
    };

    mouseMoveHandler = (e: MouseEvent) => {
        if (this.clicked) {
            const currentX = e.clientX;
            const currentY = e.clientY - 56; // Account for navbar height
            const width = currentX - this.startX;
            const height = currentY - this.startY;

            this.clearCanvas();
            this.ctx.strokeStyle = "rgba(255, 255, 255)";
            this.ctx.lineWidth = 2;

            const selectedTool = this.selectedTool;

            if (selectedTool === "rect") {
                this.ctx.strokeRect(this.startX, this.startY, width, height);
            } else if (selectedTool === "circle") {
                const radius = Math.max(Math.abs(width), Math.abs(height)) / 2;
                const centerX = this.startX + radius;
                const centerY = this.startY + radius;
                this.ctx.beginPath();
                this.ctx.arc(centerX, centerY, Math.abs(radius), 0, Math.PI * 2);
                this.ctx.stroke();
                this.ctx.closePath();
            } else if (selectedTool === "pencil") {
                // For pencil, draw a line from start to current position
                this.ctx.beginPath();
                this.ctx.moveTo(this.startX, this.startY);
                this.ctx.lineTo(currentX, currentY);
                this.ctx.stroke();
                this.ctx.closePath();
            }
        }
    };

    initMouseHandlers() {
        this.canvas.addEventListener("mousedown", this.mouseDownHandler);
        this.canvas.addEventListener("mouseup", this.mouseUpHandler);
        this.canvas.addEventListener("mousemove", this.mouseMoveHandler);
    }

    // Public method to send chat messages
    sendChatMessage(message: string) {
        this.socket.send(JSON.stringify({
            type: "chat",
            message,
            roomId: this.roomId
        }));
    }

    // Public method to clear canvas (owner only)
    clearAllShapes() {
        this.socket.send(JSON.stringify({
            type: "clear_canvas",
            roomId: this.roomId
        }));
    }
}