import { useRegisterSW } from "virtual:pwa-register/react";

interface AppUpdateState {
  isUpdateAvailable: boolean;
  applyUpdate: () => void;
}

export function useAppUpdate(): AppUpdateState {
  const { needRefresh, updateServiceWorker } = useRegisterSW();

  const isUpdateAvailable = needRefresh[0];

  const applyUpdate = () => {
    if (isUpdateAvailable) {
      updateServiceWorker(true);
    } else {
      window.location.reload();
    }
  };

  return {
    isUpdateAvailable,
    applyUpdate,
  };
}
