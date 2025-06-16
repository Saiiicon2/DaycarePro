import { useState } from "react";
import './Login.css';
export default function Login() {
  const [email, setEmail] = useState("admin@daycare.com");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const[keepLoggedIn,setKeepLoggedIn]=useState(false);

  const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  setError("");

  try {
    const res = await fetch("http://localhost:5000/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      credentials: "include", // 🔐 Include cookies
      body: JSON.stringify({
        email,
        password,
        keepLoggedIn, // 🔁 Send this to the backend
      }),
    });

    if (res.ok) {
      const user = await res.json();
      console.log("✅ Logged in as:", user);
      window.location.href = "/dashboard";
    } else {
      const err = await res.json();
      setError(err.message || "Login failed");
    }
  } catch (err) {
    setError("Error logging in");
  }
};


  return (
    <div className="login-page">
      <div className="login-card">
        <img src="../src/img/logoedu[trans].png" alt="Logo"  />
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
