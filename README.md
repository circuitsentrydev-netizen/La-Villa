# La Villa

<p align="center">
  <img src="https://socialify.git.ci/circuitsentrydev-netizen/La-Villa/image?language=1&owner=1&name=1&stargazers=1&theme=Light" alt="La Villa project banner" width="640" />
</p>

<p align="center">
  <strong>Discover your next stay. Book your next experience.</strong>
</p>

<p align="center">
  A modern accommodation discovery and booking platform built for guests and accommodation providers in South Africa.
</p>

<p align="center">
  <a href="https://la-villa-nu.vercel.app/">Visit La Villa</a> ·
  <a href="https://github.com/circuitsentrydev-netizen/La-Villa">GitHub Repository</a>
</p>

---

## About the Project

La Villa, also known as **La Villa – Lekker Stays**, is an accommodation booking platform developed by Circuit Sentry.

The project was created to make discovering and booking accommodation easier. Guests can explore available properties, view accommodation details, save their favourite stays and make reservations through an online booking experience.

The platform also includes an administration dashboard that allows authorised administrators to manage accommodation listings, room types, customer accounts and reservations.

The goal is to bring the important parts of the accommodation booking process together in one convenient place.

## Features

### Guest Features

- Browse available accommodation across South Africa.
- Search properties by destination, price and star rating.
- View accommodation descriptions, photos and details.
- Explore available room types.
- Register and sign in to a personal account.
- Google authentication.
- Save and manage favourite properties.
- Make accommodation reservations.
- Complete online payments through Paystack.
- View reservation and payment information.
- Receive booking notifications.
- Share accommodation listings.
- Manage personal account information.

### Administration Features

- Secure administrator login.
- Dedicated administration dashboard.
- View accommodation listings.
- Add new accommodation properties.
- Edit existing property information.
- Upload, update and manage property photos.
- Manage room types and room availability.
- View and manage reservations.
- View registered customers.
- Manage customer account status.
- Create and manage administrator accounts.

## Technology Stack

La Villa is built using a combination of frontend and backend technologies.

| Category | Technology |
|---|---|
| Frontend | React |
| Programming Language | TypeScript |
| Build Tool | Vite |
| Routing | React Router |
| State Management | Redux Toolkit |
| Styling | CSS |
| Backend Runtime | Node.js |
| Backend Framework | Express.js |
| Backend Language | TypeScript |
| Database | PostgreSQL |
| Database Hosting | Neon |
| Authentication | JWT and Google OAuth |
| Payment Gateway | Paystack |
| Frontend Deployment | Vercel |
| Backend Deployment | Render |

## Project Structure

The project separates the frontend and backend to keep the application organised and maintainable.

### Frontend Structure

```text
src/
├── app/
│   └── store.ts
├── components/
├── config/
├── features/
│   └── auth/
├── pages/
├── utils/
├── App.tsx
├── main.tsx
└── index.css

public/
├── favicon.ico
└── assets/
```

### Backend Structure

```text
backend/
└── src/
    ├── config/
    ├── controllers/
    ├── middleware/
    ├── routes/
    ├── services/
    └── server.ts
```

*These are simplified examples of the project structure. Additional files and folders may be present in the actual repository.*

## Getting Started

To run La Villa locally, make sure you have the required tools installed.

### Prerequisites

- Node.js
- npm
- Git
- PostgreSQL database or a Neon account
- Google OAuth credentials (if enabling Google sign-in)
- Paystack credentials (if testing payments)

### Installation

**1. Clone the repository**

```bash
git clone https://github.com/circuitsentrydev-netizen/La-Villa.git
```

**2. Navigate into the project directory**

```bash
cd La-Villa
```

**3. Install frontend dependencies**

```bash
npm install
```

**4. Configure environment variables**

Create the required environment files for the frontend and backend.

**5. Start the frontend development server**

```bash
npm run dev
```

**6. Start the backend**

Navigate to the backend directory and use the development script configured in its `package.json`.

The frontend and backend must both be running for the complete application to work locally.

## Environment Configuration

The frontend uses environment variables to connect to the backend and configure Google sign-in.

Example frontend `.env`:

```env
VITE_API_BASE_URL=http://localhost:3002/api
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

The backend requires its own environment configuration for services such as:

- Neon PostgreSQL connection.
- JWT authentication.
- Google OAuth verification.
- Paystack payment processing.
- Email and notification services.

The actual variable names should match those defined in the backend configuration.

**Security reminder:** Never commit `.env` files, database credentials, payment secret keys or private API credentials to GitHub.

## Payment Processing

La Villa integrates with Paystack to handle online payments.

The booking process is designed around full payment upfront. A reservation is only confirmed after the backend successfully verifies the payment transaction.

This provides a more reliable booking process and helps prevent unpaid reservations from being confirmed.

## Deployment

The application is deployed using separate services for the frontend, backend and database.

| Service | Platform |
|---|---|
| Frontend | Vercel |
| Backend | Render |
| Database | Neon PostgreSQL |
| Payments | Paystack |

**Live application:** https://la-villa-nu.vercel.app/

The frontend communicates with the backend through the configured API base URL.

## Security

Security is an important part of the application.

The platform includes:

- Token-based authentication.
- Protected backend routes.
- Role-based access for administrative features.
- Server-side payment verification.
- Environment-based configuration for sensitive credentials.
- Validation of important booking and account operations.

## Project Status

**Status: Active Development**

La Villa is an ongoing development project. Improvements are focused on the overall booking experience, property management, account functionality, payment processing and platform reliability.

## Developer

**Circuit Sentry**

Developer and operator of La Villa – Lekker Stays.

**Location:** South Africa  
**Email:** circuitsentrydev@gmail.com

---

<p align="center">
  <strong>La Villa – Lekker Stays</strong>
  <br />
  <em>Thoughtful stays. Memorable experiences.</em>
  <br /><br />
  © Circuit Sentry. All rights reserved.
</p>