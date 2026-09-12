import axios from "axios";

const API_URL = "http://localhost:3001";

export interface ShapeData {
    id?: string;
    type: "rect" | "circle" | "pencil";
    [key: string]: any;
}

export async function getExistingShapes(roomId: string): Promise<ShapeData[]> {
    try {
        const res = await axios.get(`${API_URL}/shape/${roomId}`);
        const shapes = res.data.shapes || [];

        return shapes.map((s: any) => ({ ...s.data, id: s.id }));
    } catch (err) {
        console.error("Failed to fetch shapes:", err);
        return [];
    }
}