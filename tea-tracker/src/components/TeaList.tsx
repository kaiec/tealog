import React, { useEffect, useState } from 'react';
import { List, ListItem, ListItemText, IconButton, TextField, Button, Box, Typography, ListItemButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { getTeas, addTea, deleteTea } from '../db';
import type { Tea } from '../types';
import { v4 as uuidv4 } from 'uuid';

const TeaList: React.FC<{ onSelect: (tea: Tea) => void; selectedTeaId?: string }> = ({ onSelect, selectedTeaId }) => {
  const [teas, setTeas] = useState<Tea[]>([]);
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [notes, setNotes] = useState('');

  const refresh = async () => {
    setTeas(await getTeas());
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleAdd = async () => {
    if (!name.trim()) return;
    await addTea({ id: uuidv4(), name, type, notes });
    setName(''); setType(''); setNotes('');
    refresh();
  };

  const handleDelete = async (id: string) => {
    await deleteTea(id);
    refresh();
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>Teas</Typography>
      <Box display="flex" gap={1} mb={2}>
        <TextField label="Name" value={name} onChange={e => setName(e.target.value)} size="small" />
        <TextField label="Type" value={type} onChange={e => setType(e.target.value)} size="small" />
        <TextField label="Notes" value={notes} onChange={e => setNotes(e.target.value)} size="small" />
        <Button variant="contained" onClick={handleAdd}>Add</Button>
      </Box>
      <List>
        {teas.map(tea => (
          <ListItem
            key={tea.id}
            secondaryAction={
              <IconButton edge="end" aria-label="delete" onClick={() => handleDelete(tea.id)}>
                <DeleteIcon />
              </IconButton>
            }
            disablePadding
          >
            <ListItemButton
              selected={tea.id === selectedTeaId}
              onClick={() => onSelect(tea)}
            >
              <ListItemText primary={tea.name} secondary={tea.type} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default TeaList; 