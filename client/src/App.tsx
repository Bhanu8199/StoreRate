import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { isAuthenticated, hasRole } from "@/lib/auth";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Signup from "@/pages/signup";
import AdminDashboard from "@/pages/admin-dashboard";
import UserDashboard from "@/pages/user-dashboard";
import OwnerDashboard from "@/pages/owner-dashboard";
import Profile from "@/pages/profile";
import Navbar from "@/components/navbar";

function ProtectedRoute({ 
  component: Component, 
  roles 
}: { 
  component: React.ComponentType; 
  roles?: string[];
}) {
  if (!isAuthenticated()) {
    return <Redirect to="/login" />;
  }

  if (roles && !roles.some(role => hasRole(role))) {
    return <Redirect to="/unauthorized" />;
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      
      <Route path="/">
        {isAuthenticated() ? (
          hasRole('admin') ? <Redirect to="/admin" /> :
          hasRole('store_owner') ? <Redirect to="/owner" /> :
          <Redirect to="/stores" />
        ) : (
          <Redirect to="/login" />
        )}
      </Route>
      
      <Route path="/admin">
        <ProtectedRoute component={AdminDashboard} roles={['admin']} />
      </Route>
      
      <Route path="/stores">
        <ProtectedRoute component={UserDashboard} roles={['user']} />
      </Route>
      
      <Route path="/owner">
        <ProtectedRoute component={OwnerDashboard} roles={['store_owner']} />
      </Route>
      
      <Route path="/profile">
        <ProtectedRoute component={Profile} />
      </Route>
      
      <Route path="/unauthorized">
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
            <p className="text-gray-600 mt-2">You don't have permission to access this page.</p>
          </div>
        </div>
      </Route>
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-gray-50">
          {isAuthenticated() && <Navbar />}
          <Router />
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
