import React, { useEffect, useState } from 'react';
import { List, ListItem, ListItemText, IconButton, TextField, Button, Box, Typography, ListItemButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { getInfusionsByBrewing, addInfusion, deleteInfusion } from '../db';
import type { Infusion, Brewing } from '../types';
import { v4 as uuidv4 } from 'uuid';

const InfusionList: React.FC<{ brewing: Brewing | null }> = ({ brewing }) => {
  const [infusions, setInfusions] = useState<Infusion[]>([]);
  const [waterAmount, setWaterAmount] = useState('');
  const [temperature, setTemperature] = useState('');
  const [steepTime, setSteepTime] = useState('');
  const [tasteNotes, setTasteNotes] = useState('');

  const refresh = async () => {
    if (brewing) setInfusions(await getInfusionsByBrewing(brewing.id));
    else setInfusions([]);
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
    setWaterAmount(''); setTemperature(''); setSteepTime(''); setTasteNotes('');
    refresh();
  };

  const handleDelete = async (id: string) => {
    await deleteInfusion(id);
    refresh();
  };

  if (!brewing) return null;

  return (
    <Box mt={4}>
      <Typography variant="h6" gutterBottom>Infusions</Typography>
      <Box display="flex" gap={1} mb={2} flexWrap="wrap">
        <TextField label="Water (ml)" value={waterAmount} onChange={e => setWaterAmount(e.target.value)} size="small" type="number" />
        <TextField label="Temp (°C)" value={temperature} onChange={e => setTemperature(e.target.value)} size="small" type="number" />
        <TextField label="Steep Time (s)" value={steepTime} onChange={e => setSteepTime(e.target.value)} size="small" type="number" />
        <TextField label="Taste Notes" value={tasteNotes} onChange={e => setTasteNotes(e.target.value)} size="small" />
        <Button variant="contained" onClick={handleAdd}>Add</Button>
      </Box>
      <List>
        {infusions.map(infusion => (
          <ListItem
            key={infusion.id}
            secondaryAction={
              <IconButton edge="end" aria-label="delete" onClick={() => handleDelete(infusion.id)}>
                <DeleteIcon />
              </IconButton>
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
    </Box>
  );
};

export default InfusionList; 