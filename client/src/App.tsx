import { Switch, Route, Redirect } from "wouter";
import { useState, useEffect, createContext, useContext } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { isAuthenticated, hasRole, getCurrentUser } from "@/lib/auth";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Signup from "@/pages/signup";
import AdminDashboard from "@/pages/admin-dashboard";
import UserDashboard from "@/pages/user-dashboard";
import OwnerDashboard from "@/pages/owner-dashboard";
import Profile from "@/pages/profile";
import Navbar from "@/components/navbar";

// Auth Context for global authentication state management
interface AuthContextType {
  isAuthenticated: boolean;
  currentUser: any;
  refreshAuth: () => void;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  currentUser: null,
  refreshAuth: () => {},
});

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState(() => ({
    isAuthenticated: isAuthenticated(),
    currentUser: getCurrentUser(),
  }));

  const refreshAuth = () => {
    const newAuthState = {
      isAuthenticated: isAuthenticated(),
      currentUser: getCurrentUser(),
    };
    console.log("Auth state refreshed:", newAuthState);
    setAuthState(newAuthState);
  };

  useEffect(() => {
    // Listen for storage changes (login/logout events)
    const handleStorageChange = () => {
      refreshAuth();
    };

    // Listen for custom auth events
    const handleAuthChange = () => {
      refreshAuth();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('authchange', handleAuthChange);
    
    // Check auth state periodically
    const interval = setInterval(refreshAuth, 2000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('authchange', handleAuthChange);
      clearInterval(interval);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ ...authState, refreshAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

function useAuth() {
  return useContext(AuthContext);
}

function ProtectedRoute({ 
  component: Component, 
  roles 
}: { 
  component: React.ComponentType; 
  roles?: string[];
}) {
  const { isAuthenticated: authenticated, currentUser } = useAuth();
  
  console.log("ProtectedRoute check:", { 
    authenticated, 
    roles, 
    currentUser,
    hasRequiredRole: roles ? roles.some(role => hasRole(role)) : true
  });

  if (!authenticated) {
    console.log("Not authenticated, redirecting to login");
    return <Redirect to="/login" />;
  }

  if (roles && !roles.some(role => hasRole(role))) {
    console.log("Role not authorized, redirecting to unauthorized");
    return <Redirect to="/unauthorized" />;
  }

  return <Component />;
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated: authenticated, currentUser } = useAuth();
  
  console.log("AuthGuard check:", { authenticated, currentUser });
  
  return <>{children}</>;
}

function Router() {
  const { isAuthenticated: authenticated, currentUser } = useAuth();

  console.log("Router render:", { authenticated, currentUser, role: currentUser?.role });

  return (
    <Switch>
      {/* Public Routes */}
      <Route path="/login">
        {authenticated ? (
          // If already authenticated, redirect based on role
          currentUser?.role === 'admin' ? <Redirect to="/admin" /> :
          currentUser?.role === 'store_owner' ? <Redirect to="/owner" /> :
          <Redirect to="/stores" />
        ) : (
          <Login />
        )}
      </Route>
      
      <Route path="/signup">
        {authenticated ? (
          // If already authenticated, redirect based on role
          currentUser?.role === 'admin' ? <Redirect to="/admin" /> :
          currentUser?.role === 'store_owner' ? <Redirect to="/owner" /> :
          <Redirect to="/stores" />
        ) : (
          <Signup />
        )}
      </Route>
      
      {/* Root Route - Redirect based on authentication and role */}
      <Route path="/">
        {authenticated ? (
          currentUser?.role === 'admin' ? <Redirect to="/admin" /> :
          currentUser?.role === 'store_owner' ? <Redirect to="/owner" /> :
          <Redirect to="/stores" />
        ) : (
          <Redirect to="/login" />
        )}
      </Route>
      
      {/* Protected Admin Routes */}
      <Route path="/admin">
        <ProtectedRoute component={AdminDashboard} roles={['admin']} />
      </Route>
      
      {/* Protected User Routes */}
      <Route path="/stores">
        <ProtectedRoute component={UserDashboard} roles={['user']} />
      </Route>
      
      {/* Protected Store Owner Routes */}
      <Route path="/owner">
        <ProtectedRoute component={OwnerDashboard} roles={['store_owner']} />
      </Route>
      
      {/* Profile Route - Available to all authenticated users */}
      <Route path="/profile">
        <ProtectedRoute component={Profile} />
      </Route>
      
      {/* Unauthorized Page */}
      <Route path="/unauthorized">
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
            <p className="text-gray-600 mt-2">You don't have permission to access this page.</p>
          </div>
        </div>
      </Route>
      
      {/* 404 Not Found */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <AuthGuard>
            <div className="min-h-screen bg-gray-50">
              {isAuthenticated() && <Navbar />}
              <Router />
            </div>
          </AuthGuard>
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;