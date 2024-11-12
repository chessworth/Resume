import React, { useState, Component } from 'react';
import logo from './logo.svg';
import './App.css';
import { Route, Routes } from 'react-router-dom';
import { useContext } from 'react';
import { UserStateContext } from './components/nav/UserStateContext';
import Game from './pages/tic_tac_toe/components/game';
import Nav from './components/nav/Nav';
import Container from './components/container/Container';

function App() {
  const lightMode = useContext(UserStateContext);
  return (
    <Container>
      <Nav />
      <Routes>
              <Route path="/" element={<div className='testHome' />} />
              <Route path="/game" element={<Game />} />
              <Route path='/blog' /*element={<Blog />}*/ />
              <Route path='/contact' /*element={<Contact />}*/ />
              <Route path="*" /*element={<NoMatch />}*/ />
      </Routes>
    </Container>
  );
}

export default App;
