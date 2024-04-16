import React, { useState } from 'react';
import { Group, Line } from 'react-konva';
import '../styles/Grid.css'


const GridLines = ({ windowWidth, windowHeight, scale }) => {
    const [strokeWidth, setStrokeWidth] = useState(0.25);
    const scaledWidth = windowWidth * scale;
    const scaledHeight = windowHeight * scale;
    const squareSize = 5 * scale;  

    const verticalLines = Array.from({ length: Math.ceil(scaledWidth / squareSize) }, (_, i) => (
        <Line
            key={`vertical-${i}`}
            points={[i * squareSize, 0, i * squareSize, scaledHeight]}
            stroke="rgba(0, 0, 0, 0.8)"
            strokeWidth={strokeWidth}
        />
    ));

    const horizontalLines = Array.from({ length: Math.ceil(scaledHeight / squareSize) }, (_, i) => (
        <Line
            key={`horizontal-${i}`}
            points={[0, i * squareSize, scaledWidth, i * squareSize]}
            stroke="rgba(0, 0, 0, 0.8)"
            strokeWidth={strokeWidth}
        />
    ));

    return (
        <div className="Grid">
            <Group 
                scaleX={scale} 
                scaleY={scale} 
            > 
                {verticalLines}
                {horizontalLines}
            </Group>
        </div>
    );
}

export default GridLines;
