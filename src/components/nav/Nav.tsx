import React, { useState } from 'react';
import logo from './logo.svg';
import './Nav.css';
import { NavLink } from 'react-router-dom';

function NavListItem({linkUrl, text} : {linkUrl : string, text : string}) {
  const [scrollPos, setScrollPos] = useState(0);
  const handleScroll = () => {
    setScrollPos(window.scrollY);
  };
  const handleMouseEnter = () => {
    setScrollPos(0);
  }

  React.useEffect(() => {
      window.addEventListener('scroll', handleScroll);
      return () => {
          window.removeEventListener('scroll', handleScroll);
      };
  }, []);

  return (
    <li className={scrollPos > 0 ? 'shrink' : ''}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleScroll}>
      <NavLink to={linkUrl}>{text}</NavLink>
    </li>
  );
}

function Nav() {
  return (
    <nav className='navContainer'>
      <ul className="topnav">
        <NavListItem linkUrl="/" text="Home" />
        <NavListItem linkUrl="/game" text="Game Center" />
        <NavListItem linkUrl="/blog" text="Blog" />
        <NavListItem linkUrl="/contact" text="Contact" />
      </ul>
    </nav>
  );
}
  
  export default Nav;
  