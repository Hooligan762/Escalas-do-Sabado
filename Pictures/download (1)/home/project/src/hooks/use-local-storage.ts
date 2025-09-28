import { useState, useEffect } from 'react';

export const useLocalStorage = <T,>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] => {
  const [isMounted, setIsMounted] = useState(false);
  
  // Initialize state with initialValue. This will be used for the server-side render.
  const [value, setValue] = useState<T>(initialValue);

  // On the first render on the client (after mount), load the data from localStorage.
  // This avoids hydration mismatch because the server and the initial client render will both use `initialValue`.
  useEffect(() => {
    setIsMounted(true);
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        setValue(JSON.parse(item));
      }
    } catch (error) {
      console.error(`Error reading localStorage key “${key}”:`, error);
      // If there's an error, we stick with the initialValue
    }
  }, [key]);


  // Effect to save the value to localStorage whenever it changes, but only after mount.
  useEffect(() => {
    if (isMounted) {
       try {
        window.localStorage.setItem(key, JSON.stringify(value));
      } catch (e) {
        console.error(`Failed to set item in localStorage for key "${key}"`, e);
      }
    }
  }, [key, value, isMounted]);

  // During SSR and initial client render, return initialValue.
  // After mounting, return the actual value from state.
  // This might seem redundant with the above, but it's an extra guard.
  const displayValue = isMounted ? value : initialValue;

  return [displayValue, setValue];
};
