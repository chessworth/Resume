import './App.css';
import { Route, Routes } from 'react-router-dom';

import Projects from './pages/projects/Projects';
import Nav from './components/nav/Nav';
import Container from './components/container/Container';
import Home from './pages/home/Home';
import PokerTable from './pages/teenpatti/PokerTable';
import Blog from './pages/blog/Blog';

function App() {
  // TODO: ADD permanent dark mode/light mode context
  //const lightMode = useContext(UserStateContext);
  return (
    <Container>
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
