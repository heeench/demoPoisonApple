import React, { useState} from "react"
import "../styles/Login.css"
import { Link, useNavigate } from "react-router-dom"
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';



function SignUp() {
    const navigate = useNavigate();

    const [state, setState] = useState({
        email: "",
        nickname: "",
        password: ""
    });

    const [showPassword, setShowPassword] = useState(false);

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    async function handle(e) {
        e.preventDefault(); // Предотвращение отправки формы по умолчанию

        if (!state.email || !state.nickname || !state.password) {
            toast.error("Все поля регистрации должны быть заполнены")
            return;
        }

        const res = await fetch("http://localhost:8080/api/v1/auth/signup", {
            method: "POST",
            body: JSON.stringify(state),
            headers: {
                "Content-Type": "application/json"
            },
        });

        if (res.ok) {
            const token = await res.text();
            console.log(token)
            localStorage.setItem("access_token", token)
            toast.success("Вы успешно прошли регистрацию!")
            setTimeout(() => {
                navigate("/user"); // Перенаправление на страницу пользователя
                window.location.reload(); // Перезагрузка страницы
            }, 1500);
        } else {
            toast.error("Произошла ошибка при регистрации. Попробуйте пройти регистрацию снова.");
        }
    }

    function handleChange(e) {
        const { name, value } = e.target;
        
        setState(prevState => ({
            ...prevState,
            [name]: value
        }));
    }

    return (
        <>
            <head> 
                <link rel="shortcut icon" href="/favicon.png"/>
                <meta name="viewport" content="width=device-width, initial-scale=1" />
            </head>

            <div className="page-container">
            <div className="login">
            <h1>Регистрация</h1>
                <form onSubmit={handle}>
                    <div className="input-box">
                        <input name="email" type="email" style={{color: 'white'}} value={state.email} placeholder="Email" onChange={handleChange} autoComplete="off" />
                        <box-icon name='envelope' color='rgba(255,255,255,.8)'></box-icon>
                    </div>
                    <div className="input-box1">
                        <input name="nickname" type="text" style={{color: 'white'}} value={state.nickname} placeholder="Username" onChange={handleChange} autoComplete="off" />
                        <box-icon name='user-circle' color='rgba(255,255,255,.8)'></box-icon>
                    </div>
                    <div className="input-box2">
                        <input name="password" type={showPassword ? 'text' : 'password'} style={{color: 'white'}} value={state.password} placeholder="Password" onChange={handleChange} />
                        <box-icon name='lock' color='rgba(255,255,255,.8)'></box-icon>
                    </div>

                    <div className="icon-eye1">
                        <box-icon name={showPassword ? 'show' : 'hide'} id='input-icon' color='rgba(255,255,255,.8)' onClick={togglePasswordVisibility}></box-icon>
                    </div>
                    <div className="btn" >
                        <input type="submit" value="Зарегистрироваться" />
                    </div>
                </form>
                <div className="login-link">
                    <p>Уже есть аккаунт?</p>
                    <Link to="/signin" id="link" className="link" style={{color: 'white'}}>Авторизоваться</Link>
                </div>
            </div>
            </div>
        </>
    );
}

export default SignUp;