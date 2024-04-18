import React, { useEffect } from 'react'; 
import { toast } from 'react-toastify';


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
    accessToken, 
}) => {
    

    const manipulateImage = (modifier) => {
        if (selectedId !== null && !lockedImages[selectedId]) {
            setImages(prevImages => {
                const updatedImages = [...prevImages];
                const [movedImage] = updatedImages.splice(selectedId, 1);
                modifier(updatedImages, movedImage);
                return updatedImages;
            });
        }
    };
    
    const deleteImage = () => {
        manipulateImage((updatedImages) => updatedImages);
        selectShape(null);
    };

    const moveImage = (direction) => {
        manipulateImage((updatedImages, movedImage) => {
            if (direction === 'front') {
                updatedImages.push(movedImage);
            } else {
                updatedImages.unshift(movedImage);
            }
        });
    };

    const toggleLock = () => {
        selectedId !== null && setLockedImages(prevLockedImages => ({
            ...prevLockedImages,
            [selectedId]: !lockedImages[selectedId]
        }));
    };

    const handleOutsideClick = (e) => {
        if (!e.target.closest('.toolbar') && e.target.tagName !== 'IMG') {
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
                <button onClick={toggleLock}>Разблокировать</button>
            ) : (
                <>
                    <button onClick={() => moveImage('front')}>Поместить вперед</button>
                    <button onClick={() => moveImage('back')}>Поместить назад</button>
                    <button onClick={deleteImage}>Удалить</button>
                    <button onClick={toggleLock}>Заблокировать</button>
                </>
            )}
        </div>
    );
}



export default ToolBar;
