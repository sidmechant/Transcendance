import { ReactElement, useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGame } from '../../../store/hooks/useGame';
import Physic from '../../../store/physic/Phisic';
import { client } from '../../Connection';

type Info = Physic['ballsInfo'][0] & { effect: string };

export default function Ball(): ReactElement {
	const { state, context } = useGame();
	const info = useRef<Info[]>([{
		position: { x: 0, y: 0, z: 0 },
		velocity: { x: 0, y: 0, z: 0 },
		collision: 0,
		effect: 'none'
	}]);
	const BallPlayer = context.players[0].Ball();
	const BallOpponent = context.players[1].Ball();
	const [, forceRender] = useState<number>(0);

	useEffect(() => {
		client?.on('ball', (data: { balls: Info[] }) => {
			if (JSON.stringify(data.balls) !== JSON.stringify(info.current)) {
				info.current = data.balls;
				forceRender(prev => prev + 1);
			}
		});

		return () => { client?.off('ball'); }
	}, [client]);

	useFrame(() => { (state === 'Play') && (client?.emit('ball')); });

	return <>
		{
			info.current.map((b, i) => [
				(context.current!.id === 'j1')
					? <BallPlayer key={`player-${i}`}
						position={b.position}
						velocity={b.velocity}
						collision={b.collision}
						effect={b.effect}
					/>
					: <BallOpponent key={`opponent-${i}`}
						position={b.position}
						velocity={b.velocity}
						collision={b.collision}
						effect={b.effect}
					/>
			])
		}
	</>;
}