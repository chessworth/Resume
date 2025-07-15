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

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  return (
    <Container>
      <LightDark isDarkMode={isDarkMode} toggleTheme={() => setIsDarkMode(!isDarkMode)} />
      <Nav />
      <Routes>
              <Route path="/Resume" element={<Home />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/teenpatti" element={<PokerTable />} />
              <Route path='/blog' element={<Blog />} />
              <Route path='/contact' /*element={<Contact />}*/ />
              <Route path="*" /*element={<NoMatch />}*/ />
      </Routes>
    </Container>
  );
}

export default App;
