import { Link, useLocation } from "wouter";
import { getCurrentUser, logout, hasRole } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, LogOut } from "lucide-react";

export default function Navbar() {
  const [location] = useLocation();
  const user = getCurrentUser();

  if (!user) return null;

  const getNavLinks = () => {
    if (hasRole('admin')) {
      return [
        { href: '/admin', label: 'Dashboard', active: location === '/admin' },
        { href: '/admin/users', label: 'Users', active: location === '/admin/users' },
        { href: '/admin/stores', label: 'Stores', active: location === '/admin/stores' },
      ];
    } else if (hasRole('store_owner')) {
      return [
        { href: '/owner', label: 'My Store', active: location === '/owner' },
      ];
    } else {
      return [
        { href: '/stores', label: 'Browse Stores', active: location === '/stores' },
        { href: '/profile', label: 'My Profile', active: location === '/profile' },
      ];
    }
  };

  const navLinks = getNavLinks();

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200" data-testid="navbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h1 className="text-xl font-bold text-gray-900">StoreRate</h1>
            </div>
            <div className="hidden md:ml-8 md:flex md:space-x-8">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href}>
                  <button
                    className={`px-3 py-2 text-sm font-medium transition-colors ${
                      link.active
                        ? 'text-primary border-b-2 border-primary'
                        : 'text-gray-500 hover:text-primary'
                    }`}
                    data-testid={`nav-link-${link.label.toLowerCase().replace(' ', '-')}`}
                  >
                    {link.label}
                  </button>
                </Link>
              ))}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-700" data-testid="user-name">
              {user.name}
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 rounded-full p-0" data-testid="user-menu-button">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="flex items-center w-full" data-testid="menu-profile">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={logout} className="flex items-center" data-testid="menu-logout">
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}
