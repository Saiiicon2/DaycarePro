🧸 Daycare Management System
A multi-tenant daycare management application built with React + TypeScript, Express, and SQLite, designed to help daycare centers manage children, parents, payments, and risk profiles — while allowing a central admin to oversee the entire ecosystem.
This project demonstrates real-world SaaS architecture, role-based access control, and data integrity across tenants.
________________________________________
 Key Features
 Authentication & Roles
•	Secure login system (local authentication)
•	Role-based access control:
o	Admin: Full access across all daycares
o	Daycare User: Restricted to their own daycare’s data
 Multi-Tenant Architecture
•	Multiple daycares operate under one system
•	Each daycare can:
o	View and manage only their own children, parents, and payments
o	Search parents globally without accessing private data (risk/payment status only)
 Child & Parent Management
•	Register parents and children
•	Link children to parents and specific daycares
•	Prevent non-paying or flagged parents from re-registering at new daycares
💳 Payments & Risk Tracking
•	Record and track payments per child
•	Flag delinquent or high-risk parents
•	Enable daycares to assess payment risk before enrollment
 Admin Oversight
•	Admin dashboard with system-wide visibility
•	Add and manage daycare centers
•	View data across all tenants while preserving isolation
________________________________________
Tech Stack
Frontend
•	React 18 with TypeScript
•	Tailwind CSS for modern UI
•	React Query for data fetching
•	Zod for schema validation
Backend
•	Node.js + Express
•	SQLite (lightweight, embedded database)
•	Zod schemas shared between frontend and backend
•	RESTful API design
Architecture Highlights
•	Shared schema validation between frontend & backend
•	Clear separation of concerns (routes, storage, validation)
•	Storage abstraction layer for future database scalability
________________________________________
 Project Structure
client/      # React + TypeScript frontend
server/      # Express backend
shared/      # Shared Zod schemas & types
________________________________________
 Why This Project Matters
This application was built to solve real operational problems faced by daycare centers: - Preventing repeat non-paying enrollments - Enforcing strict data isolation between tenants - Giving admins oversight without compromising privacy
It reflects production-level concerns such as: - Multi-tenant data access - Role-based permissions - Validation consistency - Scalable backend design
________________________________________
 Getting Started
# Install dependencies
npm install

# Run backend
npm run dev

# Run frontend
npm run client
________________________________________
📌 Status
This project is actively developed and serves as a portfolio-grade example of full-stack engineering using modern React and Node.js.
________________________________________
👤 Author
Ahmed Phiri
Full-Stack Software Engineer
________________________________________
⭐ If you’re a recruiter or hiring manager: this repository showcases real-world problem solving, not just demo features.
