///<reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

declare global {
    interface Navigator {
      /** Web Bluetooth API */
      bluetooth: {
        /** Request a BLE device by filters */
        requestDevice(
          options: RequestDeviceOptions
        ): Promise<BluetoothDevice>;
      };
    }
  
    interface RequestDeviceOptions {
      filters?: Array<{
        services?: Array<string>;
        name?: string;
        namePrefix?: string;
      }>;
      optionalServices?: Array<string>;
      acceptAllDevices?: boolean;
    }
  }

declare module 'virtual:pwa-register' {
  export interface RegisterSWOptions {
    immediate?: boolean;
    onNeedRefresh?: () => void;
    onOfflineReady?: () => void;
  }
  export function registerSW(options?: RegisterSWOptions): () => void;
}
  
  // this empty export makes the file a module and applies the above globally
  export {};
  