import { GameStates, Player } from "../types/machine";
import { createModel } from "xstate/lib/model"
import { canChooseMap, canJoinGuard, canLeaveGuard, isReadyGuard, canStartGuard, isEndGameGuard, canUseUltiGuard } from "./guards";
import { chooseMapAction, joinGameAction, leaveGameAction, restartGameAction, scoreGameAction, readyGameAction, startGameAction, ultiGameAction, powerGameAction, updateGameAction } from "./actions";

export const GameModel = createModel({
	players: [] as Player[],
	victory: 5
}, {
	events: {
		chooseMap: (name: Player['name'], map: Player['map']) => ({ name, map }),
		join: (name: Player['name']) => ({ name }),
		leave: (name: Player['name']) => ({ name }),
		power: (name: Player['name']) => ({ name }),
		ready: (name: Player['name']) => ({ name }),
		restart: () => ({}),
		start: () => ({}),
		score: (index: number, isBall: boolean) => ({ index, isBall }),
		ulti: (name: Player['name']) => ({ name }),
		update: () => ({})
	}
});


export const GameMachine = GameModel.createMachine({
	id: 'game',
	predictableActionArguments: true,
	context: GameModel.initialContext,
	initial: GameStates.MAP,
	states: {
		[GameStates.MAP]: {
			on: {
				join: {
					cond: canJoinGuard,
					actions: [GameModel.assign(joinGameAction)],
					target: GameStates.MAP
				},
				chooseMap: {
					cond: canChooseMap,
					actions: [GameModel.assign(chooseMapAction)],
					target: GameStates.MAP
				},
				start: {
					cond: canStartGuard,
					target: GameStates.ANIMATION
				},
				leave: {
					cond: canLeaveGuard,
					actions: [GameModel.assign(leaveGameAction)],
					target: GameStates.MAP
				}
			}
		},
		[GameStates.PLAY]: {
			on: {
				score: {
					actions: [GameModel.assign(scoreGameAction)],
					target: GameStates.ANIMATION
				},
				power: {
					actions: [GameModel.assign(powerGameAction)],
					target: GameStates.PLAY
				},
				leave: {
					cond: canLeaveGuard,
					actions: [GameModel.assign(leaveGameAction), 'sendEnd'],
					target: GameStates.END
				},
				ulti: {
					cond: canUseUltiGuard,
					actions: [GameModel.assign(ultiGameAction)],
					target: GameStates.ANIMATION
				},
				update: {
					actions: [GameModel.assign(updateGameAction)],
					target: GameStates.PLAY
				}
			}
		},
		[GameStates.END]: {
			entry: 'sendEnd',
			on: {
				restart: {
					actions: [GameModel.assign(restartGameAction)],
					target: GameStates.MAP
				},
				leave: {
					cond: canLeaveGuard,
					actions: [GameModel.assign(leaveGameAction)],
					target: GameStates.MAP
				}
			}
		},
		[GameStates.ANIMATION]: {
			on: {
				ready: {
					actions: [GameModel.assign(readyGameAction)],
					target: GameStates.ANIMATION
				},
				start: [{
					cond: isEndGameGuard,
					target: GameStates.END
				}, {
					cond: isReadyGuard,
					actions: [GameModel.assign(startGameAction)],
					target: GameStates.PLAY
				}],
				leave: {
					actions: [GameModel.assign(leaveGameAction), 'sendEnd'],
					target: GameStates.END
				}
			}
		}
	}
});