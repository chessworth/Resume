import './App.css';
import { Route, Routes } from 'react-router-dom';
import { useContext } from 'react';
import { UserStateContext } from './components/nav/UserStateContext';

import Game from './pages/game/Game';
import Nav from './components/nav/Nav';
import Container from './components/container/Container';
import Home from './pages/home/Home';
import PokerTable from './pages/teenpatti/PokerTable';
import Blog from './pages/blog/Blog';

function App() {
  const lightMode = useContext(UserStateContext);
  return (
    <Container>
      <Nav />
      <Routes>
              <Route path="/Resume" element={<Home />} />
              <Route path="/game" element={<Game />} />
              <Route path="/teenpatti" element={<PokerTable />} />
              <Route path='/blog' element={<Blog />} />
              <Route path='/contact' /*element={<Contact />}*/ />
              <Route path="*" /*element={<NoMatch />}*/ />
      </Routes>
    </Container>
  );
}

export default App;
