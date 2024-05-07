import React, { useEffect, useState} from 'react'; 
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
    
    const [tokenNameInputVisible, setTokenNameInputVisible] = useState(false);
    const [tkName, setTokenName] = useState('');

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
                selectShape(movedImage);
            } else {
                updatedImages.unshift(movedImage);
                selectShape(null);
            }
        });
    };

    const toggleLock = () => {
        selectedId !== null && setLockedImages(prevLockedImages => ({
            ...prevLockedImages,
            [selectedId]: !lockedImages[selectedId]
        })); selectShape(null);
    };

    const handleOutsideClick = (e) => {
        if (!e.target.closest('.toolbar') && e.target.tagName !== 'IMG') {
            hideToolbar();
            selectShape(null);
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

    const handleTokenNameInput = async () => {
        setTokenNameInputVisible(false);
        setTokenName('');

        try {
            const selectedImage = images[selectedId];
            if (!selectedImage) {
                console.error('Выбранное изображение не найдено');
                return;
            }

            const response = await fetch('http://localhost:8080/api/images/update/tokenName', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
                body: JSON.stringify({
                    imagePath: selectedImage.imagePath,
                    name: selectedImage.name,
                    roomId: selectedImage.roomId,
                    tokenName: tkName,
                    x: selectedImage.x,
                    y: selectedImage.y,
                    scaleX: selectedImage.scaleX,
                    scaleY: selectedImage.scaleY,
                    rotation: selectedImage.rotation,
                    locked: selectedImage.locked
                })
            });

            if (response.ok) {
                const data = await response.json();
                const updatedImages = [...images];
                updatedImages[selectedId] = {
                    ...updatedImages[selectedId],
                    x: data.x,
                    y: data.y,
                    tokenName: data.tokenName
                };
                setImages(updatedImages);
                return updatedImages
                
            } else {
                console.error('Ошибка сохранения имени токена:', response.statusText);
            }
        } catch (error) {
            console.error('Произошла ошибка при отправке запроса:', error);
        }
    };

    const handleTokenNameVisible = () => {
        setTokenNameInputVisible(true)
    }
    const handleClose = () => {
        setTokenNameInputVisible(false)
    }

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
                    <button onClick={handleTokenNameVisible}>Назначить имя токену</button>
                </>
            )}
            {tokenNameInputVisible && (
                <div className='tokenCreate'>
                    <form>
                        <input
                            type="text"
                            value={tkName}
                            placeholder="Введите имя..."
                            onChange={(e) => setTokenName(e.target.value)}
                        />
                        <button onClick={handleTokenNameInput}>Сохранить</button>
                        <button onClick={handleClose}>Отмена</button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default ToolBar;