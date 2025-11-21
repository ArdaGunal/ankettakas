const getApiUrl = () => {
  if (typeof window !== 'undefined') {
    if (window.location.hostname === 'localhost') {
      return 'http://localhost:5000/api';
    }
    return `http://${window.location.hostname}:5000/api`;
  }
  return 'http://localhost:5000/api';
};

export const API_URL = getApiUrl();