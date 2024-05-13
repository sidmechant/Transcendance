import { GameModel } from '../states/machine';
import { ContextFrom, EventFrom } from 'xstate';

export enum GameStates {
    MODE = 'Mode',
    MAP = 'Map',
    LOADING = 'Loading',
    PLAY = 'Play',
    END = 'End',
    ANIMATION = 'Animation'
};

export enum ModeType {
    MATCHMAKING = 'MatchMaking',
    ONLINEPLAYER ='2POnline'
};

export enum MapTheme {
    MEDIEVAL = 'medieval',
    WESTERN = 'western',
    NINJA = 'ninja',
    RETRO = 'retro'
};

export type Position = { x: number, y: number, z: number };

export type Player = {
    name: string,
    map?: MapTheme,
    score: number,
    ready: boolean,
    ulti: boolean,
    canUseUlti: boolean;
    power: {
        start: number,
        time: number,
        cooldown: number,
    }
};

export type GameContext = ContextFrom<typeof GameModel>;
export type GameEvents = EventFrom<typeof GameModel>;
export type GameEvent<T extends GameEvents['type']> = GameEvents & { type: T };
export type GameGuard<T extends GameEvents['type']> = (context: GameContext, event: GameEvent<T>) => boolean;
export type GameAction<T extends GameEvents['type']> = (context: GameContext, event: GameEvent<T>) => Partial<GameContext>;