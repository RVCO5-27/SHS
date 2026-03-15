import { useEffect, useState } from 'react';
import { getAllStudents, createStudent, updateStudent, deleteStudent } from '../services/students';
import StudentForm from '../components/StudentForm';

export default function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getAllStudents();
      setStudents(data);
    } catch (err) {
      console.error(err);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleAdd = () => { setEditing(null); setShowForm(true); };
  const handleEdit = (s) => { setEditing(s); setShowForm(true); };
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this student?')) return;
    await deleteStudent(id);
    await load();
  };

  const handleSave = async (payload) => {
    try {
      if (editing && editing.id) {
        await updateStudent(editing.id, payload);
      } else {
        await createStudent(payload);
      }
      setShowForm(false);
      setEditing(null);
      await load();
    } catch (err) {
      alert(err.response?.data?.message || 'Save failed');
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>Students</h2>
        <div>
          <button className="btn btn-success" onClick={handleAdd}>Add Student</button>
        </div>
      </div>

      {showForm && (
        <StudentForm initial={editing || {}} onCancel={() => { setShowForm(false); setEditing(null); }} onSave={handleSave} />
      )}

      {loading ? (
        <div>Loading...</div>
      ) : (
        <table className="table table-striped">
          <thead>
            <tr>
              <th>Student ID</th>
              <th>First</th>
              <th>Last</th>
              <th>Grade</th>
              <th>Strand</th>
              <th>Section</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.map(s => (
              <tr key={s.id}>
                <td>{s.student_id}</td>
                <td>{s.first_name}</td>
                <td>{s.last_name}</td>
                <td>{s.grade_level}</td>
                <td>{s.strand}</td>
                <td>{s.section}</td>
                <td>
                  <button className="btn btn-sm btn-primary me-2" onClick={() => handleEdit(s)}>Edit</button>
                  <button className="btn btn-sm btn-danger" onClick={() => handleDelete(s.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/*
        TODO: Integrate Results and Upload modules here.
        - Add links/buttons to view a student's Results (per-student page)
        - Add Upload component to attach files to students
      */}
    </div>
  );
}
