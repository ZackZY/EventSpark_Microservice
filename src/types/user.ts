export interface User {
  id?: number;
  email: string;
  password: string;
  createdAt?: Date;
  updatedAt?: Date;
  isAdmin: boolean;
}
