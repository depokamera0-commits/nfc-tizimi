import { useEffect, useMemo, useState } from "react";
import { API_URL, createEmployee, getEmployees, getProfile, login } from "./api";

const emptyEmployee = {
  cardId: "",
  pin: "",
  fullName: "",
  role: "employee",
  department: "",
  position: "",
};

const roleLabel = {
  admin: "Admin",
  hr: "HR",
  manager: "Manager",
  employee: "Employee",
};

const canManageEmployees = (role) =>
  role === "admin" || role === "hr" || role === "manager";

const canCreateEmployees = (role) => role === "admin" || role === "hr";

const StorageKey = "nfc-tizimi-session";

const loadSession = () => {
  try {
    return JSON.parse(localStorage.getItem(StorageKey));
  } catch (error) {
    return null;
  }
};

const saveSession = (data) => {
  localStorage.setItem(StorageKey, JSON.stringify(data));
};

const clearSession = () => {
  localStorage.removeItem(StorageKey);
};

const ErrorNotice = ({ message, details }) => {
  if (!message) return null;
  return (
    <div className="notice notice-error">
      <p>{message}</p>
      {details?.length ? (
        <ul>
          {details.map((detail) => (
            <li key={detail.msg}>{detail.msg}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
};

const SuccessNotice = ({ message }) => {
  if (!message) return null;
  return <div className="notice notice-success">{message}</div>;
};

const LoginPanel = ({ onLogin, isLoading }) => {
  const [cardId, setCardId] = useState("");
  const [pin, setPin] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();
    onLogin({ cardId, pin });
  };

  return (
    <div className="panel">
      <h2>Login</h2>
      <p className="muted">
        Authenticate with your NFC card ID and PIN to access your profile.
      </p>
      <form onSubmit={handleSubmit} className="form-grid">
        <label>
          Card ID
          <input
            value={cardId}
            onChange={(event) => setCardId(event.target.value)}
            placeholder="CARD-001"
            required
          />
        </label>
        <label>
          PIN
          <input
            value={pin}
            onChange={(event) => setPin(event.target.value)}
            type="password"
            placeholder="••••"
            required
          />
        </label>
        <button type="submit" className="primary" disabled={isLoading}>
          {isLoading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  );
};

const ProfileCard = ({ profile }) => (
  <div className="panel">
    <h2>Employee Profile</h2>
    <div className="profile-grid">
      <div>
        <span className="label">Full name</span>
        <span>{profile.full_name}</span>
      </div>
      <div>
        <span className="label">Card ID</span>
        <span>{profile.card_id}</span>
      </div>
      <div>
        <span className="label">Role</span>
        <span>{roleLabel[profile.role] ?? profile.role}</span>
      </div>
      <div>
        <span className="label">Department</span>
        <span>{profile.department || "—"}</span>
      </div>
      <div>
        <span className="label">Position</span>
        <span>{profile.position || "—"}</span>
      </div>
      <div>
        <span className="label">Created</span>
        <span>{new Date(profile.created_at).toLocaleString()}</span>
      </div>
    </div>
  </div>
);

const EmployeeTable = ({ employees }) => (
  <div className="panel">
    <h2>Employee Directory</h2>
    <div className="table">
      <div className="table-row table-header">
        <span>Name</span>
        <span>Role</span>
        <span>Department</span>
        <span>Position</span>
      </div>
      {employees.map((employee) => (
        <div className="table-row" key={employee.id}>
          <span>{employee.full_name}</span>
          <span>{roleLabel[employee.role] ?? employee.role}</span>
          <span>{employee.department || "—"}</span>
          <span>{employee.position || "—"}</span>
        </div>
      ))}
    </div>
  </div>
);

const CreateEmployeeForm = ({ onCreate, isLoading }) => {
  const [form, setForm] = useState(emptyEmployee);

  const updateForm = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onCreate(form);
  };

  return (
    <div className="panel">
      <h2>Create Employee</h2>
      <form onSubmit={handleSubmit} className="form-grid">
        <label>
          Card ID
          <input value={form.cardId} onChange={updateForm("cardId")} required />
        </label>
        <label>
          PIN
          <input
            value={form.pin}
            onChange={updateForm("pin")}
            type="password"
            required
          />
        </label>
        <label>
          Full name
          <input
            value={form.fullName}
            onChange={updateForm("fullName")}
            required
          />
        </label>
        <label>
          Role
          <select value={form.role} onChange={updateForm("role")}>
            <option value="employee">Employee</option>
            <option value="manager">Manager</option>
            <option value="hr">HR</option>
            <option value="admin">Admin</option>
          </select>
        </label>
        <label>
          Department
          <input
            value={form.department}
            onChange={updateForm("department")}
          />
        </label>
        <label>
          Position
          <input value={form.position} onChange={updateForm("position")} />
        </label>
        <button type="submit" className="primary" disabled={isLoading}>
          {isLoading ? "Saving..." : "Create employee"}
        </button>
      </form>
    </div>
  );
};

const AdminDashboard = ({ role, employees, onCreateEmployee, isCreating }) => (
  <div className="stack">
    <div className="panel">
      <h2>Admin Dashboard</h2>
      <p className="muted">
        Manage employee records and access key modules from a single view.
      </p>
      <div className="stats-grid">
        <div>
          <span className="label">Total employees</span>
          <span>{employees.length}</span>
        </div>
        <div>
          <span className="label">Role</span>
          <span>{roleLabel[role] ?? role}</span>
        </div>
        <div>
          <span className="label">API</span>
          <span>{API_URL}</span>
        </div>
      </div>
    </div>
    <EmployeeTable employees={employees} />
    {canCreateEmployees(role) ? (
      <CreateEmployeeForm onCreate={onCreateEmployee} isLoading={isCreating} />
    ) : null}
  </div>
);

const Hero = () => (
  <header className="hero">
    <div>
      <p className="badge">NFC Tizimi</p>
      <h1>Employee Management Console</h1>
      <p>
        Secure NFC-enabled access, structured approvals, and centralized record
        management for HR teams.
      </p>
    </div>
  </header>
);

const App = () => {
  const [session, setSession] = useState(loadSession());
  const [profile, setProfile] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [error, setError] = useState("");
  const [errorDetails, setErrorDetails] = useState([]);
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const token = session?.token;
  const role = session?.employee?.role;

  const resetMessages = () => {
    setError("");
    setErrorDetails([]);
    setSuccess("");
  };

  const fetchProfile = async (activeToken) => {
    const data = await getProfile(activeToken);
    setProfile(data);
  };

  const fetchEmployees = async (activeToken, activeRole) => {
    if (!canManageEmployees(activeRole)) {
      setEmployees([]);
      return;
    }
    const data = await getEmployees(activeToken);
    setEmployees(data);
  };

  const handleLogin = async ({ cardId, pin }) => {
    resetMessages();
    setIsLoading(true);
    try {
      const result = await login(cardId, pin);
      setSession(result);
      saveSession(result);
      setSuccess("Login successful.");
    } catch (error) {
      setError(error.message);
      setErrorDetails(error.details || []);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setSession(null);
    setProfile(null);
    setEmployees([]);
    clearSession();
  };

  const handleCreateEmployee = async (payload) => {
    resetMessages();
    setIsCreating(true);
    try {
      await createEmployee(token, payload);
      setSuccess("Employee created successfully.");
      await fetchEmployees(token, role);
    } catch (error) {
      setError(error.message);
      setErrorDetails(error.details || []);
    } finally {
      setIsCreating(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    resetMessages();
    fetchProfile(token).catch((error) => setError(error.message));
    fetchEmployees(token, role).catch((error) => setError(error.message));
  }, [token, role]);

  const isAdminView = useMemo(() => canManageEmployees(role), [role]);

  return (
    <div className="app">
      <Hero />
      <div className="content">
        <div className="toolbar">
          {session ? (
            <div className="session">
              <div>
                Signed in as <strong>{session.employee.fullName}</strong> (
                {roleLabel[session.employee.role]})
              </div>
              <button onClick={handleLogout}>Sign out</button>
            </div>
          ) : null}
        </div>
        <ErrorNotice message={error} details={errorDetails} />
        <SuccessNotice message={success} />
        {!session ? (
          <LoginPanel onLogin={handleLogin} isLoading={isLoading} />
        ) : (
          <div className="stack">
            {profile ? <ProfileCard profile={profile} /> : null}
            {isAdminView ? (
              <AdminDashboard
                role={role}
                employees={employees}
                onCreateEmployee={handleCreateEmployee}
                isCreating={isCreating}
              />
            ) : (
              <div className="panel">
                <h2>Admin Dashboard</h2>
                <p className="muted">
                  Your role does not permit admin access. Contact HR if you need
                  elevated permissions.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
