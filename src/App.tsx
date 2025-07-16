import './App.css';
import { Route, Routes } from 'react-router-dom';

import Projects from './pages/projects/Projects';
import Nav from './components/nav/Nav';
import Container from './components/container/Container';
import Home from './pages/home/Home';
import PokerTable from './pages/teenpatti/PokerTable';
import Blog from './pages/blog/Blog';
import { useState } from 'react';
import LightDark from './components/lightDark/LightDark';
import { DarkModeContext } from './contexts/DarkModeContext';

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  return (
    <DarkModeContext.Provider value={isDarkMode}>
      <Container>
        <LightDark isDarkMode={isDarkMode} toggleTheme={() => setIsDarkMode(!isDarkMode)} />
        <Nav />
        <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/Resume" element={<Home />} />
                <Route path="/projects" element={<Projects />} />
                <Route path="/teenpatti" element={<PokerTable />} />
                <Route path='/blog' element={<Blog />} />
                <Route path='/contact' /*element={<Contact />}*/ />
                <Route path="*" /*element={<NoMatch />}*/ />
        </Routes>
      </Container>
    </DarkModeContext.Provider>
  );
}

export default App;
