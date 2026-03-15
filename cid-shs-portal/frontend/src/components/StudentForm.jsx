import { useState, useEffect } from 'react';

export default function StudentForm({ initial = {}, onCancel, onSave }) {
  const [form, setForm] = useState({
    student_id: '', first_name: '', last_name: '', grade_level: '', strand: '', section: '', school_year: '',
  });

  useEffect(() => { setForm({ ...form, ...initial }); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [initial]);

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    // Frontend validation: if a Strand is provided, grade must be 11 or 12
    const grade = String(form.grade_level).trim();
    const strand = String(form.strand || '').trim();
    if (strand && !(grade === '11' || grade === '12')) {
      alert('Strand can only be assigned to Grade 11 or 12 students.');
      return;
    }
    onSave(form);
  };

  return (
    <form onSubmit={handleSubmit} className="card card-body mb-3">
      <div className="row g-2">
        <div className="col-md-4">
          <label className="form-label">Student ID</label>
          <input name="student_id" value={form.student_id} onChange={handleChange} className="form-control" />
        </div>
        <div className="col-md-4">
          <label className="form-label">First Name</label>
          <input name="first_name" value={form.first_name} onChange={handleChange} className="form-control" />
        </div>
        <div className="col-md-4">
          <label className="form-label">Last Name</label>
          <input name="last_name" value={form.last_name} onChange={handleChange} className="form-control" />
        </div>
      </div>
      <div className="row g-2 mt-2">
        <div className="col-md-3">
          <label className="form-label">Grade</label>
          <input name="grade_level" value={form.grade_level} onChange={handleChange} className="form-control" />
        </div>
        <div className="col-md-3">
          <label className="form-label">Strand</label>
          <input
            name="strand"
            value={form.strand}
            onChange={handleChange}
            className="form-control"
            disabled={!(form.grade_level === '11' || form.grade_level === '12')}
            placeholder={form.grade_level === '11' || form.grade_level === '12' ? '' : 'Select Grade 11 or 12 to set strand'}
          />
        </div>
        <div className="col-md-3">
          <label className="form-label">Section</label>
          <input name="section" value={form.section} onChange={handleChange} className="form-control" />
        </div>
        <div className="col-md-3">
          <label className="form-label">School Year</label>
          <input name="school_year" value={form.school_year} onChange={handleChange} className="form-control" />
        </div>
      </div>
      <div className="mt-3 d-flex gap-2">
        <button className="btn btn-primary">Save</button>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}
