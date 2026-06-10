export interface User {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
}

export interface UserPreference {
  theme: 'LIGHT' | 'DARK' | 'SYSTEM';
  showOnlineStatus: boolean;
  showLastSeen: boolean;
}

export interface Message {
  id: string;
  senderId: string;
  content: string | null;
  type: 'TEXT' | 'IMAGE' | 'VOICE';
  mediaUrl: string | null;
  isEdited: boolean;
  editedAt: string | null;
  isDeleted: boolean;
  deletedAt: string | null;
  seenAt: string | null;
  createdAt: string;
}
