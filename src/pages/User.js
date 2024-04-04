import { useEffect, useState, useCallback } from "react";
import React from 'react';
import "../styles/User.css"
import { toast } from 'react-toastify';
import { useNavigate } from "react-router-dom/dist/umd/react-router-dom.development";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDungeon } from '@fortawesome/free-solid-svg-icons';


const User = () => {
    const [email, setEmail] = useState('');
    const [nickname, setNick] = useState('');
    const [accessToken, setAccessToken] = useState('');
    const [rooms, setRooms] = useState([]);
    const [roomName, setRoomName] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const navigate = useNavigate()

    useEffect(() => {
      const tokenString = localStorage.getItem('access_token');
      if (tokenString) {
        const tokenObject = JSON.parse(tokenString);
        const cleanToken = tokenObject.access_token;
        setAccessToken(cleanToken);
      }
    }, []);

    useEffect(() => {
      async function getNick() {
        try {
          const res = await fetch('http://localhost:8080/api/v1/secured/user', {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`
            },
          });
          if (res.ok) {
            const json = await res.text();
            setNick(json);
          }
        } catch (error) {
          console.error('Ошибка:', error);
          toast.error('Произошла ошибка')
        }
      }
      if (accessToken) {
        getNick();
      }
    }, [accessToken, nickname]);
      
    const logout = async () => {
      try {
          const res = await fetch("http://localhost:8080/api/v1/auth/logout", {
              method: "POST",
              headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${accessToken}`
              },
          });

          if (res.ok) {
              localStorage.removeItem("access_token");
              setAccessToken('');
              setTimeout(() => {
                navigate("/signin"); // Перенаправление на страницу пользователя
                window.location.reload(); // Перезагрузка страницы
            }, 1500);
          } 
      } catch (error) {
          toast.error('Произошла неведомая ошибка...');
      }
  }
    useEffect(() => {
      async function fetchContent() {
        try {
          const res = await fetch('http://localhost:8080/api/v1/secured/user/email', {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`
            },
          });
          if (res.ok) {
            const json = await res.text();
            setEmail(json);
          } else {
            toast.error('Ваша сессия закончилась, либо вы не авторизованы!')
            logout()
          }
        } catch (error) {
          toast.error('Произошла ошибка')
        }
      }
    
      if (accessToken) {
        fetchContent();
      }
    }, [accessToken, email]);

    const fetchRooms = useCallback(async () => {
      try {
        const res = await fetch(`http://localhost:8080/api/v1/rooms?email=${email}`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
        });
        if (res.ok) {
          const roomsData = await res.json();
          setRooms(roomsData);
        } else {
          throw new Error('Ошибка при загрузке комнат');
        }
      } catch (error) {
        console.error('Ошибка при загрузке комнат:', error);
        toast.error('Произошла ошибка при загрузке комнат');
      }
  }, [email, accessToken]);

    useEffect(() => {
        if (accessToken) {
          fetchRooms();
        }
      }, [accessToken, fetchRooms]);

    const handleRoomNameChange = (e) => {
      setRoomName(e.target.value);
    };

    const handleCreateRoom = async (e) => {
        e.preventDefault();
        if (!roomName.trim()) {
          toast.error('Пожалуйста, введите название комнаты.');
          return;
      }
        try {
            const res = await fetch(`http://localhost:8080/api/v1/rooms/create?email=${email}`, {
                method: 'POST',
                headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
                },
                body: JSON.stringify({ name: roomName, email: email })
            });
            if (res.ok) {
                console.log(accessToken);
                fetchRooms();
                setRoomName('');
                setIsFormOpen(false);
                toast.success('Вы успешно создали комнату!');
            } else {
                toast.error('Вы не авторизованы! Пожалуйста, войдите в аккаунт');
                navigate('/signin')
            }
        } catch (error) {
            toast.error('Произошла ошибка при создании комнат');
        }
    };

    const toggleForm = () => {
        setIsFormOpen(!isFormOpen);
    };

    const handleEscapeKeyPress = (e) => {
        if (e.key === 'Escape') {
            setIsFormOpen(false);
        }
    };

    useEffect(() => {
        document.addEventListener('keydown', handleEscapeKeyPress);
        return () => {
            document.removeEventListener('keydown', handleEscapeKeyPress);
        };
    }, []);

    const enterRoom = async (roomId) => {
      try {
        const response = await fetch(`http://localhost:8080/api/v1/rooms/${roomId}`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
            },
        });
        if (response.ok) {
          const roomId = await response.json();
          navigate(`/room/${roomId}`);
          toast.success("Добро пожаловать в комнату! Хорошей игры!");
        } else {
          toast.error("Произошла ошибка при входе в комнату.");
        }
      } catch (error) {
        console.error("Ошибка:", error);
        toast.error("Произошла ошибка при входе в комнату.");
      }
    };


    return (
        <div className="User">
            <div className="UserPage">
                {accessToken ? <p>Добро пожаловать, {nickname}! </p>
                : <p>UNAUTHORIZED</p>}
                <button onClick={toggleForm}>
                    <span className="button-txt">Создать комнату <FontAwesomeIcon icon={faDungeon} /></span>
                    
                </button>
                {isFormOpen && (
                    <div className="create-room-form-overlay">
                        <div className="create-room-form-container">
                            <form onSubmit={handleCreateRoom}>
                                <label htmlFor="roomName">Название комнаты:</label>
                                <input type="text" id="roomName" name="roomName" value={roomName} onChange={handleRoomNameChange} placeholder="Введите название комнаты..."/>
                                <button className="btn-sub" type="submit">Создать</button>
                                <button className="btn-close" type="button" onClick={toggleForm}>Отмена</button>
                            </form>
                        </div>
                    </div>
                )}
                <div className="room-list">
                    {rooms.map(room => (
                        <div key={room.id} className="room"  onClick={() => enterRoom(room.id)}>
                            <div className="door"></div>
                            <span className="room-name">{room.name}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};


  
  export default User;