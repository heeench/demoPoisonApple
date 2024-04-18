import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDiceD20, faDice } from '@fortawesome/free-solid-svg-icons';

const DiceRoller = ({ sendMessageDice }) => {
    const [selectedDiceType, setSelectedDiceType] = useState('d6');
    const [selectedDiceCount, setSelectedDiceCount] = useState(1);
    const [result, setResult] = useState(null);
    const [menuOpen, setMenuOpen] = useState(false);
    const [showBorder, setShowBorder] = useState(false); 

    const rollDice = () => {
      
      let totalResult = 0;
      for (let i = 0; i < selectedDiceCount; i++) {
        const roll = Math.floor(Math.random() * parseInt(selectedDiceType.slice(1)) + 1);
        totalResult += roll;
      }
      setResult(totalResult);
      setTimeout(() => {
        sendMessageDice(`Бросок кубика: ${totalResult}`, selectedDiceType, selectedDiceCount); 
      }, 1000)
    };
  
    const toggleMenu = () => {
      setMenuOpen(!menuOpen);
    };

    const handleDiceTypeChange = (e) => {
      setSelectedDiceType(e.target.value);
      setShowBorder(e.target.value === 'd20'); 
    };
  
  
    return (
      <div className='dice' style={{ backgroundColor: menuOpen ? '#502424a9' : 'transparent', border: menuOpen ? '0.5px solid rgb(21, 8, 30)' : 'none', 
                                    borderRadius: menuOpen ? '20px' : '', backdropFilter: menuOpen? 'blur(1px)' : '', width: menuOpen? '200px' : '0px',
                                    height: menuOpen? '145px' : '0px'}}> 
      <button className='btn-menu' onClick={toggleMenu} titl="Бросить кубики">
        <FontAwesomeIcon className='d20' icon={faDiceD20} />
      </button>
      {menuOpen && (
        <div className="menu">
          <label htmlFor="diceType" id="diceType">Выберите тип кубика: </label>
          <select id="diceType" value={selectedDiceType} onChange={handleDiceTypeChange}>
            <option value="d4">d4</option>
            <option value="d6">d6</option>
            <option value="d8">d8</option>
            <option value="d10">d10</option>
            <option value="d12">d12</option>
            <option value="d20">d20</option>
            <option value="d100">d100</option>
          </select>
          <div>
            <label htmlFor="diceCount">Выберите количество кубиков: </label>
            <input type="number" id="diceCount" min="1" value={selectedDiceCount} onChange={(e) => setSelectedDiceCount(parseInt(e.target.value))} />
          </div>
        </div>
      )}
      {menuOpen && (
        <button className='roll' onClick={rollDice}> ROLL!!!!
          <FontAwesomeIcon className='dd' icon={faDice}/>
        </button>
      )}
    </div>
  );
};

  
  export default DiceRoller;