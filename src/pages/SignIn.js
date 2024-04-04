import React, { useState} from "react"
import "../styles/Login.css"
import 'boxicons'
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Link, useNavigate } from "react-router-dom";


function SignIn() {
    const navigate = useNavigate()
    

    const [state, setState] = useState({
        email: "",
        password: "",
        showPassword: false // Добавляем состояние для отслеживания отображения пароля
    })

    const togglePasswordVisibility = () => {
        setState(prevState => ({
            ...prevState,
            showPassword: !prevState.showPassword
        }));
    }    


    function fill(e) {
        const { name, value } = e.target; // Деструктурируем значения name и value из события
        setState(prevState => ({
            ...prevState,
            [name]: value // Обновляем только соответствующее поле в состоянии
        }));
    }

    async function handle(e) {
        e.preventDefault(); // Предотвращение отправки формы по умолчанию

        const res = await fetch("http://localhost:8080/api/v1/auth/signin", {
            method: "POST",
            body: JSON.stringify(state),
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (res.ok) {
            const token = await res.text();
            console.log(token)
            localStorage.setItem("access_token", token);
            toast.success('Вы успешно авторизованы!');
            setTimeout(() => {
                navigate("/user"); // Перенаправление на страницу пользователя
                window.location.reload(); // Перезагрузка страницы
            }, 1500);
        } else {
            toast.error('Произошла ошибка при авторизации. Попробуйте авторизоваться снова.');
        }
    }

    // Определяем, какой тип использовать на основе состояния showPassword
    const passwordType = state.showPassword ? 'text' : 'password';

    return (
        <>
        <head> 
            <link rel="shortcut icon" href="/favicon.png"/>
            <meta name="viewport" content="width=device-width, initial-scale=1" />
        </head>

        <div className="page-container">
            
        <div className="login">
        
            <h1>Авторизация</h1>
                
            <form onSubmit={handle}>

                <div className="input-box1">
                    <input name="email" type="email" style={{color: 'white'}} placeholder="Email" value={state.email} onChange={fill} autoComplete="off" />
                    <box-icon name='envelope' color='rgba(255,255,255,.8)'></box-icon>
                </div>
                
                <div className="input-box2">
                    <input name="password" type={passwordType} id='input-pass' style={{color: 'white'}} placeholder="Password" value={state.password} onChange={fill} />
                    <box-icon name='lock' color='rgba(255,255,255,.8)'></box-icon>
                    
                </div>

                <div className="icon-eye">
                    <box-icon name={state.showPassword ? 'show' : 'hide'} id='input-icon' color='rgba(255,255,255,.8)' onClick={togglePasswordVisibility}></box-icon>
                </div>
                
                <div className="btn" >
                    <input type="submit" value="Авторизоваться"/>
                </div>
                

                <div className="remember-forgot">
                    <input type="checkbox"/> 
                    <p>Запомнить меня</p>
                </div>
            </form>

            
            
            <div className="register-link" >
                <p>Нет аккаунта? </p>
                <Link style={{color: 'white'}} to="/signup" className="link">Регистрация</Link>
            </div>
            
        </div>
        </div>
        </>
    )
}

export default SignIn;