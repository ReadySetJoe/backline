import { Role } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      role: Role | null;
    };
  }

  interface User {
    role: Role | null;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    role: Role | null;
  }
}
