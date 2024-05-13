import { Socket } from "socket.io";
import { Room } from "./Room";
import { Player } from "./types/machine";
import { Injectable } from '@nestjs/common'

function idGenerate(rooms: Room[]): number {
    const usedIDs = new Set(rooms.map((room) => room.id));
    return [...Array(rooms.length + 2).keys()].find((i) => !usedIDs.has(i) && i !== 0);
}

@Injectable()
export class Match {
    private rooms: Room[] = [];

    public add(client: Socket, name: string, mode: 'matchMaking' | 'friendlyMatch'): number {
        (mode === 'friendlyMatch') && (this.remove(client));
        if (!this.rooms.find(r => r.players.find(p => p.client === client)) && ((mode === 'friendlyMatch')
            || (mode === 'matchMaking' && !this.rooms.find(r => r.join(client, name))))) {
            const newRoom = new Room((mode === 'matchMaking') ? 0 : idGenerate(this.rooms));
            newRoom.join(client, name);
            this.rooms.push(newRoom);
            console.log('----- ADD -----');
            console.log(this.rooms.map(r => r.players));
            console.log(this.rooms.length);
            this.merge();
            return newRoom.id;
        }
        return -1;
    };

    public join(id: number, client: Socket, name: string): boolean {
        this.remove(client);
        if (!this.rooms.find(r => r.players.find(p => p.client === client))) {
            const room = this.rooms.find(r => r.id === id && !r.isFull);
            if (room) {
                room.join(client, name);
                console.log('----- ADD -----');
                console.log(this.rooms.map(r => r.players));
                console.log(this.rooms.length);
                return true;
            }
        }
        return false;
    };

    public getRoom(client: Socket): Room {
        return this.rooms.find(room => room.players.some(p => p.client === client));
    };

    public getRoomById(id: number): Room {
        return this.rooms.find(room => room.id === id);
    };

    public remove(client: Socket): void {
        const room: Room | undefined = this.rooms.find(r => r.leave(client));

        if (room && room.isEmpty) {
            const index: number = this.rooms.indexOf(room);
            room.stop();
            this.rooms.splice(index, 1);
            console.log('----- REMOVE -----');
            console.log(this.rooms.map(r => r.players));
            console.log(this.rooms.length);
        }

        this.merge();
    };

    public deleteRoom(id: number): void {
        const room: Room | undefined = this.rooms.find(r => r.id === id);

        if (room) {
            const index: number = this.rooms.indexOf(room);
            room.stop();
            this.rooms.splice(index, 1);
        }
        console.log('----- DELETE -----');
        console.log(this.rooms.map(r => r.players));
        console.log(this.rooms.length);
    };

    public merge(): void {
        const singlePlayerRooms = this.rooms.filter(room => room.id === 0 && !room.isFull);

        for (let i = 0; i < singlePlayerRooms.length; i += 2) {
            const room1 = singlePlayerRooms[i];
            const room2 = singlePlayerRooms[i + 1];

            if (room2) {
                const { client, name, map }: { client: Socket, name: Player['name'], map: Player['map'] } = room2.players[0];

                if (room1.join(client, name)) {
                    const index: number = this.rooms.indexOf(room2);
                    room2.stop();
                    this.rooms.splice(index, 1);

                    room1.chooseMap(client, map);
                    room1.start(client);
                    console.log('----- MERGE -----');
                    console.log(this.rooms.map(r => r.players));
                    console.log(this.rooms.length);
                }
            }
        }
    };
}