import React, { useRef, useState, useEffect } from 'react';
import { Stage, Layer, Transformer } from 'react-konva';
import { toast } from 'react-toastify';
import '../styles/Map.css';
import ToolBar from './ToolBar';
import GridLines from './GridLines';
import ImageItem from './ImageItem';


const Map = ({ roomId, accessToken }) => {
    const [selectedId, selectShape] = useState(null);
    const trRefs = useRef({});
    const [images, setImages] = useState([]);
    const [toolbarVisible, setToolbarVisible] = useState(false);
    const [toolbarPosition, setToolbarPosition] = useState({ x: 0, y: 0 });
    const [lockedImages, setLockedImages] = useState({});
    const [rotation, setRotation] = useState();


    const handleImageUpload = (e) => {
        const file = e.currentTarget.files[0];
        
        if (!file) {
            console.error("File is null or not selected");
            return;
        }
    
        const reader = new FileReader();
    
        reader.onloadend = () => {
            const image = new window.Image();
            image.src = reader.result;
    
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
    
                setImages(prevImages => [
                    ...prevImages,
                    newImage
                ]);
    
                toast.success('Изображение успешно загружено');
            };
        };
    
        reader.onerror = () => {
            console.error('Error reading the file');
            toast.error('Ошибка при чтении файла');
        };    
    
        reader.readAsDataURL(file);
    };

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

        const [scale, setScale] = useState(1);

        return (
            <div className='Map' onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }}>
                <div className="file-upload-container">
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
                            let newScale = scale + e.evt.deltaY * -0.00001;
    
                            const minScale = 1.5;
                            const maxScale = 3.5;
    
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
    
                        <GridLines 
                            windowWidth={window.innerWidth + 30}
                            windowHeight={window.innerHeight - 10}
                            scale={scale}
                        />
                    </Layer>
                </Stage>
            </div>
        );
    }
    
    export default Map;
