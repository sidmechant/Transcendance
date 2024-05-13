import { ReactElement, useEffect } from 'react';
import End from './End';
import Lobby from '../Lobby/Lobby';
import { useGame } from '../../store/hooks/useGame';
import HudGame from './HUD/HudGame';
import LoadingInterface from './Online/LoadingInterface';
import { client } from '../Connection';
import { ModeType } from '../../types/machine';

export default function Interface(): ReactElement {
	const { context, state, send } = useGame();

	useEffect(() => {
		(context.mode === ModeType.ONLINEPLAYER) && client?.on('stop', () => { (!['Play', 'Animation'].includes(state)) && send({ type: 'leave' }); });
		return () => { client?.off('stop'); }
	}, [context.mode])

	return <>
		{(['Mode', 'Map'].includes(state)) && <Lobby />}
		{(['Play', 'Animation'].includes(state)) && <HudGame />}
		{(['Loading'].includes(state)) && <LoadingInterface />}
		{(['End'].includes(state)) && <End />}
	</>;
}
