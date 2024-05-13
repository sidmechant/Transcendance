import { GameContext, GameEvents, MapTheme } from "../types/machine";
import * as API from '../components/modalChat/FetchAPiChat'
import { client } from "../components/Connection";

export interface ConnectPlayers {
    name: string,
    map: MapTheme
}

export interface ConnectInfo {
    players: ConnectPlayers[]
}

export interface StartInfo {
    current: number
}

function connectPlayers(): Promise<ConnectInfo> {
    return new Promise((resolve, _) => {
        client?.on('match', (data: ConnectInfo) => resolve(data));
        client?.emit('match');
    });
}

export async function fetchConnectPlayers(send: (event: GameEvents) => void) {
    try {
        const { players }: ConnectInfo = await connectPlayers();

        const pseudo: string = API.getMyself().pseudo;
        send({ type: 'join', id: 'j2', name: players.find(p => p.name !== pseudo)!.name });
        send({ type: 'changeCurrent', id: 'j2' });
        send({ type: 'chooseMap', map: players.find(p => p.name !== pseudo)!.map });
        const location: -1 | 1 = players.findIndex(p => p.name === pseudo) ? 1 : -1;
        send({ type: 'updatePlayer', id: 'j1', location: location });
        send({ type: 'updatePlayer', id: 'j2', location: -location as -1 | 1 });
        send({ type: 'start', isBall: true });
    } catch (error) {
        console.error('Error fetching to connect players:', error);
    }
}

function startPlayers(): Promise<StartInfo> {
    return new Promise((resolve, _) => {
        client?.on('start', (data: StartInfo) => resolve(data));
        client?.emit('start');
    });
}

export async function fetchStartPlayers(context: GameContext, send: (event: GameEvents) => void) {
    try {
        const { current }: StartInfo = await startPlayers();
        const location: -1 | 1 = context.players[0].location as -1 | 1;
        ((location === -1 && current === 0) || (location === 1 && current === 1))
            ? send({ type: 'changeCurrent', id: 'j1' })
            : send({ type: 'changeCurrent', id: 'j2' });
        send({ type: 'start', isBall: true });
    } catch (error) {
        console.error('Error fetching to connect players:', error);
    }
}

function friendlyMatch(pseudo: string): Promise<boolean> {
    return new Promise((resolve, _) => {
        client?.on('friendlyMatch', (isConnected: boolean) => resolve(isConnected));
        client?.emit('friendlyMatch', pseudo);
        client?.emit('inGame', true);
    });
}

export async function fetchFriendlyMatch(pseudo: string, callback: (isConnected: boolean) => void) {
    try {
        callback(await friendlyMatch(pseudo));
    } catch (error) {
        console.error('Error fetching to friendly match request:', error);
    }
}

function joinFriendlyMatch(room: number): Promise<boolean> {
    return new Promise((resolve, _) => {
        client?.on('joinFriendlyMatch', (isReady: boolean) => resolve(isReady));
        client?.emit('joinFriendlyMatch', { room, isAccepted: true });
        client?.emit('inGame', true);
    });
}

export async function fetchJoinFriendlyMatch(room: number, callback: (isReady: boolean) => void) {
    try {
        callback(await joinFriendlyMatch(room));
    } catch (error) {
        console.error('Error fetching to friendly match request:', error);
    }
}

function isConnected(pseudo: string): Promise<boolean> {
    return new Promise((resolve, _) => {
        client?.on('isConnected', (isConnected: boolean) => resolve(isConnected));
        client?.emit('isConnected', pseudo);
    });
}

export async function fetchIsConnected(pseudo: string, callback: (isReady: boolean) => void) {
    try {
        callback(await isConnected(pseudo));
    } catch (error) {
        console.error('Error fetching to friendly match request:', error);
    }
}
