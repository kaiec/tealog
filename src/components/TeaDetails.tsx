import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Button, Rating, Stack } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { getTeas } from '../db';
import type { Tea } from '../types';

const TeaDetails: React.FC<{ teaId: string; onBack: () => void; onEdit?: () => void }> = ({ teaId, onBack, onEdit }) => {
  const [tea, setTea] = useState<Tea | null>(null);
  useEffect(() => {
    getTeas().then(teas => setTea(teas.find(t => t.id === teaId) || null));
  }, [teaId]);
  if (!tea) return <Typography>Loading...</Typography>;
  const placeholderImg = `${import.meta.env.BASE_URL}tea-placeholder.png`;
  return (
    <Paper sx={{ p: 3, mt: 2 }} elevation={3}>
      <Box display="flex" justifyContent="center" mb={2}>
        <img src={tea.photo || placeholderImg} alt="Tea" style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 12, border: '1px solid #ccc' }} />
      </Box>
      <Typography variant="h5" gutterBottom>Tea Details</Typography>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Button onClick={onBack} variant="outlined">Back to List</Button>
        {onEdit && (
          <Button onClick={onEdit} variant="contained" startIcon={<EditIcon />}>Edit</Button>
        )}
      </Stack>
      <Typography variant="h4" gutterBottom>{tea.name}</Typography>
      <Typography variant="h6" color="text.secondary" gutterBottom>{tea.type}</Typography>
      {tea.vendor && <Typography variant="body1" gutterBottom>Vendor: {tea.vendor}</Typography>}
      {tea.description && <Typography variant="body1" gutterBottom>{tea.description}</Typography>}
      {tea.note && <Typography variant="body1" gutterBottom>Note: {tea.note}</Typography>}
      {typeof tea.rating === 'number' && (
        <Box display="flex" alignItems="center" gap={1} mt={2}>
          <Typography>Rating:</Typography>
          <Rating value={tea.rating} readOnly max={5} />
        </Box>
      )}
    </Paper>
  );
};
export default TeaDetails; 