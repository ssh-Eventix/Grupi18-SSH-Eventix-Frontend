import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

const profile = {
  name: "Demo User",
  email: "demo@eventix.com",
  role: "Buyer",
  tenantSlug: "eventix",
};

function ProfilePage() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <main className="page">
      <h1>Profile</h1>

      <div className="table-panel">
        <table>
          <tbody>
            <tr>
              <th>Name</th>
              <td>{profile.name}</td>
            </tr>
            <tr>
              <th>Email</th>
              <td>{profile.email}</td>
            </tr>
            <tr>
              <th>Role</th>
              <td>{profile.role}</td>
            </tr>
            <tr>
              <th>Tenant</th>
              <td>{profile.tenantSlug}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="page-actions">
        <button className="logout-button" type="button" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </main>
  );
}

export default ProfilePage;
