'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function PaystackRedirect() {
  const router = useRouter();

  useEffect(() => {
    if (router.isReady && (router.query.trxref || router.query.reference)) {
      const params = new URLSearchParams();
      if (router.query.trxref) params.append('trxref', router.query.trxref as string);
      if (router.query.reference) params.append('reference', router.query.reference as string);
      
      // Redirect to the customer orders page with the Paystack parameters
      router.replace(`/customer/orders?${params.toString()}`);
    }
  }, [router.isReady, router.query]);

  return null; // No need to render anything as we're redirecting
} 