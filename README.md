# To-Do App

A simple full-stack **PERN** (PostgreSQL, Express, React, Node.js) to-do application.  
Frontend: **React** with Framer Motion animations.  
Backend: **Node.js + Express + PostgreSQL**.  
Authentication: **JWT + cookies**.

---
## 🌍 Live Demo
The application is deployed on [Render](https://todo-app-voun.onrender.com).

⚠️ Note: Since this project uses free hosting tiers (Render + Neon),  
the first load may take up to 30 seconds while the server and database wake up.  
Subsequent loads will be much faster.

---
## 🚀 Features

- User registration and login  
- Create, edit, and delete tasks  
- Task filtering (all, active, completed)  
- Task sorting (by date, priority, progress)  
- User profile management  
- Responsive design with a mobile burger menu  
- JWT-based sessions stored in cookies  

---

## 🛠️ Tech Stack

- **Frontend:** React 18, react-scripts, framer-motion  
- **Backend:** Node.js, Express, cors, helmet  
- **Database:** PostgreSQL with `pg`  
- **Authentication:** JWT (jsonwebtoken)  
- **Security:** bcrypt for password hashing  

---

## ⚙️ Installation and Setup

### 1. Clone the repository
```bash
git clone https://github.com/YaninaHolubenko/todo-app.git
cd todo-app
```
### 2. Backend setup
```bach 
cd server
npm install
```

### 3. Create a .env file inside server:

```bash
PORT=8000
JWT_SECRET=your-secret-key
CLIENT_ORIGIN=http://localhost:3000
DATABASE_URL=postgresql://user:password@localhost:5432/todoapp
```

### 4. Start the backend:
```bash
npm run dev
```
### 5. Frontend setup
```bash
cd client
npm install
```

### 6. Create a .env file inside client:

```bash
REACT_APP_SERVERURL=http://localhost:8000
```

### 7. Start the frontend:
```bash
npm start
```
---
## 🌐 Deployment

This app can be deployed using:

Render (server and database)

Vercel or Netlify (frontend)

---
## 📸 Screenshots
![alt text](screenshots\image-1.png)
![alt text](screenshots\image-2.png)
![alt text](screenshots\image-3.png)
![alt text](screenshots\image-4.png)
![alt text](screenshots\image-5.png)
![alt text](screenshots\image-6.png)
![alt text](screenshots\image-7.png) 
---

## 📜 License

MIT © 2025
Free to use and modify.