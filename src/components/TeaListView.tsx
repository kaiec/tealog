import React, { useEffect, useState } from 'react';
import { Card, CardContent, Typography, Box, Rating, Paper, List, ListItemButton } from '@mui/material';
import { getTeas } from '../db';
import type { Tea } from '../types';

const TeaListView: React.FC<{ onSelectTea: (teaId: string) => void }> = ({ onSelectTea }) => {
  const [teas, setTeas] = useState<Tea[]>([]);
  useEffect(() => { getTeas().then(setTeas); }, []);
  const placeholderImg = `${import.meta.env.BASE_URL}tea-placeholder.png`;
  return (
    <Box>
      <Typography variant="h5" gutterBottom>All Teas</Typography>
      <Paper variant="outlined">
        <List>
          {teas.length === 0 && (
            <Typography variant="body1" color="text.secondary" sx={{ p: 2 }}>No teas found.</Typography>
          )}
          {teas.map(tea => (
            <ListItemButton key={tea.id} onClick={() => onSelectTea(tea.id)}>
              <Card sx={{ width: '100%', mb: 2, display: 'flex', alignItems: 'center', gap: 2, p: 1 }}>
                <img src={tea.photo || placeholderImg} alt="Tea" style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 8, border: '1px solid #ccc' }} />
                <CardContent sx={{ flex: 1 }}>
                  <Typography variant="h6">{tea.name}</Typography>
                  <Typography variant="body2" color="text.secondary">{tea.type}</Typography>
                  {tea.vendor && <Typography variant="body2">Vendor: {tea.vendor}</Typography>}
                  {tea.description && <Typography variant="body2">{tea.description}</Typography>}
                  {tea.note && <Typography variant="body2">Note: {tea.note}</Typography>}
                  {typeof tea.rating === 'number' && <Rating value={tea.rating} readOnly max={5} />}
                </CardContent>
              </Card>
            </ListItemButton>
          ))}
        </List>
      </Paper>
    </Box>
  );
};
export default TeaListView; 