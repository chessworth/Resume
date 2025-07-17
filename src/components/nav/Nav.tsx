import React, { useState } from 'react';
import './Nav.css';
import { NavLink } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { faHouse, faBook, faGamepad, faContactCard, faDiamond } from '@fortawesome/free-solid-svg-icons';
import { DarkModeContext } from '../../contexts/DarkModeContext';

function NavListItem({linkUrl, text, iconType} : {linkUrl : string, text : string, iconType : IconProp}) {
  const [scrollPos, setScrollPos] = useState(0);
  const [hovered, setHovered] = useState(false);
  const handleScroll = () => {
    setScrollPos(window.scrollY);
  };
  const handleMouseEnter = () => {
    setHovered(true);
  }
  const handleMouseLeave = () => {
    setHovered(false);
  }

  React.useEffect(() => {
      window.addEventListener('scroll', handleScroll);
      return () => {
          window.removeEventListener('scroll', handleScroll);
      };
  }, []);

  return (
    <li className={( hovered ? 'hover ' : '') + (scrollPos > 0 ? 'shrink' : '')}>
      <NavLink to={linkUrl}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}>
      <FontAwesomeIcon icon={iconType} size='xl' className='fa-nav' />{text}</NavLink>
    </li>
  );
}

function Nav() {
  return (
    <nav className={'navContainer ' + ( React.useContext(DarkModeContext) ? 'dark' : 'light' )}>
      <ul className="topnav">
        <NavListItem linkUrl="/Resume" text="Home" iconType={faHouse} />
        <NavListItem linkUrl="/projects" text="Projects" iconType={faGamepad} />
        <NavListItem linkUrl="/teenpatti" text="Poker" iconType={faDiamond} />
        <NavListItem linkUrl="/blog" text="Blog" iconType={faBook} />
        <NavListItem linkUrl="/contact" text="Contact" iconType={faContactCard} />
      </ul>
    </nav>
  );
}
  
  export default Nav;
  