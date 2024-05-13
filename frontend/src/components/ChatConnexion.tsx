import { useEffect } from 'react'
import * as API from './modalChat/FetchAPiChat';
import { setJwtToken } from '../socket';
import { useReadyState } from './ContextBoard';

type Props = {
	isLoading: boolean;
}

const ChatConnexion = ({isLoading}: Props) => {

	const {setReady} = useReadyState();


	useEffect(() => {

		const getMyUser = async () => {

			const me = await API.fetcher('/players');

			return me;
		}

		const jwt_token = API.getCookie('jwt_token');
		if (!isLoading && jwt_token) {

			getMyUser().then((response: any) => {
				localStorage.setItem('player', JSON.stringify(response.player));
				localStorage.setItem('jwt_token', jwt_token);
				setJwtToken(jwt_token);
				setReady(true);
			});
		}
	}, [isLoading]);

  return (
	<>		
	</>
  )
}

export default ChatConnexion