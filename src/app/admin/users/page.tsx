"use client";

import { useState, useEffect } from "react";

type User = {
  id: number;
  name: string;
  email: string;
  role: string;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/admin/users"); // Assuming a GET /api/admin/users endpoint exists
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }
      const data = await response.json();
      setUsers(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId: number, newRole: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) {
        throw new Error("Failed to update user role");
      }

      // Optimistically update UI or refetch
      fetchUsers();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return <div className="p-4">Loading users...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="p-4">
      <header className="bg-background p-4 text-center z-10 shadow-md">
        <h1 className="text-2xl font-permanent-marker">Manage Users</h1>
      </header>

      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">All Users</h2>
        <ul className="space-y-4">
          {users.map((user) => (
            <li
              key={user.id}
              className="p-4 bg-card rounded-lg shadow-md flex justify-between items-center"
            >
              <div>
                <p className="font-bold">{user.name}</p>
                <p className="text-sm text-gray-400">{user.email}</p>
                <p className="text-sm text-gray-400">Role: {user.role}</p>
              </div>
              <div className="space-x-2">
                <select
                  value={user.role}
                  onChange={(e) => handleRoleChange(user.id, e.target.value)}
                  className="bg-input text-card-foreground border border-border rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
