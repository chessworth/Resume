import React, { useState } from 'react';
import logo from './logo.svg';
import './App.css';
import { Route, Routes } from 'react-router-dom';
import { useContext } from 'react';
import { UserStateContext } from './components/nav/UserStateContext';
import Game from './pages/tic_tac_toe/components/game';
import Nav from './components/nav/Nav';

function App() {
  const lightMode = useContext(UserStateContext);
  return (
    <>
    <Nav />
    <Routes>
            <Route path="/" element={<div />} />
            <Route path="/game" element={<Game />} />
    </Routes>
    </>
  );
}

export default App;
