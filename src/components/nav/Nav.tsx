import React, { useState } from 'react';
import logo from './logo.svg';
import './Nav.css';
import { NavLink } from 'react-router-dom';

function Nav() {
    return (
      <nav>
        <ul className="topnav">
          <li>
            <NavLink to="/">Home</NavLink>
          </li>
          <li>
            <NavLink to="/game">Game Center</NavLink>
          </li>
          <li>
            <NavLink to="/blog">Blog</NavLink>
          </li>
          <li>
            <NavLink to="/contact">Contact</NavLink>
          </li>
        </ul>
      </nav>
    );
  }
  
  export default Nav;
  