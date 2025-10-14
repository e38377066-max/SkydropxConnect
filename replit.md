# Overview

This shipping management platform, "Manuel Dev," is designed for the Mexican market, integrating with the Skydropx API to offer comprehensive logistics solutions. It enables users to compare shipping rates from various carriers (DHL, FedEx, Estafeta, UPS), generate shipping labels, and track packages in real-time. The application is a full-stack TypeScript project, featuring a React frontend and an Express backend, developed as a professional, efficient, and trustworthy logistics tool.

## Navigation Architecture

The application implements a dual-navigation system:

### Public Landing Page (/)
- **Available to:** All users (authenticated and non-authenticated)
- **Layout:** Header + Footer (no sidebar)
- **Components:** Hero section, How It Works, Carriers, Features, CTA sections
- **Header Actions:**
  - Non-authenticated: "Iniciar Sesión" and "Registrarse" buttons
  - Authenticated: "Mi Dashboard" button (prominent, navigates to /dashboard)
- **Behavior:** Users clicking "Cotizar" when not authenticated are redirected to /auth

### Dashboard & Internal Pages (/dashboard, /cotizar, etc.)
- **Available to:** Authenticated users only
- **Layout:** Sidebar + Content area (no header/footer)
- **Sidebar Navigation:**
  - Principal: Inicio (returns to /), Dashboard, Cotizar Envío, Crear Envío, Mis Envíos, Rastrear, Billetera
  - Configuración: Direcciones, Paquetes
  - Mi Cuenta: Mi Perfil
  - Admin: Usuarios, Recargas (admin-only)
- **Logo:** Clickeable link to homepage (/)
- **Protected Routes:** /dashboard, /cotizar, /crear-guia, /rastrear, /envios, /perfil, /billetera, /configuracion/*, /admin/*

## Important Terminology

- **Crear Envío** (Create Shipment): The correct term for the process of creating a new shipment, which then generates a shipping label/guide. This is NOT "crear guía" or "regenerar guía" - it's creating a brand new shipment.
- **Guía/Etiqueta de Envío** (Shipping Label): The physical or digital label/guide that is generated as a result of creating a shipment.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## UI/UX Decisions

The platform utilizes `shadcn/ui` (New York style) and `Radix UI` for accessible components, styled with `Tailwind CSS`. Design is influenced by Material Design, Stripe, and Shopify, focusing on transactional clarity and a responsive, mobile-first approach. It supports light/dark modes, uses blue for primary actions, green for success, and `Inter` for UI typography (`JetBrains Mono` for tracking numbers).

## Technical Implementations

The frontend uses React 18 with TypeScript and Vite, `Wouter` for routing, `TanStack Query` for state management, and `React Hook Form` with `Zod` for form handling.

The backend is an Express.js application with TypeScript, following a RESTful API design. It features middleware for request processing, Zod for request validation, and standardized JSON-based error responses.

### Core Features:

-   **Authentication & Authorization**: Hybrid system supporting local email/password and Google OAuth via Passport.js. Features include bcrypt password hashing, robust password validation, session management with PostgreSQL storage, and secure cookie handling. Users can manage multiple authentication methods and profile details on a dedicated `/perfil` page, including contact, billing, and security settings. Admin roles have access to system settings.
-   **Skydropx PRO Integration (OAuth)**: ✅ Fully functional integration with Skydropx PRO API using OAuth Bearer token authentication. Features auto-refresh token system (renews 5 min before expiration), support for 10+ shipping carriers (DHL, FedEx, Estafeta, UPS, etc.), and real-time quote comparison. Endpoint: `https://pro.skydropx.com/api/v1/quotations`.
-   **Shipping & Tracking**: 
    - Quoting: `/api/quotes` returns 10+ valid rates per request with pricing and delivery estimates (sorted by price, cheapest first)
    - Creation: `/api/shipments` creates shipments with automatic wallet deduction. Full Skydropx-style 4-step flow implemented:
      - **Step 1**: Origin/destination details (addresses guardadas dropdown, granular fields: company, email, street, ext/int numbers, references, municipality, state, RFC)
      - **Step 2**: Package information (dimensions, weight, declared value, Carta Porte, packaging type, RFC options, prohibited items warning)
      - **Step 3**: Carrier selection (sorted by price with "Mejor Precio" badge on cheapest option)
      - **Step 4**: Shipment confirmation & label download
    - Address Building: Skydropx receives fully detailed addresses via helper functions `buildAddressStreet1()` (street, #ext, Int. int, colonia) and `buildReferences()` (references, municipality, state)
    - Tracking: `/api/tracking/:trackingNumber` uses Skydropx endpoint `/api/v1/shipments/tracking?tracking_number={tracking_number}&carrier_name={carrier_name}` for real-time package tracking. Handles cancelled shipments gracefully without attempting Skydropx lookup.
    - Cancellation: `/api/shipments/:id/cancel` cancels shipments via Skydropx `/api/v1/shipments/{shipment_id}/cancellations` endpoint with automatic refund to user wallet, transaction recording, and tracking event creation. UI includes confirmation dialog showing refund amount.
-   **User Management**: Endpoints for user registration, login, logout, and authenticated user data retrieval (`/api/auth/user`). Protected routes for updating user contact, billing, and password information.
-   **Wallet System**: Protected endpoints for retrieving wallet balance, transaction history, and managing recharge requests (`/api/wallet/*`). Admin users can approve or reject recharge requests.
-   **Saved Data**: Protected endpoints for managing user's saved addresses, package presets, and billing profiles (`/api/addresses`, `/api/packages`, `/api/billing-profiles`).
-   **Profit Margin System**: Configurable profit margin applied to Skydropx base prices, stored in the `settings` table. Only admin users can modify this percentage via a dedicated admin panel, with validation ensuring the margin is between 0-100%. Default margin: 15%.
-   **Zip Code Autocomplete with Colonia Selection**: Skydropx-style unified address entry system using local database of 157,127 Mexican postal codes (SEPOMEX) covering all 32 states.
    - **UX Design**: Single input field showing "CP - Colonia" format after selection, searchable by both postal code and colonia name
    - **Search Endpoint**: `/api/zipcodes/search?q={query}` searches by CP (numeric) or colonia name (text), returns full suggestion objects with metadata
    - **Performance**: Optimized with specialized indices
      - Debounce: 50ms for fast response
      - Query times: 1-18ms (well below 30ms target)
      - `idx_codigo_postal` with `text_pattern_ops` for CP prefix searches (~1.3ms)
      - `idx_colonia_lower` on `LOWER(colonia)` for case-insensitive searches (~18ms)
    - **Smart Features**: 
      - Manual selection from dropdown (no auto-selection to prevent unwanted reapplication)
      - Metadata display (municipio, estado) below selected value
      - Hydration guard prevents dropdown flickering on prefill
      - Clean state management - clears all values when user edits
      - lastValidSelection ref caches metadata to prevent loss during re-renders
    - **Component**: `ZipCodeInput.tsx` with unified display, smart search, and metadata preservation
    - **Data Flow**: Selected colonia persisted in shipments table (senderColonia, receiverColonia) and sent to Skydropx in street addresses
    - **Benefits**: Skydropx-style UX, sub-30ms response time, no external API dependency
    - Data imported from official SEPOMEX Excel file into `zip_codes` table

## Data Storage

The application uses PostgreSQL, accessed via the Neon serverless driver, and `Drizzle ORM` for type-safe operations. Key tables include:
-   `users`: Stores user profiles, authentication details (hashed passwords, OAuth IDs), roles, and wallet balances.
-   `sessions`: For session management.
-   `shipments`: Complete shipment records with 50+ fields including granular address details (company, email, street, exteriorNumber, interiorNumber, references, municipality, city, state, RFC) for both sender and receiver, package details (shipmentType, packageAlias, declaredValue, productClassification, packagingType), and options (generateAsOcurre, sendEmailNotification).
-   `quotes`, `trackingEvents`: Core shipping data.
-   `settings`: Stores system configurations like profit margin.
-   `transactions`, `recharge_requests`: For the wallet system.
-   `saved_addresses`: Enhanced with granular fields (company, email, street, exteriorNumber, interiorNumber, references, colonia, municipality) matching shipment address structure for seamless autocomplete.
-   `saved_packages`, `billing_profiles`: For user-saved preferences.
-   `zip_codes`: Contains 157,127 Mexican postal codes from SEPOMEX with indexed columns (codigo_postal, estado) for fast autocomplete queries. Covers all 32 states of Mexico.

## System Design Choices

-   **Modular Design**: Clear separation between frontend and backend, with shared types for consistency.
-   **Type Safety**: Extensive use of TypeScript, Zod for runtime validation, and Drizzle ORM for database interactions.
-   **Security-First**: Bcrypt for password hashing, secure session management, input validation on all API endpoints, and careful sanitization of user data.
-   **Scalability**: Leverages serverless PostgreSQL and a RESTful API design.

# External Dependencies

## Third-Party APIs

-   **Skydropx API**: Integrated for shipping rate quotes, label generation, and real-time package tracking across various carriers. 
    - **Authentication**: OAuth 2.0 using client_credentials flow
    - **Base URL**: `https://app.skydropx.com/v1`
    - **OAuth Endpoint**: `https://pro.skydropx.com/api/v1/oauth/token` (Corrected)
    - **Credentials**: Stored in `SKYDROPX_API_KEY` (client_id) and `SKYDROPX_API_SECRET` (client_secret)
    - **Token**: Bearer token with 2-hour expiration, auto-refreshes 5 minutes before expiry
    - **Scope**: `default orders.create`
    - **Endpoints**: 
        - `/quotations` - Get shipping quotes
        - `/shipments` - Create shipments
        - `/shipments/{shipment_id}` - Get shipment status
        - `/shipments/tracking?tracking_number={tracking_number}&carrier_name={carrier_name}` - Track packages
        - `/shipments/{shipment_id}/cancellations` - Cancel shipments (POST with reason)
    - **Fallback**: Mock data mode when credentials are not configured
    - **Status**: OAuth endpoint correcto identificado, error 401 "invalid_client" pendiente de resolver con soporte (ver SKYDROPX_CONFIG.md)
-   **Google OAuth 2.0 API**: Integrated for secure user authentication via Google accounts.

## Libraries

-   `@tanstack/react-query`: For server state management and caching in the frontend.
-   `drizzle-orm` & `@neondatabase/serverless`: For database interactions with PostgreSQL.
-   `passport` & `openid-client`: Core libraries for authentication.
-   `zod`: For robust runtime type validation across the stack.
-   `react-hook-form`: For efficient form state management in React.
-   `date-fns`: For date manipulation utilities.

## Development Tools

-   Replit-specific plugins: Runtime error overlay, Cartographer for code exploration, and a Dev banner.

## Image Assets

-   Static images stored in `attached_assets/generated_images`, including a hero background image for the landing page.