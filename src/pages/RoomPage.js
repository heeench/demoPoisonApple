import React, { useState, useEffect } from "react";
import '../styles/Room.css';
import ChatBox from "../Room/ChatBox";
import DicePanel from "../dice/DicePanel";
import Map from "../Room/Map";
import { useParams, useNavigate } from "react-router-dom";
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserCircle, faSkull } from "@fortawesome/free-solid-svg-icons";
import { toast } from 'react-toastify';



const RoomPage = () => {
  const { roomId } = useParams();
  const [user, setUser] = useState([]);
  const [email, setEmail] = useState();
  const [nickname, setNick] = useState();
  const [accessToken, setAccessToken] = useState('');
  const [stompClient, setStompClient] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  

  useEffect(() => {
    if (stompClient) {
      const data = {
        'nickname': nickname,
        'email': email, 
        'roomId': roomId
      };
      stompClient.send('/app/users', {}, JSON.stringify(data));
    }
    
  }, [email, nickname, roomId, stompClient]);

  useEffect(() => {
    const getStompConnection = async () => {
      const socket = new SockJS('http://localhost:8080/users');
      const client = Stomp.over(socket);

      client.connect({}, () => {
        console.log('Connected to WebSocket Users');
        setStompClient(client);
      }, error => {
        console.error('Error connecting to WebSocket Users:', error);
      });

      return () => {
        if (client && client.connected) {
          client.disconnect();
          console.log('Disconnected from WebSocket Users');
        }
      };
    };

    getStompConnection();
  }, []);

  useEffect(() => {
    if (stompClient) {
      const subscription = stompClient.subscribe(`/topic/users/${roomId}`, (userData) => {
        try {
          const nicknames = JSON.parse(userData.body); // Распарсить JSON
          setUser(prevUser => [...new Set([...prevUser, ...nicknames])]); // Использовать Set для исключения дубликатов
          console.log('Добавлены никнеймы:', nicknames);
        } catch (error) {
          console.error('Ошибка парсинга JSON:', error);
        }
      });
  
      return () => {
        subscription.unsubscribe();
      };
    }
  }, [stompClient, roomId]);


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
      }
    }
    if (accessToken) {
      getNick();
    }
  }, [accessToken, nickname]);

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
        } 
      } catch (error) {
        console.error('Произошла ошибка')
      }
    }
  
    if (accessToken) {
      fetchContent();
    }
  }, [accessToken, email]);

  
  useEffect(() => {
    const handleWheel = (e) => {
      const target = e.target;
      const isMapComponent = target.classList.contains('grid-container'); 
      if (!isMapComponent && e.ctrlKey) {
        e.preventDefault(); 
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });

    return () => {    
      window.removeEventListener('wheel', handleWheel);
    };
  }, []);

  const homepage = () => {
    navigate('/user');
  };
  
  const toggleUsersList = () => {
    setMenuOpen(!menuOpen);
    console.log('Полученные данные:', user);
  };


  return (
    <div className="hom"> 
      <div className="header" >
      <img className='favicon-room' src="../favicon.png" alt="" onClick={homepage}/> 
      </div>
      <div className="room-page">
        <div className="game-area">
          <div id="grid-container">
          <Map  roomId={roomId} accessToken={accessToken} />
          </div>
        </div>
        <div className="users-list">
          <button className='btn-users-list' onClick={toggleUsersList}>
            <FontAwesomeIcon className='btn-user-list' icon={faUserCircle} />
          </button>
          {menuOpen && (
            <div className="menu-usr">
              {user.map((nickname, index) => ( 
                <div key={index} className="usr">
                  <FontAwesomeIcon icon={faSkull} className="usr-icon" />
                  <strong>{nickname}</strong> 
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="dice-area">
          <DicePanel nickname={nickname} roomId={roomId}/>
        </div>

        <div className="chat-area">
          <ChatBox nickname={nickname} roomId={roomId} accessToken={accessToken}/>
        </div>
      </div>
    </div>
  );
};

export default RoomPage;