import axios from 'axios';
axios.defaults.baseURL = import.meta.env['VITE_API_URL']; // URL de base de votre API
axios.defaults.withCredentials = true; // Permet d'envoyer les cookies lors des requêtes


export interface GameRecord {
	id: number;
	playedAt: string;
	playerA: string;
	playerAId: number;
	playerB: string;
	playerBId: number;
	scoreA: number;
	scoreB: number;
  }

const fetchLatestMatches = async () => {
	try {
		const response = await axios.get('/game/last');
		return response.data;
	} catch (error) {
		console.log(error);
	}
};

export const fetchMatches = async () => {
	try {
		const matches:GameRecord[] = await fetchLatestMatches();
		return matches;
	} catch (error: any) {
		console.error("An error occurred while fetching the matches: ", error.message);
	}
};
