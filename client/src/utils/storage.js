export const getLocalStorageUsage = () => {
  try {
    let total = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      const value = localStorage.getItem(key);
      if (value) {
        total += ((value.length + key.length) * 2);
      }
    }
    return (total / 1024).toFixed(1);
  } catch (e) {
    return "0.0";
  }
};
