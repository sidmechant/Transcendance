import { InterpreterFrom, StateFrom, interpret } from 'xstate';
import { GameMachine, GameModel } from './states/machine';
import { GameContext, GameStates, MapTheme } from './types/machine';
import { Player } from './types/machine';
import { Socket } from 'socket.io';
import Physic, { SkillInfoProps } from './physic/Phisic';
import Paddle from './physic/Paddle';
import { NinjaSkillInfoProps } from './physic/NinjaPaddle';
import { RetroSkillInfoProps } from './physic/RetroPaddle';

export class Room {
    public id: number;
    private machine: InterpreterFrom<typeof GameMachine> = null;
    private physic: Physic;
    private clients: Socket[] = [];
    private state: StateFrom<typeof GameMachine>;
    private reconnection: NodeJS.Timeout;

    constructor(id: number = 0, state: GameStates = GameStates.MAP, context: Partial<GameContext> = {}) {
        this.id = id;
        this.machine = interpret(
            GameMachine.withContext({
                ...GameModel.initialContext,
                ...context
            }).withConfig({
                ...GameMachine.config,
                initial: state,
                actions: {
                    sendEnd: this.sendEnd.bind(this)
                }
            } as any))
            .start();
        this.machine.onTransition(currentState => { this.state = currentState; });
        this.score = this.score.bind(this);
    };
    /* ---------- START ----------*/

    /* ---------- EVENTS ----------*/
    public ball(client: Socket): void {
        if (this.state.context.players.length === 2) {
            const effect = () => {
                let effect: string | undefined;
                this.state.context.players.forEach((p, i) => {
                    if (!effect && p.map === MapTheme.NINJA && (this.physic.paddlesInfo[i].skill as NinjaSkillInfoProps).power.effect)
                        effect = 'ninja';
                    if (p.map === MapTheme.RETRO && (this.physic.paddlesInfo[i].skill as RetroSkillInfoProps).ulti.effect)
                        effect = 'retroUlti';
                });
                return effect ?? 'none';
            };
            client.emit('ball', { balls: this.physic.ballsInfo.map(b => ({ ...b, effect: effect() })) });
        }
    };

    public chooseMap(client: Socket, map: Player['map']): void {
        this.machine.send(GameModel.events.chooseMap(this.getNameBySocket(client), map));
    };

    public join(client: Socket, name: Player['name']): boolean {
        if (this.machine.send(GameModel.events.join(name)).changed) {
            this.clients.push(client);
            if (this.state.context.players.length === 2)
                this.reconnection = setTimeout(() => {
                    client.emit('reconnect');
                    console.log('reconnect required');
                }, 30000);
            return true;
        }
        return false;
    };

    public leave(client: Socket): boolean {
        const index: number = this.clients.indexOf(client);
        if (index != -1 && this.machine.send(GameModel.events.leave(this.players[index].name)).changed) {
            this.clients.splice(index, 1);
            if (index === 1) clearTimeout(this.reconnection);
            return true;
        }
        return false;
    };

    public move(client: Socket, key: Paddle['key'] & { ulti: boolean, power: boolean }) {
        this.machine.send(GameModel.events.update());

        if (key.ulti) {
            this.physic.setUlti(this.clients.indexOf(client), true)
            if (this.physic.paddlesInfo[this.clients.indexOf(client)].skill.ulti.isActive && this.machine.send(GameModel.events.ulti(this.getNameBySocket(client))).changed) {
                this.physic.pause();
                this.clients.find(c => c !== client).emit('ulti');
            }
        }

        const player = this.state.context.players[this.clients.indexOf(client)];
        if (!player.power.time) {
            if (player.map === MapTheme.NINJA) {
                if (!key.power && this.physic.paddlesInfo[this.clients.indexOf(client)].skill.power.isActive)
                    this.machine.send(GameModel.events.power(this.getNameBySocket(client)));
                this.physic.setPower(this.clients.indexOf(client), key.power);
            } else {
                this.physic.setPower(this.clients.indexOf(client), key.power);
                if (this.physic.paddlesInfo[this.clients.indexOf(client)].skill.power.isActive)
                    this.machine.send(GameModel.events.power(this.getNameBySocket(client)));
            }
        }

        this.physic.setKeys(this.clients.indexOf(client), { leftward: key.leftward, rightward: key.rightward });
        this.player(client);
    };

    public play(client: Socket): void {
        if (this.machine.send(GameModel.events.ready(this.getNameBySocket(client))).changed) {
            if (this.machine.send(GameModel.events.start()).changed) {
                this.physic.play()
                this.clients.map(c => c.emit('play'));
            }
        }
    };

    public player(client: Socket): void {
        if (this.state.context.players.length === 2) {
            const effect = (index: number): string => {
                const indexOpponent = index ? 0 : 1;
                if (this.state.context.players[indexOpponent].map === MapTheme.RETRO && this.physic.paddlesInfo[indexOpponent].skill.power.isActive)
                    return 'retroPower';
                return 'none';
            };
            let players = [
                { ...this.physic.paddlesInfo[0], cooldown: this.state.context.players[0].power.time, effect: effect(0) },
                { ...this.physic.paddlesInfo[1], cooldown: this.state.context.players[1].power.time, effect: effect(1) }
            ];
            if (this.clients.indexOf(client) === 1) { players = [players[1], players[0]]; }
            client.emit('players', { players });
        }
    };

    public maps(client: Socket): void {
        if (this.state.context.players.length === 2) {
            let infos: [{ skill: SkillInfoProps }, { skill: SkillInfoProps }] = [
                { skill: this.physic.paddlesInfo[0].skill },
                { skill: this.physic.paddlesInfo[1].skill }
            ];
            if (this.clients.indexOf(client) === 1) { infos = [infos[1], infos[0]]; }
            client.emit('maps', { infos });
        }
    };

    public restart(): void {
        this.machine.send(GameModel.events.restart());
        if (!this.id && this.state.context.players.length === 2)
            this.reconnection = setTimeout(() => {
                this.clients[1].emit('reconnect');
                console.log('reconnect required');
            }, 30000);
        this.physic = null;
    };

    public score(index: number, isBall: boolean): void {
        this.machine.send(GameModel.events.score(index, isBall));
        this.physic.pause();
        this.clients.forEach((c, i) => c.emit('score', { index: (i === index) ? 0 : 1, isBall }));
    };

    public async sendEnd(): Promise<void> {
        this.clients.forEach(c => c.emit('end'));
        this.physic?.off('score', this.score);
        this.physic?.stop();
    };

    public sendLeave(): void {
        this.clients.forEach(c => c.emit('leave'));
    }

    public match(): void {
        if (this.machine.send(GameModel.events.start()).changed) {
            clearTimeout(this.reconnection);
            this.clients.forEach(c => c.emit('match', { players: this.state.context.players }));
        }
    };

    public start(client: Socket): void {
        if (this.machine.send(GameModel.events.ready(this.getNameBySocket(client))).changed) {
            if (this.machine.send(GameModel.events.start()).changed) {
                if (!this.physic) {
                    this.physic = new Physic(this.players[0].map, this.players[1].map);
                    this.physic.on('score', this.score);
                }
                const current: number = this.physic.start();
                this.clients.map(c => c.emit('start', { current }));
            }
        }
    };

    public stop(): void {
        this.machine.stop();
    };

    private getNameBySocket(client: Socket): string { return this.players[this.clients.indexOf(client)].name; }

    get isFull(): boolean {
        return (this.state.context.players.length === 2) ? true : false;
    }

    get isEmpty(): boolean {
        return (this.state.context.players.length === 0) ? true : false;
    }

    get players(): { client: Socket, name: Player['name'], map: Player['map'] }[] {
        return this.clients.map((c, i) => ({
            client: c,
            name: this.state.context.players[i].name,
            map: this.state.context.players[i].map
        }));
    }
}