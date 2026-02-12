export interface AuthUser {
  id: number;
  username: string;
  passwordHash: string;
  isActive: boolean;

  // 🔐 Appartenance métier
  siteId: number | null;

  roles?: {
    role: {
      name: string;
    };
  }[];
}
