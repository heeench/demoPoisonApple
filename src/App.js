import React from 'react';
import Home from "./pages/Home"
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import User from "./pages/User";
import Navbar from "./components/Navbar";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Route, BrowserRouter, Navigate, Routes, useLocation } from 'react-router-dom';
import RoomPage from './pages/RoomPage';

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}


function AppContent() {
  const location = useLocation();

  return (
    <div className="App">
     <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/user" element={<User />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path={`/room/:roomId`} element={<RoomPage />} />
          <Route path="*" element={<Navigate to="/" />} />
          </Routes>
      {/* Условный оператор для рендеринга Navbar */}
      {!location.pathname.includes('/room/') && <Navbar />}
      <ToastContainer theme='dark'/>
    </div>
  );
}

export default App;
