# Smart Attendance System

AI-powered attendance management system using face recognition with Docker-based deployment, Nginx reverse proxy, and mobile access via HTTPS tunneling.
---

## Features

* Face recognition based attendance
* Role based dashboards (Admin / Teacher / Student)
* Semester promotion system
* Attendance analytics
* Attendance reports
* Smart attendance insights

---

## Tech Stack

- **Frontend:** Next.js, Tailwind CSS  
- **Backend:** Node.js  
- **Database:** MongoDB  
- **Authentication:** JWT  
- **Deployment:** Docker, Nginx (Reverse Proxy)

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


## Mobile Access

Since mobile browsers require HTTPS to access the camera, the application cannot be accessed via `localhost` from other devices.

### Option 1: Same WiFi

Use your system’s local IP address:

```bash
http://<your-ip-address>
```

Example:

```bash
http://192.168.1.5
```

⚠️ Camera may not work over HTTP.

---

### Option 2: Using ngrok (Recommended)

To enable camera access on mobile devices, use ngrok to expose the application over HTTPS:

```bash
ngrok http 80
```

This will generate a public HTTPS URL like:

```bash
https://abc123.ngrok.io
```

Open this URL on your mobile device:

```bash
https://abc123.ngrok.io/login
```

✔ Works across devices
✔ Enables camera access
✔ Useful for testing and demo purposes

---

### Flow

Mobile → ngrok (HTTPS) → Nginx → Next.js → MongoDB

