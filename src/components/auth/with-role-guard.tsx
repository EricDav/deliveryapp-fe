import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { hasRole, isAuthenticated } from '@/utils/auth';

// HOC to protect routes based on user roles
export function withRoleGuard(
  WrappedComponent: React.ComponentType,
  allowedRoles: string | string[],
  redirectTo: string = '/'
) {
  // Return a new component
  return function WithRoleGuard(props: any) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    
    useEffect(() => {
      // Check if the user is authenticated and has the required role
      if (!isAuthenticated() || !hasRole(allowedRoles)) {
        router.replace(redirectTo);
      } else {
        setIsLoading(false);
      }
    }, [router]);
    
    // Show loading indicator while checking permissions
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-screen">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="ml-2">Loading...</p>
        </div>
      );
    }
    
    // Render the wrapped component with all its props
    return <WrappedComponent {...props} />;
  };
} 