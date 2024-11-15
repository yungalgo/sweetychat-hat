export interface Position {
    x: number;
    y: number;
}

export interface Transform {
    position: Position;
    rotation: number;
    scale: number;
    flipX: boolean;
}

export interface TouchData {
    initialDistance: number;
    initialRotation: number;
    initialScale: number;
}