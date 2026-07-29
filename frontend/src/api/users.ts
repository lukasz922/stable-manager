import { api } from "./client";

export interface User {
  id: number;
  username: string;
  full_name: string;
  role: string;
  is_active: boolean;
}

export interface UserCreate {
  username: string;
  full_name: string;
  password: string;
  role: string;
}

export interface UserUpdate {
  username: string;
  full_name: string;
  role: string;
}

const getUsers = async (): Promise<User[]> => {
  const { data } = await api.get("/users");
  return data;
};

const getUser = async (id: number): Promise<User> => {
  const { data } = await api.get(`/users/${id}`);
  return data;
};

const createUser = async (payload: UserCreate): Promise<User> => {
  const { data } = await api.post("/users", payload);
  return data;
};

const updateUser = async (
  id: number,
  payload: UserUpdate
): Promise<User> => {
  const { data } = await api.put(`/users/${id}`, payload);
  return data;
};

const deleteUser = async (id: number) => {
  return api.delete(`/users/${id}`);
};

const toggleActive = async (
  id: number,
  is_active: boolean
) => {
  const { data } = await api.patch(`/users/${id}/active`, {
    is_active,
  });

  return data;
};

const changePassword = async (
  id: number,
  password: string
) => {
  return api.patch(`/users/${id}/password`, {
    password,
  });
};

export const usersApi = {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  toggleActive,
  changePassword,
};