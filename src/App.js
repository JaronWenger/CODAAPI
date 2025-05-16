import React, { useState, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Container, Typography, Paper, CircularProgress, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import codaApi from './services/codaApi';

const theme = createTheme({
  palette: {
    mode: 'dark',
  },
});

function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [columns, setColumns] = useState([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const docId = 'aICF0Nr9qq';
      const tableId = 'grid-AugbPR9_CK';
      
      const [tableMetadata, columnMetadata, rows] = await Promise.all([
        codaApi.getTableMetadata(docId, tableId),
        codaApi.getColumnMetadata(docId, tableId),
        codaApi.getTableRows(docId, tableId)
      ]);

      // Define the known column order
      const knownColumnOrder = [
        'c-tPm_VB9vIS', // Name
        'c-ALBQZX2Wa9', // Number
        'c-eXa5blRRhA', // Text
        'c-wU3aA-DtG1', // Number 2
        'c-EFovGRleen', // Text 2
        'c-7A2xbfGGmf'  // Number 3
      ];

      // Get all columns
      const allColumns = columnMetadata.items || [];
      
      // Sort columns: known columns first in specified order, then any new columns
      const sortedColumns = [
        // First add known columns in the specified order
        ...knownColumnOrder
          .map(id => allColumns.find(col => col.id === id))
          .filter(Boolean),
        // Then add any new columns that aren't in the known order
        ...allColumns.filter(col => !knownColumnOrder.includes(col.id))
      ];

      setColumns(sortedColumns);
      setData({ metadata: tableMetadata, rows: rows });
      setLoading(false);
    } catch (err) {
      console.error('Error details:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <Container>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
            <CircularProgress />
          </Box>
        </Container>
      </ThemeProvider>
    );
  }

  if (error) {
    return (
      <ThemeProvider theme={theme}>
        <Container>
          <Typography color="error" variant="h6">
            Error: {error}
          </Typography>
        </Container>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <Container>
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <Typography variant="h4">
            Coda API Data
          </Typography>
          <Button 
            variant="contained" 
            startIcon={<RefreshIcon />}
            onClick={fetchData}
          >
            Refresh
          </Button>
        </Box>
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Structure
          </Typography>
          <Typography variant="body1">
            Document: Jaron's Coda Playground (ID: aICF0Nr9qq)
          </Typography>
          <Typography variant="body1" sx={{ ml: 2 }}>
            └─ Page: DOMO DATA (ID: canvas-ZhoXyCGPLH)
          </Typography>
          <Typography variant="body1" sx={{ ml: 4 }}>
            └─ Table: Data (ID: grid-AugbPR9_CK)
          </Typography>
        </Paper>
        <Paper elevation={3} sx={{ p: 3, mt: 2 }}>
          <Typography variant="h6" gutterBottom>
            Table: {data?.metadata?.name}
          </Typography>
          <Typography variant="subtitle2" gutterBottom>
            Page: {data?.metadata?.parent?.name}
          </Typography>
          
          <TableContainer component={Paper} sx={{ mt: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  {columns.map((column) => (
                    <TableCell key={column.id}>
                      {column.name}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {data?.rows?.items
                  ?.sort((a, b) => a.index - b.index)
                  .map((row) => (
                    <TableRow key={row.id}>
                      {columns.map((column) => (
                        <TableCell key={column.id}>
                          {row.values[column.id]}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        <Paper elevation={3} sx={{ p: 3, mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            Raw Data
          </Typography>
          <Typography variant="subtitle2" gutterBottom>
            Table Metadata
          </Typography>
          <pre>
            {JSON.stringify(data?.metadata, null, 2)}
          </pre>
          
          <Typography variant="subtitle2" gutterBottom sx={{ mt: 4 }}>
            Table Rows
          </Typography>
          <pre>
            {JSON.stringify(data?.rows, null, 2)}
          </pre>
        </Paper>
      </Container>
    </ThemeProvider>
  );
}

export default App; 