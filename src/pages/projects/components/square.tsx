import React, { EventHandler, MouseEventHandler } from 'react';
import logo from './logo.svg';
import { useState } from 'react';

function Square( {value, onSquareClick} : {value? : string, onSquareClick : React.MouseEventHandler<HTMLButtonElement>} ) {
    return (
    <button className="square" onClick={onSquareClick}>
        {value}
    </button>
    );
}
export default Square;