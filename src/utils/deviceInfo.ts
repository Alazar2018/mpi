export interface DeviceInfo {
  deviceId: string;
  deviceName: string;
  platform: 'web' | 'ios' | 'android' | 'desktop' | 'mobile';
  userAgent: string;
  ipAddress?: string;
}

export function getDeviceInfo(): DeviceInfo {
  // Get or generate a persistent device ID
  let deviceId = localStorage.getItem('deviceId');
  if (!deviceId) {
    deviceId = generateDeviceId();
    localStorage.setItem('deviceId', deviceId);
  }

  // Get real device information
  const platform = detectPlatform();
  const deviceName = getDeviceName();
  const userAgent = navigator.userAgent;

  return {
    deviceId,
    deviceName,
    platform,
    userAgent
  };
}

// Utility function to reset device ID (useful for testing)
export function resetDeviceId(): void {
  localStorage.removeItem('deviceId');
}

// Utility function to get device ID components for debugging
export function getDeviceIdComponents(): string[] {
  return [
    navigator.userAgent,
    navigator.language,
    screen.width.toString(),
    screen.height.toString(),
    screen.colorDepth.toString(),
    new Date().getTimezoneOffset().toString(),
    (navigator as any).hardwareConcurrency?.toString() || 'unknown',
    (navigator as any).deviceMemory?.toString() || 'unknown',
    navigator.platform,
    navigator.cookieEnabled.toString(),
    navigator.doNotTrack || 'unknown'
  ];
}

function generateDeviceId(): string {
  // Create a stable device ID using consistent hardware/software characteristics
  const components = [
    navigator.userAgent,
    navigator.language,
    screen.width.toString(),
    screen.height.toString(),
    screen.colorDepth.toString(),
    new Date().getTimezoneOffset().toString(),
    (navigator as any).hardwareConcurrency?.toString() || 'unknown',
    (navigator as any).deviceMemory?.toString() || 'unknown',
    navigator.platform,
    navigator.cookieEnabled.toString(),
    navigator.doNotTrack || 'unknown'
  ];
  
  // Create a stable fingerprint without canvas (which can vary)
  const fingerprint = components.join('|');
  const hash = simpleHash(fingerprint);
  
  return `web-${hash}`;
}

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

function detectPlatform(): 'web' | 'ios' | 'android' | 'desktop' | 'mobile' {
  const userAgent = navigator.userAgent.toLowerCase();
  
  // Check for iOS devices
  if (/iphone|ipad|ipod/.test(userAgent)) {
    return 'ios';
  }
  
  // Check for Android devices
  if (/android/.test(userAgent)) {
    return 'android';
  }
  
  // Check for mobile devices
  if (/mobile|tablet|phone/.test(userAgent) || 
      /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent) ||
      window.innerWidth <= 768) {
    return 'mobile';
  }
  
  // Check for desktop operating systems
  if (/windows|macintosh|linux/.test(userAgent)) {
    return 'desktop';
  }
  
  return 'web';
}

function getDeviceName(): string {
  const userAgent = navigator.userAgent;
  
  // iOS devices
  if (/iPhone/.test(userAgent)) {
    const match = userAgent.match(/OS (\d+)_(\d+)_?(\d+)?/);
    if (match) {
      return `iPhone iOS ${match[1]}.${match[2]}`;
    }
    return 'iPhone';
  }
  
  if (/iPad/.test(userAgent)) {
    const match = userAgent.match(/OS (\d+)_(\d+)_?(\d+)?/);
    if (match) {
      return `iPad iOS ${match[1]}.${match[2]}`;
    }
    return 'iPad';
  }
  
  // Android devices
  if (/Android/.test(userAgent)) {
    const match = userAgent.match(/Android (\d+\.\d+)/);
    if (match) {
      return `Android ${match[1]}`;
    }
    return 'Android Device';
  }
  
  // Desktop operating systems
  if (/Windows/.test(userAgent)) {
    return 'Windows PC';
  }
  
  if (/Macintosh/.test(userAgent)) {
    const match = userAgent.match(/Mac OS X (\d+[._]\d+)/);
    if (match) {
      return `Mac OS ${match[1].replace('_', '.')}`;
    }
    return 'Mac';
  }
  
  if (/Linux/.test(userAgent)) {
    return 'Linux PC';
  }
  
  return 'Web Browser';
}


