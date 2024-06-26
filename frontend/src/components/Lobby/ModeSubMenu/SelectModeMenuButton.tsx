import styled from 'styled-components';
import { PixelCorners3x3 } from '../../../styles/HomeStyles';
import Pixelated_Button from '../../Global_UI/Pixelated_Button';
import { ModeType } from '../../../types/machine';
import { useGame } from '../../../store/hooks/useGame';
import { client } from '../../Connection';
import * as API from '../../../components/modalChat/FetchAPiChat'

const MenuButtonContainer = styled(PixelCorners3x3)`
    display: flex;
    justify-content: center;
    align-items: center;
    width: 468px;
    height: 76px;
    margin: 10px;
    background-color: black;
`

type Props = {
    label: string;
    modeValue: ModeType;
    $backgroundColor: string;
};

const MenuButton: React.FC<Props> = ({ label, modeValue, $backgroundColor }) => {
    const { send } = useGame();

    return (
        <MenuButtonContainer>
            <Pixelated_Button
                color_button={$backgroundColor}
                text={label}
                font_size={'24px'}
                onClick={() => {
                    send({ type: 'join', id: 'j1', name: API.getMyself().pseudo });
                    if (modeValue === 'MatchMaking') {
                        client?.emit('matchMaking');
                        client?.emit('inGame', true);
                    } else {
                        send({ type: 'join', id: 'j2', name: 'Bot' });
                    }
                    send({ type: 'chooseMode', mode: modeValue });
                }}
            />
        </MenuButtonContainer>
    );
};

export default MenuButton;