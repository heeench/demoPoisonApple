import { Line, Group } from 'react-konva';
import '../styles/Grid.css'
import React, { useState } from 'react';

const GridLines = ({ windowWidth, windowHeight, scale }) => {
    const [strokeWidth, setStrokeWidth] = useState(1);
    const scaledWidth = windowWidth * scale;
    const scaledHeight = windowHeight * scale;

    const numberOfLines = 50;

    const handleChange = (event, newValue) => {
        setStrokeWidth(newValue);
    };

    return (
        <div className="Grid">
            <Group 
                scaleX={scale} 
                scaleY={scale} 
            >
                {Array.from({ length: numberOfLines }, (_, i) => (
                    <Line
                        key={`vertical-${i}`}
                        points={[i * (scaledWidth / numberOfLines), 0, i * (scaledWidth / numberOfLines), scaledHeight ]}
                        stroke="rgba(128, 128, 128, 0.5)"
                        strokeWidth={strokeWidth}
                    />
                ))}
                {Array.from({ length: numberOfLines }, (_, i) => (
                    <Line
                        key={`horizontal-${i}`}
                        points={[0, i * (scaledHeight / numberOfLines), scaledWidth, i * (scaledHeight / numberOfLines)]}
                        stroke="rgba(128, 128, 128, 0.5)"
                        strokeWidth={strokeWidth}
                    />
                ))}
            </Group>
        
        </div>
    );
}

export default GridLines;

