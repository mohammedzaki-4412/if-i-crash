# 🚨 If I Crash

> **Your emergency information, available when it matters most.**

**If I Crash** is a web application designed to make critical emergency information quickly accessible after a road accident or other emergency.

Instead of relying on a rescuer to know who the victim is or how to contact their family, the user can create an emergency profile and generate a **QR-powered emergency card**. The QR code can be scanned to quickly access the information the user has chosen to make available during an emergency.

### 🔗 Live Demo

**[Try If I Crash](https://main.d23bpdt0a1hdn1.amplifyapp.com/)**

---

## 📌 The Problem

During an accident, a person may be unconscious, unable to communicate, or without someone nearby who knows their emergency information.

Important details such as:

* Name
* Blood group
* Emergency contacts
* Other emergency information

may not be immediately available to a rescuer.

**If I Crash** provides a simple way to connect that information to a physical emergency card through a QR code.

---

## 💡 How It Works

The basic flow is:

```text
User
  │
  ▼
Create Account
  │
  ▼
Create Emergency Profile
  │
  ├── Name
  ├── Blood Group
  ├── Emergency Contacts
  └── Other emergency information
  │
  ▼
Generate Emergency Card
  │
  ▼
QR Code
  │
  ▼
Place / display the QR code
  │
  ▼
Emergency occurs
  │
  ▼
Rescuer scans QR code
  │
  ▼
Emergency information is displayed
```

The goal is to reduce the time between **finding an injured person** and **finding useful emergency information**.

---

# ✨ Features

### 👤 Emergency Profile

Users can create and maintain their emergency information in one place.

### 🪪 Digital Emergency Card

The application generates an emergency card containing the user's selected information.

### 📱 QR Code Emergency Access

A QR code connects the physical/digital emergency card to the emergency information.

A rescuer can scan the QR code to access the information without needing to know the victim personally.

### 🔄 Profile Updates

Users can update their emergency information and regenerate/update the information associated with their QR code.

### 🔐 Authentication

The application uses AWS-backed authentication so users can access their own account and emergency information.

### 📱 Responsive Interface

The application is designed to work across:

* Mobile devices
* Tablets
* Desktop browsers

---

# 🏗️ Architecture

The application follows a serverless web-application architecture.

```text
                    ┌─────────────────────┐
                    │       User          │
                    │  Mobile / Desktop   │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │    React Frontend   │
                    │      + Vite         │
                    └──────────┬──────────┘
                               │
                     ┌─────────┴─────────┐
                     │                   │
                     ▼                   ▼
              Authentication        Application API
                     │                   │
                     ▼                   ▼
              Amazon Cognito       AWS Backend
                                         │
                                         ▼
                                   Data Storage
                                         │
                                         ▼
                                  Emergency Data
```

The frontend is built with React and Vite. The application is deployed through AWS infrastructure, allowing the project to run as a web application without maintaining a traditional server.

---

# ☁️ AWS Services

The project was built as a practical introduction to AWS and uses AWS services to handle the application's cloud infrastructure.

### AWS Amplify

Used to deploy and host the web application and make the frontend available through a public URL.

### Amazon Cognito

Used for user authentication and account management.

This allows emergency information to be associated with the appropriate user rather than treating the application as a single shared profile.

### AWS Backend Services

The backend handles the storage and retrieval of emergency-profile information and connects the frontend to the cloud infrastructure.

> The exact backend service configuration is documented in the project source code.

---

# 🛠️ Tech Stack

### Frontend

* React
* Vite
* JavaScript
* React Router
* Lucide React
* QRCode React

### Cloud / AWS

* AWS Amplify
* Amazon Cognito
* AWS backend services

### Development

* Node.js
* npm
* Git
* GitHub

---

# 📂 Project Structure

```text
if-i-crash/
│
├── backend/
│   └── AWS backend configuration and resources
│
├── public/
│   └── Static assets
│
├── src/
│   ├── Components
│   ├── Pages
│   ├── Application logic
│   └── UI
│
├── index.html
├── package.json
├── package-lock.json
├── vite.config.js
├── .gitignore
└── README.md
```

---

# 🚀 Running the Project Locally

## 1. Clone the repository

```bash
git clone https://github.com/mohammedzaki-4412/if-i-crash.git
```

Move into the project directory:

```bash
cd if-i-crash
```

## 2. Install dependencies

```bash
npm install
```

## 3. Start the development server

```bash
npm run dev
```

Vite will start the local development server.

Open the URL displayed in the terminal, typically:

```text
http://localhost:5173
```

---

# 🏗️ Production Build

To create a production build:

```bash
npm run build
```

To preview the production build locally:

```bash
npm run preview
```

---

# 🌐 Deployment

The application is deployed using **AWS Amplify**.

The deployment flow is:

```text
Local Development
       │
       ▼
   Git Repository
       │
       ▼
     GitHub
       │
       ▼
 AWS Amplify
       │
       ▼
Production Build
       │
       ▼
Live Web Application
```

Live application:

**https://main.d23bpdt0a1hdn1.amplifyapp.com/**

---

# 🧩 Development Journey

This project was also a hands-on introduction to AWS cloud development.

The development process involved going from a basic application idea to a deployed cloud application.

### Phase 1 — Problem Definition

The initial concept was based on a simple question:

> What information would a stranger need if they found me after an accident?

This led to the idea of an emergency profile connected to a QR code.

### Phase 2 — Frontend Development

The initial interface was developed using React and Vite.

The application was then iterated on to improve:

* Layout
* Typography
* Spacing
* Responsiveness
* Emergency-card presentation
* Dashboard usability
* QR-code interaction

### Phase 3 — Cloud Integration

The project was connected to AWS services for authentication, backend functionality, data management, and deployment.

This required understanding how a browser-based frontend communicates with cloud services rather than relying only on local application state.

### Phase 4 — Authentication & Data Isolation

One of the major development challenges was ensuring that emergency information belonged to the correct user.

This required moving away from a simple demo-style shared profile and implementing user-aware authentication and data handling.

### Phase 5 — QR Code Synchronization

Another important issue was ensuring that the QR code represented the user's current emergency information rather than static demonstration data.

The QR flow was tested repeatedly after profile updates and deployment.

### Phase 6 — Deployment

After integrating the frontend and AWS backend, the application was deployed through AWS Amplify and made available through a public HTTPS URL.

---

# 🧪 Testing

The application was tested across the major user flows:

* Account creation/authentication
* Emergency profile creation
* Emergency profile updates
* Emergency card generation
* QR code generation
* QR code scanning
* Emergency information retrieval
* Responsive layouts
* Production deployment

---

# 🔒 Security Considerations

The application handles potentially sensitive emergency information.

Authentication and user-specific data access are therefore important parts of the architecture.

For a production-scale version, additional security work would be required, including:

* Strict authorization policies
* Data minimization
* Encryption and secure storage
* API abuse protection
* Audit logging
* Rate limiting
* Privacy controls
* Clear rules around which emergency information is publicly accessible through a QR scan

**This project is a hackathon/learning project and should not be treated as a production medical-data system.**

---

# 🎯 What I Learned

Building this project provided hands-on experience with:

* React application development
* Vite-based frontend development
* Git and GitHub
* AWS Amplify deployment
* AWS authentication
* Cloud backend integration
* User-specific data handling
* QR-code based workflows
* Debugging deployed applications
* Responsive UI/UX
* Connecting frontend applications to cloud infrastructure

Most importantly, the project provided practical experience moving from:

```text
Idea
  ↓
Prototype
  ↓
Frontend
  ↓
Cloud Backend
  ↓
Authentication
  ↓
Testing
  ↓
Deployment
  ↓
Live Application
```

---

# 🔮 Future Improvements

Possible future improvements include:

* Emergency-location sharing
* Optional GPS location during an emergency
* SMS-based emergency notifications
* Additional emergency medical fields
* QR-code privacy controls
* Expiring/rotating emergency links
* Emergency access analytics
* Better accessibility support
* Progressive Web App support
* Stronger production-grade authorization and monitoring

---

# 📸 Screenshots

Screenshots of the application can be added here to show:

1. Landing page
2. Authentication
3. Dashboard
4. Emergency profile
5. Emergency card
6. QR-code view
7. Scanned emergency information

---

# 👨‍💻 Author

**Mohammed Zaki**

GitHub:
https://github.com/mohammedzaki-4412

---

## 📄 License

Add a license here if you decide to open-source the project.

---

## ⭐ Project

If you find the idea useful, consider giving the repository a star.

**Live Demo:**
https://main.d23bpdt0a1hdn1.amplifyapp.com/

**Source Code:**
https://github.com/mohammedzaki-4412/if-i-crash
