import React, { useEffect, useState } from 'react';
import { List, IconButton, TextField, Button, Box, Typography, Dialog, DialogTitle, DialogContent, DialogActions, Card, CardContent, CardActions } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { getTeas, addTea, deleteTea } from '../db';
import type { Tea } from '../types';
import { v4 as uuidv4 } from 'uuid';
import SpaIcon from '@mui/icons-material/Spa';

const TeaList: React.FC<{ onSelect: (tea: Tea) => void; selectedTeaId?: string; onTeaAdded?: () => void; showSnackbar?: (msg: string, action?: React.ReactNode) => void }> = ({ onSelect, selectedTeaId, onTeaAdded, showSnackbar }) => {
  const [teas, setTeas] = useState<Tea[]>([]);
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [notes, setNotes] = useState('');
  const [editTea, setEditTea] = useState<Tea | null>(null);
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [search, setSearch] = useState('');
  const lastDeletedTea = React.useRef<Tea | null>(null);

  const refresh = async () => {
    setTeas(await getTeas());
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleAdd = async () => {
    if (!name.trim()) return;
    const newTea = { id: uuidv4(), name, type, notes };
    await addTea(newTea);
    setName(''); setType(''); setNotes('');
    refresh();
    if (onTeaAdded) onTeaAdded();
    showSnackbar && showSnackbar('Tea added');
  };

  const handleDelete = async (id: string) => {
    const teaToDelete = teas.find(t => t.id === id);
    if (!teaToDelete) return;
    lastDeletedTea.current = teaToDelete;
    await deleteTea(id);
    refresh();
    showSnackbar && showSnackbar('Tea deleted', (
      <Button color="secondary" size="small" onClick={async () => {
        if (lastDeletedTea.current) {
          await addTea(lastDeletedTea.current);
          refresh();
          showSnackbar('Tea restored');
        }
      }}>Undo</Button>
    ));
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
      showSnackbar && showSnackbar('Tea updated');
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>Teas</Typography>
      <TextField
        label="Search teas"
        value={search}
        onChange={e => setSearch(e.target.value)}
        size="small"
        fullWidth
        sx={{ mb: 2 }}
        placeholder="Type to filter by name or type"
      />
      <Box display="flex" gap={1} mb={2}>
        <TextField label="Name" value={name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)} size="small" />
        <TextField label="Type" value={type} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setType(e.target.value)} size="small" />
        <TextField label="Notes" value={notes} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNotes(e.target.value)} size="small" />
        <Button variant="contained" onClick={handleAdd}>Add</Button>
      </Box>
      <List>
        {teas.filter(tea =>
          tea.name.toLowerCase().includes(search.toLowerCase()) ||
          (tea.type && tea.type.toLowerCase().includes(search.toLowerCase()))
        ).length === 0 && (
          <Box textAlign="center" py={4}>
            <SpaIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
            <Typography variant="body1" color="text.secondary">No teas found. Add your first tea!</Typography>
          </Box>
        )}
        {teas.filter(tea =>
          tea.name.toLowerCase().includes(search.toLowerCase()) ||
          (tea.type && tea.type.toLowerCase().includes(search.toLowerCase()))
        ).map(tea => (
          <Card key={tea.id} sx={{ mb: 2, boxShadow: '0 2px 8px 0 rgba(56,142,60,0.08)', borderLeft: tea.id === selectedTeaId ? '6px solid #388e3c' : undefined }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', p: 2 }} onClick={() => onSelect(tea)}>
              <SpaIcon sx={{ color: 'primary.main', mr: 2, fontSize: 32 }} />
              <Box flex={1}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>{tea.name}</Typography>
                <Typography variant="body2" color="text.secondary">{tea.type}</Typography>
                {tea.notes && <Typography variant="body2" color="text.secondary">{tea.notes}</Typography>}
              </Box>
            </CardContent>
            <CardActions sx={{ justifyContent: 'flex-end', pr: 2 }}>
              <IconButton edge="end" aria-label="edit" onClick={() => handleEdit(tea)} color="primary">
                <EditIcon />
              </IconButton>
              <IconButton edge="end" aria-label="delete" onClick={() => handleDelete(tea.id)} color="secondary">
                <DeleteIcon />
              </IconButton>
            </CardActions>
          </Card>
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