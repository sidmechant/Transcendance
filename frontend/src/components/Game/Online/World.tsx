import { ReactElement, useEffect } from 'react';
import { RootState, useThree } from '@react-three/fiber';
import Ball from './Ball';
import Player from './Player';
import Area from '../Area';
import Lights from '../Lights';
import IntroAnimation from '../../Animation/IntroAnimation';
import EndAnimation from '../../Animation/EndAnimation';
import { useGame } from '../../../store/hooks/useGame';
import { client } from '../../Connection';

export default function World(): ReactElement {
	const { camera } = useThree<RootState>();
	const { state, context, send } = useGame();

	const updateCameraPosition = () => {
		if (state === 'Play') {
			const width = window.innerWidth;

			if (width < 1200) {
				const x = (-8.7 + (-10 + 8.5) * ((1200 - width + 250) / (1200 - 900))) * -context.players[0].location!;
				const z = 1.6 + 2.2 * ((1200 - width + 250) / (1200 - 900));
				camera.position.set(x, 0, z);
			} else {
				camera.position.set(-9.9 * -context.players[0].location!, 0, 3.8);
			}
		}
	};

	useEffect(() => {
		client?.on('end', () => {
			client?.off('end');
			const winner = context.players.find(p => p.score === context.victory);
			if (!winner || (winner && winner === context.players[0]))
				client?.emit('score', {
					playerAPseudo: context.players[0].name,
					playerBPseudo: context.players[1].name,
					scoreA: context.players[0].score,
					scoreB: context.players[1].score,
				});
			send({ type: 'end' });
		});

		return () => { client?.off('end'); }
	}, []);

	useEffect(() => {
		(state === 'Play') && updateCameraPosition();
		const handleResize = () => { (state === 'Play') && updateCameraPosition(); };
		window.addEventListener('resize', handleResize);

		return () => {
			window.removeEventListener('resize', handleResize);
		};
	}, [state]);

	return <>
		{context.animation === 'Intro' && <IntroAnimation />}
		{context.animation === 'End' && <EndAnimation />}
		{context.animation !== 'Intro' && <Area />}
		<Lights />
		{context.animation !== 'Intro' && <Player />}
		{context.animation !== 'Intro' && <Ball />}
	</>;
}