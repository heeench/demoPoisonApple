import React, { useState } from 'react';
import '../../styles/MapTool.css';

const MapTool = ({ rows, cols, cellSize }) => {
    const [gridState, setGridState] = useState(Array(rows).fill().map(() => Array(cols).fill("plain")));
    const [walls, setWalls] = useState([]);
    const [drawingMode, setDrawingMode] = useState(false); // Состояние режима рисования

    const handleCellClick = (i, j) => {
        if (!drawingMode) return; // Не обрабатывать клики при выключенном режиме рисования

        if (drawingMode === "wall") {
            // Добавляем стену
            setWalls([...walls, { i, j, orientation: "horizontal" }]);
        } else if (drawingMode === "erase") {
            // Удаляем стены на клетке и соседних клетках
            const newWalls = walls.filter(wall => !(wall.i === i && wall.j === j) && !isWallAdjacent(i, j, wall));
            setWalls(newWalls);
            // Меняем необычную клетку на обычную
            const newGridState = [...gridState];
            newGridState[i][j] = "plain";
            setGridState(newGridState);
        } else {
            // Изменяем тип клетки
            const newGridState = [...gridState];
            newGridState[i][j] = drawingMode;
            setGridState(newGridState);
        }
    };

    const isWallAdjacent = (i, j, wall) => {
        return (wall.i === i && (wall.j === j + 1 || wall.j === j - 1)) || 
               (wall.j === j && (wall.i === i + 1 || wall.i === i - 1)) ;
    };

    const rotateWall = (i, j) => {
        const newWalls = walls.map(wall => {
            if (wall.i === i && wall.j === j) {
                const newOrientation = wall.orientation === "horizontal" ? "vertical" : "horizontal";
                return { ...wall, orientation: newOrientation };
            }
            return wall;
        });
        setWalls(newWalls);
    };

    const renderWalls = () => {
        return walls.map(wall => {
            const { i, j, orientation } = wall;
            const wallColor = "transparent";
            const strokeWidth = 3;
            const wallWidth = orientation === "horizontal" ? cellSize : strokeWidth;
            const wallHeight = orientation === "horizontal" ? strokeWidth : cellSize;
            const x = j * cellSize;
            const y = i * cellSize;
    
            return (
                <rect
                    key={`wall-${i}-${j}`}
                    x={x}
                    y={y}
                    width={wallWidth + 1}
                    height={wallHeight + 1}
                    fill={wallColor}
                    stroke={'black'}
                    strokeWidth={strokeWidth}
                    onContextMenu={(e) => {
                        e.preventDefault();
                        rotateWall(i, j);
                    }}
                />
            );
        });
    };

    const renderGrid = () => {
        const grid = [];
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {

                    let fill;
                    switch (gridState[i][j]) {
                        case "plain":
                            fill = "white";
                            break;
                        case "difficult":
                            fill = "gray";
                            break;
                        default:
                            fill = "white";
                            break;
                    }
    
                    grid.push(
                        <rect
                            key={`cell-${i}-${j}`}
                            x={j * cellSize}
                            y={i * cellSize}
                            width={cellSize}
                            height={cellSize}
                            fill={fill}
                            stroke="black"
                            strokeWidth="1"
                            onClick={() => handleCellClick(i, j)}
                        />
                    );
            }
        }
        return grid;
    };
    
    const handleDrawingModeChange = (mode) => {
        setDrawingMode(mode);
    };

    const toggleDrawingMode = () => {
        setDrawingMode(prevMode => !prevMode);
    };

    return (
        <div className='MapTool'
            onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }}
        >
            <button className="DrawMode" onClick={toggleDrawingMode}>
                {drawingMode ? 'Выключить режим рисования' : 'Включить режим рисования'}
            </button>
            {drawingMode && (
                <div className='DrawMenu'>
                    <button className="PlainMode" onClick={() => handleDrawingModeChange("plain")}>Обычная местность</button>
                    <button className="DiffMode" onClick={() => handleDrawingModeChange("difficult")}>Труднопроходимая местность</button>
                    <button className="WallMode" onClick={() => handleDrawingModeChange("wall")}>Стена</button>
                    <button className="EraseMode" onClick={() => handleDrawingModeChange("erase")}>Ластик</button>
                </div>
            )}

            <svg width={cols * cellSize} height={rows * cellSize} >
                {renderGrid()}
                {renderWalls()}
            </svg>
        </div>
    );
};

export default MapTool;
