import { useState } from "react";

export default function Login() {
  const [email, setEmail] = useState("admin@daycare.com");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        
        body: JSON.stringify({ email, password }),
        credentials: "include", // 🔥 This ensures cookies are stored
      });

      if (res.ok) {
        const user = await res.json();
        console.log("✅ Logged in as:", user);
        window.location.href = "/dashboard"; // 🔁 Or use wouter/router
      } else {
        const err = await res.json();
        setError(err.message || "Login failed");
      }
    } catch (err) {
      setError("Error logging in");
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <h2>Login</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      <button type="submit">Login</button>
    </form>
  );
}
