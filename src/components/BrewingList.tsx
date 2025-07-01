import React, { useEffect, useState } from 'react';
import { List, ListItem, ListItemText, IconButton, TextField, Button, Box, Typography, ListItemButton, Dialog, DialogTitle, DialogContent, DialogActions, MenuItem, Select, InputLabel, FormControl } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { getBrewingsByTea, addBrewing, deleteBrewing } from '../db';
import type { Brewing, Tea, TeaAmountUnit } from '../types';
import { v4 as uuidv4 } from 'uuid';

const unitOptions: TeaAmountUnit[] = ['g', 'tsp', 'bag'];

const BrewingList: React.FC<{ tea: Tea | null; onSelect: (brewing: Brewing) => void; selectedBrewingId?: string; showSnackbar?: (msg: string, action?: React.ReactNode) => void }> = ({ tea, onSelect, selectedBrewingId, showSnackbar }) => {
  const [brewings, setBrewings] = useState<Brewing[]>([]);
  const [amount, setAmount] = useState('');
  const [unit, setUnit] = useState<TeaAmountUnit>('g');
  const [editBrewing, setEditBrewing] = useState<Brewing | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editUnit, setEditUnit] = useState<TeaAmountUnit>('g');
  const lastDeletedBrewing = React.useRef<Brewing | null>(null);

  const refresh = async (selectId?: string) => {
    if (tea) {
      let brewings = await getBrewingsByTea(tea.id);
      brewings = brewings.sort((a: Brewing, b: Brewing) => b.date.localeCompare(a.date)); // newest first
      setBrewings(brewings);
      // Prefill with last brewing values
      if (brewings.length > 0) {
        setAmount(brewings[0].amount.toString());
        setUnit(brewings[0].unit);
      } else {
        setAmount('');
        setUnit('g');
      }
      // If a new brewing was just added, select it
      if (selectId) {
        const newBrewing = brewings.find((b: Brewing) => b.id === selectId);
        if (newBrewing) onSelect(newBrewing);
      }
    } else {
      setBrewings([]);
      setAmount('');
      setUnit('g');
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line
  }, [tea]);

  const handleAdd = async () => {
    if (!tea || !amount.trim() || isNaN(Number(amount))) return;
    const id = uuidv4();
    const newBrewing = { id, teaId: tea.id, date: new Date().toISOString(), amount: Number(amount), unit };
    await addBrewing(newBrewing);
    refresh(id);
    showSnackbar && showSnackbar('Brewing added');
  };

  const handleDelete = async (id: string) => {
    const brewingToDelete = brewings.find(b => b.id === id);
    if (!brewingToDelete) return;
    lastDeletedBrewing.current = brewingToDelete;
    await deleteBrewing(id);
    refresh();
    showSnackbar && showSnackbar('Brewing deleted', (
      <Button color="secondary" size="small" onClick={async () => {
        if (lastDeletedBrewing.current) {
          await addBrewing(lastDeletedBrewing.current);
          refresh();
          showSnackbar('Brewing restored');
        }
      }}>Undo</Button>
    ));
  };

  const handleEdit = (brewing: Brewing) => {
    setEditBrewing(brewing);
    setEditAmount(brewing.amount.toString());
    setEditUnit(brewing.unit);
  };

  const handleEditSave = async () => {
    if (editBrewing && editAmount.trim() && !isNaN(Number(editAmount))) {
      await addBrewing({ ...editBrewing, amount: Number(editAmount), unit: editUnit });
      setEditBrewing(null);
      refresh();
      showSnackbar && showSnackbar('Brewing updated');
    }
  };

  if (!tea) return null;

  return (
    <Box mt={4}>
      <Typography variant="h6" gutterBottom>Add Brewing</Typography>
      <Box display="flex" gap={1} mb={2}>
        <TextField label="Amount" value={amount} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAmount(e.target.value)} size="small" type="number" />
        <FormControl size="small" sx={{ minWidth: 80 }}>
          <InputLabel>Unit</InputLabel>
          <Select value={unit} label="Unit" onChange={(e: any) => setUnit(e.target.value as TeaAmountUnit)}>
            {unitOptions.map(u => <MenuItem key={u} value={u}>{u}</MenuItem>)}
          </Select>
        </FormControl>
        <Button variant="contained" onClick={handleAdd}>Add</Button>
      </Box>
      <Typography variant="h6" gutterBottom>Brewings for {tea.name}</Typography>
      <List>
        {brewings.map((brewing: Brewing) => (
          <ListItem
            key={brewing.id}
            secondaryAction={
              <>
                <IconButton edge="end" aria-label="edit" onClick={() => handleEdit(brewing)}>
                  <EditIcon />
                </IconButton>
                <IconButton edge="end" aria-label="delete" onClick={() => handleDelete(brewing.id)}>
                  <DeleteIcon />
                </IconButton>
              </>
            }
            disablePadding
          >
            <ListItemButton
              selected={brewing.id === selectedBrewingId}
              onClick={() => onSelect(brewing)}
            >
              <ListItemText primary={`Brewed on ${new Date(brewing.date).toLocaleString()}`} secondary={`Amount: ${brewing.amount} ${brewing.unit}`} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Dialog open={!!editBrewing} onClose={() => setEditBrewing(null)}>
        <DialogTitle>Edit Brewing</DialogTitle>
        <DialogContent>
          <TextField label="Amount" value={editAmount} onChange={e => setEditAmount(e.target.value)} fullWidth margin="dense" type="number" />
          <FormControl fullWidth margin="dense">
            <InputLabel>Unit</InputLabel>
            <Select value={editUnit} label="Unit" onChange={e => setEditUnit(e.target.value as TeaAmountUnit)}>
              {unitOptions.map(u => <MenuItem key={u} value={u}>{u}</MenuItem>)}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditBrewing(null)}>Cancel</Button>
          <Button onClick={handleEditSave} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BrewingList; 