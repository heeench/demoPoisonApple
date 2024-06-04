import React, { useEffect, useState } from "react";
import "../../styles/DiceRoll.css";
import DiceRoller from "./DiceRoller";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDiceD20 } from '@fortawesome/free-solid-svg-icons';
import { ThreeDDice } from 'dddice-js';

const UserSetAPIdddice = ({ nickname, roomId, gameMaster, accessToken }) => {
    const [token, setToken] = useState(localStorage.getItem(`${nickname}_token`));
    const [roomSlug, setRoomSlug] = useState(localStorage.getItem(`${roomId}_slug`));
    const [isUserCreated, setIsUserCreated] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);


    useEffect(() => {
        if (token === null || token === undefined) {
        const createGuestUser = () => {    
            const url = new URL("https://dddice.com/api/1.0/user");
            const headers = {
                "Content-Type": "application/json",
                "Accept": "application/json",
            };
            
            fetch(url, {
                method: "POST",
                headers,
                credentials: 'include'
            }).then(response => {
                if (!response.ok) {
                    throw new Error('Failed to create guest user');
                }
                return response.json();
            })
            .then(data => {
                setToken(data.data);
                authUser(data.data);
            })
            .catch(error => console.error('Error:', error));
        };

        if (!isUserCreated) {
            createGuestUser();
        }
    }
    }, [isUserCreated, token]);

    const authUser = (token) => {
        const url = new URL("https://dddice.com/api/1.0/user/token");
        const headers = {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
            "Accept": "application/json",
        };
        
        const body = {
            "name": nickname
        };
        
        fetch(url, {
            method: "POST",
            headers,
            body: JSON.stringify(body),
            credentials: 'include'
        }).then(response => {
            if (!response.ok) {
                throw new Error('Failed to auth user');
            }
            return response.json();
        })
        .then(data => {
            localStorage.setItem(`${nickname}_token`, data.data);
            setToken(data.data);
            if (gameMaster === nickname && (roomSlug !== null || roomSlug !== undefined || roomSlug !== '')) {
                createGuestRoom(data.data);
            }
            setIsUserCreated(true); 
        })
        .catch(error => console.error('Error:', error));
    };

        const createGuestRoom = (token) => {
            const url = new URL("https://dddice.com/api/1.0/room");
            const headers = {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
                "Accept": "application/json",
            };
            
            const body = {
                "is_public": true,
                "name": roomId
            };
            
            fetch(url, {
                method: "POST",
                headers,
                body: JSON.stringify(body),
                credentials: 'include'
            }).then(response => {
                if (!response.ok) {
                    throw new Error('Failed to create guest room');
                }
                return response.json();
            })
            .then(data => {
                setRoomSlug(data.data.slug);
                localStorage.setItem(`${roomId}_slug`, data.data.slug);
                postSlug(data.data.slug);
            })
            .catch(error => console.error('Error:', error));
        };

    
    const joinRoom = (token, slug) => {
        if (slug) {
            const url = new URL(`https://dddice.com/api/1.0/room/${slug}/participant`);
            const headers = {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
                "Accept": "application/json",
            };
            
            fetch(url, {
                method: "POST",
                headers,
                credentials: 'include'
            }).then(response => {
                if (!response.ok) {
                    // throw new Error('Failed to join room');
                }
                return response.json();
            })
            // .catch(error => console.error('Error:', error));
        }
    };

        const postSlug = async(slug) => {
            try {
                const res = await fetch(`http://localhost:8080/api/v1/rooms/diceSlug/${roomId}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${accessToken}`
                    },
                    body: slug 
                });
                if (res.ok) {
                    // console.log('Room slug saved successfully');
                } else {
                    if(gameMaster === nickname) {
                        createGuestRoom(token);
                    }
                    throw new Error('Failed to save room slug');
                }
            } catch (error) {
                console.error('Error:', error);
            }
        };

        useEffect(() => {
            if (gameMaster === nickname && (roomSlug === null || roomSlug === undefined || roomSlug === '')) {
                createGuestRoom(token);
            }
        })

    useEffect(() => {
        const getSlug = async() => {
            try {
                const res = await fetch(`http://localhost:8080/api/v1/rooms/diceSlug/${roomId}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${accessToken}`
                    },
                });
                if (res.ok) {
                    const json = await res.text();
                    if (json !== null || json !== undefined || json !== '') {
                    // console.log('Room slug GET successfully');
                    setRoomSlug(json);
                    localStorage.setItem(`${roomId}_slug`, json);
                    joinRoom(token, json);
                }
                } else {
                    if(gameMaster === nickname) {
                        createGuestRoom(token);
                    }
                    throw new Error('Failed to get room slug');
                }
            } catch (error) {
                console.error('Error:', error);
            }
        };
        getSlug();
    }, [accessToken, createGuestRoom, nickname]);

    // console.log("GuestToken - " + token + "\nRoomSlug - " + roomSlug);

    const toggleMenu = () => {
        setMenuOpen(!menuOpen);
      };

      const [dddice, setDddice] = useState(null);
      
      useEffect(() => {
        if (token || roomSlug || token !== null || roomSlug !== null || token !== undefined || roomSlug !== undefined || token !== '' || roomSlug !== '') {
          const dddiceInstance = new ThreeDDice(document.getElementById("dddice"), token);
          dddiceInstance.start();
          dddiceInstance.connect(roomSlug);
          setDddice(dddiceInstance);
        }
      }, [token, roomSlug]);
    return (
        <div className="dice" >
            <canvas id='dddice' style={{ width: window.innerWidth - 100, height: window.innerHeight - 100 }}></canvas>
            <button className='btn-menu' onClick={toggleMenu} titl='Бросить кубики'>
                <FontAwesomeIcon className='d20' icon={faDiceD20} />
            </button>
            {menuOpen ? (
            <DiceRoller token={token} roomSlug={roomSlug} gameMaster={gameMaster} nickname={nickname} roomId={roomId} />
            ) : null}
        </div>
    );
};

export default UserSetAPIdddice;
