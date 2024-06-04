import React, { useState, useEffect } from 'react';
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';
import '../../styles/Dice.css';
import icon_d4 from '../../assets/game-icons--d4.png';
import icon_d6 from '../../assets/game-icons--perspective-dice-six.png';
import icon_d8 from '../../assets/game-icons--dice-eight-faces-eight.png';
import icon_d10 from '../../assets/game-icons--d10.png';
import icon_d12 from '../../assets/game-icons--d12.png';
import icon_d20 from '../../assets/game-icons--dice-twenty-faces-twenty.png';
import { toast } from 'react-toastify';

const diceIcons = {
  d4: icon_d4,
  d6: icon_d6,
  d8: icon_d8,
  d10: icon_d10,
  d12: icon_d12,
  d20: icon_d20
};

const DiceRoller = ({ token, roomSlug, gameMaster, nickname, roomId }) => {
  const [formula, setFormula] = useState('');
  const [result, setResult] = useState('');
  const [activationCode, setActivationCode] = useState(localStorage.getItem('activationCode') || '');
  const [activationSecret, setActivationSecret] = useState(localStorage.getItem('activationSecret') || '');
  const [apiKey, setApiKey] = useState('');
  const [activationStatus, setActivationStatus] = useState(false);
  const [isHidden, setIsHidden] = useState(false);

  const generateActivationCode = () => {
    if (token !== '[object Object]' && roomSlug !== '[object Object]' && gameMaster === nickname) {
      const url = new URL("https://dddice.com/api/1.0/activate");
      const headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
      };

      fetch(url, {
        method: "POST",
        headers,
        credentials: 'include'
      })
        .then(response => {
          if (!response.ok) {
            throw new Error('Failed to generate activation code');
          }
          return response.json();
        })
        .then(data => {
          setActivationCode(data.data.code);
          setActivationSecret(data.data.secret);
          localStorage.setItem('activationCode', data.data.code);
          localStorage.setItem('activationSecret', data.data.secret);
          pollActivationStatus(data.data.code, data.data.secret);
        })
        .catch(error => console.error('Error:', error));
    }
  };

  const pollActivationStatus = (code, secret) => {
    if (token !== '[object Object]' && roomSlug !== '[object Object]' && gameMaster === nickname) {
      const intervalId = setInterval(() => {
        const url = new URL(`https://dddice.com/api/1.0/activate/${code}`);
        const headers = {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Secret ${secret}`,
        };

        fetch(url, {
          method: "GET",
          headers,
          credentials: 'include'
        })
          .then(response => response.json())
          .then(data => {
            if (data.data.token) {
              setApiKey(data.data.token);
              setActivationStatus(true);
              clearInterval(intervalId);
              localStorage.removeItem('activationCode');
              localStorage.removeItem('activationSecret');
            }
          })
          .catch(error => console.error('Error:', error));
      }, 5000);
    }
  };

  const handleDiceClick = (type) => {
    const newFormula = updateFormula(formula, type);
    setFormula(newFormula);
  };

  const updateFormula = (currentFormula, type) => {
    const regex = new RegExp(`(\\d*)${type}`, 'g');
    const match = regex.exec(currentFormula);

    if (match) {
      const count = parseInt(match[1] || '1', 10) + 1;
      return currentFormula.replace(regex, `${count}${type}`);
    }

    return currentFormula ? `${currentFormula} + 1${type}` : `1${type}`;
  };

  const parseFormula = (formula) => {
    const regex = /(\d+)(d\d+)/g;
    let match;
    const diceSettings = [];

    while ((match = regex.exec(formula)) !== null) {
      diceSettings.push({ type: match[2], count: parseInt(match[1], 10) });
    }

    return diceSettings;
  };

  const resultRoll = () => {
    if (!formula) {
      toast.warning('Пожалуйста, выберите кубик');
      return;
    }
    const diceSettings = parseFormula(formula);
    let totalResult = 0;
    let rollResults = [];

    diceSettings.forEach(dice => {
      for (let i = 0; i < dice.count; i++) {
        const roll = Math.floor(Math.random() * parseInt(dice.type.slice(1)) + 1);
        totalResult += roll;
        rollResults.push({ type: dice.type, result: roll });
      }
    });

    setResult(`Итого: ${totalResult}\n${rollResults.map(r => `${r.type}: ${r.result}`).join('\n')}`);
    setTimeout(() => {
      sendMessageDice(`Выбросил ${totalResult}`, formula); 
    }, 1500)
    rollDice(rollResults);
    clearFormula();
  };

  const rollDice = (rollResults) => {
    if (!token) {
      toast.warning('Пожалуйста, сгенерируйте код активации и после выполните показанную инструкцию для броска кубиков');
      return;
    }
    const url = new URL("https://dddice.com/api/1.0/roll");
    const headers = {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
      "Accept": "application/json",
    };

    const body = {
      "dice": rollResults.map(dice => ({
        "type": dice.type,
        "theme": "dddice-bees",
        "value": dice.result,
        "is_hidden": isHidden
      })),
      "room": `${roomSlug}`,
    };

    fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      credentials: 'include'
    })
      .then(response => response.json());
  };

  const clearFormula = () => {
    setFormula('');
  };

  const hideRoll = () => {
    setIsHidden(prev => !prev);
  };

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

  const sendMessageDice = (message, formula) => {
    if (stompClient && message.trim() !== '') {
      const data = {
        'sender': nickname,
        'roomId': roomId,
        'message': `${message} (${formula})`, 
      };
      stompClient.send('/app/chat', {}, JSON.stringify(data));
    }
  };
  return (
    <div className="diced">
      <div className="dice-menu" style={{height: (!activationStatus || gameMaster === nickname || roomSlug === null) ? '150px':'250px' }}>
      <div className='dice-type'>
        {Object.keys(diceIcons).map((type) => (
          <div key={type} className="dice-setting">
            <img
              src={diceIcons[type]}
              alt={type}
              width="42"
              height="42"
              onClick={() => handleDiceClick(type)}
              style={{ cursor: 'pointer' }}
            />
          </div>
        ))}
      </div>
        <button className='roll' onClick={resultRoll}>Бросить кубики!</button>
        <button className='clearRoll' onClick={clearFormula}>Очистить формулу</button>
        <button className='hideRoll' onClick={hideRoll}>{isHidden ? 'Показать бросок' : 'Скрыть бросок'}</button>
        <p className='formula'>Формула: {formula}</p>
        {!activationStatus || gameMaster === nickname || roomSlug === null (
        <div className='act'>
          <button className="activation" onClick={generateActivationCode}>Сгенерировать активационный код</button>
          {activationCode && gameMaster === nickname && roomSlug === null && (
            <div>
              <p className='actcode'>Активацонный код: {activationCode}</p>
              <p className='actproc'>Пожалуйста перейдите по ссылке <a href="https://dddice.com/activate" target="_blank" rel="noopener noreferrer">dddice.com/activate</a> и введите код</p>
            </div>
          )}
        </div>
      )}
      </div>
      
      
    </div>
  );
}

export default DiceRoller;
