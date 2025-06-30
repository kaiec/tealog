import React, { useEffect, useState } from 'react';
import { List, ListItem, ListItemText, IconButton, TextField, Button, Box, Typography, ListItemButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { getBrewingsByTea, addBrewing, deleteBrewing } from '../db';
import type { Brewing, Tea } from '../types';
import { v4 as uuidv4 } from 'uuid';

const BrewingList: React.FC<{ tea: Tea | null; onSelect: (brewing: Brewing) => void; selectedBrewingId?: string }> = ({ tea, onSelect, selectedBrewingId }) => {
  const [brewings, setBrewings] = useState<Brewing[]>([]);
  const [amount, setAmount] = useState('');

  const refresh = async () => {
    if (tea) setBrewings(await getBrewingsByTea(tea.id));
    else setBrewings([]);
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line
  }, [tea]);

  const handleAdd = async () => {
    if (!tea || !amount.trim() || isNaN(Number(amount))) return;
    await addBrewing({ id: uuidv4(), teaId: tea.id, date: new Date().toISOString(), amount: Number(amount) });
    setAmount('');
    refresh();
  };

  const handleDelete = async (id: string) => {
    await deleteBrewing(id);
    refresh();
  };

  if (!tea) return null;

  return (
    <Box mt={4}>
      <Typography variant="h6" gutterBottom>Brewings for {tea.name}</Typography>
      <Box display="flex" gap={1} mb={2}>
        <TextField label="Amount (g)" value={amount} onChange={e => setAmount(e.target.value)} size="small" type="number" />
        <Button variant="contained" onClick={handleAdd}>Add</Button>
      </Box>
      <List>
        {brewings.map(brewing => (
          <ListItem
            key={brewing.id}
            secondaryAction={
              <IconButton edge="end" aria-label="delete" onClick={() => handleDelete(brewing.id)}>
                <DeleteIcon />
              </IconButton>
            }
            disablePadding
          >
            <ListItemButton
              selected={brewing.id === selectedBrewingId}
              onClick={() => onSelect(brewing)}
            >
              <ListItemText primary={`Brewed on ${new Date(brewing.date).toLocaleString()}`} secondary={`Amount: ${brewing.amount}g`} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default BrewingList; 