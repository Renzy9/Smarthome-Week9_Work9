import { useIoT } from '../context/IoTContext';

const palettes = {
  light: {
    bg: '#FFFFFF', card: '#FFFFFF', text: '#000000', muted: '#000000',
    border: '#DDDDDD', accent: '#000000', tint: '#F5F5F5', danger: '#000000',
    onAccent: '#FFFFFF', hero: '#FFFFFF', heroText: '#000000', heroMuted: '#000000', success: '#000000',
  },
  dark: {
    bg: '#121212', card: '#1C1C1C', text: '#FFFFFF', muted: '#FFFFFF',
    border: '#444444', accent: '#FFFFFF', tint: '#292929', danger: '#FFFFFF',
    onAccent: '#000000', hero: '#1C1C1C', heroText: '#FFFFFF', heroMuted: '#FFFFFF', success: '#FFFFFF',
  },
};

export function usePalette() {
  return palettes[useIoT().preferences.darkMode ? 'dark' : 'light'];
}
