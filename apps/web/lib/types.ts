export interface Game {
  id: string;
  name: string;
  description: string;
  code: string;
  created_at: Date;
  creator_id?: string;
  creator_email?: string;
  creator_username?: string;
  play_count?: number;
  last_played_at?: Date;
  preview?: boolean;
  tags?: string[] | null;
}

export interface GameStats {
  gameName: string;
  activePlayers: number;
  activeRooms: number;
  totalPlayCount: number;
  lastPlayedAt?: Date;
}

