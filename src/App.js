import React, { useState, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Container, Typography, Paper, CircularProgress, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, Tooltip } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import ErrorIcon from '@mui/icons-material/Error';
import codaApi from './services/codaApi';
import domoApi from './services/domoApi';

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
  const [domoError, setDomoError] = useState(null);
  const [isPushingToDomo, setIsPushingToDomo] = useState(false);
  //////////////////////////////////////////CODA DOC ID////////////////////////////////////////////////////////
  const [docId] = useState('aICF0Nr9qq');
  //////https://coda.io/d/Jarons-Coda-Playground_daICF0Nr9qq/Arbitrary-Data_suspmNrM#New-Table_tu75UX0j//////////


  const fetchData = async () => {
    try {
      setLoading(true);
  ///////////////////////////////////////CODA TABLE IDS///////////////////////////////////////////////////////////
      //const tableId = 'grid-AugbPR9_CK';  //first DATA TABLE
      const tableId = 'grid-VhEQ75UX0j';  //second test
  //////Must pull table ID from Elements in DEV Tools data-object-id="grid-AugbPR9_CK"//////////////////////////

      
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

  const pushToDomo = async () => {
    try {
      setIsPushingToDomo(true);
      setDomoError(null);
      await domoApi.pushData({ rows: data.rows, columns });
    } catch (err) {
      console.error('Error pushing to Domo:', err);
      setDomoError(err.message || 'Failed to connect to Domo');
    } finally {
      setIsPushingToDomo(false);
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
        <Box display="flex" alignItems="center" gap={2} mb={2} sx={{ mt: 4 }}>
          <Typography variant="h4" sx={{
            color: '#ffffff',
            textShadow: '0 0 .2px rgba(255,255,255,0.7), 0 0 20px rgba(255,255,255,0.5)',
            fontWeight: 'bold',
            letterSpacing: '1px'
          }}>
            Coda API Data
          </Typography>
          <Button 
            variant="contained" 
            startIcon={<RefreshIcon />}
            onClick={fetchData}
          >
            Refresh
          </Button>
          <Box display="flex" alignItems="center" gap={1}>
            <Button 
              variant="contained" 
              color="secondary"
              startIcon={<CloudUploadIcon />}
              onClick={pushToDomo}
              disabled={isPushingToDomo || !data}
            >
              Push to Domo
            </Button>
            {domoError && (
              <Tooltip title={domoError}>
                <ErrorIcon color="error" />
              </Tooltip>
            )}
          </Box>
        </Box>

{/*///////////Structure block////////////////////////////////////////////////////*/}
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Structure
          </Typography>
          <Typography variant="body1">
            Document: (ID: {docId})
          </Typography>
          <Typography variant="body1" sx={{ ml: 2 }}>
            └─ Page: {data?.metadata?.parent?.name} (ID: {data?.metadata?.parent?.id})
          </Typography>
          <Typography variant="body1" sx={{ ml: 4 }}>
            └─ Table: {data?.metadata?.name} (ID: {data?.metadata?.id})
          </Typography>
        </Paper>

{/*///////////Table block////////////////////////////////////////////////////*/}
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



{/*///////////Data block////////////////////////////////////////////////////*/} 
        <Paper elevation={3} sx={{ p: 3, mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            Raw Data
          </Typography>
          <Typography variant="subtitle2" gutterBottom>
            Table Metadata
          </Typography>
          <pre style={{ 
            overflowX: 'auto', 
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word',
            maxWidth: '100%'
          }}>
            {JSON.stringify(data?.metadata, null, 2)}
          </pre>
          
          <Typography variant="subtitle2" gutterBottom sx={{ mt: 4 }}>
            Table Rows
          </Typography>
          <pre style={{ 
            overflowX: 'auto', 
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word',
            maxWidth: '100%'
          }}>
            {JSON.stringify(data?.rows, null, 2)}
          </pre>
        </Paper>
      </Container>
    </ThemeProvider>
  );
}

export default App; 