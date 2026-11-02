export type RequestAuth = {
  id: string;
};

export type PublicIdentity = {
  id: string;
  email: string;
  createdAt: string;
};

declare global {
  namespace Express {
    interface Request {
      auth?: RequestAuth;
    }
  }
}
