import styled from 'styled-components';
import SelectModeSubMenu from './ModeSubMenu/ModeSubMenu';
import SelectMapSubMenu from './MapSubMenu/MapSubMenu';
import { PixelCorners3x3 } from '../../styles/HomeStyles';
import { useGame } from '../../store/hooks/useGame';
import { useLocation, useNavigate } from 'react-router-dom';
import { ModeType } from '../../types/machine';
import { useEffect } from 'react';
import * as API from '../../components/modalChat/FetchAPiChat'
import { fetchFriendlyMatch, fetchIsConnected, fetchJoinFriendlyMatch } from '../../data/Client';

const Container = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.25);

`;

const Content = styled(PixelCorners3x3)`
  position: relative;
  width: 100%;
  height: 100%;
  background-color: #FFF8DC;
`;

const ShadowBox = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  box-shadow: 0px 0px 60px black;
  z-index: -1; 
`;

const Menu = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const pseudo = queryParams.get('pseudo');
    const room = queryParams.get('room');
    const { state, context, send } = useGame();

    useEffect(() => {
        if (pseudo && room) {
            setTimeout(() => {
                fetchJoinFriendlyMatch(+room, (isReady) => {
                    if (isReady) {
                        send({ type: 'join', id: 'j1', name: API.getMyself().pseudo });
                        send({ type: 'chooseMode', mode: ModeType.ONLINEPLAYER });
                    }
                });
            }, 500);
        } else if (pseudo) {
            setTimeout(() => {
                fetchFriendlyMatch(pseudo, (isConnected) => {
                    if (isConnected) {
                        send({ type: 'join', id: 'j1', name: API.getMyself().pseudo });
                        send({ type: 'chooseMode', mode: ModeType.ONLINEPLAYER });
                        const interval = setInterval(() => {
                            fetchIsConnected(pseudo, (isConnected) => {
                                if (context.players.length === 2) {
                                    clearInterval(interval);
                                } else if (!isConnected) {
                                    clearInterval(interval);
                                    send({ type: 'leave' });
                                }
                            });
                        }, 5000);
                    }
                });
            }, 500);
        }
        (pseudo) && (navigate('/game', { replace: true }));
    }, []);

    return state === 'Mode'
        ? (
            <Container>
                <ShadowBox />
                <Content>
                    <SelectModeSubMenu />
                </Content>
            </Container>
        )
        : (
            <>
                <Container>
                    <ShadowBox />
                    <Content>
                        <SelectMapSubMenu />
                    </Content>
                </Container>
            </>
        );
}

export default Menu;