
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Unauthorized() {
  const { user } = useAuth();
  
  // Create a display name by combining first and last name
  const displayName = user ? `${user.first_name} ${user.last_name}` : '';
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <div className="text-center p-8 bg-white rounded-lg shadow-md max-w-md">
        <div className="flex justify-center mb-4">
          <AlertTriangle className="h-16 w-16 text-yellow-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          Access Denied
        </h1>
        <p className="text-gray-600 mb-6">
          You don't have permission to access this page. This area is restricted based on your user role.
        </p>
        <div className="flex flex-col gap-2">
          <Button asChild className="bg-blue-700 hover:bg-blue-800">
            <Link to="/dashboard">
              Go to Dashboard
            </Link>
          </Button>
          {user && (
            <p className="text-sm text-gray-500 mt-2">
              You are signed in as: {displayName} ({user.role})
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
