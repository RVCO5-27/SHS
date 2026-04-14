import { useEffect, useState } from 'react';
import { getAllUsers, createUser, updateUser, deleteUser } from '../services/adminUsers';
import UserForm from '../components/UserForm';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getAllUsers();
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleAdd = () => { setEditing(null); setShowForm(true); };
  const handleEdit = (u) => { setEditing(u); setShowForm(true); };
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this user?')) return;
    try {
      await deleteUser(id);
      await load();
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed');
    }
  };

  const handleSave = async (payload) => {
    try {
      if (editing && editing.id) {
        await updateUser(editing.id, payload);
      } else {
        await createUser(payload);
      }
      setShowForm(false);
      setEditing(null);
      await load();
    } catch (err) {
      alert(err.response?.data?.message || 'Save failed');
    }
  };

  return (
    <div className="admin-console">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>User Management</h2>
        <div>
          <button className="btn btn-success" onClick={handleAdd}>Add User</button>
        </div>
      </div>

      {showForm && (
        <UserForm initial={editing || {}} onCancel={() => { setShowForm(false); setEditing(null); }} onSave={handleSave} />
      )}

      {loading ? (
        <div>Loading...</div>
      ) : (
        <table className="table table-striped">
          <thead>
            <tr>
              <th>ID</th>
              <th>Username</th>
              <th>Email</th>
              <th>Role</th>
              <th>Created At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td>{u.username}</td>
                <td>{u.email}</td>
                <td>
                  <span className={`badge ${u.role === 'admin' ? 'bg-danger' : 'bg-primary'}`}>
                    {u.role}
                  </span>
                </td>
                <td>{new Date(u.created_at).toLocaleDateString()}</td>
                <td>
                  <button className="btn btn-sm btn-primary me-2" onClick={() => handleEdit(u)}>Edit</button>
                  <button className="btn btn-sm btn-danger" onClick={() => handleDelete(u.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
