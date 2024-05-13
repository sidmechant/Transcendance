import { ReactElement, useEffect, useRef, useState } from 'react';
import { useKeyboardControls } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import UltiAnimation from '../../Animation/UltiAnimation';
import { fetchStartPlayers } from '../../../data/Client';
import { useGame } from '../../../store/hooks/useGame';
import Physic from '../../../store/physic/Phisic';
import { MapTheme } from '../../../types/machine';
import TextThreeTwoOne from '../../Animation/TextThreeTwoOne';
import { client } from '../../Connection';
import { PADDLE_POSITION } from '../../../store/physic/config';

type Info = Physic['paddlesInfo'][0] & { cooldown: number, effect: string };

export default function Player(): ReactElement {
	const { state, context, send } = useGame();
	const info = useRef<[Info, Info]>();
	const [index, setIndex] = useState<number>(context.players.findIndex(p => p.id === context.current!.id));
	const player = context.players[0];
	const opponent = context.players[1];
	const PaddlePlayer = player.Paddle();
	const PaddleOpponent = opponent.Paddle();
	const [_, getKeys] = useKeyboardControls<string>();
	const [collision, setCollision] = useState<boolean>(false);
	const [isAnimation, setIsAnimation] = useState<boolean>(true);
	const [isBall, setIsBall] = useState<boolean>(true);
	const [, forceRender] = useState<number>(0);

	useEffect(() => { (isAnimation === true) && (setTimeout(() => { setIsAnimation(false); }, 4000)); }, [isAnimation]);
	useEffect(() => {
		client?.on('play', () => {
			send({ type: 'start', isBall });
			setIsBall(true);
		});
		client?.on('players', (data: { players: [Info, Info] }) => {
			if (JSON.stringify(data.players) !== JSON.stringify(info.current)) {
				info.current = data.players;
				forceRender(prev => prev + 1);
			}
		});
		client?.on('score', (data: { index: number, isBall: boolean }) => {
			client?.emit('move', { key: { leftward: false, rightward: false, ulti: false, power: false } });
			send({ type: 'score', index: data.index, isBall: data.isBall });
			setIsBall(data.isBall);
			if (data.isBall) { setIsAnimation(true); }
			if (data.isBall) { fetchStartPlayers(context, send); }
			else { client?.emit('play') }
		});
		client?.on('ulti', () => {
			setIndex(1);
			send({ type: 'ulti', id: 'j2' });
		});

		return () => {
			client?.off('play');
			client?.off('players');
			client?.off('score');
			client?.off('ulti');
		}
	}, [client]);

	useEffect(() => { setCollision(true); }, [info.current && info.current[0].collision]);

	useFrame(() => {
		(player.power.time) && (send({ type: 'update' }));
		if (!isAnimation && state === 'Play') {
			let { leftward, rightward, ulti, power } = getKeys();
			if (!player.power.time) {
				if (player.mapInfo.id === MapTheme.NINJA) {
					if (collision) { power = false; setCollision(false); }
					if (!power && info.current && info.current[0].skill.power.isActive) {
						send({ type: 'power', id: 'j1' })
						send({ type: 'update' });
					}
				} else {
					(power) && send({ type: 'power', id: 'j1' })
					send({ type: 'update' });
				}
			}
			client?.emit('move', { key: { leftward, rightward, ulti, power } });
			if (info.current && info.current[0].skill.ulti.isActive) {
				setIndex(0);
				send({ type: 'ulti', id: 'j1' });
			}
		}
	});

	return <>
		{context.animation === 'Ulti' && <UltiAnimation index={index} />}
		{isAnimation && <TextThreeTwoOne />}

		<PaddlePlayer
			effect={info.current && info.current[0].effect}
			position={(info.current && info.current[0].position)
				?? { x: PADDLE_POSITION * player.location!, y: 0, z: 0 }
			}
			velocity={
				info.current && info.current[0].velocity}
			location={player.location!}
			skillInfo={info.current && info.current[0].skill}
			collision={info.current && info.current[0].collision} />
		<PaddleOpponent
			effect={info.current && info.current[1].effect}
			position={
				(info.current && info.current[1].position)
				?? { x: PADDLE_POSITION * opponent.location!, y: 0, z: 0 }
			}
			velocity={info.current && info.current[1].velocity}
			location={opponent.location!}
			skillInfo={info.current && info.current[1].skill}
			collision={info.current && info.current[1].collision} />
	</>;
}