import Card from './Card';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCoins, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import styles from './GameStyles.module.css';
import { evaluateHand } from './utils/pokerUtils';

const PlayerSeat = ({
  player,
  isTurn,
  revealedHands,
  adjustChips,
  onRevealCard,
  onRevealAllCards,
  showdownResult
}) => {
  // Check if this player is the winner or loser in the showdown
  const isShowdownWinner = showdownResult?.winnerId === player.id;
  const isShowdownLoser = showdownResult?.loserId === player.id;

  const playerStyle = {
    border: isTurn ? '2px solid yellow' : '1px solid gray',
    opacity: player.folded ? 0.4 : (isShowdownLoser ? 0.6 : 1),
    padding: '10px',
    backgroundColor: player.revealed ? '#222' : '#111',
    color: 'white',
    borderRadius: '8px',
    width: '180px',
    textAlign: 'center',
    transition: 'all 0.5s ease',
    boxShadow: isShowdownWinner ? '0 0 15px 5px rgba(255, 215, 0, 0.7)' : 'none'
  };

  const handleCardClick = (cardIndex) => {
    if (isTurn && onRevealCard) {
      onRevealCard(player.id, cardIndex);
    }
  };

  const handleRevealAll = () => {
    if (isTurn && onRevealAllCards) {
      onRevealAllCards(player.id);
    }
  };

  // Check if any cards are revealed
  const hasRevealedCards = player.revealedCards && 
    Object.values(player.revealedCards).some(revealed => revealed);
  
  // Check if ALL cards are revealed
  const allCardsRevealed = player.cards.length > 0 && player.revealedCards && 
    player.cards.every((_, index) => player.revealedCards[index]);

  // Calculate hand rank when cards are revealed
  const handRank = (revealedHands.find(r => r === player.id) || allCardsRevealed) && player.cards.length > 0 
    ? evaluateHand(player.cards) 
    : '';

  return (
    <div style={playerStyle}>
      <h3>
        {player.name}
        {player.blind && (
          <span style={{ marginLeft: '5px', color: '#ff9900' }}>
            <FontAwesomeIcon icon={faEyeSlash} title="Playing blind" />
          </span>
        )}
      </h3>
      <div className={styles.chips}>
        <FontAwesomeIcon className={styles.potIcon} icon={faCoins} /> {player.chips}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
        {player.cards.map((c, i) => (
          <div 
            key={i} 
            onClick={() => handleCardClick(i)}
            style={{ cursor: isTurn ? 'pointer' : 'default' }}
          >
            <Card 
              value={c} 
              hidden={!revealedHands.find(r => r === player.id) && !player.revealedCards?.[i]} 
              revealed={player.revealedCards?.[i]}
            />
          </div>
        ))}
      </div>

      {isTurn && player.cards.length > 0 && !player.folded && (
        <div className={styles.revealButtons}>
          <button 
            className={`${styles.revealButton} ${!hasRevealedCards ? styles.revealAllButton : ''}`}
            onClick={handleRevealAll}
          >
            <FontAwesomeIcon icon={faEye} /> 
            {allCardsRevealed ? 'Hide All' : (hasRevealedCards ? 'Reveal All' : 'Peek at Cards')}
          </button>
        </div>
      )}

      {(revealedHands.find(r => r === player.id) || allCardsRevealed) && (
        <div style={{ marginTop: '0.5rem', fontWeight: 'bold' }}>
          {handRank}
        </div>
      )}

      {/* Add a winner/loser indicator during showdown */}
      {isShowdownWinner && (
        <div className={styles.winnerIndicator}>Winner!</div>
      )}
    </div>
  );
};

export default PlayerSeat;
