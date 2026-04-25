import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSun, faMoon } from '@fortawesome/free-solid-svg-icons';
import './LightDark.css';

interface LightDarkProps {
    isDarkMode: boolean;
    toggleTheme: () => void;
}

const LightDark: React.FC<LightDarkProps> = ({ isDarkMode, toggleTheme }) => {
    // Define paths where the navbar should NOT appear
    const hideOnRoutes = ['/immigrationaccelerator', '/immigration-file'];

    // Check if the current URL starts with any of the hidden routes
    const shouldHideNavbar = hideOnRoutes.some(route => 
        window.location.pathname.startsWith(route)
    );

    if (shouldHideNavbar) {
        return null; // Don't render the navbar at all
    }

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