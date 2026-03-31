# Smart Attendance System

AI-powered attendance management system using face recognition with Docker-based deployment and Nginx reverse proxy for a production-ready architecture.

---

## Features

* Face recognition based attendance
* Role based dashboards (Admin / Teacher / Student)
* Semester promotion system
* Attendance analytics
* PDF attendance reports
* Smart attendance insights

---

## Tech Stack

Frontend: Next.js, Tailwind CSS
Backend: Node.js
Database: MongoDB
Authentication: JWT
Deployment: Docker, Nginx (Reverse Proxy)

---

## Architecture

Client → Nginx → Next.js Application → MongoDB

* Nginx acts as a reverse proxy
* Docker ensures consistent deployment environment

---

## Modules

### Admin

* Manage batches
* Manage divisions
* Assign teachers
* Create timetable
* View reports

### Teacher

* Mark attendance
* View class reports
* Subject analytics

### Student

* View attendance percentage
* Attendance insights
* Attendance history
* Timetable

---

## Installation

### Without Docker

```bash
git clone https://github.com/arfaheemshahnawaz-web/smart-attendance-system
cd smart-attendance-system
npm install
npm run dev
```

### With Docker (Recommended)

```bash
docker-compose up --build
```

Then open: http://localhost
