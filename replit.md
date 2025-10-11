# Overview

This is a shipping management platform (Manuel Dev) built for the Mexican market that integrates with the Skydropx API. The application enables users to quote shipping rates from multiple carriers (DHL, FedEx, Estafeta, UPS, etc.), create shipping labels, and track packages in real-time. It's a full-stack TypeScript application with a React frontend and Express backend, designed as a professional logistics platform with a focus on clarity, trust, and efficiency.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

**Framework & Build System:**
- React 18 with TypeScript using Vite as the build tool
- Client-side routing with Wouter (lightweight React router)
- State management via TanStack Query (React Query) for server state
- Form handling with React Hook Form and Zod validation

**UI Design System:**
- shadcn/ui component library (New York style variant)
- Radix UI primitives for accessible components
- Tailwind CSS for styling with custom design tokens
- Material Design principles with Stripe/Shopify influences for transactional clarity
- Responsive design with mobile-first approach

**Design Tokens:**
- Light/dark mode support via CSS custom properties
- Primary color: Blue (HSL 214 100% 45%) for logistics trust
- Secondary color: Green (HSL 142 76% 36%) for success states
- Typography: Inter for UI, JetBrains Mono for tracking numbers
- Custom elevation system with hover/active states

## Backend Architecture

**Server Framework:**
- Express.js with TypeScript (ESM modules)
- RESTful API design pattern
- Middleware-based request processing pipeline

**API Routes:**
- `/api/quotes` - POST endpoint for shipping rate quotes (public, applies profit margin)
- `/api/shipments` - POST/GET endpoints for shipment creation and retrieval (public)
- `/api/tracking/:trackingNumber` - GET endpoint for package tracking (public)
- `/api/register` - POST endpoint for local user registration (public)
- `/api/login` - POST endpoint for local user login (public)
- `/api/login-google` - GET endpoint to initiate Google OAuth login flow
- `/api/auth/google/callback` - GET endpoint for Google OAuth callback
- `/api/logout` - GET endpoint to logout and clear session
- `/api/auth/user` - GET endpoint for authenticated user data (protected, sanitized)
- `/api/user/contact` - PATCH endpoint to update user contact information (protected)
- `/api/user/billing` - PATCH endpoint to update user billing information (protected)
- `/api/user/password` - PATCH endpoint to update user password (protected, local auth only)
- `/api/user/add-password` - POST endpoint to add password to OAuth-only accounts (protected)
- `/api/user/unlink-provider` - POST endpoint to unlink OAuth provider with validation (protected, supports google/facebook)
- `/api/user/avatar` - PATCH endpoint to update profile image URL (protected)
- `/api/admin/settings` - GET endpoint to retrieve all system settings (admin only)
- `/api/settings/:key` - GET endpoint to retrieve specific setting value (public)
- `/api/admin/settings` - PATCH endpoint to update system settings (admin only)

**Required Environment Variables:**
- `GOOGLE_CLIENT_ID` - Google OAuth 2.0 Client ID from Google Cloud Console
- `GOOGLE_CLIENT_SECRET` - Google OAuth 2.0 Client Secret from Google Cloud Console
- `SESSION_SECRET` - Secret key for session encryption
- `DATABASE_URL` - PostgreSQL connection string
- `REPLIT_DOMAINS` - Replit deployment domains for callback URLs

**Google Cloud Console Configuration:**
- **Orígenes JavaScript autorizados**: Development and production URLs
- **URIs de redireccionamiento**: `/api/auth/google/callback` for both environments
- **Estado de publicación**: Aplicación publicada (producción)

**Request/Response Flow:**
- Request validation using Zod schemas from shared directory
- JSON-based request/response format
- Error handling middleware with standardized error responses
- Request logging with duration tracking for API endpoints

## Data Storage

**Database:**
- PostgreSQL via Neon serverless driver (production-ready)
- Drizzle ORM for type-safe database operations
- Connection pooling for performance optimization
- Migrated from MemStorage to DatabaseStorage for persistence

**Schema Design:**
- `users` table - Stores authenticated user profiles with contact and billing data:
  - Contact: id, email, firstName, lastName, phone, profileImageUrl, dateOfBirth
  - Billing: rfc, razonSocial, direccionFiscal, codigoPostalFiscal, ciudadFiscal, estadoFiscal
  - Auth: password (hashed with bcrypt, can be null), googleId, facebookId (OAuth provider IDs)
  - Role: 'admin' or 'user' for access control
  - Users can have multiple auth methods simultaneously (password + OAuth providers)
- `sessions` table - Session storage with PostgreSQL backend
- `shipments` table - Core shipment data with sender/receiver details
- `quotes` table - Shipping rate quote records
- `trackingEvents` table - Timeline of package tracking updates
- `settings` table - System configuration storage (key-value pairs):
  - key (varchar, primary key) - Setting identifier
  - value (text) - Setting value stored as string
  - description (text, optional) - Human-readable description
  - updatedAt (timestamp) - Last update timestamp

**Data Models:**
- Shared TypeScript types via Drizzle schema exports
- Insert and Select type inference for type safety
- Validation schemas using drizzle-zod integration
- Storage interface pattern (IStorage) for testability and flexibility

## Authentication & Authorization

**Authentication System:**
- **Hybrid Authentication**: Supports local email/password and Google OAuth
- **Local Authentication**: 
  - Email/password registration with bcrypt hashing (10 rounds)
  - Enhanced registration collects: email, password, confirm password, first name, last name, date of birth (day/month/year selectors)
  - Strong password validation: minimum 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character (@$!%*?&_-.,)
  - Password confirmation validation enforced in both frontend and backend
  - Date of birth validation: numeric ranges (day 1-31, month 1-12, year 1900-current) + Date object validity check
  - Passport-local strategy for credential validation
  - Auto-login after successful registration
- **Google OAuth Authentication**:
  - Official Google OAuth 2.0 API via passport-google-oauth20
  - User profile data (email, name, photo) automatically synced
  - Seamless account creation/update on first login
- Passport.js for unified authentication flow
- Session-based authentication using connect-pg-simple

**Session Management:**
- PostgreSQL-backed session storage (sessions table)
- 7-day session TTL (Time To Live)
- Secure cookies with httpOnly and secure flags
- Custom middleware `isAuthenticated` for route protection
- Token refresh mechanism for expired sessions

**Frontend Authentication:**
- Custom `useAuth` hook with React Query integration
- Handles 401 responses gracefully (treats as unauthenticated)
- Includes credentials in all requests for cookie-based auth
- 5-minute staleTime to prevent redundant auth checks
- Shared auth state across components (App, Header)

**User Flow:**
- Unified home page (`/`) adapts to authentication state:
  - **Unauthenticated users**: Shows login/signup buttons in hero and CTA sections
  - **Authenticated users**: Shows action buttons (Cotizar Envío, Crear Guía) in hero and CTA sections
- `/auth` page with forms for local login/registration and OAuth button (Google)
- Local registration creates user with hashed password and auto-logs in
- Login (local or Google) redirects to home page after success
- Automatic user profile creation/update via upsertUser on authentication
- Protected routes (/cotizar, /crear-guia, /rastrear, /envios, /perfil, /admin/usuarios) only accessible when authenticated
- `/perfil` page for enhanced user profile management:
  - **Profile Header**: Avatar with camera button for editing, user name/email, badges showing active auth methods (Password, Google)
  - **Contact Tab**: Update name, email (read-only), and phone
  - **Billing Tab**: Manage RFC, razón social, fiscal address details
  - **Security Tab**: 
    - Password section: "Agregar Contraseña" for OAuth accounts (no current password required), "Cambiar Contraseña" for accounts with password
    - Redes Vinculadas section: Shows Google/Facebook connection status with link/unlink buttons
    - Cannot unlink last remaining auth method (validation enforced)
- Logout clears session and redirects to landing (/api/logout)
- User profile display in header with avatar and name (clickable to navigate to profile)
- Users can add password to OAuth accounts to enable independent login
- Users can unlink OAuth providers while maintaining access via password

**Security Measures:**
- All user responses sanitized via `sanitizeUser()` helper to remove password hashes
- Passwords never exposed in API responses (even hashed)
- Bcrypt with 10 salt rounds for password hashing
- Session cookies with httpOnly and secure flags
- Backend Zod validation on all profile update endpoints
- Strong password requirements: minimum 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
- Password confirmation field validated but not stored in database
- Password change requires current password verification (not required when adding first password to OAuth account)
- Cannot unlink last authentication method (enforced in backend to prevent account lockout)
- Multiple authentication methods supported simultaneously for redundancy

## External Dependencies

**Third-Party APIs:**
- Skydropx API - Primary shipping carrier integration for quotes, label generation, and tracking
  - Quote endpoint for rate comparison across carriers
  - Shipment creation endpoint for label generation
  - Tracking endpoint for real-time package status

**Development Tools:**
- Replit-specific plugins for development environment
  - Runtime error overlay modal
  - Cartographer for code exploration
  - Dev banner for development mode indication

**Key Libraries:**
- `@tanstack/react-query` - Server state management and caching
- `drizzle-orm` & `@neondatabase/serverless` - Database layer
- `passport` & `openid-client` - Authentication
- `zod` - Runtime type validation
- `react-hook-form` - Form state management
- `date-fns` - Date manipulation utilities

**Image Assets:**
- Static images stored in `attached_assets/generated_images`
- Hero background image for landing page

## Profit Margin System

**Configurable Pricing:**
- Platform charges customers the Skydropx base price plus a configurable profit margin
- Margin percentage stored in `settings` table with key `profit_margin_percentage`
- Default profit margin: 15% when no setting exists or invalid data detected
- Only admin users can modify profit margin through admin panel

**Price Calculation:**
- Formula: `price_with_margin = base_price * (1 + margin_percentage / 100)`
- Applied to both `amount_local` and `total_pricing` fields in quote responses
- Validation ensures margin is between 0-100%
- NaN guards prevent invalid prices from reaching customers

**Admin Configuration:**
- AdminUsersPage (/admin/usuarios) contains profit margin configuration card
- Number input with min=0, max=100 validation
- Real-time updates to quote system
- Backend validation using z.coerce.number().min(0).max(100)
- Fallback to 15% if stored value is invalid or missing

**Security & Validation:**
- PATCH /api/admin/settings validates profit_margin_percentage with strict numeric bounds
- Quote endpoint validates rate amounts before applying margin
- Returns original Skydropx rate if amounts are invalid (NaN protection)
- All margin changes require admin authentication