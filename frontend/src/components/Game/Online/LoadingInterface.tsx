import { ReactElement, useEffect, useState } from 'react';
import { useGame } from '../../../store/hooks/useGame';
import { client } from '../../Connection';
import styled from 'styled-components';

const LoadingContainer = styled.div`
	position: absolute;
	left: 40vw;
	top: 40vh;
	
  display: flex;
`;

const LoadingText = styled.div`

/* text-align: left; */
	font-size: 4.5vw;
  font-family: 'inknutAntiqua', serif;
  color: #ecd2d2;

`;

const Dots = styled.span`
 font-size: 4.5vw;
  font-family: 'inknutAntiqua', serif;
  color: #ecd2d2;
`;


const CancelContainer = styled.button`
position: absolute;
top: 80%;
font-size: 3vw;
  text-align: center;
  transform: translate(4.8vw, 0px);
  font-family: 'inknutAntiqua', serif;
  color: #5f130a;
  text-decoration : underline;
  cursor: pointer;


`;
export default function LoadingInterface(): ReactElement {
	const { send } = useGame();
	const [dots, setDots] = useState<string>('.');

	const cancel = () => {
		client?.emit('leave');
		client?.emit('inGame', false);
		send({ type: 'leave' });
	}

	useEffect(() => {

		const interval = setInterval(() => {
			setDots(prevDots => (prevDots.length >= 3 ? '' : prevDots + '.'));
		}, 500);

		return () => {
			clearInterval(interval);
		};
	}, []);

	return (
		<>
			<LoadingContainer>
				<LoadingText>Loading</LoadingText>
				<Dots>{dots}</Dots>
				<CancelContainer onClick={cancel}>Cancel</CancelContainer>
			</LoadingContainer>
		</>
	);
}
