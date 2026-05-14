export interface RegisterPayload {
  username: string;
  password: string;
}

export interface LoginPayload {
  username: string;
  password: string;
}

export interface RoomPayload {
  name: string;
}

export interface MessagePayload {
  roomId: string;
  content: string;
}
