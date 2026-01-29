
import cabinet from './prova.png';
import './style.css'

export const PlayerCard = (idx: number) => {
    return ({
        id: `PlayerCard-${idx}`,
        content:
            <div className="box">
                <i className="fas fa-star">Player</i>
            </div>
    });
}

export const CabinetCard = (idx: number, isToggled: boolean) => {
    const getItemStyle = () => ({
        display: (isToggled ? 'block' : 'none'),
        flexdirection: 'row',
        gap: '10px',
    });
    return ({
        id: `item-${idx}`,
        content:
            <div>
                <img src={cabinet}></img>
                    {isToggled ? (
                        <div style={getItemStyle()}>
                            {PlayerCard(idx).content}
                            {PlayerCard(idx).content}
                        </div>
                    ) : null}
            </div>

    });
}
