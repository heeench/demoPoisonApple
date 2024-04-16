import React, { useRef, useState, useEffect } from 'react';
import { Stage, Layer, Transformer, Group } from 'react-konva';
import { toast } from 'react-toastify';
import '../styles/Map.css';
import ToolBar from './ToolBar';
import GridLines from './GridLines';
import ImageItem from './ImageItem';
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBorderAll, faMinus, faPlus } from '@fortawesome/free-solid-svg-icons';

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
    
        const formData = new FormData();
        formData.append('file', file);
    
        try {
            
            const response = await fetch(`http://localhost:8080/api/images/upload?roomId=${roomId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                },
                body: formData
            });
            
            if (response.ok) {
            } else {
                console.error('Error uploading image:', response.statusText);
                toast.error('Ошибка при загрузке изображения');
            }
            
        } catch (error) {
            console.error('Error uploading image:', error);
            toast.error('Ошибка при загрузке изображения');
        } finally {
            setLoadingImage(false);
            setTimeout(()=>{
                toast.dismiss();
            }, 500
        )
            
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
                const imageUrl = message.body;
                    const image = new Image();
                    image.src = imageUrl;
                    image.onload = () => {
                        const newImage = {
                            img: image,
                            x: 0,
                            y: 0,
                            rotation: 0,
                            scaleX: 1,
                            scaleY: 1,
                            locked: false
                        };
                        setImages(prevImages => [...prevImages, newImage]);
                        setTimeout(()=>{
                            toast.success('Изображение успешно загружено');
                        }, 300
                    )
                    };
    
                    image.onerror = () => {
                        console.error('Error loading image');
                        toast.error('Ошибка при загрузке изображения');
                    };
            });
    
            return () => {
                subscription.unsubscribe();
            };
        }
    }, [stompClient, roomId, accessToken]);
    
    
    
    
    const updateImage = () => {
        if (selectedId !== null && trRefs.current && trRefs.current[selectedId]) {
            const node = trRefs.current[selectedId];
            setImages(prevImages => 
                prevImages.map((image, idx) => 
                    idx === selectedId ? {
                        ...image,
                        x: node.attrs.x,
                        y: node.attrs.y,
                        rotation: node.rotation(),
                        scaleX: node.scaleX(),
                        scaleY: node.scaleY(),
                        locked: lockedImages[selectedId] || false 
                    } : image
                )
            );
        }
    };

        
    const checkDeselect = (e) => {
        const clickedOnTransformer = e.target.getParent()?.className === 'Transformer';
        
        if (!clickedOnTransformer && selectedId < images.length && trRefs.current) {
            const node = trRefs.current[selectedId];
                
            if (node) {
                updateImage(selectedId, node);
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
                    const absoluteTransform = node.getAbsoluteTransform();
                    
                    if (absoluteTransform && !lockedImages[selectedId]) {
                        updateImage(selectedId, node);
                    }
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
                        <label htmlFor="file-upload" className="file-upload-label">
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
                    />
                    <span className='gridInputValue'>{Math.round((scale - 1.68) / (4.01 - 1.7) * 100)}%</span>
                    </div>
                    )}
                    <label className={gridVisible ? "switch" : "switch-on"}>
                        <input type="checkbox" checked={gridVisible} onChange={gridVisible ? hideGrid : showGrid} />
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
                                    imgData={imgData.img} 
                                    index={index} 
                                    trRefs={(node) => trRefs.current[index] = node}
                                    selectId={selectedId}
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
