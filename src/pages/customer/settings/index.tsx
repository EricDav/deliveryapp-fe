import React, { useState } from 'react';
import { useRouter } from 'next/router';
import CustomerLayout from '../../../components/customer-layout';
import { LoginModal } from '../../../components/auth/LoginModal';

const SettingsPage: React.FC = () => {
  const router = useRouter();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [error, setError] = useState('');

  if (error && error.toLowerCase().includes('log in')) {
    return (
      <CustomerLayout>
        <div className="max-w-xl mx-auto mt-32 bg-white rounded-2xl shadow-lg p-10 text-center">
          <h2 className="text-2xl font-bold mb-2">Sign In Required</h2>
          <p className="text-gray-500 mb-6">Please log in to view your settings.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              className="bg-[#B2151B] text-white px-6 py-2 rounded-md text-lg"
              onClick={() => setShowLoginModal(true)}
            >
              Login
            </button>
            <button
              className="bg-gray-200 text-gray-700 px-6 py-2 rounded-md text-lg"
              onClick={() => router.push('/customer/menu')}
            >
              Back to Menu
            </button>
          </div>
        </div>
        {/* Login Modal */}
        <LoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          onSuccess={() => window.location.reload()}
          onSignupClick={() => {}}
        />
      </CustomerLayout>
    );
  }

  return (
    <div>
      {/* Rest of the component code */}
    </div>
  );
};

export default SettingsPage; 