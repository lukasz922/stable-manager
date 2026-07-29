import { useCallback, useEffect, useState } from "react";
import {
  usersApi,
  type User,
  type UserCreate,
  type UserUpdate,
} from "../api/users";

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await usersApi.getUsers();
      setUsers(data);
    } catch (err) {
      console.error("Błąd pobierania użytkowników:", err);
      setError("Nie udało się pobrać użytkowników.");
    } finally {
      setLoading(false);
    }
  }, []);

  const createUser = async (payload: UserCreate) => {
    await usersApi.createUser(payload);
    await loadUsers();
  };

  const updateUser = async (id: number, payload: UserUpdate) => {
    await usersApi.updateUser(id, payload);
    await loadUsers();
  };

  const deleteUser = async (id: number) => {
    await usersApi.deleteUser(id);
    await loadUsers();
  };

  const toggleActive = async (id: number, isActive: boolean) => {
    await usersApi.toggleActive(id, isActive);
    await loadUsers();
  };

  const changePassword = async (id: number, password: string) => {
    await usersApi.changePassword(id, password);
  };

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  return {
    users,
    loading,
    error,
    loadUsers,
    createUser,
    updateUser,
    deleteUser,
    toggleActive,
    changePassword,
  };
}