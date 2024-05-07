import React, {useState, useEffect} from 'react';
import { Image, Text } from 'react-konva';

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
    showToolbar,
}) => {

    const { img, x, y, scaleX, scaleY, rotation } = imgData;

    const handleDragEnd = (e) => {
        const pos = e.target.position();
        const imageWidth = img.width * scaleX;
        const imageHeight = img.height * scaleY;
        const stageWidth = window.innerWidth - 100;
        const stageHeight = window.innerHeight + 425;
    
        const minX = -imageWidth / 30;
        const minY = -imageHeight / 15;
        const maxX = stageWidth - imageWidth / 15;
        const maxY = stageHeight - imageHeight / 15;
    
        let newX = pos.x;
        let newY = pos.y;
    
        // Проверяем, не выходит ли новая позиция за границы по оси X
        if (newX < minX) {
            newX = minX;
        } else if (newX > maxX) {
            newX = maxX;
        }
    
        // Проверяем, не выходит ли новая позиция за границы по оси Y
        if (newY < minY) {
            newY = minY;
        } else if (newY > maxY) {
            newY = maxY;
        }
    
        e.target.setAttrs({
            x: newX,
            y: newY,
        });
    
        const updatedImages = [...images];
        updatedImages[index] = {
            ...updatedImages[index],
            x: newX,
            y: newY,
        };
        setImages(updatedImages);
    };
    

    const handleTransformEnd = () => {
        if (selectedId !== null && !locked && trRefs.current && trRefs.current[index]) {
            const node = trRefs.current[index];
            if (node && typeof node === 'object' && typeof node.getAbsoluteTransform === 'function') {
                const { x, y, rotation, scaleX, scaleY } = node.attrs;
                setImages(images.map((image, idx) => {
                    if (idx === selectedId) {
                        return {
                            ...image,
                            x: x,
                            y: y,
                            rotation: rotation,
                            scaleX: scaleX,
                            scaleY: scaleY,
                        };
                    }
                    return image;
                }));
            }
        }
    };

    const handleContextMenu = (e) => {
        e.evt.preventDefault();
        if (e.evt.button === 2) {
            selectShape(index);
            showToolbar(e.evt.clientX, e.evt.clientY);
        }
    };

    const handleDragMove = (e) => {
        const node = e.target;
        const index = selectedId; 
        const { x, y } = node.attrs;
    
        if (!locked) {
            const updatedImages = [...images];
            updatedImages[index] = {
                ...updatedImages[index],
                x: x,
                y: y,
            };
            setImages(updatedImages);
        }
    };

    const handleMouseDown = () => {
        selectShape(index);
    };

    return (
        <>
        <Image
            ref={(node) => trRefs(node, index)}
            image={imgData.img}
            x={imgData.x}
            y={imgData.y}
            tokenName={imgData.tokenName}
            draggable={!locked}
            rotation={imgData.rotation}
            scaleX={imgData.scaleX}
            scaleY={imgData.scaleY}
            onClick={(e) => {
                e.cancelBubble = true;
                if (e.stopPropagation) e.stopPropagation();
                if(!locked) {
                selectShape(index);
                setRotation(e.target.rotation());
                }
            }}
            onContextMenu={handleContextMenu}
            onDragEnd={handleDragEnd}
            onTransformEnd={handleTransformEnd}
            onDragMove={handleDragMove}
            onMouseDown={handleMouseDown}
        />
        {imgData.tokenName && (
            <Text
                x={x}
                y={y - 15}
                text={imgData.tokenName}
                fill='black'
                fontSize={16}
                fontFamily='Vinque'
            />
        )}
    </>
);
}

export default ImageItem;
