import Phaser from 'phaser';
import {
    unlockAudio,
    playSound,
    SOUND_KEYS,
    COLORS,
    WIDTH,
    HEIGHT,
    DEFAULT_PVP_SERVER_URL,
    Player,
    OnlineRoomState,
    saveReconnectSession,
} from '../shared';

export type OnlineRoomSummary = {
  room_code: string;
  red_joined?: boolean;
  game_over?: boolean;
  current_player?: Player;
  turn?: number;
  counts?: { blue: number; red: number };
  updated_at?: number;
};

function getRoomCodeFromUnknown(value: unknown): string | null {
  if (typeof value === 'string') return value.trim().toUpperCase() || null;
  if (!value || typeof value !== 'object') return null;

  const record = value as Record<string, unknown>;
  const possible = record.room_code ?? record.roomCode ?? record.code ?? record.id;
  return typeof possible === 'string' ? possible.trim().toUpperCase() || null : null;
}

function parseRoomList(payload: unknown): OnlineRoomSummary[] {
  const source = Array.isArray(payload)
    ? payload
    : payload && typeof payload === 'object'
      ? ((payload as Record<string, unknown>).rooms ?? (payload as Record<string, unknown>).available_rooms ?? [])
      : [];

  if (!Array.isArray(source)) return [];

  const seen = new Set<string>();
  const rooms: OnlineRoomSummary[] = [];

  for (const item of source) {
    const code = getRoomCodeFromUnknown(item);
    if (!code || seen.has(code)) continue;
    seen.add(code);

    const record = item && typeof item === 'object' ? item as Partial<OnlineRoomSummary> : {};
    rooms.push({
      room_code: code,
      red_joined: Boolean(record.red_joined),
      game_over: Boolean(record.game_over),
      current_player: record.current_player,
      turn: typeof record.turn === 'number' ? record.turn : undefined,
      counts: record.counts,
      updated_at: typeof record.updated_at === 'number' ? record.updated_at : undefined,
    });
  }

  return rooms.sort((a, b) => (b.updated_at ?? 0) - (a.updated_at ?? 0));
}

function isRoomJoinable(room: OnlineRoomSummary | undefined) {
  return Boolean(room && !room.red_joined && !room.game_over);
}

function getRoomStatus(room: OnlineRoomSummary) {
  if (room.game_over) return 'Finished';
  if (room.red_joined) return 'In Progress';
  return 'Waiting';
}

function getRoomStatusColor(room: OnlineRoomSummary) {
  if (room.game_over) return '#c7c7c7';
  if (room.red_joined) return '#7cc3ff';
  return '#7cff83';
}

function countJoinableRooms(rooms: OnlineRoomSummary[]) {
  return rooms.filter(isRoomJoinable).length;
}

export class OnlineLobbyScene extends Phaser.Scene {
  private serverUrl = DEFAULT_PVP_SERVER_URL;
  private statusText!: Phaser.GameObjects.Text;
  private selectedRoomCode = '';
  private availableRooms: OnlineRoomSummary[] = [];
  private roomRows: Phaser.GameObjects.Container[] = [];
  private joinButton?: Phaser.GameObjects.Container;
  private joinButtonBg?: Phaser.GameObjects.Graphics;
  private joinButtonLabel?: Phaser.GameObjects.Text;
  private refreshEvent?: Phaser.Time.TimerEvent;

  constructor() {
    super('OnlineLobbyScene');
  }

  create() {
    this.input.once('pointerdown', () => unlockAudio(this));
    const g = this.add.graphics();
    g.fillGradientStyle(COLORS.bgTop, COLORS.bgTop, COLORS.bgBottom, COLORS.bgBottom, 1);
    g.fillRect(0, 0, WIDTH, HEIGHT);

    this.add.text(WIDTH / 2, 72, 'ONLINE PVP', {
      fontSize: '34px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 7,
    }).setOrigin(0.5);

    this.add.text(WIDTH / 2, 116, 'Browse rooms. Join only rooms marked Waiting.', {
      fontSize: '15px',
      color: '#eaf7ff',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);

    const panel = this.add.graphics();
    panel.fillStyle(0x163d5d, 0.78);
    panel.lineStyle(3, 0xffffff, 0.6);
    panel.fillRoundedRect(24, 145, WIDTH - 48, 300, 18);
    panel.strokeRoundedRect(24, 145, WIDTH - 48, 300, 18);

    this.statusText = this.add.text(WIDTH / 2, 172, 'Loading rooms...', {
      fontSize: '16px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
      align: 'center',
      wordWrap: { width: 370 },
    }).setOrigin(0.5);

    this.createLobbyButton(500, 'Create Room', () => this.createRoom());

    const join = this.createLobbyButton(590, 'Join Room', () => this.joinSelectedRoom(), false);
    this.joinButton = join.button;
    this.joinButtonBg = join.bg;
    this.joinButtonLabel = join.label;

    this.createLobbyButton(680, 'Back to Menu', () => this.scene.start('MenuScene'));

    this.loadAvailableRooms();
    this.refreshEvent = this.time.addEvent({
      delay: 3500,
      loop: true,
      callback: () => this.loadAvailableRooms(false),
    });
  }

  shutdown() {
    this.refreshEvent?.remove(false);
  }

  private createLobbyButton(y: number, labelText: string, callback: () => void, enabled = true) {
    const button = this.add.container(WIDTH / 2, y);
    const bg = this.add.graphics();
    const label = this.add.text(0, 0, labelText, {
      fontSize: '23px',
      fontStyle: 'bold',
      color: '#ffffff',
    }).setOrigin(0.5);

    button.add([bg, label]);
    button.setSize(310, 58);
    button.on('pointerdown', () => {
      unlockAudio(this);
      if (enabled || button.getData('enabled')) {
        callback();
      } else {
        playSound(this, SOUND_KEYS.invalid, 0.35);
      }
    });

    this.setButtonEnabled(button, bg, label, enabled);
    return { button, bg, label };
  }

  private setButtonEnabled(
    button: Phaser.GameObjects.Container,
    bg: Phaser.GameObjects.Graphics,
    label: Phaser.GameObjects.Text,
    enabled: boolean
  ) {
    bg.clear();
    bg.fillStyle(enabled ? 0xb78a55 : 0x7f7f7f, enabled ? 1 : 0.72);
    bg.fillRoundedRect(-155, -29, 310, 58, 14);
    label.setAlpha(enabled ? 1 : 0.58);
    button.setAlpha(enabled ? 1 : 0.86);
    button.setData('enabled', enabled);
    button.setInteractive({ useHandCursor: enabled });
  }

  private setStatus(text: string) {
    this.statusText.setText(text);
  }

  private async loadAvailableRooms(showLoading = true) {
    if (showLoading) this.setStatus('Loading rooms...');

    try {
      const rooms = await this.fetchAvailableRooms();
      this.availableRooms = rooms;

      if (this.selectedRoomCode && !rooms.some(room => room.room_code === this.selectedRoomCode)) {
        this.selectedRoomCode = '';
      }

      this.renderRoomList();
      this.updateJoinButton();

      const joinableCount = countJoinableRooms(rooms);
      const selectedRoom = this.getSelectedRoom();

      if (!rooms.length) {
        this.setStatus('No rooms yet. Create a room to start.');
      } else if (selectedRoom) {
        const status = getRoomStatus(selectedRoom);
        this.setStatus(
          isRoomJoinable(selectedRoom)
            ? `Selected ${selectedRoom.room_code} — Waiting. Ready to join.`
            : `Selected ${selectedRoom.room_code} — ${status}. Cannot join.`
        );
      } else {
        this.setStatus(`Rooms: ${rooms.length} total, ${joinableCount} waiting. Select a Waiting room to join.`);
      }
    } catch (error) {
      this.availableRooms = [];
      this.selectedRoomCode = '';
      this.renderRoomList();
      this.updateJoinButton();
      this.setStatus(`Could not load rooms.\n${String(error).slice(0, 120)}`);
    }
  }

  private async fetchAvailableRooms() {
    // Prefer /rooms/list because it should return all rooms: Waiting, In Progress, and Finished.
    // Fallback endpoints are kept for older backend deployments.
    const endpoints = ['/rooms/list', '/rooms/available', '/rooms'];
    let lastError = '';

    for (const endpoint of endpoints) {
      try {
        const res = await fetch(`${this.serverUrl}${endpoint}`);
        if (!res.ok) {
          lastError = await res.text();
          continue;
        }

        const payload = await res.json();
        return parseRoomList(payload);
      } catch (error) {
        lastError = String(error);
      }
    }

    throw new Error(lastError || 'Room list endpoint is unavailable.');
  }

  private renderRoomList() {
    for (const row of this.roomRows) row.destroy();
    this.roomRows = [];

    const header = this.add.container(WIDTH / 2, 207);
    const headerRoom = this.add.text(-140, 0, 'ROOM', {
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#dff5ff',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0, 0.5);
    const headerTurn = this.add.text(-25, 0, 'TURN', {
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#dff5ff',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0, 0.5);
    const headerStatus = this.add.text(70, 0, 'STATUS', {
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#dff5ff',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0, 0.5);
    header.add([headerRoom, headerTurn, headerStatus]);
    this.roomRows.push(header);

    const maxRows = 6;
    const rooms = this.availableRooms.slice(0, maxRows);

    if (!rooms.length) {
      const empty = this.add.text(WIDTH / 2, 295, 'No rooms found.', {
        fontSize: '18px',
        color: '#dff5ff',
        stroke: '#000000',
        strokeThickness: 3,
      }).setOrigin(0.5);
      const holder = this.add.container(0, 0, [empty]);
      this.roomRows.push(holder);
      return;
    }

    rooms.forEach((room, index) => {
      const y = 238 + index * 35;
      const selected = room.room_code === this.selectedRoomCode;
      const joinable = isRoomJoinable(room);
      const status = getRoomStatus(room);
      const row = this.add.container(WIDTH / 2, y);

      const bg = this.add.graphics();
      bg.fillStyle(selected ? COLORS.selected : 0xffffff, selected ? 0.92 : 0.14);
      bg.lineStyle(2, selected ? 0xffffff : 0xdff5ff, selected ? 0.9 : 0.28);
      bg.fillRoundedRect(-180, -16, 360, 32, 10);
      bg.strokeRoundedRect(-180, -16, 360, 32, 10);

      const textColor = selected ? '#102235' : '#ffffff';
      const strokeColor = selected ? '#ffffff' : '#000000';
      const statusColor = selected ? '#102235' : getRoomStatusColor(room);

      const roomText = this.add.text(-165, 0, room.room_code, {
        fontSize: '16px',
        fontStyle: selected ? 'bold' : 'normal',
        color: textColor,
        stroke: strokeColor,
        strokeThickness: selected ? 1 : 3,
      }).setOrigin(0, 0.5);

      const turnText = this.add.text(-55, 0, String(room.turn ?? '-'), {
        fontSize: '16px',
        color: textColor,
        stroke: strokeColor,
        strokeThickness: selected ? 1 : 3,
      }).setOrigin(0, 0.5);

      const statusText = this.add.text(30, 0, status, {
        fontSize: '15px',
        fontStyle: joinable ? 'bold' : 'normal',
        color: statusColor,
        stroke: strokeColor,
        strokeThickness: selected ? 1 : 3,
      }).setOrigin(0, 0.5);

      row.add([bg, roomText, turnText, statusText]);
      row.setSize(360, 32);
      row.setInteractive({ useHandCursor: true });
      row.on('pointerdown', () => {
        playSound(this, joinable ? SOUND_KEYS.select : SOUND_KEYS.invalid, joinable ? 0.45 : 0.28);
        this.selectedRoomCode = room.room_code;
        this.renderRoomList();
        this.updateJoinButton();
        this.setStatus(joinable
          ? `Selected ${room.room_code} — Waiting. Ready to join.`
          : `Selected ${room.room_code} — ${status}. Cannot join.`
        );
      });

      this.roomRows.push(row);
    });
  }

  private getSelectedRoom() {
    return this.availableRooms.find(room => room.room_code === this.selectedRoomCode);
  }

  private updateJoinButton() {
    if (!this.joinButton || !this.joinButtonBg || !this.joinButtonLabel) return;
    this.setButtonEnabled(
      this.joinButton,
      this.joinButtonBg,
      this.joinButtonLabel,
      isRoomJoinable(this.getSelectedRoom())
    );
  }

  private async createRoom() {
    try {
      this.setStatus('Creating room...');

      const res = await fetch(`${this.serverUrl}/rooms/create`, {
        method: 'POST',
      });

      if (!res.ok) throw new Error(await res.text());

      const state: OnlineRoomState = await res.json();
      playSound(this, SOUND_KEYS.confirm, 0.55);
      if (state.player_id && state.player_color) {
        saveReconnectSession({
          serverUrl: this.serverUrl,
          roomCode: state.room_code,
          playerId: state.player_id,
          playerColor: state.player_color,
        });
      }
      this.scene.start('HexConquestScene', {
        mode: 'online',
        onlineServerUrl: this.serverUrl,
        roomCode: state.room_code,
        playerId: state.player_id,
        playerColor: state.player_color,
      });
    } catch (error) {
      this.setStatus(`Create room failed:\n${String(error).slice(0, 160)}`);
    }
  }

  private async joinSelectedRoom() {
    const selectedRoom = this.getSelectedRoom();
    if (!this.selectedRoomCode || !isRoomJoinable(selectedRoom)) {
      playSound(this, SOUND_KEYS.invalid, 0.35);
      if (selectedRoom) {
        this.setStatus(`Selected ${selectedRoom.room_code} — ${getRoomStatus(selectedRoom)}. Cannot join.`);
      }
      return;
    }

    try {
      const code = this.selectedRoomCode.trim().toUpperCase();
      this.setStatus(`Joining ${code}...`);

      const res = await fetch(`${this.serverUrl}/rooms/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room_code: code }),
      });

      if (!res.ok) throw new Error(await res.text());

      const state: OnlineRoomState = await res.json();
      playSound(this, SOUND_KEYS.confirm, 0.55);
      if (state.player_id && state.player_color) {
        saveReconnectSession({
          serverUrl: this.serverUrl,
          roomCode: state.room_code,
          playerId: state.player_id,
          playerColor: state.player_color,
        });
      }
      this.scene.start('HexConquestScene', {
        mode: 'online',
        onlineServerUrl: this.serverUrl,
        roomCode: state.room_code,
        playerId: state.player_id,
        playerColor: state.player_color,
      });
    } catch (error) {
      this.setStatus(`Join room failed:\n${String(error).slice(0, 160)}`);
      this.loadAvailableRooms(false);
    }
  }
}