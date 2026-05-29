import { useAuth } from "../auth/AuthContext";

function ProfilePage() {
  const { logout, tenantSlug, user } = useAuth();
  const email = Array.isArray(user?.email) ? user.email.find(Boolean) : user?.email;
  const name = user?.fullName || [user?.firstName, user?.lastName].filter(Boolean).join(" ") || email || "Current user";

  const handleLogout = () => {
    logout("/");
  };

  return (
    <main className="page">
      <h1>Profile</h1>

      <div className="table-panel">
        <table>
          <tbody>
            <tr>
              <th>Name</th>
              <td>{name}</td>
            </tr>
            <tr>
              <th>Email</th>
              <td>{email || "-"}</td>
            </tr>
            <tr>
              <th>Role</th>
              <td>{user?.role || "-"}</td>
            </tr>
            <tr>
              <th>Tenant</th>
              <td>{tenantSlug || user?.tenantSlug || "-"}</td>
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
