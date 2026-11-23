export interface InviteFriendDto {
  friendEmail: string;
  friendName?: string;
}

export interface RespondFriendDto {
  status: 'ACCEPTED' | 'DECLINED';
}
