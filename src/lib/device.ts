import { STORAGE_KEYS } from './constants';

export function getDeviceId(): string {
  let deviceId = localStorage.getItem(STORAGE_KEYS.DEVICE_ID);
  
  if (!deviceId) {
    deviceId = 'dev_' + crypto.randomUUID().replace(/-/g, '').substring(0, 16);
    localStorage.setItem(STORAGE_KEYS.DEVICE_ID, deviceId);
  }
  
  return deviceId;
}

export function getSelectedLocation(): { uf: string; city: string } | null {
  const uf = localStorage.getItem(STORAGE_KEYS.SELECTED_UF);
  const city = localStorage.getItem(STORAGE_KEYS.SELECTED_CITY);
  
  if (uf && city) {
    return { uf, city };
  }
  
  return null;
}

export function setSelectedLocation(uf: string, city: string): void {
  localStorage.setItem(STORAGE_KEYS.SELECTED_UF, uf);
  localStorage.setItem(STORAGE_KEYS.SELECTED_CITY, city);
}

export function clearSelectedLocation(): void {
  localStorage.removeItem(STORAGE_KEYS.SELECTED_UF);
  localStorage.removeItem(STORAGE_KEYS.SELECTED_CITY);
}

export function isOnboardingComplete(): boolean {
  return localStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETE) === 'true';
}

export function setOnboardingComplete(): void {
  localStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETE, 'true');
}
