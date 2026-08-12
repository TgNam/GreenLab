import {Role} from './role';

export class User {
    id: number;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    fullName: string;
    avatar: string;
    role: Role;
    token?: string;
}
