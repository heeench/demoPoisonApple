import DiceRoller from "./DiceRoller";
import React, { useState, useEffect } from 'react';
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';
import "../styles/DiceRoll.css"


const DicePanel = ({nickname, roomId}) => {
  const [stompClient, setStompClient] = useState(null);

  useEffect(() => {
    const getStompConnection = async () => {
      const socket = new SockJS('http://localhost:8080/chat');
      const client = Stomp.over(socket);

      client.connect({}, () => {
        console.log('Connected to WebSocket Dice');
        setStompClient(client);
      }, error => {
        console.error('Error connecting to WebSocket Dice:', error);
      });

      return () => {
        if (client && client.connected) {
          client.disconnect();
          console.log('Disconnected from WebSocket Dice');
        }
      };
    };

    getStompConnection();
  }, []);

  const sendMessageDice = (message, diceType, diceCount) => {
    if (stompClient && message.trim() !== '') {
      const data = {
        'sender': nickname,
        'roomId': roomId,
        'message': `${message} (${diceCount}${diceType})`, 
      };
      stompClient.send('/app/chat', {}, JSON.stringify(data));
    }
  };



  return (

    <div className="dice-panel">
      <DiceRoller sendMessageDice={sendMessageDice} />
    </div>
  
  );
};

export default DicePanel;