import api from './api';

export async function getAllStudents() {
  const res = await api.get('/students');
  return res.data;
}

export async function getStudent(id) {
  const res = await api.get(`/students/${id}`);
  return res.data;
}

export async function createStudent(payload) {
  const res = await api.post('/students', payload);
  return res.data;
}

export async function updateStudent(id, payload) {
  const res = await api.put(`/students/${id}`, payload);
  return res.data;
}

export async function deleteStudent(id) {
  await api.delete(`/students/${id}`);
}

// TODO: Export Results API functions here when backend tests are added.
