import React, { useState, useEffect } from "react";
import '../styles/Room.css';
import ChatBox from "../Room/ChatBox";
import DicePanel from "../dice/DicePanel";
import Map from "../Room/Map";
import { useParams, useNavigate } from "react-router-dom";


const RoomPage = () => {
  const { roomId } = useParams();
  const [nickname, setNick] = useState();
  const [accessToken, setAccessToken] = useState('');
  const navigate = useNavigate();
  

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