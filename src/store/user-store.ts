import { create } from 'zustand';
import { User } from 'firebase/auth';
import { UserAdapter } from '@/hooks/UserAdapter';

interface UserState {
  user: User | null;
  username: string | null;
  loaded: boolean;
  userAdapter: UserAdapter | null;
  setUser: (user: User | null) => void;
  setUsername: (username: string | null) => void;
  setLoaded: (loaded: boolean) => void;
  setUserAdapter: (adapter: UserAdapter | null) => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  username: null,
  loaded: false,
  userAdapter: null,
  setUser: (user) => set({ user }),
  setUsername: (username) => set({ username }),
  setLoaded: (loaded) => set({ loaded }),
  setUserAdapter: (userAdapter) => set({ userAdapter }),
}));
