import { useState } from "react";
import './Login.css';
import { apiRequest } from "@/lib/queryClient";
export default function Login() {
  const [email, setEmail] = useState("admin@daycare.com");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const[keepLoggedIn,setKeepLoggedIn]=useState(false);

  const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  setError("");

  try {
    const res = await apiRequest('POST', '/api/auth/login', { email, password, keepLoggedIn });
    const user = await res.json();
    console.log("Logged in as:", user);
    window.location.href = "/dashboard";
  } catch (err: any) {
    setError(err?.message ?? "Login failed");
  }

};


  return (
    <div className="login-page">
      <div className="login-card">
        <img src="/img/logoedu[trans].png" alt="Logo"></img>
        <br></br>
        <h2><em>Sign In</em></h2>
        {error && <p className="error">{error}</p>}
        <form onSubmit={handleLogin}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
          />
          <label className="checkbox">
            <input
              type="checkbox"
              checked={keepLoggedIn}
              onChange={(e) => setKeepLoggedIn(e.target.checked)}
            />
            Keep me logged in.
          </label>
          <button type="submit" className="btn">Sign In</button>
        </form>
      </div>
    </div>
  );
}
