import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSun, faMoon } from '@fortawesome/free-solid-svg-icons';
import './LightDark.css';

interface LightDarkProps {
    isDarkMode: boolean;
    toggleTheme: () => void;
}
const LightDark: React.FC<LightDarkProps> = ({ isDarkMode, toggleTheme }) => {
    return (
        <button onClick={toggleTheme} className={'lightDarkButton' + (isDarkMode ? ' dark' : '')}>
            {isDarkMode ? (
                <FontAwesomeIcon icon={faMoon} size="lg" color="#999" />
            ) : (
                <FontAwesomeIcon icon={faSun} size="lg" color="#F7DC6F" />
            )}
        </button>
    )
}
export default LightDark;