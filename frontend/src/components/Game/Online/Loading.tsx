import { ReactElement, useEffect } from 'react';
import { fetchConnectPlayers } from '../../../data/Client';
import { useGame } from '../../../store/hooks/useGame';
import { client } from '../../Connection';

export default function Loading(): ReactElement {
	const { send } = useGame();

	useEffect(() => {
		fetchConnectPlayers(send);

		return () => {
			client?.off('match');
		};
	}, []);

	return <></>;
}