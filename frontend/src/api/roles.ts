import { api } from "./client";

export interface Permission {
  id: number;
  code: string;
  name: string;
  module: string;
}

export interface Role {
  id: number;
  code: string;
  name: string;
  permissions: Permission[];
}

export async function getRoles() {
  const { data } = await api.get<Role[]>("/roles");
  return data;
}

export async function getPermissions() {
  const { data } = await api.get<Permission[]>("/roles/permissions");
  return data;
}

export async function updateRolePermissions(
  roleId: number,
  permissionCodes: string[]
) {
  const { data } = await api.put<Role>(
    `/roles/${roleId}/permissions`,
    { permission_codes: permissionCodes }
  );

  return data;
}
