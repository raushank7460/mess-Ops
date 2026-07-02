import React, { useState, useEffect, useMemo, createContext, useContext } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import axios from "axios";

/* ============================================================
   MESSOPS — Complete Frontend (single file: App.jsx)
   Matches actual backend:
     POST /api/auth/register        { name, email, password }
     POST /api/auth/login           { email, password } -> { token, admin }
     GET  /api/students             -> { students, count }
     POST /api/students             { name, rollNumber, roomNumber, course, phone }
     PUT  /api/students/:id
     DELETE /api/students/:id
     POST /api/attendance           { studentId, day, month, year, status } (protect)
     GET  /api/attendance?month=&year=            -> { attendance, count } (protect)
     GET  /api/attendance/summary?month=&year=    -> { summary, count } (protect)
     GET  /api/attendance/student?studentId=&month=&year= -> { attendance, summary } (protect)
     DELETE /api/attendance/:id     (protect, deletes the whole monthly doc)

   Install once in your project:
     npm install axios react-router-dom
============================================================ */

const API_BASE_URL = "http://localhost:5005/api";

const api = axios.create({ baseURL: API_BASE_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("messops_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function daysInMonth(month, year) {
  return new Date(year, month, 0).getDate();
}

function errMsg(err, fallback) {
  return err?.response?.data?.message || fallback;
}

/* ============================================================
   Global styles (design tokens, no CSS framework needed)
============================================================ */
function GlobalStyles() {
  return (
    <style>{`
      * { box-sizing: border-box; }
      body { margin: 0; }
      #root, .messops-root {
        font-family: 'Segoe UI', system-ui, -apple-system, Roboto, Helvetica, Arial, sans-serif;
        background: #f4f6fb;
        color: #1f2430;
      }
      .ms-btn {
        border: none;
        border-radius: 8px;
        padding: 10px 18px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: transform .08s ease, box-shadow .15s ease, opacity .15s ease;
      }
      .ms-btn:hover { transform: translateY(-1px); }
      .ms-btn:active { transform: translateY(0); }
      .ms-btn:disabled { opacity: .6; cursor: not-allowed; transform: none; }
      .ms-btn-primary { background: linear-gradient(135deg,#4f46e5,#6366f1); color: #fff; box-shadow: 0 4px 12px rgba(79,70,229,.28); }
      .ms-btn-danger { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
      .ms-btn-danger:hover { background: #fee2e2; }
      .ms-btn-ghost { background: #eef2ff; color: #4338ca; }
      .ms-btn-outline { background: #fff; color: #374151; border: 1px solid #d1d5db; }
      .ms-card {
        background: #fff;
        border-radius: 14px;
        box-shadow: 0 2px 10px rgba(17,24,39,.06);
        border: 1px solid #eef0f5;
      }
      .ms-input, .ms-select {
        width: 100%;
        padding: 10px 12px;
        border-radius: 8px;
        border: 1px solid #d8dce6;
        font-size: 14px;
        outline: none;
        background: #fff;
        transition: border-color .15s ease, box-shadow .15s ease;
      }
      .ms-input:focus, .ms-select:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,.15); }
      .ms-label { display:block; font-size: 12.5px; font-weight: 600; color: #4b5563; margin-bottom: 6px; }
      .ms-table { width: 100%; border-collapse: collapse; }
      .ms-table th {
        text-align: left; font-size: 12.5px; text-transform: uppercase; letter-spacing: .04em;
        color: #6b7280; padding: 12px 14px; background: #f8f9fc; border-bottom: 1px solid #edeff5;
      }
      .ms-table td { padding: 12px 14px; font-size: 14px; border-bottom: 1px solid #f2f3f8; color: #1f2430; }
      .ms-table tr:last-child td { border-bottom: none; }
      .ms-table tbody tr:hover { background: #fafbff; }
      .ms-badge { display:inline-block; padding: 3px 10px; border-radius: 999px; font-size: 12px; font-weight: 700; }
      .ms-badge-present { background: #dcfce7; color: #16a34a; }
      .ms-badge-absent { background: #fee2e2; color: #dc2626; }
      .ms-sidebar-link {
        display: flex; align-items: center; gap: 10px; padding: 11px 16px; border-radius: 10px;
        color: #cbd2e6; text-decoration: none; font-size: 14px; font-weight: 500; margin: 2px 10px;
        transition: background .15s ease, color .15s ease;
      }
      .ms-sidebar-link:hover { background: #232a44; color: #fff; }
      .ms-sidebar-link.active { background: #4f46e5; color: #fff; }
      .ms-day-btn {
        width: 36px; height: 36px; border-radius: 8px; border: 1px solid #e2e5ee; background: #fff;
        font-size: 12.5px; font-weight: 700; cursor: pointer; transition: all .12s ease;
      }
      .ms-day-btn:hover { transform: translateY(-1px); }
      .ms-day-present { background: #16a34a; color: #fff; border-color: #16a34a; }
      .ms-day-absent { background: #fee2e2; color: #dc2626; border-color: #fecaca; }
      .ms-fade-in { animation: msFadeIn .2s ease; }
      @keyframes msFadeIn { from { opacity: 0; transform: translateY(4px);} to { opacity: 1; transform: translateY(0);} }
      ::-webkit-scrollbar { width: 8px; height: 8px; }
      ::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 8px; }
    `}</style>
  );
}


// auth COntroller

const AuthContext = createContext(null);
const useAuth = () => useContext(AuthContext);

function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("messops_token"));
  const [admin, setAdmin] = useState(() => {
    try {
      const saved = localStorage.getItem("messops_admin");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const login = (token, admin) => {
    localStorage.setItem("messops_token", token);
    localStorage.setItem("messops_admin", JSON.stringify(admin || {}));
    setToken(token);
    setAdmin(admin || {});
  };

  const logout = () => {
    localStorage.removeItem("messops_token");
    localStorage.removeItem("messops_admin");
    setToken(null);
    setAdmin(null);
  };

  return (
    <AuthContext.Provider value={{ token, admin, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

function ProtectedRoute({ children }) {
  const { token } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  return children;
}


 //  Small shared UI pieces

function Alert({ type = "error", message }) {
  if (!message) return null;
  const styles =
    type === "error"
      ? { bg: "#fef2f2", color: "#b91c1c", border: "#fecaca" }
      : { bg: "#f0fdf4", color: "#15803d", border: "#bbf7d0" };
  return (
    <div
      className="ms-fade-in"
      style={{
        background: styles.bg,
        color: styles.color,
        border: `1px solid ${styles.border}`,
        padding: "10px 14px",
        borderRadius: 8,
        margin: "0 0 14px",
        fontSize: 13.5,
      }}
    >
      {message}
    </div>
  );
}

function Spinner({ label = "Loading..." }) {
  return (
    <div style={{ padding: 40, textAlign: "center", color: "#8b93a7", fontSize: 14 }}>
      {label}
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div style={{ padding: 30, textAlign: "center", color: "#9aa1b5", fontSize: 14 }}>
      {text}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label className="ms-label">{label}</label>
      {children}
    </div>
  );
}

/* ============================================================
   Auth pages
============================================================ */
function AuthShell({ title, subtitle, children }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg,#eef1ff,#f4f6fb)",
        padding: 20,
      }}
    >
      <div className="ms-card ms-fade-in" style={{ width: 380, padding: 34 }}>
        <div style={{ textAlign: "center", marginBottom: 22 }}>
          <div
            style={{
              width: 46, height: 46, borderRadius: 12, margin: "0 auto 12px",
              background: "linear-gradient(135deg,#4f46e5,#6366f1)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontWeight: 800, fontSize: 20,
            }}
          >
            M
          </div>
          <h2 style={{ margin: "0 0 4px", fontSize: 20 }}>{title}</h2>
          <p style={{ margin: 0, fontSize: 13, color: "#8b93a7" }}>{subtitle}</p>
        </div>
        {children}
      </div>
    </div>
  );
}

function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/auth/login", form);
      // backend: { success, message, token, admin }
      login(res.data.token, res.data.admin);
      navigate("/");
    } catch (err) {
      setError(errMsg(err, "Login failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Welcome back" subtitle="Login to MESSOPS admin panel">
      <form onSubmit={handleSubmit}>
        <Alert message={error} />
        <Field label="Email">
          <input className="ms-input" type="email" required value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </Field>
        <Field label="Password">
          <input className="ms-input" type="password" required value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </Field>
        <button className="ms-btn ms-btn-primary" style={{ width: "100%" }} disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
      <p style={{ marginTop: 16, fontSize: 13.5, textAlign: "center", color: "#6b7280" }}>
        No account? <Link to="/register" style={{ color: "#4f46e5", fontWeight: 600 }}>Register</Link>
      </p>
    </AuthShell>
  );
}

function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const res = await api.post("/auth/register", form);
      setSuccess(res.data.message || "Registered successfully. Please login.");
      setTimeout(() => navigate("/login"), 1000);
    } catch (err) {
      setError(errMsg(err, "Registration failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Create admin account" subtitle="Register to manage MESSOPS">
      <form onSubmit={handleSubmit}>
        <Alert message={error} />
        <Alert type="success" message={success} />
        <Field label="Name">
          <input className="ms-input" required value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </Field>
        <Field label="Email">
          <input className="ms-input" type="email" required value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </Field>
        <Field label="Password">
          <input className="ms-input" type="password" required minLength={6} value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </Field>
        <button className="ms-btn ms-btn-primary" style={{ width: "100%" }} disabled={loading}>
          {loading ? "Registering..." : "Register"}
        </button>
      </form>
      <p style={{ marginTop: 16, fontSize: 13.5, textAlign: "center", color: "#6b7280" }}>
        Already registered? <Link to="/login" style={{ color: "#4f46e5", fontWeight: 600 }}>Login</Link>
      </p>
    </AuthShell>
  );
}

/* ============================================================
   App shell: sidebar + content
============================================================ */
function NavItem({ to, label, icon }) {
  const location = useLocation();
  const active = location.pathname === to;
  return (
    <Link to={to} className={`ms-sidebar-link${active ? " active" : ""}`}>
      <span style={{ fontSize: 16 }}>{icon}</span>
      {label}
    </Link>
  );
}

function AppShell({ children }) {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <aside style={{ width: 230, background: "#161c2e", padding: "20px 0", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 20px", marginBottom: 26 }}>
          <div
            style={{
              width: 34, height: 34, borderRadius: 9,
              background: "linear-gradient(135deg,#4f46e5,#6366f1)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontWeight: 800, fontSize: 15,
            }}
          >
            M
          </div>
          <span style={{ color: "#fff", fontWeight: 700, fontSize: 16 }}>MESSOPS</span>
        </div>

        <NavItem to="/" label="Dashboard" icon="📊" />
        <NavItem to="/students" label="Students" icon="🎓" />
        <NavItem to="/attendance" label="Mark Attendance" icon="🗓️" />
        <NavItem to="/attendance/summary" label="Monthly Summary" icon="📈" />

        <div style={{ position: "absolute", bottom: 20, width: 230, padding: "0 20px" }}>
          <div style={{ borderTop: "1px solid #262d45", paddingTop: 14 }}>
            <div style={{ color: "#fff", fontSize: 13.5, fontWeight: 600 }}>{admin?.name || "Admin"}</div>
            <div style={{ color: "#7c85a3", fontSize: 12, marginBottom: 12 }}>{admin?.email}</div>
            <button
              className="ms-btn ms-btn-danger"
              style={{ width: "100%" }}
              onClick={() => { logout(); navigate("/login"); }}
            >
              Logout
            </button>
          </div>
        </div>
      </aside>

      <main style={{ flex: 1, padding: 28, maxWidth: "100%" }}>{children}</main>
    </div>
  );
}

/* ============================================================
   Dashboard
============================================================ */
function Dashboard() {
  const { admin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [totalStudents, setTotalStudents] = useState(0);
  const [present, setPresent] = useState(0);
  const [absent, setAbsent] = useState(0);

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");
      try {
        const studentsRes = await api.get("/students");
        setTotalStudents(studentsRes.data.students?.length ?? studentsRes.data.count ?? 0);

        const summaryRes = await api.get("/attendance/summary", { params: { month, year } });
        const summary = summaryRes.data.summary || [];
        const totalPresent = summary.reduce((sum, s) => sum + (s.present || 0), 0);
        const totalAbsent = summary.reduce((sum, s) => sum + (s.absent || 0), 0);
        setPresent(totalPresent);
        setAbsent(totalAbsent);
      } catch (err) {
        setError(errMsg(err, "Failed to load dashboard data"));
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const total = present + absent;
  const pct = total > 0 ? ((present / total) * 100).toFixed(1) : "0.0";

  return (
    <div className="ms-fade-in">
      <h2 style={{ margin: "0 0 2px" }}>Welcome, {admin?.name || "Admin"} 👋</h2>
      <p style={{ margin: "0 0 20px", color: "#8b93a7", fontSize: 14 }}>
        Here's what's happening this month — {MONTH_NAMES[month - 1]} {year}
      </p>

      <Alert message={error} />

      {loading ? (
        <Spinner />
      ) : (
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 24 }}>
          <StatCard label="Total Students" value={totalStudents} color="#4f46e5" icon="🎓" />
          <StatCard label="Present (This Month)" value={present} color="#16a34a" icon="✅" />
          <StatCard label="Absent (This Month)" value={absent} color="#dc2626" icon="🚫" />
          <StatCard label="Attendance Rate" value={`${pct}%`} color="#0ea5e9" icon="📈" />
        </div>
      )}

      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
        <Link to="/students" className="ms-btn ms-btn-primary" style={{ textDecoration: "none" }}>+ Add Student</Link>
        <Link to="/attendance" className="ms-btn ms-btn-ghost" style={{ textDecoration: "none" }}>Mark Attendance</Link>
        <Link to="/attendance/summary" className="ms-btn ms-btn-outline" style={{ textDecoration: "none" }}>View Summary</Link>
      </div>
    </div>
  );
}

function StatCard({ label, value, color, icon }) {
  return (
    <div className="ms-card" style={{ padding: "20px 22px", minWidth: 190, flex: "1 1 190px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 13, color: "#8b93a7" }}>{label}</span>
        <span style={{ fontSize: 18 }}>{icon}</span>
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color, marginTop: 6 }}>{value}</div>
    </div>
  );
}

/* ============================================================
   Students page
============================================================ */
function Students() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const fetchStudents = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/students");
      setStudents(res.data.students || []);
    } catch (err) {
      setError(errMsg(err, "Failed to load students"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStudents(); }, []);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete student "${name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/students/${id}`);
      fetchStudents();
    } catch (err) {
      alert(errMsg(err, "Delete failed"));
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return students;
    return students.filter(
      (s) =>
        s.name?.toLowerCase().includes(q) ||
        s.course?.toLowerCase().includes(q) ||
        String(s.rollNumber).includes(q) ||
        String(s.roomNumber).includes(q) ||
        s.phone?.includes(q)
    );
  }, [students, search]);

  return (
    <div className="ms-fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 10 }}>
        <div>
          <h2 style={{ margin: 0 }}>Students</h2>
          <p style={{ margin: "2px 0 0", color: "#8b93a7", fontSize: 13.5 }}>{students.length} total</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <input
            className="ms-input"
            placeholder="Search name, roll no, course..."
            style={{ width: 240 }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className="ms-btn ms-btn-primary" onClick={() => { setEditing(null); setShowForm(true); }}>
            + Add Student
          </button>
        </div>
      </div>

      <Alert message={error} />

      <div className="ms-card" style={{ overflow: "hidden" }}>
        {loading ? (
          <Spinner />
        ) : filtered.length === 0 ? (
          <EmptyState text="No students found." />
        ) : (
          <table className="ms-table">
            <thead>
              <tr>
                <th>Roll No</th>
                <th>Name</th>
                <th>Course</th>
                <th>Room No</th>
                <th>Phone</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s._id}>
                  <td>{s.rollNumber}</td>
                  <td style={{ fontWeight: 600 }}>{s.name}</td>
                  <td>{s.course}</td>
                  <td>{s.roomNumber}</td>
                  <td>{s.phone}</td>
                  <td>
                    <button className="ms-btn ms-btn-outline" style={{ padding: "6px 12px", fontSize: 12.5 }}
                      onClick={() => { setEditing(s); setShowForm(true); }}>
                      Edit
                    </button>{" "}
                    <button className="ms-btn ms-btn-danger" style={{ padding: "6px 12px", fontSize: 12.5 }}
                      onClick={() => handleDelete(s._id, s.name)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showForm && (
        <StudentFormModal
          student={editing}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); fetchStudents(); }}
        />
      )}
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(15,18,30,.45)",
        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60, padding: 16,
      }}
      onClick={onClose}
    >
      <div
        className="ms-card ms-fade-in"
        style={{ width: 400, padding: 26, maxHeight: "90vh", overflowY: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ marginTop: 0 }}>{title}</h3>
        {children}
      </div>
    </div>
  );
}

function StudentFormModal({ student, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: student?.name || "",
    rollNumber: student?.rollNumber ?? "",
    roomNumber: student?.roomNumber ?? "",
    course: student?.course || "",
    phone: student?.phone || "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const payload = {
        ...form,
        rollNumber: Number(form.rollNumber),
        roomNumber: Number(form.roomNumber),
      };
      if (student) {
        await api.put(`/students/${student._id}`, payload);
      } else {
        await api.post("/students", payload);
      }
      onSaved();
    } catch (err) {
      setError(errMsg(err, "Save failed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={student ? "Edit Student" : "Add Student"} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <Alert message={error} />
        <Field label="Name">
          <input className="ms-input" required value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </Field>
        <Field label="Roll Number">
          <input className="ms-input" type="number" required value={form.rollNumber}
            onChange={(e) => setForm({ ...form, rollNumber: e.target.value })} />
        </Field>
        <Field label="Room Number">
          <input className="ms-input" type="number" required value={form.roomNumber}
            onChange={(e) => setForm({ ...form, roomNumber: e.target.value })} />
        </Field>
        <Field label="Course">
          <input className="ms-input" required value={form.course}
            onChange={(e) => setForm({ ...form, course: e.target.value })} />
        </Field>
        <Field label="Phone (10 digits)">
          <input className="ms-input" required pattern="[0-9]{10}" title="Enter a valid 10 digit phone number"
            value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </Field>
        <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
          <button className="ms-btn ms-btn-primary" disabled={saving}>{saving ? "Saving..." : "Save"}</button>
          <button type="button" className="ms-btn ms-btn-outline" onClick={onClose}>Cancel</button>
        </div>
      </form>
    </Modal>
  );
}

/* ============================================================
   Mark Attendance page (month-grid, matches backend model)
============================================================ */
function Attendance() {
  const now = new Date();
  const [students, setStudents] = useState([]);
  const [studentId, setStudentId] = useState("");
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const [grid, setGrid] = useState(null); // { "1": "Present"|"Absent", ... }
  const [loadingGrid, setLoadingGrid] = useState(false);
  const [savingDay, setSavingDay] = useState(null);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const [monthRecords, setMonthRecords] = useState([]);
  const [loadingRecords, setLoadingRecords] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/students");
        const list = res.data.students || [];
        setStudents(list);
        if (list.length && !studentId) setStudentId(list[0]._id);
      } catch (err) {
        setError(errMsg(err, "Failed to load students"));
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadMonthRecords = async () => {
    setLoadingRecords(true);
    try {
      const res = await api.get("/attendance", { params: { month, year } });
      setMonthRecords(res.data.attendance || []);
    } catch (err) {
      setError(errMsg(err, "Failed to load attendance records"));
    } finally {
      setLoadingRecords(false);
    }
  };

  useEffect(() => {
    loadMonthRecords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, year]);

  const loadGrid = async () => {
    if (!studentId) return;
    setError("");
    setInfo("");
    setLoadingGrid(true);
    try {
      const res = await api.get("/attendance/student", { params: { studentId, month, year } });
      setGrid(res.data.attendance.attendance);
    } catch (err) {
      if (err.response?.status === 404) {
        // no record yet this month — start with a blank grid (all default Absent)
        const blank = {};
        for (let d = 1; d <= daysInMonth(month, year); d++) blank[d] = "Absent";
        setGrid(blank);
        setInfo("No attendance marked yet for this student this month — click a day to start.");
      } else {
        setError(errMsg(err, "Failed to load attendance"));
        setGrid(null);
      }
    } finally {
      setLoadingGrid(false);
    }
  };

  useEffect(() => {
    if (studentId) loadGrid();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId, month, year]);

  const toggleDay = async (day) => {
    if (!grid) return;
    const current = grid[day] || "Absent";
    const next = current === "Present" ? "Absent" : "Present";
    setSavingDay(day);
    setError("");
    try {
      await api.post("/attendance", { studentId, day, month, year, status: next });
      setGrid((g) => ({ ...g, [day]: next }));
      loadMonthRecords();
    } catch (err) {
      setError(errMsg(err, "Failed to update attendance"));
    } finally {
      setSavingDay(null);
    }
  };

  const handleDeleteRecord = async (id, name) => {
    if (!window.confirm(`Delete the entire month's attendance for "${name}"?`)) return;
    try {
      await api.delete(`/attendance/${id}`);
      loadMonthRecords();
      if (grid) loadGrid();
    } catch (err) {
      alert(errMsg(err, "Delete failed"));
    }
  };

  const dayCount = daysInMonth(month, year);
  const presentCount = grid ? Object.values(grid).filter((v) => v === "Present").length : 0;
  const totalMarked = grid ? Object.keys(grid).length : 0;
  const pct = totalMarked > 0 ? ((presentCount / totalMarked) * 100).toFixed(1) : "0.0";

  return (
    <div className="ms-fade-in">
      <h2 style={{ margin: "0 0 4px" }}>Mark Attendance</h2>
      <p style={{ margin: "0 0 20px", color: "#8b93a7", fontSize: 14 }}>
        Select a student and month, then tap a day to toggle Present / Absent.
      </p>

      <Alert message={error} />
      <Alert type="success" message={info} />

      <div className="ms-card" style={{ padding: 20, marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ minWidth: 220 }}>
            <label className="ms-label">Student</label>
            <select className="ms-select" value={studentId} onChange={(e) => setStudentId(e.target.value)}>
              {students.map((s) => (
                <option key={s._id} value={s._id}>{s.name} — Roll {s.rollNumber}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="ms-label">Month</label>
            <select className="ms-select" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
              {MONTH_NAMES.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="ms-label">Year</label>
            <input className="ms-input" type="number" style={{ width: 100 }} value={year}
              onChange={(e) => setYear(Number(e.target.value))} />
          </div>
        </div>

        {loadingGrid ? (
          <Spinner />
        ) : grid && students.length > 0 ? (
          <>
            <div style={{ display: "flex", gap: 16, margin: "20px 0 14px", flexWrap: "wrap" }}>
              <MiniStat label="Present" value={presentCount} color="#16a34a" />
              <MiniStat label="Absent" value={totalMarked - presentCount} color="#dc2626" />
              <MiniStat label="Rate" value={`${pct}%`} color="#4f46e5" />
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {Array.from({ length: dayCount }, (_, i) => i + 1).map((day) => {
                const status = grid[day] || "Absent";
                return (
                  <button
                    key={day}
                    disabled={savingDay === day}
                    onClick={() => toggleDay(day)}
                    className={`ms-day-btn ${status === "Present" ? "ms-day-present" : "ms-day-absent"}`}
                    title={`Day ${day}: ${status} — click to toggle`}
                  >
                    {savingDay === day ? "…" : day}
                  </button>
                );
              })}
            </div>
            <p style={{ fontSize: 12.5, color: "#9aa1b5", marginTop: 12 }}>
              🟢 Present &nbsp; 🔴 Absent — click any day to toggle and save instantly.
            </p>
          </>
        ) : (
          <EmptyState text={students.length === 0 ? "Add a student first." : "Select a student to view attendance."} />
        )}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h3 style={{ margin: 0 }}>All Students — {MONTH_NAMES[month - 1]} {year}</h3>
      </div>
      <div className="ms-card" style={{ overflow: "hidden" }}>
        {loadingRecords ? (
          <Spinner />
        ) : monthRecords.length === 0 ? (
          <EmptyState text="No attendance records yet for this month." />
        ) : (
          <table className="ms-table">
            <thead>
              <tr>
                <th>Roll No</th>
                <th>Name</th>
                <th>Present</th>
                <th>Absent</th>
                <th>Rate</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {monthRecords.map((rec) => {
                const values = Object.values(rec.attendance || {});
                const p = values.filter((v) => v === "Present").length;
                const a = values.filter((v) => v === "Absent").length;
                const rate = p + a > 0 ? ((p / (p + a)) * 100).toFixed(1) : "0.0";
                return (
                  <tr key={rec._id}>
                    <td>{rec.student?.rollNumber}</td>
                    <td style={{ fontWeight: 600 }}>{rec.student?.name || "—"}</td>
                    <td><span className="ms-badge ms-badge-present">{p}</span></td>
                    <td><span className="ms-badge ms-badge-absent">{a}</span></td>
                    <td>{rate}%</td>
                    <td>
                      <button className="ms-btn ms-btn-danger" style={{ padding: "6px 12px", fontSize: 12.5 }}
                        onClick={() => handleDeleteRecord(rec._id, rec.student?.name)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function MiniStat({ label, value, color }) {
  return (
    <div style={{ background: "#f8f9fc", borderRadius: 10, padding: "10px 16px", minWidth: 100 }}>
      <div style={{ fontSize: 12, color: "#8b93a7" }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 800, color }}>{value}</div>
    </div>
  );
}

/* ============================================================
   Monthly Summary page
============================================================ */
function AttendanceSummary() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchSummary = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/attendance/summary", { params: { month, year } });
      setSummary(res.data.summary || []);
    } catch (err) {
      setError(errMsg(err, "Failed to load summary"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="ms-fade-in">
      <h2 style={{ margin: "0 0 4px" }}>Monthly Summary</h2>
      <p style={{ margin: "0 0 20px", color: "#8b93a7", fontSize: 14 }}>
        Attendance percentage for every student in a given month.
      </p>

      <Alert message={error} />

      <div className="ms-card" style={{ padding: 20, marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 14, alignItems: "flex-end", flexWrap: "wrap" }}>
          <div>
            <label className="ms-label">Month</label>
            <select className="ms-select" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
              {MONTH_NAMES.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="ms-label">Year</label>
            <input className="ms-input" type="number" style={{ width: 100 }} value={year}
              onChange={(e) => setYear(Number(e.target.value))} />
          </div>
          <button className="ms-btn ms-btn-primary" onClick={fetchSummary}>Get Summary</button>
        </div>
      </div>

      <div className="ms-card" style={{ overflow: "hidden" }}>
        {loading ? (
          <Spinner />
        ) : summary.length === 0 ? (
          <EmptyState text="No summary data for this month." />
        ) : (
          <table className="ms-table">
            <thead>
              <tr>
                <th>Roll No</th>
                <th>Name</th>
                <th>Course</th>
                <th>Room No</th>
                <th>Present</th>
                <th>Absent</th>
                <th>Percentage</th>
              </tr>
            </thead>
            <tbody>
              {summary
                .slice()
                .sort((a, b) => (a.rollNumber || 0) - (b.rollNumber || 0))
                .map((row) => (
                  <tr key={row.studentId}>
                    <td>{row.rollNumber}</td>
                    <td style={{ fontWeight: 600 }}>{row.name}</td>
                    <td>{row.course}</td>
                    <td>{row.roomNumber}</td>
                    <td><span className="ms-badge ms-badge-present">{row.present}</span></td>
                    <td><span className="ms-badge ms-badge-absent">{row.absent}</span></td>
                    <td style={{ fontWeight: 700 }}>{row.percentage}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   Root App
============================================================ */
export default function App() {
  return (
    <AuthProvider>
      <GlobalStyles />
      <div className="messops-root">
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={
              <ProtectedRoute><AppShell><Dashboard /></AppShell></ProtectedRoute>
            } />
            <Route path="/students" element={
              <ProtectedRoute><AppShell><Students /></AppShell></ProtectedRoute>
            } />
            <Route path="/attendance" element={
              <ProtectedRoute><AppShell><Attendance /></AppShell></ProtectedRoute>
            } />
            <Route path="/attendance/summary" element={
              <ProtectedRoute><AppShell><AttendanceSummary /></AppShell></ProtectedRoute>
            } />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </div>
    </AuthProvider>
  );
}