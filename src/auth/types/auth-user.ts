export type AuthUser = {
  id: string;
  email?: string | null;
  name?: string | null;
  roles?: string[];
};
