import React, { useEffect, useState } from 'react';
import { List, ListItem, ListItemText, IconButton, TextField, Button, Box, Typography, ListItemButton, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { getTeas, addTea, deleteTea } from '../db';
import type { Tea } from '../types';
import { v4 as uuidv4 } from 'uuid';

const TeaList: React.FC<{ onSelect: (tea: Tea) => void; selectedTeaId?: string }> = ({ onSelect, selectedTeaId }) => {
  const [teas, setTeas] = useState<Tea[]>([]);
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [notes, setNotes] = useState('');
  const [editTea, setEditTea] = useState<Tea | null>(null);
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState('');
  const [editNotes, setEditNotes] = useState('');

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

  const handleEdit = (tea: Tea) => {
    setEditTea(tea);
    setEditName(tea.name);
    setEditType(tea.type || '');
    setEditNotes(tea.notes || '');
  };

  const handleEditSave = async () => {
    if (editTea) {
      await addTea({ ...editTea, name: editName, type: editType, notes: editNotes });
      setEditTea(null);
      refresh();
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>Teas</Typography>
      <Box display="flex" gap={1} mb={2}>
        <TextField label="Name" value={name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)} size="small" />
        <TextField label="Type" value={type} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setType(e.target.value)} size="small" />
        <TextField label="Notes" value={notes} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNotes(e.target.value)} size="small" />
        <Button variant="contained" onClick={handleAdd}>Add</Button>
      </Box>
      <List>
        {teas.map(tea => (
          <ListItem
            key={tea.id}
            secondaryAction={
              <>
                <IconButton edge="end" aria-label="edit" onClick={() => handleEdit(tea)}>
                  <EditIcon />
                </IconButton>
                <IconButton edge="end" aria-label="delete" onClick={() => handleDelete(tea.id)}>
                  <DeleteIcon />
                </IconButton>
              </>
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
      <Dialog open={!!editTea} onClose={() => setEditTea(null)}>
        <DialogTitle>Edit Tea</DialogTitle>
        <DialogContent>
          <TextField label="Name" value={editName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditName(e.target.value)} fullWidth margin="dense" />
          <TextField label="Type" value={editType} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditType(e.target.value)} fullWidth margin="dense" />
          <TextField label="Notes" value={editNotes} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditNotes(e.target.value)} fullWidth margin="dense" />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditTea(null)}>Cancel</Button>
          <Button onClick={handleEditSave} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TeaList; 