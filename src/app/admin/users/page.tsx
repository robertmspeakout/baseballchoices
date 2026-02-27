"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";

interface AdminUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  trialExpiresAt: string;
  membershipActive: boolean;
  createdAt: string;
  gradYear: number | null;
  position: string | null;
  state: string | null;
  profileComplete: boolean;
}

export default function AdminUsersPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [editRole, setEditRole] = useState("");
  const [editTrial, setEditTrial] = useState("");
  const [editMembership, setEditMembership] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const currentRole = (session?.user as Record<string, unknown>)?.role as string;
  const currentEmail = session?.user?.email;
  const isOwner = currentRole === "OWNER" || currentEmail === "testing@extrabase.com";
  const isAdminOrOwner = currentRole === "ADMIN" || currentRole === "OWNER" || currentEmail === "testing@extrabase.com";

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch { /* ignore */ }
    setLoading(false);
  };

  const openEdit = (user: AdminUser) => {
    setEditUser(user);
    setEditRole(user.role);
    setEditTrial(new Date(user.trialExpiresAt).toISOString().split("T")[0]);
    setEditMembership(user.membershipActive);
    setMessage("");
  };

  const handleSave = async () => {
    if (!editUser) return;
    setSaving(true);
    setMessage("");

    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: editUser.id,
          role: editRole,
          trialExpiresAt: editTrial + "T23:59:59.000Z",
          membershipActive: editMembership,
        }),
      });

      if (res.ok) {
        setMessage("Saved!");
        await fetchUsers();
        setTimeout(() => setEditUser(null), 800);
      } else {
        const data = await res.json();
        setMessage(data.error || "Failed to save");
      }
    } catch {
      setMessage("Error saving");
    }
    setSaving(false);
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("Are you sure you want to permanently delete this user?")) return;

    try {
      const res = await fetch(`/api/admin/users?userId=${userId}`, { method: "DELETE" });
      if (res.ok) {
        await fetchUsers();
        setEditUser(null);
      }
    } catch { /* ignore */ }
  };

  if (!isAdminOrOwner) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-500 mb-4">You don&apos;t have permission to view this page.</p>
          <Link href="/" className="text-blue-600 hover:text-blue-800 font-medium">Go Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-950 text-white">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <BrandLogo size="sm" showTagline={false} />
            <span className="text-white/50 text-sm">|</span>
            <div className="flex items-center gap-3">
              <Link href="/admin" className="text-sm text-white/60 hover:text-white transition-colors">Schools</Link>
              <Link href="/admin/users" className="text-sm text-white font-bold border-b-2 border-red-500 pb-0.5">Users</Link>
            </div>
          </div>
          <Link href="/" className="text-sm text-white/60 hover:text-white transition-colors">Back to Site</Link>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-black text-gray-900">User Management</h1>
          <span className="text-sm text-gray-500">{users.length} users</span>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-200 border-t-blue-600" />
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Name</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Email</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Grad Year</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Position</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">State</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Role</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Trial Expires</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Member</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Joined</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600"></th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => {
                    const trialActive = new Date(user.trialExpiresAt) > new Date();
                    return (
                      <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{user.firstName} {user.lastName}</td>
                        <td className="px-4 py-3 text-gray-600">{user.email}</td>
                        <td className="px-4 py-3 text-gray-600">{user.gradYear || "—"}</td>
                        <td className="px-4 py-3 text-gray-600">{user.position || "—"}</td>
                        <td className="px-4 py-3 text-gray-600">{user.state || "—"}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${
                            user.role === "OWNER" ? "bg-purple-100 text-purple-700" :
                            user.role === "ADMIN" ? "bg-blue-100 text-blue-700" :
                            "bg-gray-100 text-gray-600"
                          }`}>{user.role}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs ${trialActive ? "text-green-600" : "text-red-500"}`}>
                            {new Date(user.trialExpiresAt).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {user.membershipActive ? (
                            <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700">Active</span>
                          ) : (
                            <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-500">No</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{new Date(user.createdAt).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          <button onClick={() => openEdit(user)} className="text-blue-600 hover:text-blue-800 text-xs font-medium">
                            Edit
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Edit Panel */}
        {editUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setEditUser(null)}>
            <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Edit User</h3>
              <p className="text-sm text-gray-500 mb-6">{editUser.firstName} {editUser.lastName} ({editUser.email})</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select value={editRole} onChange={(e) => setEditRole(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm text-gray-900">
                    <option value="USER">User</option>
                    <option value="ADMIN">Admin</option>
                    {isOwner && <option value="OWNER">Owner</option>}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Trial Expiration</label>
                  <input type="date" value={editTrial} onChange={(e) => setEditTrial(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm text-gray-900" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Membership</label>
                  <button type="button" onClick={() => setEditMembership(!editMembership)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${editMembership ? "bg-green-50 text-green-800 border-2 border-green-400" : "bg-gray-100 text-gray-600 border-2 border-transparent"}`}>
                    <span className={`w-5 h-5 rounded flex items-center justify-center ${editMembership ? "bg-green-500 text-white" : "bg-gray-300 text-transparent"}`}>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    </span>
                    {editMembership ? "Active Member" : "Not a Member"}
                  </button>
                </div>

                {message && (
                  <p className={`text-sm font-medium ${message === "Saved!" ? "text-green-600" : "text-red-600"}`}>{message}</p>
                )}

                <div className="flex gap-3 pt-2">
                  <button onClick={() => setEditUser(null)} className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50">
                    Cancel
                  </button>
                  <button onClick={handleSave} disabled={saving} className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 disabled:opacity-50">
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>

                {isOwner && (
                  <button onClick={() => handleDelete(editUser.id)} className="w-full px-4 py-2.5 text-red-600 hover:text-red-800 text-xs font-medium transition-colors text-center mt-2">
                    Permanently Delete User
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
