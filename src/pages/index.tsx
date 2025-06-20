import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/customer/menu');
  }, [router]);

  return null; // No need to render anything as we're redirecting
}
