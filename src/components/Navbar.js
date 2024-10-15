import React, { useEffect, useState} from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "../styles/Navbar.css"
import { toast } from 'react-toastify';
import 'boxicons'

const Navbar = () => {
  const [accessToken, setAccessToken] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

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
    <nav className="navbar-links" style={window.location.pathname === '/user' ? ({background: '#2e271e5e',
      backdropfilter: 'blur(2px)'}) : 
      (window.localStorage.pathname === '/signin' || window.localStorage.pathname === '/signup') ? ({background: 'white', backdropfilter: 'blur(2px)'}) : ({background: '#2e271e5e', backdropfilter: 'blur(2px)'}) }>
      <div className="container-logo">
      <img className="logo" src="../favicon.png" alt="" onClick={homepage} ></img>
      </div>
      <ul className="nav-links" >
        {accessToken ? (
          <>
          {window.location.pathname !== '/user' ? (
            <li className="user-link">
              <Link style={{color: 'white', textDecoration: 'none'}} to="/user">Комнаты</Link>
            </li>
          ) : null}
            <li className="loqout-link" onClick={logout}>
              <Link style={{color: 'white', textDecoration: 'none'}} to="/">Выйти из аккаунта</Link>
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
        {window.location.pathname !== '/' ? (
        <li className="home-link">
          <Link style={{color: 'white', textDecoration: 'none'}} to="/">Главная страница</Link>
        </li>
        ) : null}
        
      </ul>
    </nav>
  );
};


export default Navbar;