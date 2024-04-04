import React from 'react';
import { Image } from 'react-konva';

const ImageItem = ({ 
    imgData, 
    index, 
    trRefs,
    selectedId, 
    selectShape, 
    setRotation, 
    images, 
    setImages,
    locked,
    showToolbar  
}) => {

    const handleDragEnd = (e) => {
        if (selectedId !== null && !locked) {
            const updatedImages = images.map((image, idx) => {
                if (idx === selectedId) {
                    return {
                        ...image,
                        x: e.target.x(),
                        y: e.target.y(),
                    };
                }
                return image;
            });
            setImages(updatedImages);
        }
    };

    const handleTransformEnd = (e) => {
        if (!locked) {
            const node = e.target;
            const scaleX = node.scaleX();
            const scaleY = node.scaleY();

            setImages(images.map((image, idx) => {
                if (idx === selectedId) {
                    return {
                        ...image,
                        scaleX: scaleX,
                        scaleY: scaleY,
                        rotation: node.rotation(),
                    };
                }
                return image;
            }));
        }
    };

    const handleContextMenu = (e) => {
        e.evt.preventDefault();
        if (e.evt.button === 2) {
            selectShape(index);
            showToolbar(e.evt.clientX, e.evt.clientY);
        }
    };

    return (
        <Image 
            ref={trRefs}
            image={imgData}  // Use imgData directly here
            x={imgData.x}
            y={imgData.y}
            draggable={!locked}
            rotation={imgData.rotation}
            scaleX={imgData.scaleX}
            scaleY={imgData.scaleY}
            onClick={(e) => { 
                e.cancelBubble = true;
                if (e.stopPropagation) e.stopPropagation();
                selectShape(index);
                setRotation(e.target.rotation());
            }} 
            onContextMenu={handleContextMenu}
            onDragEnd={handleDragEnd}
            onTransformEnd={handleTransformEnd}
        />
    );
}

export default ImageItem;
