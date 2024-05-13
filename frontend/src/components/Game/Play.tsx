import { useGame } from '../../store/hooks/useGame';
import Offline from './Offline/Offline';
import Online from './Online/Online';

export default function Play() {
	const { context } = useGame();

	return (['IA', '2PLocal'].includes(context.mode!))
		? <Offline />
		: <Online />;
}