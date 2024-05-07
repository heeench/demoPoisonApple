import React, { useState, useEffect } from 'react';
import Grid from './Grid';
import MapTool from './MapTool';
import '../../styles/Map.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMinus, faPlus } from '@fortawesome/free-solid-svg-icons';

const Map = () => {
    const [gridVisible, setGridVisible] = useState(true);
    const [constructorMode, setConstructorMode] = useState(false);
    const [scale, setScale] = useState(50);
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    const [windowHeight, setWindowHeight] = useState(window.innerHeight);

    const toggleConstructorMode = () => {
        setConstructorMode(!constructorMode);
    };

    const showGrid = () => {
        setGridVisible(true);
    }

    const hideGrid = () => {
        setGridVisible(false);
    }

    const [gridRows, setGridRows] = useState(Math.floor(windowHeight / scale + 10));
    const [gridCols, setGridCols] = useState(Math.floor(windowWidth / scale));

    useEffect(() => {
        const handleResize = () => {
            setWindowWidth(window.innerWidth);
            setWindowHeight(window.innerHeight);
            setGridRows(Math.floor(window.innerHeight / scale + 10));
            setGridCols(Math.floor(window.innerWidth / scale));
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, [scale]);

    useEffect(() => {
        const handleWheel = (e) => {
            if (e.ctrlKey) {
                e.preventDefault();
                // Определяем направление прокрутки колеса мыши
                const delta = Math.sign(e.deltaY);
                // Определяем новый масштаб
                let newScale = scale + delta * -0.5;
    
                const minScale = 20;
                const maxScale = 80;
    
                newScale = Math.min(maxScale, Math.max(minScale, newScale));
                setScale(newScale);
            }
        };
    
        window.addEventListener('wheel', handleWheel, { passive: false });
    
        return () => {
            window.removeEventListener('wheel', handleWheel);
        };
    }, [scale]);

    // Вычисляем новое количество строк и столбцов в зависимости от размера окна и масштаба
    const rows = Math.floor(windowHeight / scale + 10);
    const cols = Math.floor(windowWidth / scale);

    return (
        <div className='Map' >
            {gridVisible && (
                <div className='gridRange'>
                    <FontAwesomeIcon className='plus' icon={faPlus} color='rgba(255,255,255,.8)'></FontAwesomeIcon>
                    <FontAwesomeIcon className='minus' icon={faMinus} color='rgba(255,255,255,.8)'></FontAwesomeIcon>
                    <input 
                        className='gridInput'
                        type='range'
                        max={80}
                        min={20}
                        step={0.5}
                        value={scale} 
                        onChange={(e) => setScale(parseFloat(e.target.value))}
                        titl="Масштаб сетки"
                    />
                    <span className='gridInputValue'>{Math.round((scale - 20) / (80 - 20) * 100)}%</span>
                </div>
            )}
            <label className={gridVisible ? "switch" : "switch-on"} titl={gridVisible ? "Скрыть сетку" : "Показать сетку"}>
                <input type="checkbox" checked={gridVisible} onChange={gridVisible ? hideGrid : showGrid}  />
                <span className="slider round"></span>
            </label>
            <div className='game-Area'>
                <div className='grid'>
                <Grid rows={gridRows} cols={gridCols} cellSize={scale} />
                </div>
            </div>
        </div>
    );
};

export default Map;
