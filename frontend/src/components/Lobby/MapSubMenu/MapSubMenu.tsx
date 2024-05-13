import Pixelated_Button from '../../Global_UI/Pixelated_Button';
import MapSwitcherSelector from './MapSwitcherSelector';
import styled from 'styled-components';
import { useEffect } from 'react';
import { useGame } from '../../../store/hooks/useGame';
import { client } from '../../Connection';

type ButtonColorProps = {
	$color: string;
}

const ReturnButtonContainer = styled.div<ButtonColorProps>`
    position: absolute;
    top: 10px;
    right: 10px;
    z-index: 10;
    color: ${props => props.$color};
    font-family: Yoster Island;
    font-size: 32px;
    font-style: normal;
    font-weight: 400;
    line-height: normal;
    letter-spacing: 0.96px;
    font-family: "Yoster";
    cursor: pointer;
`;

const SelectMapSubMenu = () => {
	const { context, send } = useGame();

	const mainColor = context.current!.mapInfo.mainColor;
	const secondaryColor = context.current!.mapInfo.secondaryColor;


	const handleReturn = () => {
		client?.emit('leave');
		client?.emit('inGame', false);
		send({ type: 'leave' });
	};

	useEffect(() => {
		send({ type: 'changeCurrent', id: 'j1' });
		client?.on('reconnect', () => {
			if (context.mode === 'MatchMaking') {
				client?.emit('leave');
				client?.emit('matchMaking');
			}
		});
		return (() => {
			client?.off('reconnect')
		})
	}, []);

	return (
		<>
			<ReturnButtonContainer $color={secondaryColor} onClick={handleReturn}>
				X
			</ReturnButtonContainer>
			<MapSwitcherSelector />
			<Pixelated_Button
				color_button={mainColor}
				color_outline={secondaryColor}
				position={['40px', '30px']}
				text={'PLAY'}
				onClick={() => {
					if (!['IA', '2PLocal'].includes(context.mode!)) {
						client?.emit('chooseMap', { map: context.players[0].mapInfo.id });
					}
					send({ type: 'load' });
				}} />
		</>
	);
};

export default SelectMapSubMenu;