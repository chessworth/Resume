import React, { useState } from 'react';
import styles from './GameStyles.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay, faPause } from '@fortawesome/free-solid-svg-icons';

const SettingsMenu = ({ settings, customSettings, updateSetting, toggleCustomSetting, addPlayer, pauseGame, setPauseGame }) => {
  const [name, setName] = useState('');
  const [chips, setChips] = useState(100);

  const handleAddPlayer = () => {
    if (!name.trim()) return;
    addPlayer(name.trim(), parseInt(chips) || 100);
    setName('');
    setChips(100);
  };

  return (
    <div style={{ color: '#fff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
            <h3 className={styles.settingsHeading}>Game Settings</h3>
            <button
                onClick={() => setPauseGame(!pauseGame)}
                className={styles.pauseIconButton}
                title={pauseGame ? 'Resume Game' : 'Pause Game'}
                >
                <FontAwesomeIcon icon={pauseGame ? faPlay : faPause} size='xs'/>
            </button>
        </div>

      <label>Ante:</label>
      <input
        type="number"
        value={settings.ante}
        onChange={(e) => updateSetting('ante', parseInt(e.target.value))}
      />
      <br />
      <label>Max Back-Show Rejects:</label>
      <input
        type="number"
        value={settings.maxBackShowRejects}
        onChange={(e) => updateSetting('maxBackShowRejects', parseInt(e.target.value))}
      />

      <hr />
      <h4>Custom Rules</h4>

      <div className={styles.toggleRow}>
        <span>2-3-5 beats straights</span>
        <label className={styles.switch}>
          <input
            type="checkbox"
            checked={customSettings.enableSpecial235}
            onChange={() => toggleCustomSetting('enableSpecial235')}
          />
          <span className={styles.slider}></span>
        </label>
      </div>

      <div className={styles.toggleRow}>
        <span>Suited 2-3-5 beats straight flush</span>
        <label className={styles.switch}>
          <input
            type="checkbox"
            checked={customSettings.enableSuited235}
            onChange={() => toggleCustomSetting('enableSuited235')}
          />
          <span className={styles.slider}></span>
        </label>
      </div>

      <div className={styles.toggleRow}>
        <span>Caller loses on tie</span>
        <label className={styles.switch}>
          <input
            type="checkbox"
            checked={customSettings.showLoserOnTie}
            onChange={() => toggleCustomSetting('showLoserOnTie')}
          />
          <span className={styles.slider}></span>
        </label>
      </div>

      <div className={styles.toggleRow}>
        <span>Allow back-show requests</span>
        <label className={styles.switch}>
          <input
            type="checkbox"
            checked={customSettings.allowBackShow}
            onChange={() => toggleCustomSetting('allowBackShow')}
          />
          <span className={styles.slider}></span>
        </label>
      </div>

      <hr />
      <h4>Add Player</h4>
      <input
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        type="number"
        placeholder="Chips"
        value={chips}
        onChange={(e) => setChips(e.target.value)}
      />
      <button onClick={handleAddPlayer} style={{ marginTop: '5px' }}>
        Add Player
      </button>
    </div>
  );
};

export default SettingsMenu;
