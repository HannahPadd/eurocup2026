import { faLock, faUnlock } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import './style.css'

interface toggleButtonProps {
    isToggled: boolean;
    handleClick: () => any;
}

export const ToggleButton = ({ isToggled, handleClick } : toggleButtonProps) => {
    return (
        <button
            className='toggle-button'
            onClick={handleClick}>
            <FontAwesomeIcon icon={isToggled ? faLock : faUnlock} />
        </button>
    );
};
