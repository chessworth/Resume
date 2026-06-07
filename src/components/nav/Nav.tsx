import React, { useState } from 'react';
import './Nav.css';
import { NavLink } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { faHouse, faBook, faGamepad} from '@fortawesome/free-solid-svg-icons';
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

  // Define paths where the navbar should NOT appear
  const hideOnRoutes = ['/immigrationaccelerator', '/immigration-file', '/intake']; // Add more as needed

  // Check if the current URL starts with any of the hidden routes
  const shouldHideNavbar = hideOnRoutes.some(route => 
    window.location.pathname.startsWith(route)
  );

  if (shouldHideNavbar) {
    return null; // Don't render the navbar at all
  }

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
        <NavListItem linkUrl="/blog" text="Blog" iconType={faBook} />
      </ul>
    </nav>
  );
}
  
  export default Nav;
  