export type TournamentStatus = 'active' | 'ongoing' | 'ended' | 'completed' | 'cancelled';

export interface TournamentType {
  id: string;
  title: string;
  mode: string;
  map: string;
  entryFee: number;
  prizeMoney: number;
  date: string;
  time: string;
  totalSpots: number;
  filledSpots: number;
  status: TournamentStatus;
  ttl?: any; // Can be a Firestore Timestamp
  host_id?: string;
}
