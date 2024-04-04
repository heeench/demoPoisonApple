import React, { useEffect, useState} from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/Navbar.css"
import { toast } from 'react-toastify';
import 'boxicons'

const Navbar = () => {
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
              toast.success('Вы успешно вышли!');
              setAccessToken('');
              navigate("/"); 
          } else {
              toast.error('Произошла ошибка при выходе из аккаунта...');
          }
      } catch (error) {
          console.error("Произошла ошибка при отправке запроса:", error);
          toast.error('Произошла неведомая ошибка...');
      }
  }

  const homepage = () => {
    navigate('/')
  }


  return (
    <nav className="navbar-links">
      <img src="../favicon.png" alt="" onClick={homepage} ></img>
      <ul className="nav-links">
        {accessToken ? (
          <>
            <li className="user-link">
              <Link style={{color: 'white', textDecoration: 'none'}} to="/user">Комнаты</Link>
             
            </li>
            <li className="loqout-link" onClick={logout}>
              <Link style={{color: 'white', textDecoration: 'none'}} to="/">Выйти</Link>
            </li>
            <box-icon className="icon-logout" name='log-out-circle' color='rgba(255,255,255,.8)' ></box-icon>
            
          </>
        ) : (
          <>
            <li className="signin-link">
              <Link style={{color: 'white', textDecoration: 'none'}} to="/signin">Войти</Link>
            </li>
            <box-icon className="icon-signin" name='log-in-circle' color='rgba(255,255,255,.8)' ></box-icon>
              
            <li className="signup-link">
              <Link style={{color: 'white', textDecoration: 'none'}} to="/signup">Зарегистрироваться</Link>
            </li>
            <box-icon className="icon-signup" name='user-plus' color='rgba(255,255,255,.8)' ></box-icon>
          </>
        )}
        <li className="home-link">
          <Link style={{color: 'white', textDecoration: 'none'}} to="/">Главная страница</Link>
        </li>

        
      </ul>
    </nav>
  );
};


export default Navbar;