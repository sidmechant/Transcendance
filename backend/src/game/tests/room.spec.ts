import { GameStates, PlayerTheme } from '../types/machine';
import { Room } from '../Room';

describe('Room', () => {
  describe('join', () => {
    let room: Room;

    beforeEach(() => {
      room = new Room;
    });

    afterEach(() => {
      room.stop();
    });

    it('should allow players to join', () => {
      expect(room.send('join', '1', 'none', PlayerTheme.WESTERN)).toBe(true);
      expect(room.state.context.players).toHaveLength(1);
      expect(room.send('join', '2', 'none', PlayerTheme.RETRO)).toBe(true);
      expect(room.state.context.players).toHaveLength(2);
    });

    it('should not allow the same player to join a game twice', () => {
      expect(room.send('join', '1', 'none', PlayerTheme.MEDIEVAL)).toBe(true);
      expect(room.send('join', '1', 'none', PlayerTheme.NINJA)).toBe(false);
      expect(room.state.context.players).toHaveLength(1);
    });

    it('should not allow a third player to join', () => {
      expect(room.send('join', '1', 'none', PlayerTheme.RETRO)).toBe(true);
      expect(room.send('join', '2', 'none', PlayerTheme.WESTERN)).toBe(true);
      expect(room.send('join', '3', 'none', PlayerTheme.MEDIEVAL)).toBe(false);
      expect(room.state.context.players).toHaveLength(2);
    });
  });
  describe('leave', () => {
    let room: Room;

    beforeEach(() => {
      room = new Room(GameStates.MAP, {
        players:
          [{
            id: '1',
            name: 'none',
            theme: PlayerTheme.MEDIEVAL,
            score: 0
          },
          {
            id: '2',
            name: 'none',
            theme: PlayerTheme.RETRO,
            score: 0
          }]
      });
    });

    afterEach(() => {
      room.stop();
    });

    it('should allow a player to leave', () => {
      expect(room.send('leave', '1')).toBe(true);
      expect(room.state.context.players[0].id).toBe('2');
      expect(room.state.context.players).toHaveLength(1);
    });

    it('should not allow a player to leave', () => {
      expect(room.send('leave', '3')).toBe(false);
      expect(room.state.context.players).toHaveLength(2);
    });
  });
  describe('start', () => {
    let room: Room;

    beforeEach(() => {
      room = new Room(GameStates.MAP, {
        players:
          [{
            id: '1',
            name: 'none',
            theme: PlayerTheme.MEDIEVAL,
            score: 0
          },
          {
            id: '2',
            name: 'none',
            theme: PlayerTheme.RETRO,
            score: 0
          }]
      });
    });

    afterEach(() => {
      room.stop();
    });

    it('should allow a game to start', () => {
      expect(room.send('start')).toBe(true);
      expect(room.state.context.ball.position).toBeDefined()
      expect(room.state.context.players[0].position).toBeDefined()
      expect(room.state.context.players[1].position).toBeDefined()
      expect(room.state.value).toBe(GameStates.PLAY);
    });

    it('should not allow a game to start', () => {
      room.send('leave', '2');
      expect(room.send('start')).toBe(false);
      expect(room.state.value).toBe(GameStates.MAP);
    });
  });
  describe('update and move', () => {
    let room: Room;

    beforeEach(() => {
      room = new Room(GameStates.MAP, {
        players:
          [{
            id: '1',
            name: 'none',
            theme: PlayerTheme.MEDIEVAL,
            score: 0
          },
          {
            id: '2',
            name: 'none',
            theme: PlayerTheme.RETRO,
            score: 0
          }]
      });
      room.send('start');
    });

    afterEach(() => {
      room.stop();
    });

    it('should allow players to move', () => {
      expect(room.send('move', '1', { leftward: true, rightward: false })).toBe(true);
      for (let i = 1000; i; i--) {
        expect(room.send('update', '1')).toBe(true);
      }
      expect(room.state.context.players[0].position.y).toBe(0);
      // expect(room.send('move', '2', {leftward: true, rightward: false})).toBe(true);
      // expect(room.state.context.players[0].position.y > 0).toBe(true);
    });
  });
});
