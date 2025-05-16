import axios from 'axios';

const DOMO_API_BASE_URL = 'https://api.domo.com/v1';

// Get Domo credentials from environment variables
const clientId = process.env.REACT_APP_DOMO_CLIENT_ID;
const clientSecret = process.env.REACT_APP_DOMO_CLIENT_SECRET;
const datasetId = process.env.REACT_APP_DOMO_DATASET_ID;

// Function to get Domo access token
const getAccessToken = async () => {
  try {
    const response = await axios.post(
      'https://api.domo.com/oauth/token',
      {
        grant_type: 'client_credentials',
        scope: 'data'
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`
        }
      }
    );
    return response.data.access_token;
  } catch (error) {
    console.error('Error getting Domo access token:', error.response?.data || error.message);
    throw error;
  }
};

const domoApi = {
  // Push data to Domo dataset
  pushData: async (data) => {
    try {
      if (!clientId || !clientSecret || !datasetId) {
        throw new Error('Domo credentials are missing. Please check your .env file.');
      }

      const accessToken = await getAccessToken();

      // Format data for Domo
      const formattedData = data.rows.items.map(row => {
        const formattedRow = {};
        data.columns.forEach(column => {
          formattedRow[column.name] = row.values[column.id];
        });
        return formattedRow;
      });

      // Push data to Domo
      const response = await axios.put(
        `${DOMO_API_BASE_URL}/datasets/${datasetId}/data`,
        formattedData,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error pushing data to Domo:', error.response?.data || error.message);
      throw error;
    }
  }
};

export default domoApi; 