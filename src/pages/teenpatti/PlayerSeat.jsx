import Card from './Card';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCoins } from '@fortawesome/free-solid-svg-icons';
import styles from './GameStyles.module.css';

const PlayerSeat = ({
  player,
  isTurn,
  revealedHands,
  adjustChips
}) => {

  const playerStyle = {
    border: isTurn ? '2px solid yellow' : '1px solid gray',
    opacity: player.folded ? 0.4 : 1,
    padding: '10px',
    backgroundColor: player.revealed ? '#222' : '#111',
    color: 'white',
    borderRadius: '8px',
    width: '180px',
    textAlign: 'center',
  };

  return (
    <div style={playerStyle}>
      <h3>{player.name}</h3>
      <div>
        <strong><FontAwesomeIcon icon={faCoins} className={styles.potIcon}/> {player.chips}</strong>
        {/* <div style={{ marginTop: '4px' }}>
            <button onClick={() => adjustChips(player.id, +10)}>+10</button>
            <button onClick={() => adjustChips(player.id, -10)}>-10</button>
        </div> */}
      </div>


      <div style={{ display: 'flex', justifyContent: 'center' }}>
        {player.cards.map((c, i) => (
          <Card key={i} value={c} hidden={!revealedHands.find( r => r === player.id)} />
        ))}
      </div>

      {revealedHands.find( r => r === player.id) && (
        <div style={{ marginTop: '0.5rem', fontWeight: 'bold' }}>
          {player.handRank || '...'}
        </div>
      )}
    </div>
  );
};

export default PlayerSeat;
