// utils/apiUtils.js
export const getAuthToken = () => {
  return localStorage.getItem('token');
};

export const createAuthHeaders = (customHeaders = {}) => {
  const token = getAuthToken();
  const headers = { ...customHeaders };

  // Always add Authorization header if token exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Don't set Content-Type for FormData - browser sets it with boundary
  // Only set Content-Type for JSON requests
  if (!(customHeaders.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  return headers;
};

export const authFetch = async (url, options = {}) => {
  const headers = createAuthHeaders(options.headers);
  
  const config = {
    ...options,
    headers
  };

  // Log for debugging
  //console.log('AuthFetch Request:', {
    url,
    method: options.method || 'GET',
    headers: headers,
    hasBody: !!options.body
  });

  try {
    const response = await fetch(url, config);
    return response;
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      throw new Error('Network error. Please check your internet connection.');
    }
    throw error;
  }
};

export const handleResponse = async (response) => {
  const contentType = response.headers.get('content-type');
  const isJSON = contentType?.includes('application/json');

  let data;
  if (isJSON) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const error = new Error(data?.message || data?.error || `Request failed with status ${response.status}`);
    error.status = response.status;
    error.data = data;
    
    if (response.status === 401) {
      error.type = 'UNAUTHORIZED';
      // Clear invalid token
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // You might want to redirect to login here
      window.location.href = '/login';
    } else if (response.status === 403) {
      error.type = 'FORBIDDEN';
    } else if (response.status === 404) {
      error.type = 'NOT_FOUND';
    } else if (response.status >= 500) {
      error.type = 'SERVER_ERROR';
    }
    
    throw error;
  }

  // Extract result from response structure
  if (data?.result !== undefined) {
    return data.result;
  } else if (data?.data !== undefined) {
    return data.data;
  }
  
  return data;
};

export const createFormData = (data, files = [], fileFields = []) => {
  const formData = new FormData();

  // Add regular fields
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      formData.append(key, value.toString());
    }
  });

  // Add files
  if (files && files.length > 0) {
    files.forEach((file) => {
      if (file instanceof File) {
        formData.append('photos', file);
      }
    });
  }

  return formData;
};

export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    return dateString;
  }
};

export const formatTime = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return dateString;
  }
};

export const getStatusColor = (status) => {
  const colors = {
    present: '#4caf50',
    absent: '#f44336',
    late: '#ff9800',
    holiday: '#2196f3',
    leave: '#9c27b0',
    'half-day': '#ff9800'
  };
  return colors[status?.toLowerCase()] || '#757575';
};