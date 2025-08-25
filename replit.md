# Store Rating Platform

## Overview

This is a full-stack web application for a store rating platform that allows users to discover, rate, and review stores. The platform supports three user roles: normal users who can browse and rate stores, store owners who can manage their stores and view ratings, and system administrators who have comprehensive management capabilities over users, stores, and ratings.

The application features a modern, responsive design with role-based access control, comprehensive search and filtering capabilities, and real-time statistics dashboards. Users can create accounts as either regular users or store owners, with store owners automatically getting a store created upon registration.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The frontend is built with React and TypeScript, using a component-based architecture with modern UI patterns. The application uses Wouter for client-side routing and TanStack Query for efficient data fetching and caching. The UI is built with shadcn/ui components on top of Radix UI primitives, styled with Tailwind CSS for a consistent, professional design system.

Key architectural decisions:
- **Component Structure**: Organized into pages, components, and UI components with clear separation of concerns
- **State Management**: React Hook Form for form state, TanStack Query for server state, and local storage for authentication
- **Styling**: Tailwind CSS with CSS custom properties for theming and responsive design
- **Type Safety**: Full TypeScript implementation with shared types between frontend and backend

### Backend Architecture
The backend follows a RESTful API design using Express.js with TypeScript. The architecture separates concerns through dedicated layers: routes for API endpoints, middleware for cross-cutting concerns like authentication, and a storage layer that abstracts database operations.

Key architectural patterns:
- **Route Organization**: Centralized route registration with clear separation by feature
- **Middleware Chain**: JWT-based authentication with role-based access control
- **Storage Abstraction**: Interface-based storage layer allowing for easy database switching
- **Error Handling**: Centralized error handling with proper HTTP status codes

### Authentication & Authorization
The system implements JWT-based authentication with role-based access control. Passwords are hashed using bcrypt, and tokens are stored in localStorage on the client side. The middleware chain validates tokens and enforces role-based permissions for protected routes.

Authentication flow:
- **Registration**: User signs up with role selection (user or store_owner)
- **Login**: Credentials validated, JWT token issued
- **Authorization**: Middleware validates tokens and checks role permissions
- **Security**: Password hashing, token expiration, and role-based route protection

### Database Design
The application uses PostgreSQL with Drizzle ORM for type-safe database operations. The schema includes three main entities: users, stores, and ratings, with proper foreign key relationships and cascading deletes.

Database architecture:
- **Users Table**: Stores user information with role-based access control
- **Stores Table**: Store information linked to store owner users
- **Ratings Table**: Junction table linking users to stores with rating values
- **Relations**: Proper foreign keys with cascade deletes for data integrity

### Form Validation & Data Flow
The application implements comprehensive validation using Zod schemas shared between frontend and backend. Forms use React Hook Form with Zod resolvers for client-side validation, while the backend validates all incoming data using the same schemas.

Validation strategy:
- **Shared Schemas**: Common validation rules between client and server
- **Client Validation**: Real-time form validation with user-friendly error messages
- **Server Validation**: Backend validation as the source of truth
- **Type Safety**: Full type inference from validation schemas

## External Dependencies

### Database & ORM
- **Neon Database**: PostgreSQL database hosting with serverless capabilities
- **Drizzle ORM**: Type-safe database operations with PostgreSQL dialect
- **Connection Pooling**: Neon serverless connection pooling for efficient database access

### UI & Styling
- **Tailwind CSS**: Utility-first CSS framework for rapid UI development
- **Radix UI**: Unstyled, accessible UI components as foundation
- **shadcn/ui**: Pre-built component library with consistent design system
- **Lucide Icons**: Consistent iconography throughout the application

### Authentication & Security
- **JSON Web Tokens**: Stateless authentication with configurable expiration
- **bcrypt**: Secure password hashing with salt rounds
- **Role-based Access Control**: Granular permissions based on user roles

### Development & Build Tools
- **Vite**: Fast development server and build tool with hot module replacement
- **TypeScript**: Type safety across the entire application stack
- **ESBuild**: Fast bundling for production builds
- **React Hook Form**: Efficient form handling with minimal re-renders

### Data Fetching & State Management
- **TanStack Query**: Powerful data fetching, caching, and synchronization
- **Wouter**: Lightweight client-side routing for single-page application
- **Zod**: Runtime type validation and schema parsing