import axios from 'axios';

const CODA_API_BASE_URL = 'https://coda.io/apis/v1';

// Debug: Log the token (first few characters only)
const token = process.env.REACT_APP_CODA_API_TOKEN;
console.log('Token available:', token ? 'Yes' : 'No');
console.log('Token first 4 chars:', token ? token.substring(0, 4) : 'None');

// Test function to verify API access
const testApiAccess = async () => {
  try {
    const response = await axios.get(
      `${CODA_API_BASE_URL}/whoami`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
    console.log('API Test Response:', response.data);
    return response.data;
  } catch (error) {
    console.error('API Test Error:', error.response?.data || error.message);
    throw error;
  }
};

// List accessible documents
const listDocuments = async () => {
  try {
    const response = await axios.get(
      `${CODA_API_BASE_URL}/docs`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
    console.log('Accessible Documents:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error listing documents:', error.response?.data || error.message);
    throw error;
  }
};

// List all tables in a document
const listTables = async (docId) => {
  try {
    const response = await axios.get(
      `${CODA_API_BASE_URL}/docs/${docId}/tables`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
    console.log('Document Tables:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error listing tables:', error.response?.data || error.message);
    throw error;
  }
};

const codaApi = {
  // Test API access
  testAccess: testApiAccess,
  
  // List accessible documents
  listDocs: listDocuments,

  // List tables in a document
  listTables: listTables,

  // Get all rows from a table
  getTableRows: async (docId, tableId) => {
    try {
      if (!token) {
        throw new Error('API token is missing. Please check your .env file.');
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };
      
      console.log('Making request to:', `${CODA_API_BASE_URL}/docs/${docId}/tables/${tableId}/rows`);
      console.log('With headers:', { ...headers, Authorization: 'Bearer [REDACTED]' });

      const response = await axios.get(
        `${CODA_API_BASE_URL}/docs/${docId}/tables/${tableId}/rows`,
        { headers }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching table rows:', error.response?.data || error.message);
      throw error;
    }
  },

  // Get a specific row
  getRow: async (docId, tableId, rowId) => {
    try {
      if (!token) {
        throw new Error('API token is missing. Please check your .env file.');
      }

      const response = await axios.get(
        `${CODA_API_BASE_URL}/docs/${docId}/tables/${tableId}/rows/${rowId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching row:', error.response?.data || error.message);
      throw error;
    }
  },

  // Get table metadata
  getTableMetadata: async (docId, tableId) => {
    try {
      if (!token) {
        throw new Error('API token is missing. Please check your .env file.');
      }

      const response = await axios.get(
        `${CODA_API_BASE_URL}/docs/${docId}/tables/${tableId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching table metadata:', error.response?.data || error.message);
      throw error;
    }
  },

  // Get column metadata
  getColumnMetadata: async (docId, tableId) => {
    try {
      if (!token) {
        throw new Error('API token is missing. Please check your .env file.');
      }

      const response = await axios.get(
        `${CODA_API_BASE_URL}/docs/${docId}/tables/${tableId}/columns`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching column metadata:', error.response?.data || error.message);
      throw error;
    }
  }
};

export default codaApi; 