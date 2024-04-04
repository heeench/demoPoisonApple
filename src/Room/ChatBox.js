import '../styles/ChatBox.css';
import React, { useState, useEffect } from 'react';
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';


const ChatBox = ({ nickname, roomId }) => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [stompClient, setStompClient] = useState(null);
  const [collapsed, setCollapsed] = useState(false);  

  const sendMessage = (client) => {
    if (stompClient && inputValue.trim() !== '') {
      const data = {
        'sender': nickname,
        'roomId': roomId,
        'message': inputValue,
      };
      stompClient.send('/app/chat', {}, JSON.stringify(data));
      setInputValue('');
    }
  };
  useEffect(() => {
    const getStompConnection = async () => {
      const socket = new SockJS('http://localhost:8080/chat');
      const client = Stomp.over(socket);

      client.connect({}, () => {
        console.log('Connected to WebSocket Chat');
        setStompClient(client);
      }, error => {
        console.error('Error connecting to WebSocket Chat:', error);
      });

      return () => {
        if (client && client.connected) {
          client.disconnect();
          console.log('Disconnected from WebSocket Chat');
        }
      };
    };

    getStompConnection();
  }, []);

  useEffect(() => {
    if (stompClient) {
      const subscription = stompClient.subscribe(`/topic/messages/${roomId}`, (message) => {
        const newMessage = JSON.parse(message.body);
        setMessages(prevMessages => [...prevMessages, newMessage]);
      });
  
      return () => {
        subscription.unsubscribe();
      };
    }
  }, [stompClient, roomId]);
  

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      sendMessage(stompClient);
    }
  };

  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
  };


  return (
    <div className={`chat-container ${collapsed ? 'collapsed' : ''}`}> 
      {!collapsed && (
        <div className="chat">
          <div className='chat-messages'>
          {messages.map((msg, index) => (
            <div key={index} className="chat-message">
              <strong>{msg.sender}:</strong> {msg.message}
            </div>
          
          ))}
          </div>
      <input className='input-container'
        type="text"
        placeholder="Введите сообщение..."
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyPress}
      />
      
      <button className='button' onClick={sendMessage}>
        <box-icon name='send' className='icon-btn' color='rgba(255,255,255,.8)'></box-icon>
      </button>
      </div>
      )}
      <button className='toggle-button' onClick={toggleCollapsed}>
        <box-icon name={collapsed ? 'chevron-right' : 'chevron-left'} className='icon-butn' color='white'></box-icon>
      </button>
    </div>
  );
}

export default ChatBox;
