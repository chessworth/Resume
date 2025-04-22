import React from 'react';
import styles from './GameStyles.module.css';

const suitSymbols = {
  H: '♥',
  D: '♦',
  C: '♣',
  S: '♠'
};

const Card = ({ value, hidden = false }) => {
  if (hidden) return <div className={`${styles.card} ${styles.cardBack}`}>🂠</div>;

  const rank = value.slice(0, -1);
  const suit = value.slice(-1);
  const isRed = suit === 'H' || suit === 'D';

  return (
    <div className={`${styles.card} ${isRed ? styles.red : styles.black}`}>
      <div className={styles.cardTop}>{rank}</div>
      <div className={styles.cardSuit}>{suitSymbols[suit]}</div>
      <div className={styles.cardBottom}>{rank}</div>
    </div>
  );
};

export default Card;
