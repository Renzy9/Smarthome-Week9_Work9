import { useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Preferences = { darkMode: boolean; autoRefresh: boolean; fahrenheit: boolean; homeName: string };
const defaults: Preferences = { darkMode: false, autoRefresh: true, fahrenheit: false, homeName: 'My home' };
// Retain the existing storage key so rebranding does not reset saved settings.
const preferenceKey = 'orpia.preferences';

function restorePreferences(raw: string): Preferences {
  const stored = JSON.parse(raw);
  return {
    darkMode: stored.darkMode === true,
    autoRefresh: stored.autoRefresh !== false,
    fahrenheit: stored.fahrenheit === true,
    homeName: typeof stored.homeName === 'string' && stored.homeName.trim() ? stored.homeName.slice(0, 40) : defaults.homeName,
  };
}

export function useHomePreferences() {
  const [preferences, setPreferences] = useState(defaults);
  const [ready, setReady] = useState(false);
  const [preferenceError, setPreferenceError] = useState<string | null>(null);
  const saveQueue = useRef(Promise.resolve());

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(preferenceKey).then(raw => {
      if (mounted && raw) setPreferences(restorePreferences(raw));
    }).catch(() => { if (mounted) setPreferenceError('Saved preferences could not be loaded.'); })
      .finally(() => { if (mounted) setReady(true); });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!ready) return;
    saveQueue.current = saveQueue.current.then(() => AsyncStorage.setItem(preferenceKey, JSON.stringify(preferences)))
      .then(() => setPreferenceError(null)).catch(() => setPreferenceError('Preferences could not be saved on this device.'));
  }, [preferences, ready]);

  const updatePreferences = (patch: Partial<Preferences>) => setPreferences(current => ({ ...current, ...patch }));
  return { preferences, updatePreferences, ready, preferenceError };
}
