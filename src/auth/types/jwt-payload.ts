export type JwtPayload = {
  sub: string;
  email?: string | null;
  name?: string | null;
  roles?: string[];
};
