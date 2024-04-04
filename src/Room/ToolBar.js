import React, { useEffect } from 'react'; 


const ToolBar = ({
    images,
    selectedId,
    selectShape,
    setImages,
    showToolbar,
    hideToolbar,
    toolbarPosition = { x: 0, y: 0 }, 
    lockedImages,
    setLockedImages,
}) => {
    

    const bringToFront = () => {
        if (selectedId !== null && selectedId < images.length - 1 && !lockedImages[selectedId]) {
            setImages(prevImages => {
                const updatedImages = [...prevImages];
                const [movedImage] = updatedImages.splice(selectedId, 1);
                updatedImages.push(movedImage);
                return updatedImages;
            });
        }
    };
    
    const sendToBack = () => {
        if (selectedId !== null && selectedId > 0 && !lockedImages[selectedId]) {
            setImages(prevImages => {
                const updatedImages = [...prevImages];
                const [movedImage] = updatedImages.splice(selectedId, 1);
                updatedImages.unshift(movedImage);
                return updatedImages;
            });
        }
    };
    

    const deleteImage = () => {
        if (selectedId !== null) {
            setImages(prevImages => {
                const updatedImages = [...prevImages];
                updatedImages.splice(selectedId, 1);
                return updatedImages;
            });
            selectShape(null);
        }
    };
    

    const lockImage = () => {
        if (selectedId !== null && !lockedImages[selectedId]) {
            setLockedImages(prevLockedImages => ({
                ...prevLockedImages,
                [selectedId]: true
            }));
        }
    };
    
    const unlockImage = () => {
        if (selectedId !== null && lockedImages[selectedId]) {
            setLockedImages(prevLockedImages => ({
                ...prevLockedImages,
                [selectedId]: false
            }));
        }
    };
    

    const handleOutsideClick = (e) => {
        if (!e.target.closest('.toolbar') && !e.target.closest('Image')) {
            hideToolbar();
        }
    };

    useEffect(() => {
        document.addEventListener('mousedown', handleOutsideClick);
        return () => {
            document.removeEventListener('mousedown', handleOutsideClick);
        };
    }, []);
    
    const toolbarStyle = {
        top: `${toolbarPosition.y}px`,
        left: `${toolbarPosition.x}px`,
    };

    return (
        <div className="toolbar" style={toolbarStyle}>
            {lockedImages[selectedId] ? (
                <button onClick={unlockImage}>Разблокировать</button>
            ) : (
                <>
                    <button onClick={bringToFront}>Поместить вперед</button>
                    <button onClick={sendToBack}>Поместить назад</button>
                    <button onClick={deleteImage}>Удалить</button>
                    <button onClick={lockImage}>Заблокировать</button>
                </>
            )}

        </div>
    );
}

export default ToolBar;
