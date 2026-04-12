import { UserPayload } from '../src/models/types'; // Vérifie bien ce chemin

declare global {
  namespace Express {
    interface Request {
      user?: UserPayload;
    }
  }
}

export { UserPayload };
