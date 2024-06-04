import React, { useRef, useState, useEffect } from 'react';
import { Stage, Layer, Transformer, Group, Line } from 'react-konva';
import { toast } from 'react-toastify';
import '../../styles/ImageTool.css';
import ToolBar from './ToolBar';
import ImageItem from './ImageItem';
import MapTool from './MapTool';
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMinus, faPlus } from '@fortawesome/free-solid-svg-icons';


const ImageTool = ({ roomId, accessToken }) => {
    const [selectedId, selectShape] = useState(null);
    const trRefs = useRef({});
    const [images, setImages] = useState([]);
    const [toolbarVisible, setToolbarVisible] = useState(false);
    const [toolbarPosition, setToolbarPosition] = useState({ x: 0, y: 0 });
    const [lockedImages, setLockedImages] = useState({});
    const [rotation, setRotation] = useState();
    const [stompClient, setStompClient] = useState(null);
    const [loadingImage, setLoadingImage] = useState(false);
    let isMounted = false;

    const fetchData = async () => {
        try {
            const response = await fetch(`http://localhost:8080/api/images/fetchContent/${roomId}`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                // console.log('Изображения получены:', data);

                data.forEach(imageData => {
                    const imageUrl = imageData.imagePath;
                    const image = new Image();
                    image.src = imageUrl;
                    image.onload = () => {
                        if (!images.some(img => img.img.src === imageUrl)) {
                            const newImage = {
                                img: image,
                                name: imageData.name,
                                imagePath: imageUrl,
                                tokenName: imageData.tokenName,
                                x: imageData.x,
                                y: imageData.y,
                                rotation: imageData.rotation,
                                scaleX: imageData.scaleX,
                                scaleY: imageData.scaleY,
                                locked: imageData.locked
                            };
                            setImages(prevImages => [...prevImages, newImage]);
                            // setTimeout(() => {
                            //     toast.success('Изображение успешно загружено');
                            // }, 300);
                        } else {
                            // console.log(`Изображение ${imageUrl} уже загружено`);
                        }
                    };
                    image.onerror = () => {
                        console.error('Error loading image');
                        toast.error('Ошибка при загрузке изображения');
                    };
                });
                
            } else {
                console.error('Ошибка получения изображений:', response.statusText);
            }
        } catch (error) {
            console.error('Ошибка при запросе изображений:', error);
        }
    };

    useEffect(() => {
        if (!isMounted) {
            fetchData();
        }
    
        return () => {
            isMounted = true;
        };
    }, [isMounted]);
    
    
    const handleImageUpload = async (e) => {
        const file = e.currentTarget.files[0];
        setLoadingImage(true);
        
        if (!file) {
            console.error("File is null or not selected");
            setLoadingImage(false);
            return;   
        } else {
            toast.loading("Подождите... Изображение загружается!");
        }
    
        try {
            const formData = new FormData();
            formData.append('file', file);
    
            const response = await fetch(`http://localhost:8080/api/images/upload?roomId=${roomId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                },
                body: formData
            });
            
            if (response.ok) {
               fetchData()
            } else {
                console.error('Error uploading image:', response.statusText);
                toast.error('Ошибка при загрузке изображения');
            }
            
        } catch (error) {
            console.error('Error uploading image:', error);
            toast.error('Ошибка при загрузке изображения');
        } finally {
            setLoadingImage(false);
            toast.dismiss();
            
        }
    };
    

    useEffect(() => {
        const getStompConnection = async () => {
            const socket = new SockJS('http://localhost:8080/image');
            const client = Stomp.over(socket);
    
            client.connect({}, () => {
            // console.log('Connected to WebSocket Image');
            setStompClient(client);
            }, error => {
            console.error('Error connecting to WebSocket Image:', error);
            });
    
            return () => {
            if (client && client.connected) {
                client.disconnect();
                // console.log('Disconnected from WebSocket Image');
            }
            };
        };
  
      getStompConnection();
    }, []);
  
    useEffect(() => {
        if (stompClient) {
            const subscription = stompClient.subscribe(`/topic/image/upload/${roomId}`, async (message) => {
                const imageData = JSON.parse(message.body);
                const updatedImages = images.map(img => {
                    if (img.imagePath === imageData.imagePath) {
                        return {
                            ...img,
                            roomId: roomId,
                            name: imageData.name,
                            tokenName: imageData.tokenName,
                            imagePath: imageData.imagePath,
                            x: imageData.x,
                            y: imageData.y,
                            rotation: imageData.rotation,
                            scaleX: imageData.scaleX,
                            scaleY: imageData.scaleY,
                            locked: imageData.locked
                        };
                    }
                    return img;
                });
                setImages(updatedImages);
            });
    
            return () => {
                subscription.unsubscribe();
            };
        }
    }, [ roomId, images]);  
 
    const updateImage = (index, newDataPos) => {
        const selectedImage = images[index];
        if (selectedImage && stompClient) { 
            const { name, imagePath, tokenName } = selectedImage;
    
            const data = {
                roomId: roomId,
                name: name,
                tokenName: tokenName,
                imagePath: imagePath,
                x: newDataPos.x,
                y: newDataPos.y,
                rotation: newDataPos.rotation,
                scaleX: newDataPos.scaleX,
                scaleY: newDataPos.scaleY,
                locked: newDataPos.locked
            };
    
            stompClient.send('/app/image', {}, JSON.stringify(data));
    
            const updatedImages = [...images];
            updatedImages[index] = { ...selectedImage, ...newDataPos };
            setImages(updatedImages);
        } else {
            console.error('Изображение не найдено или WebSocket-соединение не установлено');
        }
    };
 
    
    const checkDeselect = (e) => {
        if (e.target && typeof e.target.getParent === 'function') {
            const clickedOnTransformer = e.target.getParent()?.className === 'Transformer';
            
            if (!clickedOnTransformer && selectedId !== null && selectedId < images.length && trRefs.current) {
                const node = trRefs.current[selectedId];
                    
                if (node) {
                    const { x, y, rotation, scaleX, scaleY } = node.attrs;
                    updateImage(selectedId, { x, y, rotation, scaleX, scaleY });
                }
            }
        }
    };
      
    const handleTransformEnd = () => {
        if (
            selectedId !== null &&
            selectedId < images.length &&
            trRefs.current &&
            trRefs.current[selectedId] && 
            !lockedImages[selectedId]     
        ) {
            const node = trRefs.current[selectedId];
            
            if (node && typeof node === 'object' && typeof node.getAbsoluteTransform === 'function' && !lockedImages[selectedId]) {
                const { x, y, rotation, scaleX, scaleY } = node.attrs;
                updateImage(selectedId, { x, y, rotation, scaleX, scaleY });
            }
        }
    };

    useEffect(() => {
        const newRefs = {};
        images.forEach((_, index) => {
            if (trRefs.current[index]) {
                newRefs[index] = trRefs.current[index];
            }
        });
        trRefs.current = newRefs;
    }, [images]);
            
        const showToolbar = (clientX, clientY) => {
            setToolbarPosition({ x: clientX, y: clientY });
            setToolbarVisible(true);  
        };
        
        const hideToolbar = () => {
            setToolbarVisible(false);
        };

    const [gridVisible, setGridVisible] = useState(true);
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    const [windowHeight, setWindowHeight] = useState(window.innerHeight);

    const showGrid = () => {
        setGridVisible(true);
    }

    const hideGrid = () => {
        setGridVisible(false);
    }

    const [scale, setScale] = useState(40);
    const [stageScale, setStageScale] = useState(1);
    const [stageX, setStageX] = useState(0);
    const [stageY, setStageY] = useState(0);

   
    const handleWheel = (e) => {
        if (e.evt.ctrlKey) {
            e.evt.preventDefault();
            const delta = Math.sign(e.evt.deltaY);
            let newScale = scale + delta * -0.5;
            const minScale = 20;
            const maxScale = 80;
            newScale = Math.min(maxScale, Math.max(minScale, newScale));
            setScale(newScale);
                
        } else {
            const scaleBy = 1.05;
            const stage = e.target.getStage();
            const oldScale = stage.scaleX();
            const mousePointTo = {
                x: stage.getPointerPosition().x / oldScale - stage.x() / oldScale,
                y: stage.getPointerPosition().y / oldScale - stage.y() / oldScale,
            };
            let newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
            const minScale = 0.3;
            const maxScale = 10;
            newScale = Math.min(maxScale, Math.max(minScale, newScale));
            setStageScale(newScale);
            setStageX(-(mousePointTo.x - stage.getPointerPosition().x / newScale) * newScale);
            setStageY(-(mousePointTo.y - stage.getPointerPosition().y / newScale) * newScale);
        }
    };
        
    const [drawingMode, setDrawingMode] = useState('');
    const [drawingModeTemplate, setDrawingModeTemplate] = useState(false);

    const handleDrawingModeChange = (mode) => {
        setDrawingMode(mode);
        };

    const toggleDrawingMode = () => {
        setDrawingModeTemplate(prevMode => !prevMode);
        setGridMap(true);
        console.log(drawingModeTemplate);
    };

    const [permitSaveMap, setPermitSaveMap] = useState(false); 

    const saveMap = () => {
        setPermitSaveMap(true);
        setTimeout(() => setPermitSaveMap(false), 1000);
    };

    const renderGrid = () => {
        const lines = [];
        const width = windowWidth * 5;
        const height = windowHeight * 5;

        for (let i = -width; i <= width; i += scale) {
            lines.push(<Line key={`v-${i}`} points={[i, -height, i, height]} stroke="#00000066" strokeWidth={1} />);
        }

        for (let j = -height; j <= height; j += scale) {
            lines.push(<Line key={`h-${j}`} points={[-width, j, width, j]} stroke="#00000066" strokeWidth={1} />);
        }

        return lines;
    };
    
    const limitPositionToBounds = (x, y, scale) => {
        const gridWidth = windowWidth * 5 * scale; // Учитываем масштаб для ширины сетки
        const gridHeight = windowHeight * 5 * scale; // Учитываем масштаб для высоты сетки
        const gridPadding = scale / 2; // Половина размера сетки, чтобы учесть положение границы
    
        // Ограничение координат по всем сторонам
        const limitedX = Math.max(-gridWidth / 2 + gridPadding, Math.min(x, gridWidth / 2 - gridPadding));
        const limitedY = Math.max(-gridHeight / 2 + gridPadding, Math.min(y, gridHeight / 2 - gridPadding));
    
        return { x: limitedX, y: limitedY };
    };
    

    const handleDragMoveStage = (e) => {
        selectShape();
        const node = e.target;
        const stage = node.getStage();
        const position = node.position();
        const stageScale = stage.scaleX();
    
        const { x, y } = limitPositionToBounds(position.x, position.y, stageScale);
    
        node.position({ x, y });
        stage.batchDraw();
    };
    const [gridMap, setGridMap] = useState(false);
    const hideGridMap = () => {
        setGridMap(false);
    }
    const showGridMap = () => {
        setGridMap(true);
    }
    return (
        <div className='Image' onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }}>
            <div className='button-bar'>
                <div className="file-upload-container" >
                    <label htmlFor="file-upload" className="file-upload-label" titl="Загрузить изображение">
                        <box-icon className='imageAdd' name='image-add' color='rgba(255,255,255,.8)'></box-icon> 
                    </label>
                    <input 
                        type="file" 
                        id="file-upload" 
                        onChange={handleImageUpload} 
                        accept="image/*" 
                        className="file-upload-input" 
                    />
                </div>
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

                    <button className="DrawMode" onClick={toggleDrawingMode}>
                        {!drawingModeTemplate ? 'Включить режим рисования' : 'Выключить режим рисования'}
                    </button>
                    {drawingModeTemplate && (
                        <div className='DrawMenu'>
                            <button className="PlainMode" onClick={() => handleDrawingModeChange("plain")}>Обычная местность</button>
                            <button className="DiffMode" onClick={() => handleDrawingModeChange("difficult")}>Труднопроходимая местность</button>
                            <button className="WallMode" onClick={() => handleDrawingModeChange("wall")}>Стена</button>
                            <button className="EraseMode" onClick={() => handleDrawingModeChange("erase")}>Ластик</button>
                            <button className="SaveMode" onClick={() => saveMap()}>Сохранить</button>
                        </div>
                    )}  

                    <label className={gridMap ? "switch-on1" : "switch1"} titl={gridMap ? "Показать конструктор карты" : "Скрыть конструктор карты"}>
                        <input type="checkbox"  checked={gridMap === true} onChange={gridMap ? hideGridMap : showGridMap}  />
                        <span className="slider round1"></span>
                    </label>
                    </div>
                    
                    <div className='gameArea'>
                    {toolbarVisible && (
                        <ToolBar 
                            images={images}
                            selectedId={selectedId}
                            selectShape={selectShape}
                            setImages={setImages}
                            hideToolbar={hideToolbar}
                            showToolbar={showToolbar}
                            toolbarPosition={toolbarPosition}
                            lockedImages={lockedImages}
                            setLockedImages={setLockedImages}
                            accessToken={accessToken}
                        />
                    )}
            
            <Stage
                width={window.innerWidth}
                height={window.innerHeight}
                draggable={!drawingModeTemplate}
                onDragMove={checkDeselect}
                scaleX={stageScale}
                scaleY={stageScale}
                x={stageX}
                y={stageY}
                onWheel={(e) => {
                    if (!e.ctrlKey && !drawingModeTemplate) {
                        handleWheel(e);
                    }
                }}
                onClick={() => selectShape(null)}
            >
                <Layer >
                    <Group>
                        <Group listening={!drawingModeTemplate} >
                            {images.map((imgData, index) => (
                            
                            <ImageItem
                                key={index}
                                imgData={imgData}
                                index={index}
                                trRefs={(node) => trRefs.current[index] = node}
                                selectedId={selectedId}
                                selectShape={selectShape}
                                setRotation={setRotation}
                                images={images}
                                setImages={setImages}
                                locked={lockedImages[index]}
                                drawingModeTemplate={drawingModeTemplate}
                                showToolbar={showToolbar}
                                stageWidth={windowWidth * 5}
                                stageHeight={windowHeight * 5}
                                draggable={!lockedImages[selectedId]}
                                onClick={(e) => {
                                        if (e.nativeEvent.button === 0) {
                                            if (!lockedImages[selectedId]) {
                                                selectShape(index);
                                                showToolbar(e.evt.clientX, e.evt.clientY);
                                                checkDeselect(e);
                                                updateImage(index, { x: e.currentTarget.x(), y: e.currentTarget.y() });
                                            }
                                        }
                                }}
                                onDragEnd={(e) => {
                                    if (!lockedImages[index] || drawingModeTemplate) {
                                        const node = e.target;
                                        const { x, y } = node.attrs;
                                        updateImage(index, { x, y });
                                    }
                                }}
                                onTransformEnd={() => {
                                    if (!lockedImages[index] || drawingModeTemplate) {
                                        const node = trRefs.current[index];
                                        const { x, y, rotation, scaleX, scaleY } = node.attrs;
                                        updateImage(index, { x, y, rotation, scaleX, scaleY });
                                    }
                                }}
                        />              
                    ))}

                    </Group>
                     
                      <Group listening={drawingModeTemplate} >
                      {gridMap && 
                         <MapTool 
                            windowWidth={window.innerWidth}
                            windowHeight={window.innerHeight}
                            cellSize={scale}
                            stageScale={stageScale}
                            stageX={stageX}
                            stageY={stageY}
                            drawingMode={drawingMode}
                            roomId={roomId}
                            token={accessToken}
                            permitSaveMap={permitSaveMap}
                            
                        /> 
                      }
                        </Group>
                        {selectedId !== null && trRefs.current && trRefs.current[selectedId] && (
                            <Transformer
                                nodes={[trRefs.current[selectedId]]}
                                rotateEnabled={true}
                                enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right', 'top-center', 'bottom-center', 'middle-left', 'middle-right']}
                                scaleEnabled={true}
                                onTransformEnd={handleTransformEnd}
                            />
                        )}
                    </Group>
                </Layer>
                <Layer listening={false} fill="transparent">
                    {gridVisible && (
                        renderGrid()
                    )}
                </Layer>
            </Stage>
            </div>  
        </div>
    );
}
export default ImageTool;