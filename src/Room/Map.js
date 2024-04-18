import React, { useRef, useState, useEffect } from 'react';
import { Stage, Layer, Transformer } from 'react-konva';
import { toast } from 'react-toastify';
import '../styles/Map.css';
import ToolBar from './ToolBar';
import GridLines from './GridLines';
import ImageItem from './ImageItem';
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMinus, faPlus } from '@fortawesome/free-solid-svg-icons';

const Map = ({ roomId, accessToken }) => {
    const [selectedId, selectShape] = useState(null);
    const trRefs = useRef({});
    const [images, setImages] = useState([]);
    const [toolbarVisible, setToolbarVisible] = useState(false);
    const [toolbarPosition, setToolbarPosition] = useState({ x: 0, y: 0 });
    const [lockedImages, setLockedImages] = useState({});
    const [rotation, setRotation] = useState();
    const [stompClient, setStompClient] = useState(null);
    const [loadingImage, setLoadingImage] = useState(false);
    const [gridVisible, setGridVisible] = useState(true);
    const [dataPos, setDataPos] = useState([]);
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
                console.log('Изображения получены:', data);

                data.forEach(imageData => {
                    const imageUrl = imageData.imagePath;
                    const image = new Image();
                    image.src = imageUrl;
                    image.onload = () => {
                        if (!images.some(img => img.img.src === imageUrl)) {
                            console.log(image)
                            const newImage = {
                                img: image,
                                name: imageData.name,
                                imagePath: imageUrl,
                                x: imageData.x,
                                y: imageData.y,
                                rotation: imageData.rotation,
                                scaleX: imageData.scaleX,
                                scaleY: imageData.scaleY,
                                locked: imageData.locked
                            };
                            setImages(prevImages => [...prevImages, newImage]);
                            setTimeout(() => {
                                toast.success('Изображение успешно загружено');
                            }, 300);
                        } else {
                            console.log(`Изображение ${imageUrl} уже загружено`);
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
                window.location.reload()                
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
            console.log('Connected to WebSocket Image');
            setStompClient(client);
            }, error => {
            console.error('Error connecting to WebSocket Image:', error);
            });
    
            return () => {
            if (client && client.connected) {
                client.disconnect();
                console.log('Disconnected from WebSocket Image');
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
            const { name, imagePath } = selectedImage;
    
            const data = {
                roomId: roomId,
                name: name,
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
        const clickedOnTransformer = e.target.getParent()?.className === 'Transformer';
        
        if (!clickedOnTransformer && selectedId !== null && selectedId < images.length && trRefs.current) {
            const node = trRefs.current[selectedId];
                
            if (node) {
                const { x, y, rotation, scaleX, scaleY } = node.attrs;
                updateImage(selectedId, { x, y, rotation, scaleX, scaleY });
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
        
        const [scale, setScale] = useState(2);

        const showGrid = () => {
            setGridVisible(true);
        }
        const hideGrid = () => {
            setGridVisible(false);
        }
        
        
            return (
                <div className='Map' onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                }}>
        
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
                        max={4}
                        min={1.7}
                        step={0.0001}
                        value={scale} 
                        onChange={(e) => setScale(parseFloat(e.target.value))}
                        onClick={(e) => setScale(scale + 0.0001)}
                        titl="Масштаб сетки"
                    />
                    <span className='gridInputValue'>{Math.round((scale - 1.68) / (4.01 - 1.7) * 100)}%</span>
                    </div>
                    )}
                    <label className={gridVisible ? "switch" : "switch-on"} titl={gridVisible ? "Скрыть сетку" : "Показать сетку"}>
                        <input type="checkbox" checked={gridVisible} onChange={gridVisible ? hideGrid : showGrid}  />
                        <span className="slider round"></span>
                    </label>
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
                        onMouseDown={checkDeselect}
                        onTouchStart={checkDeselect}
                        onClick={() => selectShape(null)}
                        onWheel={(e) => {
                            if (e.evt.ctrlKey) {
                                e.evt.preventDefault();
                                let newScale = scale + e.evt.deltaY * -0.0002;
        
                                const minScale = 1.7;
                                const maxScale = 4;
        
                                newScale = Math.min(maxScale, Math.max(minScale, newScale));
                                setScale(newScale);
                            }
                        }}
                    >
                        <Layer>
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
                                showToolbar={showToolbar}
                                draggable={!lockedImages[index]}
                                onClick={(e) => {
                                    selectShape(index);
                                    showToolbar(e.evt.clientX, e.evt.clientY);
                                    checkDeselect(e)
                                    updateImage(index, { x: e.target.x(), y: e.target.y() });
                                }}
                                onDragEnd={(e) => {
                                    if (!lockedImages[index]) {
                                        const node = e.target;
                                        const { x, y } = node.attrs;
                                        updateImage(index, { x, y });
                                    }
                                }}
                                onTransformEnd={() => {
                                    if (!lockedImages[index]) {
                                        const node = trRefs.current[index];
                                        const { x, y, rotation, scaleX, scaleY } = node.attrs;
                                        updateImage(index, { x, y, rotation, scaleX, scaleY });
                                    }
                                }}
                            />
                        ))}
        
                            {selectedId !== null && trRefs.current && trRefs.current[selectedId] && (
                                <Transformer
                                    nodes={[trRefs.current[selectedId]]}
                                    rotateEnabled={true}
                                    enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right', 'top-center', 'bottom-center', 'middle-left', 'middle-right']}
                                    scaleEnabled={true}
                                    onTransformEnd={handleTransformEnd}
                                />
                            )} 
                            {gridVisible && (             
                            <GridLines 
                                windowWidth={window.innerWidth + 30}
                                windowHeight={window.innerHeight - 10}
                                scale={scale}
                            />
                        )}
                        </Layer>
                    </Stage>      
                </div>
            );
        }
        export default Map;