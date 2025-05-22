import React, { useState, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Container, Typography, Paper, CircularProgress, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, Tooltip, TextField } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import ErrorIcon from '@mui/icons-material/Error';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
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
  const [pages, setPages] = useState([]);
  const [selectedTableId, setSelectedTableId] = useState('grid-AugbPR9_CK');
  const [isStructureExpanded, setIsStructureExpanded] = useState(false);
  const [docId, setDocId] = useState('aICF0Nr9qq');
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [isDocumentsExpanded, setIsDocumentsExpanded] = useState(false);
  //////https://coda.io/d/Jarons-Coda-Playground_daICF0Nr9qq/Arbitrary-Data_suspmNrM#New-Table_tu75UX0j//////////

  const fetchDocuments = async () => {
    try {
      const docsData = await codaApi.listDocs();
      console.log('Documents data:', docsData);
      setDocuments(docsData.items || []);
    } catch (err) {
      console.error('Error fetching documents:', err);
    }
  };

  const fetchPages = async () => {
    try {
      const pagesData = await codaApi.getPages(docId);
      console.log('Pages data:', pagesData);
      setPages(pagesData.items || []);
    } catch (err) {
      console.error('Error fetching pages:', err);
    }
  };

  const fetchData = async (tableId = selectedTableId, currentDocId = docId) => {
    try {
      setLoading(true);
      const [tableMetadata, columnMetadata, rows] = await Promise.all([
        codaApi.getTableMetadata(currentDocId, tableId),
        codaApi.getColumnMetadata(currentDocId, tableId),
        codaApi.getTableRows(currentDocId, tableId)
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
        ...knownColumnOrder
          .map(id => allColumns.find(col => col.id === id))
          .filter(Boolean),
        ...allColumns.filter(col => !knownColumnOrder.includes(col.id))
      ];

      setColumns(sortedColumns);
      setData({ metadata: tableMetadata, rows: rows });
      setLoading(false);
    } catch (err) {
      console.error('Error details:', err);
      setError(err.message);
      setLoading(false);
      // Clear data on error
      setData(null);
      setColumns([]);
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
    fetchDocuments();
    fetchPages();
    fetchData();
    setIsStructureExpanded(false);
  }, []);

  const handleDocumentSelect = async (newDocId) => {
    // Clear current data and show loading state
    setData(null);
    setColumns([]);
    setSelectedTableId(null);
    setLoading(true);
    setError(null);
    
    // Update document
    setDocId(newDocId);
    setIsDocumentsExpanded(false);
    
    try {
      // Get pages and find the first table
      const pagesData = await codaApi.getPages(newDocId);
      setPages(pagesData.items || []);
      
      // Find the first available table
      const firstPageWithTable = pagesData.items?.find(page => page.tables?.length > 0);
      if (firstPageWithTable?.tables?.[0]) {
        const firstTable = firstPageWithTable.tables[0];
        setSelectedTableId(firstTable.id);
        await fetchData(firstTable.id, newDocId);
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error loading document:', error);
      setError('Error loading document. Please try again.');
      setLoading(false);
    }
  };

  const handleTableClick = (tableId) => {
    setSelectedTableId(tableId);
    setIsStructureExpanded(false);
    fetchData(tableId);
  };

  const handleCellDoubleClick = (rowId, columnId, value) => {
    setEditingCell({ rowId, columnId });
    setEditValue(value);
  };

  const handleCellEdit = async (newValue) => {
    if (!editingCell) return;
    
    try {
      // Update local state immediately
      setData(prevData => ({
        ...prevData,
        rows: {
          ...prevData.rows,
          items: prevData.rows.items.map(row => 
            row.id === editingCell.rowId 
              ? {
                  ...row,
                  values: {
                    ...row.values,
                    [editingCell.columnId]: newValue
                  }
                }
              : row
          )
        }
      }));
      
      // Then update the API in the background
      await codaApi.updateCell(docId, selectedTableId, editingCell.rowId, editingCell.columnId, newValue);
    } catch (error) {
      console.error('Error updating cell:', error);
    } finally {
      setEditingCell(null);
    }
  };

  const EditableCell = ({ row, column, value }) => {
    const isEditing = editingCell?.rowId === row.id && editingCell?.columnId === column.id;
    const isLongText = value && value.length > 30;

    if (isEditing) {
      return (
        <Box sx={{ position: 'relative', height: '24px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
          <Box sx={{ position: 'absolute', left: 0, width: isLongText ? '200px' : '120px' }}>
            <TextField
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={() => handleCellEdit(editValue)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleCellEdit(editValue);
                }
              }}
              autoFocus
              multiline={isLongText}
              minRows={isLongText ? 1 : 1}
              maxRows={isLongText ? 4 : 1}
              size="small"
              sx={{
                width: '100%',
                '& .MuiInputBase-root': {
                  width: '100%',
                  margin: 0,
                  padding: 0,
                  minHeight: isLongText ? '28px' : '28px',
                  backgroundColor: '#1e1e1e',
                  position: 'relative',
                  zIndex: 1
                },
                '& .MuiInputBase-input': {
                  textAlign: 'left',
                  padding: '2px 8px',
                  minHeight: isLongText ? '28px' : '28px'
                }
              }}
            />
          </Box>
          <Box
            sx={{
              position: 'absolute',
              left: 0,
              width: '100%',
              zIndex: 0
            }}
          >
            {value ?? ''}
          </Box>
        </Box>
      );
    }

    return (
      <Box
        onDoubleClick={() => handleCellDoubleClick(row.id, column.id, value ?? '')}
        sx={{
          cursor: 'pointer',
          minHeight: '24px',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          wordBreak: 'break-word',
          whiteSpace: 'normal'
        }}
      >
        {value ?? ''}
      </Box>
    );
  };

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
            letterSpacing: '1px',
            textAlign: { xs: 'center', sm: 'left' }
          }}>
            Coda Link
          </Typography>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1,
            order: { xs: -1, sm: 0 },
            ml: { xs: 'auto', sm: 0 }
          }}>
            <Button 
              variant="contained" 
              onClick={() => {
                setIsStructureExpanded(false);
                fetchData();
              }}
              sx={{
                minWidth: { xs: 'auto', sm: 'inherit' },
                p: { xs: 1, sm: 1 },
                height: { xs: 'auto', sm: '36px' }
              }}
            >
              <RefreshIcon sx={{ display: { xs: 'block', sm: 'none' } }} />
              <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', gap: 1 }}>
                <RefreshIcon />
                Refresh
              </Box>
            </Button>
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            <Button 
              variant="contained" 
              color="secondary"
              onClick={() => {
                const docName = documents.find(doc => doc.id === docId)?.name
                  ?.replace(/['"]/g, '') // Remove quotes and apostrophes
                  ?.replace(/\s+/g, '-'); // Replace spaces with hyphens
                const selectedPage = pages.find(page => 
                  page.id === data?.metadata?.parent?.id || 
                  page.tables?.some(table => table.id === selectedTableId)
                );
                const pageName = selectedPage?.name
                  ?.replace(/['"]/g, '')
                  ?.replace(/\s+/g, '-');
                const url = `https://coda.io/d/${docName}_d${docId}/${pageName}`;
                console.log('Opening Coda URL:', url);
                window.open(url, '_blank', 'noopener,noreferrer');
              }}
              disabled={!documents.find(doc => doc.id === docId)?.name || !data?.metadata?.parent?.name}
              sx={{
                minWidth: { xs: 'auto', sm: 'inherit' },
                p: { xs: 1, sm: 1 },
                height: { xs: 'auto', sm: '36px' }
              }}
            >
              <CloudUploadIcon sx={{ display: { xs: 'block', sm: 'none' } }} />
              <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', gap: 1 }}>
                <CloudUploadIcon />
                Open Coda
              </Box>
            </Button>
          </Box>
        </Box>

        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <Typography variant="h6">
              Structure
            </Typography>
            <Button
              onClick={() => setIsStructureExpanded(!isStructureExpanded)}
              endIcon={isStructureExpanded ? <ExpandLessIcon sx={{ fontSize: 32 }} /> : <ExpandMoreIcon sx={{ fontSize: 32 }} />}
              sx={{ 
                minWidth: 'auto', 
                p: 0.5,
                height: '32px',
                '& .MuiButton-endIcon': {
                  margin: 0
                }
              }}
            />
          </Box>
          <Typography variant="body1">
            Document: <strong>{documents.find(doc => doc.id === docId)?.name || 'Loading...'}</strong> (ID: {docId})
          </Typography>
          {isStructureExpanded && documents && documents.length > 0 && (
            <Box sx={{ ml: 4 }}>
              {documents.map((doc) => (
                <Typography 
                  key={doc.id} 
                  variant="body1" 
                  sx={{ 
                    cursor: 'pointer',
                    color: doc.id === docId ? 'primary.main' : 'secondary.main',
                    '&:hover': {
                      color: 'primary.main',
                      textDecoration: 'underline'
                    }
                  }}
                  onClick={() => handleDocumentSelect(doc.id)}
                >
                  {doc.id === docId ? '▶ ' : ''}└─ {doc.name} (ID: {doc.id})
                </Typography>
              ))}
            </Box>
          )}
          {isStructureExpanded && pages && pages.length > 0 ? (
            pages.map((page) => {
              // Check if this is a subpage
              const isSubpage = page.parent?.type === 'page';
              const parentPage = isSubpage ? pages.find(p => p.id === page.parent?.id) : null;
              
              // Only show top-level pages and their subpages
              if (!isSubpage) {
                return (
                  <Box key={page.id}>
                    <Typography variant="body1" sx={{ ml: 2 }}>
                      {page.id === data?.metadata?.parent?.id ? '▶ ' : ''}└─ Page: {page.name} (ID: {page.id})
                    </Typography>
                    {/* Show subpages */}
                    {pages
                      .filter(p => p.parent?.id === page.id)
                      .map(subpage => (
                        <Box key={subpage.id}>
                          <Typography variant="body1" sx={{ ml: 4 }}>
                            {subpage.id === data?.metadata?.parent?.id ? '▶ ' : ''}└─ Page: {subpage.name} (ID: {subpage.id})
                          </Typography>
                          {/* Show tables for this subpage */}
                          {subpage.tables && subpage.tables.length > 0 && (
                            subpage.tables.map((table) => (
                              <Typography 
                                key={table.id} 
                                variant="body1" 
                                sx={{ 
                                  ml: 6,
                                  cursor: 'pointer',
                                  color: table.id === selectedTableId ? 'primary.main' : 'secondary.main',
                                  '&:hover': {
                                    color: 'primary.main',
                                    textDecoration: 'underline'
                                  }
                                }}
                                onClick={() => handleTableClick(table.id)}
                              >
                                {table.id === selectedTableId ? '▶ ' : ''}└─ Table: {table.name} (ID: {table.id})
                              </Typography>
                            ))
                          )}
                        </Box>
                      ))}
                    {/* Show tables for the main page */}
                    {page.tables && page.tables.length > 0 && (
                      page.tables.map((table) => (
                        <Typography 
                          key={table.id} 
                          variant="body1" 
                          sx={{ 
                            ml: 4,
                            cursor: 'pointer',
                            color: table.id === selectedTableId ? 'primary.main' : 'secondary.main',
                            '&:hover': {
                              color: 'primary.main',
                              textDecoration: 'underline'
                            }
                          }}
                          onClick={() => handleTableClick(table.id)}
                        >
                          {table.id === selectedTableId ? '▶ ' : ''}└─ Table: {table.name} (ID: {table.id})
                        </Typography>
                      ))
                    )}
                  </Box>
                );
              }
              return null;
            })
          ) : !isStructureExpanded && data?.metadata ? (
            <Box>
              <Typography variant="body1" sx={{ ml: 2 }}>
                └─ Page: {data.metadata.parent?.name} (ID: {data.metadata.parent?.id})
              </Typography>
              <Typography variant="body1" sx={{ ml: 4 }}>
                └─ Table: {data.metadata.name} (ID: {data.metadata.id})
              </Typography>
            </Box>
          ) : (
            <Typography variant="body1" sx={{ ml: 2, color: 'text.secondary' }}>
              Loading pages...
            </Typography>
          )}
        </Paper>

        <Paper elevation={3} sx={{ p: 3, mt: 2 }}>
          <Typography variant="h6" gutterBottom>
            Table: {data?.metadata?.name || 'Select a table'}
          </Typography>
          <Typography variant="subtitle2" gutterBottom>
            Page: {data?.metadata?.parent?.name || 'No page selected'}
          </Typography>
          <TableContainer component={Paper} sx={{ mt: 2 }}>
            {data ? (
              <Table>
                <TableHead>
                  <TableRow>
                    {columns.map((column) => (
                      <TableCell 
                        key={column.id}
                        sx={{ 
                          width: '200px',
                          maxWidth: '200px',
                          whiteSpace: 'normal',
                          wordBreak: 'break-word'
                        }}
                      >
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
                          <TableCell 
                            key={column.id}
                            sx={{ 
                              width: '200px',
                              maxWidth: '200px',
                              whiteSpace: 'normal',
                              wordBreak: 'break-word'
                            }}
                          >
                            <EditableCell
                              row={row}
                              column={column}
                              value={row.values[column.id]}
                            />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            ) : (
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography color="text.secondary">
                  Select a table from the structure to view its data
                </Typography>
              </Box>
            )}
          </TableContainer>
        </Paper>

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