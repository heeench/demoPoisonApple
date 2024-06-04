import React, { memo } from 'react';
import { Image, Text } from 'react-konva';

const ImageItem = React.memo(({
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
    drawingModeTemplate,
    stageWidth,
    stageHeight
}) => {

    const handleDragEnd = (e) => {
        const { x, y } = e.target.position();
        const updatedImages = [...images];
        updatedImages[index] = {
            ...updatedImages[index],
            x,
            y,
        };
        setImages(updatedImages);
    };

    const handleTransformEnd = () => {
        if (selectedId !== null && !locked && trRefs.current && trRefs.current[index]) {
            const { x, y, rotation, scaleX, scaleY } = trRefs.current[index].getAbsoluteTransform();
            setImages(prevImages => prevImages.map((image, idx) => idx === selectedId ? {
                ...image,
                x,
                y,
                rotation,
                scaleX,
                scaleY,
            } : image));
        }
    };

    const handleContextMenu = (e) => {
        e.evt.preventDefault();
        if (e.evt.button === 2) {
            selectShape(index);
            showToolbar(e.evt.clientX, e.evt.clientY);
        }
    };

    const handleMouseDown = () => {
        selectShape(index);
    };

    return (
        <>
            <Image
                ref={node => trRefs(node, index)}
                opacity={drawingModeTemplate ? 0.6 : 1}
                image={imgData.img}
                x={imgData.x}
                y={imgData.y}
                tokenName={imgData.tokenName}
                draggable={!drawingModeTemplate && !locked}
                rotation={imgData.rotation}
                scaleX={imgData.scaleX}
                scaleY={imgData.scaleY}
                onClick={(e) => {
                    e.cancelBubble = true;
                    if (e.stopPropagation) e.stopPropagation();
                    if (!locked || drawingModeTemplate) {
                        selectShape(index);
                        setRotation(e.target.rotation());
                    }
                }}
                onContextMenu={handleContextMenu}
                onDragEnd={handleDragEnd}
                onTransformEnd={handleTransformEnd}
                onMouseDown={handleMouseDown}
            />
            {imgData.tokenName && (
                <Text
                    x={imgData.x}
                    y={imgData.y - 15}
                    text={imgData.tokenName}
                    fill='black'
                    fontSize={16}
                    fontFamily='Vinque'
                />
            )}
        </>
    );
});

export default ImageItem;
