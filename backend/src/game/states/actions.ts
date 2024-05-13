import { GameAction, MapTheme } from "../types/machine";

export const chooseMapAction: GameAction<'chooseMap'> = (context, event) => {
	return {
		players: context.players.map(p => p.name === event.name ? {
			...p,
			map: event.map,
			score: 0,
			ready: false,
			ulti: false,
			canUseUlti: true,
			power: {
				start: 0,
				time: 0,
				cooldown: 0
			}
		} : p)
	};
};

export const joinGameAction: GameAction<'join'> = (context, event) => {
	return {
		players: [...context.players, {
			name: event.name,
			score: 0,
			ready: false,
			ulti: false,
			canUseUlti: true,
			power: {
				start: 0,
				time: 0,
				cooldown: 0
			}
		}]
	};
};

export const leaveGameAction: GameAction<'leave'> = (context, event) => {
	return { players: context.players.filter(p => p.name !== event.name) };
};

export const powerGameAction: GameAction<'power'> = (context, event) => {
	return {
		players: context.players.map(p => {
			if (p.name === event.name) {
				p.power.start = Date.now();
				p.power.cooldown = (p.map === MapTheme.MEDIEVAL) ? 8000 :
					(p.map === MapTheme.WESTERN) ? 4000 :
						(p.map === MapTheme.NINJA) ? 12000 :
							(p.map === MapTheme.RETRO) ? 10000 : 0;
			}
			return p;
		})
	};
};

export const scoreGameAction: GameAction<'score'> = (context, event) => {
	return {
		players: context.players.map((p, i) => {
			(i === event.index) && (p.score += 1);
			if (event.isBall) {
				p.power = { ...p.power, start: 0, time: 0 };
				p.ulti = false;
			}
			return p;
		})
	};
};

export const readyGameAction: GameAction<'ready'> = (context, event) => {
	return { players: context.players.map(p => p.name === event.name ? { ...p, ready: true } : p) };
}

export const restartGameAction: GameAction<'restart'> = (context, _) => {
	return { players: context.players.map(p => ({ ...p, map: undefined })) };
};

export const startGameAction: GameAction<'start'> = (context, _) => {
	return { players: context.players.map(p => ({ ...p, ready: false })) };
};

export const ultiGameAction: GameAction<'ulti'> = (context, event) => {
	return { players: context.players.map(p => p.name === event.name ? { ...p, ulti: true, canUseUlti: false } : p) }
};

export const updateGameAction: GameAction<'update'> = (context, _) => {
	return {
		players: context.players.map((p) => {
			if (p.power.start) {
				const time = Date.now() - p.power.start;
				if (time >= p.power.cooldown) { p.power.start = 0; p.power.time = 0; }
				else { p.power.time = p.power.cooldown - time }
			}
			return p;
		})
	};
}