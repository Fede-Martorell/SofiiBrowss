# SofiiBrowss

### Beauty studio booking & management platform

> 🚧 Active Development • Built with React, TypeScript and Supabase

SofiiBrowss is a modern web platform designed for a beauty studio specialized in lashes and brows.

The application combines a customer-facing booking experience with an administration dashboard that allows the studio to manage appointments, services, gallery content, reviews, business settings and user roles.

The project was built as a real-world application with a focus on usability, responsive design, maintainability and a scalable backend architecture.

---

## Why SofiiBrowss?

Most beauty studios still manage appointments through WhatsApp conversations,
manual calendars and social media messages.

SofiiBrowss was created to centralize booking management, reduce scheduling
friction and provide a modern customer experience while keeping administration
simple for the business owner.

---

## Live Demo

Coming soon.

Production deployment is currently being prepared.

---

## ✨ Features

### Customer Experience

- 📅 Online appointment booking
- 🕐 Dynamic appointment availability
- 💇 Service catalog with categories and pricing
- 🖼️ Service and portfolio galleries
- ⭐ Customer reviews
- 💬 WhatsApp integration
- 📆 Google Calendar integration
- 🌓 Light and dark themes
- 📱 Responsive design for desktop and mobile
- ⚡ Fast client-side experience

### Administration

- 🔐 Authentication and role-based access
- 📊 Appointment management
- 💇 Service and pricing management
- 🖼️ Gallery management
- ⭐ Review moderation
- ⚙️ Business configuration
- 📤 Image uploads through Supabase Storage
- 👥 Owner and staff roles
- 🚪 Session management and logout

---

## 🏗️ Architecture

The application follows a client/server architecture centered around Supabase.

```text
React Application
(TypeScript + Vite)
        │
        ▼
Application Layer
(Components · Hooks · Queries)
        │
        ▼
Supabase
(PostgreSQL · Auth · Storage · RLS)
```

The application separates database access from the UI through dedicated query and data-access layers.

---

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|----------|
| React 19 | User Interface |
| TypeScript | Type Safety |
| Vite | Development & Build Tooling |
| Supabase | Backend Services |
| PostgreSQL | Persistent Database |
| Supabase Auth | Authentication |
| Supabase Storage | File Storage |
| Lucide React | Icons |
| CSS | Styling |
| Oxlint | Code Quality |

---

## 🗄️ Data Model

Main entities:

```text
auth.users
    │
    └── profiles

services
    │
    └── bookings

gallery_items

reviews

settings
```

### Profiles

Stores application users and roles.

Supported roles:

- owner
- staff

### Services

Stores available treatments, pricing, duration and scheduling information.

### Bookings

Stores customer appointments and booking status.

### Gallery

Stores portfolio and showcase images.

### Reviews

Stores customer feedback and moderation status.

### Settings

Stores configurable business information:

- Business name
- WhatsApp
- Instagram
- Working days
- Working hours
- Branding
- Notifications

---

## 📅 Booking Flow

```text
Select Service
      ↓
Select Date
      ↓
Check Availability
      ↓
Select Time
      ↓
Enter Customer Data
      ↓
Create Booking
      ↓
Confirmation
```

Additional integrations:

- WhatsApp
- Google Calendar

---

## 🖼️ Image Management

Images are uploaded to Supabase Storage and associated with services and gallery entries through public URLs.

```text
Image
  ↓
Supabase Storage
  ↓
Public URL
  ↓
Database Record
```

---

## 🔐 Authentication & Roles

The administration area uses Supabase Authentication together with profile-based roles.

### Owner

Full access to:

- Appointments
- Services
- Gallery
- Reviews
- Settings

### Staff

Limited operational access focused on appointment management.

---

## 🖥️ Administration Dashboard

```text
Dashboard
│
├── Appointments
├── Services
├── Gallery
├── Reviews
└── Settings
```

The dashboard allows business management without changing source code.

---

## 🔒 Security

Security is based on:

- Supabase Authentication
- PostgreSQL Row Level Security (RLS)
- Role-based permissions

Current focus:

- Final RLS review
- Permission hardening
- Production security validation

---

## 📱 Responsive Design

Optimized for:

- Mobile
- Tablet
- Laptop
- Desktop

The booking flow is primarily designed for mobile users.

---

## 📁 Project Structure

```text
src/
├── components/
├── hooks/
├── lib/
│   ├── adapters.ts
│   ├── db.ts
│   ├── queries.ts
│   └── supabase.ts
│
├── App.tsx
├── main.tsx
└── ...
```

---

## 🚀 Getting Started

### Requirements

- Node.js
- npm
- Supabase Project

### Clone Repository

```bash
git clone https://github.com/Fede-Martorell/SofiiBrowss.git
cd SofiiBrowss
```

### Install Dependencies

```bash
npm install
```

### Environment Variables

Create:

```env
.env.local
```

And add:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Preview

```bash
npm run preview
```

### Lint

```bash
npm run lint
```

---

## 📈 Project Status

### Completed

- [x] Service catalog
- [x] Responsive design
- [x] Booking flow
- [x] WhatsApp integration
- [x] Google Calendar integration
- [x] Administration dashboard
- [x] Reviews management
- [x] Gallery management
- [x] Settings management
- [x] Supabase integration
- [x] Storage integration
- [x] Authentication foundation
- [x] Owner / staff roles
- [x] Logout functionality
- [x] Persistent application data

### In Progress

- [ ] Final RLS hardening
- [ ] Security review
- [ ] Booking concurrency validation
- [ ] Production QA
- [ ] Deployment

---

## 🗺️ Roadmap

### Phase 1

- [x] Customer website
- [x] Booking system
- [x] Dashboard
- [x] Database integration

### Phase 2

- [x] Gallery
- [x] Reviews
- [x] Storage
- [x] Business settings

### Phase 3

- [ ] Security hardening
- [ ] QA
- [ ] Production deployment

### Future Ideas

- Appointment reminders
- Customer history
- Analytics dashboard
- PWA support
- SEO improvements

---

## 🎯 Project Goals

- Simplify appointment booking
- Centralize business management
- Improve customer experience
- Reduce manual coordination
- Build a scalable platform

---

## 💡 Design Principles

### Simple for Customers

Booking an appointment should require as few steps as possible.

### Practical for the Business

The platform should simplify daily operations.

### Mobile First

Most bookings are expected to come from mobile devices.

### Maintainable Architecture

Business logic and UI should remain clearly separated.

### Security by Default

Users should only access the data they actually need.

---

## 👨‍💻 Development

Built and maintained by **Fede Martorell**.

Developed as a real-world solution for a beauty studio and as an ongoing software engineering project.

---

## 📄 License

All rights reserved.

This repository is published for portfolio and educational purposes.

Reuse, redistribution or commercial use is not permitted without explicit authorization from the project owner.

---

## ❤️ About SofiiBrowss

Built with care for the business.
Designed for its clients.