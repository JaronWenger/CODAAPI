# Coda API Integration

A React application that integrates with the Coda API to display and manage data from Coda tables.

## Features

- **Real-time Data Display**: View your Coda table data in a clean, organized format
- **Dynamic Column Updates**: 
  - Column headers automatically update when renamed in Coda
  - New columns are automatically added to the end of the table
  - Maintains a consistent column order for existing columns
- **Manual Refresh**: Use the refresh button to fetch the latest data from Coda
- **Error Handling**: Clear error messages when API calls fail
- **Dark Mode UI**: Modern, dark-themed interface using Material-UI

## Setup

1. Clone the repository
2. Create a `.env` file in the root directory with your Coda API token:
   ```
   REACT_APP_CODA_API_TOKEN=your_coda_api_token_here
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the development server:
   ```bash
   npm start
   ```

## Configuration

The application is currently configured to work with:
- Document ID: `aICF0Nr9qq` (Jaron's Coda Playground)
- Table ID: `grid-AugbPR9_CK` (Data table)

## Column Order

The application maintains a specific order for the following columns:
1. Name
2. Number
3. Text
4. Number 2
5. Text 2
6. Number 3

Any new columns added to the Coda table will automatically appear at the end of the table.

## API Integration

The application uses the following Coda API endpoints:
- `/docs/{docId}/tables/{tableId}` - Get table metadata
- `/docs/{docId}/tables/{tableId}/columns` - Get column information
- `/docs/{docId}/tables/{tableId}/rows` - Get table data

## Development

Built with:
- React
- Material-UI
- Axios for API calls

## License

MIT 