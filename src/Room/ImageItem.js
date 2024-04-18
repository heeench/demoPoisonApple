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
        if (selectedId !== null && !locked && e.target) {
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

    return (
        <Image
            ref={(node) => trRefs(node, index)}
            image={imgData.img}
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
