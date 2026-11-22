import { useEffect, useState } from 'react';

const PHONE_QUERY = '(max-width: 1023.98px)';

/** Vrai sous 1024 px : téléphone et tablette (spec §2.3). */
export function usePhone(): boolean {
  const [phone, setPhone] = useState(() => window.matchMedia(PHONE_QUERY).matches);
  useEffect(() => {
    const list = window.matchMedia(PHONE_QUERY);
    const update = () => setPhone(list.matches);
    update();
    list.addEventListener('change', update);
    return () => list.removeEventListener('change', update);
  }, []);
  return phone;
}
