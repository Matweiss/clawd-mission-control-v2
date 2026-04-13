import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function SarahDashboardRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/?mode=sarah');
  }, [router]);

  return null;
}
