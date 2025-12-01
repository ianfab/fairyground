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
  min_players_per_room?: number;
  max_players_per_room?: number;
  has_win_condition?: boolean;
  can_join_late?: boolean;
  tags?: string[] | null;
}

export interface GameStats {
  gameName: string;
  activePlayers: number;
  activeRooms: number;
  totalPlayCount: number;
  lastPlayedAt?: Date;
}

