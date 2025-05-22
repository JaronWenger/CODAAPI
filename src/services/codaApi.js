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
    // Add browserUrl to each document
    const docsWithUrls = response.data.items.map(doc => ({
      ...doc,
      browserUrl: `https://coda.io/d/${doc.id}`
    }));
    return { ...response.data, items: docsWithUrls };
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
  },

  // Get all pages in a document
  getPages: async (docId) => {
    try {
      // First get all pages
      const pagesResponse = await axios.get(`${CODA_API_BASE_URL}/docs/${docId}/pages`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      // Then get all tables in the document
      const tablesResponse = await axios.get(`${CODA_API_BASE_URL}/docs/${docId}/tables`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      // Get table metadata to associate tables with pages
      const tablesWithMetadata = await Promise.all(
        tablesResponse.data.items.map(async (table) => {
          try {
            const metadata = await axios.get(
              `${CODA_API_BASE_URL}/docs/${docId}/tables/${table.id}`,
              {
                headers: {
                  'Authorization': `Bearer ${token}`,
                }
              }
            );
            return {
              ...table,
              parent: metadata.data.parent
            };
          } catch (error) {
            console.error(`Error fetching metadata for table ${table.id}:`, error);
            return table;
          }
        })
      );

      // Associate tables with their pages
      const pagesWithTables = pagesResponse.data.items.map(page => ({
        ...page,
        tables: tablesWithMetadata.filter(table => table.parent?.id === page.id)
      }));

      return {
        ...pagesResponse.data,
        items: pagesWithTables
      };
    } catch (error) {
      console.error('Error fetching pages:', error);
      throw error;
    }
  },

  updateCell: async (docId, tableId, rowId, columnId, value) => {
    try {
      const response = await axios.put(
        `${CODA_API_BASE_URL}/docs/${docId}/tables/${tableId}/rows/${rowId}`,
        { 
          row: {
            cells: [{
              column: columnId,
              value: value
            }]
          }
        },
        { 
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          } 
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error updating cell:', error);
      throw error;
    }
  }
};

export default codaApi; 