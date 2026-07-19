const DEMO_MODE_STORAGE_KEY = "dalcoomi-demo-mode";

export const isDemoMode = () => {
  if (typeof window === "undefined") {
    return false;
  }

  return sessionStorage.getItem(DEMO_MODE_STORAGE_KEY) === "active";
};

export const enterDemoMode = () => {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(DEMO_MODE_STORAGE_KEY, "active");
};

export const exitDemoMode = () => {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(DEMO_MODE_STORAGE_KEY);
};
