
export enum Role {
  USER = 'user',
  MODEL = 'model',
}

export interface Message {
  role: Role;
  text: string;
}

export interface Draft {
  id: string;
  text: string;
}

export interface ChatHistoryItem {
  id: string;
  title: string;
  messages: Message[];
}
