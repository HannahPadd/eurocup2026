export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  grooveStatsApi?: string;
  country?: string;
  divisionId?: number[];
}
