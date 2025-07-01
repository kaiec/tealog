import React, { useEffect, useState } from 'react';
import { List, IconButton, TextField, Button, Box, Typography, Dialog, DialogTitle, DialogContent, DialogActions, Card, CardContent, CardActions, MenuItem, Select, InputLabel, FormControl, Rating } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { getTeas, addTea, deleteTea } from '../db';
import type { Tea } from '../types';
import { v4 as uuidv4 } from 'uuid';
import SpaIcon from '@mui/icons-material/Spa';

const teaTypeOptions = [
  'Black Tea',
  'Green Tea',
  'White Tea',
  'Herbal',
  'Fruits',
  'Misc',
];

const TeaList: React.FC<{ onSelect: (tea: Tea) => void; selectedTeaId?: string; onTeaAdded?: (teaId: string) => void; showSnackbar?: (msg: string, action?: React.ReactNode) => void }> = ({ onSelect, selectedTeaId, onTeaAdded, showSnackbar }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [vendor, setVendor] = useState('');
  const [description, setDescription] = useState('');
  const [note, setNote] = useState('');
  const [rating, setRating] = useState<number | null>(null);
  const [editTea, setEditTea] = useState<Tea | null>(null);
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState('');
  const [editVendor, setEditVendor] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editNote, setEditNote] = useState('');
  const [editRating, setEditRating] = useState<number | null>(null);

  useEffect(() => {
    if (selectedTeaId) {
      getTeas().then(teas => {
        const tea = teas.find(t => t.id === selectedTeaId);
        if (tea) {
          setName(tea.name || '');
          setType(tea.type || '');
          setVendor(tea.vendor || '');
          setDescription(tea.description || '');
          setNote(tea.note || '');
          setRating(typeof tea.rating === 'number' ? tea.rating : null);
        }
      });
    } else {
      setName('');
      setType('');
      setVendor('');
      setDescription('');
      setNote('');
      setRating(null);
    }
  }, [selectedTeaId]);

  const handleAdd = async () => {
    if (!name.trim()) return;
    const newTea = {
      id: uuidv4(),
      name,
      type,
      vendor: vendor || undefined,
      description: description || undefined,
      note: note || undefined,
      rating: rating ?? undefined,
    };
    await addTea(newTea);
    setName(''); setType(''); setVendor(''); setDescription(''); setNote(''); setRating(null);
    if (onTeaAdded) onTeaAdded(newTea.id);
    showSnackbar && showSnackbar('Tea added');
  };

  const handleDelete = async (id: string) => {
    const teaToDelete = await getTeas().then(teas => teas.find(t => t.id === id));
    if (!teaToDelete) return;
    await deleteTea(id);
    showSnackbar && showSnackbar('Tea deleted', (
      <Button color="secondary" size="small" onClick={async () => {
        await addTea(teaToDelete);
        showSnackbar('Tea restored');
      }}>Undo</Button>
    ));
  };

  const handleEdit = (tea: Tea) => {
    setEditTea(tea);
    setEditName(tea.name);
    setEditType(tea.type || '');
    setEditVendor(tea.vendor || '');
    setEditDescription(tea.description || '');
    setEditNote(tea.note || '');
    setEditRating(tea.rating ?? null);
  };

  const handleEditSave = async () => {
    if (editTea) {
      await addTea({
        ...editTea,
        name: editName,
        type: editType,
        vendor: editVendor || undefined,
        description: editDescription || undefined,
        note: editNote || undefined,
        rating: editRating ?? undefined,
      });
      setEditTea(null);
      showSnackbar && showSnackbar('Tea updated');
      if (onTeaAdded) onTeaAdded(editTea.id);
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>{selectedTeaId ? 'Edit Tea' : 'Add a New Tea'}</Typography>
      <Box display="flex" flexDirection="column" gap={1} mb={2}>
        <TextField label="Name" value={name} onChange={e => setName(e.target.value)} size="small" required />
        <FormControl size="small">
          <InputLabel>Type</InputLabel>
          <Select value={type} label="Type" onChange={e => setType(e.target.value)}>
            <MenuItem value=""><em>None</em></MenuItem>
            {teaTypeOptions.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
          </Select>
        </FormControl>
        <TextField label="Vendor" value={vendor} onChange={e => setVendor(e.target.value)} size="small" />
        <TextField label="Description" value={description} onChange={e => setDescription(e.target.value)} size="small" multiline minRows={2} />
        <TextField label="Note" value={note} onChange={e => setNote(e.target.value)} size="small" multiline minRows={2} />
        <Box display="flex" alignItems="center" gap={1}>
          <Typography>Rating</Typography>
          <Rating value={rating} onChange={(_, v) => setRating(v)} max={5} />
        </Box>
        <Button variant="contained" onClick={async () => {
          if (!name.trim()) return;
          const newTea = {
            id: selectedTeaId || uuidv4(),
            name,
            type,
            vendor: vendor || undefined,
            description: description || undefined,
            note: note || undefined,
            rating: rating ?? undefined,
          };
          await addTea(newTea);
          setName(''); setType(''); setVendor(''); setDescription(''); setNote(''); setRating(null);
          if (onTeaAdded) onTeaAdded(newTea.id);
          showSnackbar && showSnackbar(selectedTeaId ? 'Tea updated' : 'Tea added');
        }}>{selectedTeaId ? 'Save' : 'Add'}</Button>
      </Box>
      <Dialog open={!!editTea} onClose={() => setEditTea(null)}>
        <DialogTitle>Edit Tea</DialogTitle>
        <DialogContent>
          <TextField label="Name" value={editName} onChange={e => setEditName(e.target.value)} fullWidth margin="dense" required />
          <FormControl fullWidth margin="dense">
            <InputLabel>Type</InputLabel>
            <Select value={editType} label="Type" onChange={e => setEditType(e.target.value)}>
              <MenuItem value=""><em>None</em></MenuItem>
              {teaTypeOptions.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField label="Vendor" value={editVendor} onChange={e => setEditVendor(e.target.value)} fullWidth margin="dense" />
          <TextField label="Description" value={editDescription} onChange={e => setEditDescription(e.target.value)} fullWidth margin="dense" multiline minRows={2} />
          <TextField label="Note" value={editNote} onChange={e => setEditNote(e.target.value)} fullWidth margin="dense" multiline minRows={2} />
          <Box display="flex" alignItems="center" gap={1} mt={2}>
            <Typography>Rating</Typography>
            <Rating value={editRating} onChange={(_, v) => setEditRating(v)} max={5} />
          </Box>
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