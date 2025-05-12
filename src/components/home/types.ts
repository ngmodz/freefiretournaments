export type TournamentStatus = 'active' | 'ongoing' | 'completed' | 'cancelled';

export interface TournamentType {
  id: string;
  title: string;
  mode: string;
  entryFee: number;
  prizeMoney: number;
  date: string;
  time: string;
  totalSpots: number;
  filledSpots: number;
  status: TournamentStatus;
  isPremium: boolean;
}
