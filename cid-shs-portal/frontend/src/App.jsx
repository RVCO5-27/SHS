import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
import LoginPage from './pages/Login';
import StudentsPage from './pages/Students';
import Dashboard from './pages/Dashboard';
import PrivateRoute from './components/PrivateRoute';
import './App.css';

function NavBar() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };
  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light mb-3">
      <div className="container-fluid">
        <Link className="navbar-brand" to="/">SHS Portal</Link>
        <div className="collapse navbar-collapse">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            {token && (
              <li className="nav-item">
                <Link className="nav-link" to="/students">Students</Link>
              </li>
            )}
          </ul>
          <div className="d-flex">
            {token ? (
              <button className="btn btn-outline-secondary" onClick={handleLogout}>Logout</button>
            ) : null}
            {/* Login is intentionally hidden from the navbar; use the direct /login URL for access */}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="container-fluid g-0">
        <Routes>
          <Route path="/login" element={<><NavBar /><div className="container"><LoginPage /></div></>} />
          <Route path="/students" element={<PrivateRoute><NavBar /><div className="container"><StudentsPage /></div></PrivateRoute>} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/" element={<Dashboard />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
