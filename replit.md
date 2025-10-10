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
- `/api/quotes` - POST endpoint for shipping rate quotes (public)
- `/api/shipments` - POST/GET endpoints for shipment creation and retrieval (public)
- `/api/tracking/:trackingNumber` - GET endpoint for package tracking (public)
- `/api/login` - GET endpoint to initiate Replit Auth login flow
- `/api/logout` - GET endpoint to logout and clear session
- `/api/callback` - GET endpoint for OAuth callback
- `/api/auth/user` - GET endpoint for authenticated user data (protected)

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
- `users` table - Stores authenticated user profiles (id, email, firstName, lastName, profileImageUrl)
- `sessions` table - Session storage for Replit Auth with TTL index
- `shipments` table - Core shipment data with sender/receiver details
- `quotes` table - Shipping rate quote records
- `trackingEvents` table - Timeline of package tracking updates

**Data Models:**
- Shared TypeScript types via Drizzle schema exports
- Insert and Select type inference for type safety
- Validation schemas using drizzle-zod integration
- Storage interface pattern (IStorage) for testability and flexibility

## Authentication & Authorization

**Authentication Provider:**
- Replit Auth with OpenID Connect (OIDC) integration
- Supports multiple login methods: Google, GitHub, X (Twitter), Apple, and email/password
- Passport.js strategy for authentication flow
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
- Landing page for unauthenticated users with login/signup buttons
- Login redirects to Replit OAuth (/api/login)
- Automatic user profile creation/update via upsertUser on authentication
- Protected routes show authenticated content
- Logout clears session and redirects to landing (/api/logout)
- User profile display in header with avatar and name

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