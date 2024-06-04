import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Rect, Group } from 'react-konva';
import { toast } from'react-toastify';
import '../../styles/ImageTool.css';

const MapTool = React.memo(({ cellSize, drawingMode, roomId, token, permitSaveMap, stageScale }) => {
    const [gridState, setGridState] = useState(Array(50).fill().map(() => Array(50).fill("plain")));
    const [walls, setWalls] = useState([]);
    let [gridScale, setGridScale] = useState(cellSize);
    const [x, setX] = useState(0);
    const [y, setY] = useState(0);

    const loadMap = useCallback(async () => {
        try {
            const response = await fetch(`http://localhost:8080/api/map/${roomId}/load`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) {
                throw new Error('Failed to load map');
            }
            const data = await response.json();
            setGridState(JSON.parse(data.gridState));
            setWalls(JSON.parse(data.walls));
            setX(JSON.parse(data.x));
            setY(JSON.parse(data.y));
            // toast.success('Конструктор карты успешно загружен');
        } catch (error) {
            console.error('Failed to load map:', error);
        }
    }, [roomId, token]);

    const saveMap = useCallback(async () => {
        if (permitSaveMap) {
            const mapData = {
                gridState: JSON.stringify(gridState),
                walls: JSON.stringify(walls),
                x: JSON.stringify(x),
                y: JSON.stringify(y),
            };
            try {
                const response = await fetch(`http://localhost:8080/api/map/${roomId}/save`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(mapData)
                });
                if (response.ok) {
                    // console.log('Map saved successfully');
                    toast.success('Конструктор карты успешно сохранен');
                } else {
                    console.error('Failed to save map:', response.statusText);
                    toast.error('Конструктор карты не удалось сохранить');
                }
            } catch (error) {
                console.error('Failed to save map:', error);
            }
        }
    }, [gridState, walls, cellSize, permitSaveMap, roomId, token]);

    useEffect(() => {
        loadMap();
    }, [loadMap]);

    useEffect(() => {
        saveMap();
    }, [saveMap, permitSaveMap]);

    const handleCellClick = useCallback((i, j) => {
        if (!drawingMode) return;

        if (drawingMode === "wall") {
            const isWallOnSide = walls.some(wall => wall.i === i && wall.j === j && wall.orientation === "horizontal");
            if (!isWallOnSide) {
                setWalls([...walls, { i, j, orientation: "horizontal" }]);
            }
        } else if (drawingMode === "erase") {
            const newWalls = [];
            setWalls(newWalls);
            const newGridState = [...gridState];
            newGridState[i][j] = "plain";
            setGridState(newGridState);
        } else {
            const newGridState = [...gridState];
            newGridState[i][j] = drawingMode;
            setGridState(newGridState);
        }
    }, [drawingMode, walls, gridState]);

    const rotateWall = useCallback((i, j) => {
        const existingWallIndex = walls.findIndex(wall => wall.i === i && wall.j === j);
        if (existingWallIndex !== -1) {
            const existingWall = walls[existingWallIndex];
            const newOrientation = existingWall.orientation === "horizontal" ? "vertical" : "horizontal";
            const newWalls = walls.map((wall, index) => {
                if (index === existingWallIndex) {
                    return { ...wall, orientation: newOrientation };
                }
                return wall;
            });
            setWalls(newWalls);
        } else {
            const newOrientation = Math.random() < 0.5 ? "horizontal" : "vertical";
            const newWall = { i, j, orientation: newOrientation };
            const newWalls = [...walls, newWall];
            setWalls(newWalls);
        }
    }, [walls]);

    const renderWalls = useMemo(() => {
        if (!Array.isArray(walls)) {
            return null;
        }
        return walls.map((wall, index) => { 
            const { i, j, orientation } = wall;
            const wallColor = "transparent";
            const strokeWidth = 2;
            const wallWidth = orientation === "horizontal" ? cellSize : strokeWidth;
            const wallHeight = orientation === "horizontal" ? strokeWidth : cellSize;
            const x = j * cellSize;
            const y = i * cellSize;

            return (
                <Rect
                    key={`wall-${i}-${j}-${index}`}
                    x={x}
                    y={y}
                    width={wallWidth + 1}
                    height={wallHeight + 1}
                    fill={wallColor}
                    stroke={'black'}
                    strokeWidth={strokeWidth}
                    onContextMenu={(e) => {
                        e.evt.preventDefault();
                        rotateWall(i, j);
                    }}
                />
            );
        });
    }, [walls, cellSize]);

    const renderGrid = useMemo(() => {
        if (!gridState || gridState.length === 0) {
            return null; 
        }
        
        return gridState.flatMap((row, i) => {
            return row.map((cell, j) => { 
                let fill;
                let strokeWidth;
                switch (cell) {
                    case "plain":
                        fill = "grey";
                        strokeWidth = 0.4;
                        break;
                    case "difficult":
                        fill = "black";
                        strokeWidth = 1.5;
                        break;
                    default:
                        fill = "grey";
                        strokeWidth = 0.4;
                        break;
                }

                return (
                    <Rect
                        key={`cell-${i}-${j}`}
                        x={j * cellSize}
                        y={i * cellSize}
                        width={cellSize}
                        height={cellSize}
                        fill="transparent"
                        stroke={fill}
                        strokeWidth={strokeWidth}
                        onClick={(e) => (e.evt.button === 0) ? handleCellClick(i, j) : rotateWall(i, j)}
                    />
                );
            });
        });
    }, [gridState, cellSize, handleCellClick, rotateWall]);

    const handleGroupDrag = (e) => {
        const newX = x + e.evt.movementX;
        const newY = y + e.evt.movementY;
        setX(newX);
        setY(newY);
    };
    

    return (
        <Group 
        draggable 
        x={x}
        y={y}
        onDragMove={(e) => handleGroupDrag(e)}>
            {renderGrid}
            {renderWalls}
        </Group>
    );
});

export default MapTool;
