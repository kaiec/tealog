import React, { useEffect, useState } from 'react';
import { List, ListItem, ListItemText, IconButton, TextField, Button, Box, Typography, ListItemButton, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { getInfusionsByBrewing, addInfusion, deleteInfusion, getBrewingsByTea } from '../db';
import type { Infusion, Brewing } from '../types';
import { v4 as uuidv4 } from 'uuid';

const defaultInfusion = { waterAmount: '', temperature: '', steepTime: '', tasteNotes: '' };

const InfusionList: React.FC<{ brewing: Brewing | null }> = ({ brewing }) => {
  const [infusions, setInfusions] = useState<Infusion[]>([]);
  const [waterAmount, setWaterAmount] = useState('');
  const [temperature, setTemperature] = useState('');
  const [steepTime, setSteepTime] = useState('');
  const [tasteNotes, setTasteNotes] = useState('');
  const [editInfusion, setEditInfusion] = useState<Infusion | null>(null);
  const [editWaterAmount, setEditWaterAmount] = useState('');
  const [editTemperature, setEditTemperature] = useState('');
  const [editSteepTime, setEditSteepTime] = useState('');
  const [editTasteNotes, setEditTasteNotes] = useState('');

  const prefillFromPreviousBrewing = async (brewing: Brewing, idx: number) => {
    const brewings = await getBrewingsByTea(brewing.teaId);
    // Only consider brewings before the current one (by date)
    const previous = brewings
      .filter(b => b.id !== brewing.id && b.date < brewing.date)
      .sort((a, b) => b.date.localeCompare(a.date)); // most recent first
    if (previous.length === 0) return defaultInfusion;
    const lastBrewing = previous[0];
    const prevInfusions = await getInfusionsByBrewing(lastBrewing.id);
    let match = prevInfusions[idx];
    if (!match && prevInfusions.length > 0) match = prevInfusions[prevInfusions.length - 1];
    if (match) {
      return {
        waterAmount: match.waterAmount.toString(),
        temperature: match.temperature.toString(),
        steepTime: match.steepTime.toString(),
        tasteNotes: match.tasteNotes || '',
      };
    }
    return defaultInfusion;
  };

  const refresh = async () => {
    if (brewing) {
      const infs = await getInfusionsByBrewing(brewing.id);
      setInfusions(infs);
      let prefill = defaultInfusion;
      if (infs.length > 0) {
        // Usual prefill logic for subsequent infusions
        const idx = infs.length; // next infusion index (0-based)
        let match = infs[idx];
        if (!match && idx > 0) match = infs[idx - 1];
        if (match) {
          prefill = {
            waterAmount: match.waterAmount.toString(),
            temperature: match.temperature.toString(),
            steepTime: match.steepTime.toString(),
            tasteNotes: match.tasteNotes || '',
          };
        } else {
          const last = infs[infs.length - 1];
          prefill = last
            ? {
                waterAmount: last.waterAmount.toString(),
                temperature: last.temperature.toString(),
                steepTime: last.steepTime.toString(),
                tasteNotes: last.tasteNotes || '',
              }
            : defaultInfusion;
        }
      } else if (brewing) {
        // For the first infusion of a new brewing, prefill from previous brewing
        prefill = await prefillFromPreviousBrewing(brewing, 0);
      }
      setWaterAmount(prefill.waterAmount);
      setTemperature(prefill.temperature);
      setSteepTime(prefill.steepTime);
      setTasteNotes(prefill.tasteNotes);
    } else {
      setInfusions([]);
      setWaterAmount('');
      setTemperature('');
      setSteepTime('');
      setTasteNotes('');
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line
  }, [brewing]);

  const handleAdd = async () => {
    if (!brewing || !waterAmount.trim() || !temperature.trim() || !steepTime.trim()) return;
    await addInfusion({
      id: uuidv4(),
      brewingId: brewing.id,
      waterAmount: Number(waterAmount),
      temperature: Number(temperature),
      steepTime: Number(steepTime),
      tasteNotes,
    });
    refresh();
  };

  const handleDelete = async (id: string) => {
    await deleteInfusion(id);
    refresh();
  };

  const handleEdit = (infusion: Infusion) => {
    setEditInfusion(infusion);
    setEditWaterAmount(infusion.waterAmount.toString());
    setEditTemperature(infusion.temperature.toString());
    setEditSteepTime(infusion.steepTime.toString());
    setEditTasteNotes(infusion.tasteNotes || '');
  };

  const handleEditSave = async () => {
    if (
      editInfusion &&
      editWaterAmount.trim() &&
      editTemperature.trim() &&
      editSteepTime.trim() &&
      !isNaN(Number(editWaterAmount)) &&
      !isNaN(Number(editTemperature)) &&
      !isNaN(Number(editSteepTime))
    ) {
      await addInfusion({
        ...editInfusion,
        waterAmount: Number(editWaterAmount),
        temperature: Number(editTemperature),
        steepTime: Number(editSteepTime),
        tasteNotes: editTasteNotes,
      });
      setEditInfusion(null);
      refresh();
    }
  };

  if (!brewing) return null;

  return (
    <Box mt={4}>
      <Typography variant="h6" gutterBottom>Infusions</Typography>
      <Box display="flex" gap={1} mb={2} flexWrap="wrap">
        <TextField label="Water (ml)" value={waterAmount} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWaterAmount(e.target.value)} size="small" type="number" />
        <TextField label="Temp (°C)" value={temperature} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTemperature(e.target.value)} size="small" type="number" />
        <TextField label="Steep Time (s)" value={steepTime} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSteepTime(e.target.value)} size="small" type="number" />
        <TextField label="Taste Notes" value={tasteNotes} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTasteNotes(e.target.value)} size="small" />
        <Button variant="contained" onClick={handleAdd}>Add</Button>
      </Box>
      <List>
        {infusions.map((infusion: Infusion) => (
          <ListItem
            key={infusion.id}
            secondaryAction={
              <>
                <IconButton edge="end" aria-label="edit" onClick={() => handleEdit(infusion)}>
                  <EditIcon />
                </IconButton>
                <IconButton edge="end" aria-label="delete" onClick={() => handleDelete(infusion.id)}>
                  <DeleteIcon />
                </IconButton>
              </>
            }
            disablePadding
          >
            <ListItemButton>
              <ListItemText
                primary={`Water: ${infusion.waterAmount}ml, Temp: ${infusion.temperature}°C, Time: ${infusion.steepTime}s`}
                secondary={infusion.tasteNotes}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Dialog open={!!editInfusion} onClose={() => setEditInfusion(null)}>
        <DialogTitle>Edit Infusion</DialogTitle>
        <DialogContent>
          <TextField label="Water (ml)" value={editWaterAmount} onChange={e => setEditWaterAmount(e.target.value)} fullWidth margin="dense" type="number" />
          <TextField label="Temp (°C)" value={editTemperature} onChange={e => setEditTemperature(e.target.value)} fullWidth margin="dense" type="number" />
          <TextField label="Steep Time (s)" value={editSteepTime} onChange={e => setEditSteepTime(e.target.value)} fullWidth margin="dense" type="number" />
          <TextField label="Taste Notes" value={editTasteNotes} onChange={e => setEditTasteNotes(e.target.value)} fullWidth margin="dense" />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditInfusion(null)}>Cancel</Button>
          <Button onClick={handleEditSave} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default InfusionList; 