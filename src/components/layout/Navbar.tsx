
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, User } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  
  // Create a display name by combining first and last name
  const displayName = user ? `${user.first_name} ${user.last_name}` : '';
  
  return (
    <header className="bg-blue-700 text-white shadow-md">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div>
          <Link to="/dashboard" className="text-xl font-bold">
            Bharat Dairy
          </Link>
        </div>
        
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center space-x-2 focus:outline-none"
          >
            <div className="bg-blue-800 p-2 rounded-full">
              <User className="h-5 w-5" />
            </div>
            <span>{displayName}</span>
          </button>
          
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
              <Link
                to="/profile"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => setShowDropdown(false)}
              >
                Profile
              </Link>
              <button
                onClick={() => {
                  logout();
                  setShowDropdown(false);
                }}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <div className="flex items-center">
                  <LogOut className="h-4 w-4 mr-2" />
                  <span>Sign out</span>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
