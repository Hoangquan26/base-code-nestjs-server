export type AuthUser = {
  id: string;
  email?: string | null;
  name?: string | null;
  avatarUrl?: string | null;
  avatarSource?: 'UPLOAD' | 'S3' | 'SOCIAL' | null;
  roles?: string[];
};
