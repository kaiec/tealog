import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Box, Typography, Card, CardContent, Button, List, ListItem, ListItemText, ListItemButton, IconButton, Chip, Divider, TextField, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { getTeaById, getInfusionsByBrewing, addInfusion, deleteInfusion, getBrewingsByTea } from '../db';
import type { Brewing, Tea, Infusion } from '../types';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { v4 as uuidv4 } from 'uuid';

interface BrewingDetailsProps {
  brewing: Brewing;
  onBack: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  showSnackbar?: (msg: string, action?: React.ReactNode) => void;
}

const BrewingDetails: React.FC<BrewingDetailsProps> = ({ 
  brewing, 
  onBack, 
  onEdit, 
  onDelete, 
  showSnackbar 
}) => {
  const [tea, setTea] = useState<Tea | null>(null);
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
  const lastDeletedInfusion = React.useRef<Infusion | null>(null);

  const defaultInfusion = useMemo(() => ({ waterAmount: '', temperature: '', steepTime: '', tasteNotes: '' }), []);

  const prefillFromPreviousBrewing = useCallback(async (brewing: Brewing, idx: number) => {
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
  }, [defaultInfusion]);

  const refreshInfusions = useCallback(async () => {
    const infs = await getInfusionsByBrewing(brewing.id);
    setInfusions(infs.sort((a: Infusion, b: Infusion) => a.steepTime - b.steepTime));
    
    // Prefill form with smart defaults
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
    } else {
      // For the first infusion of a new brewing, prefill from previous brewing
      prefill = await prefillFromPreviousBrewing(brewing, 0);
    }
    setWaterAmount(prefill.waterAmount);
    setTemperature(prefill.temperature);
    setSteepTime(prefill.steepTime);
    setTasteNotes(prefill.tasteNotes);
  }, [brewing, defaultInfusion, prefillFromPreviousBrewing]);

  useEffect(() => {
    async function fetchData() {
      const [teaData] = await Promise.all([
        getTeaById(brewing.teaId)
      ]);
      setTea(teaData || null);
      refreshInfusions();
    }
    fetchData();
  }, [brewing, refreshInfusions]);

  const handleAddInfusion = async () => {
    if (!waterAmount.trim() || !temperature.trim() || !steepTime.trim()) return;
    const newInfusion = {
      id: uuidv4(),
      brewingId: brewing.id,
      waterAmount: Number(waterAmount),
      temperature: Number(temperature),
      steepTime: Number(steepTime),
      tasteNotes,
    };
    await addInfusion(newInfusion);
    refreshInfusions();
    if (showSnackbar) {
      showSnackbar('Infusion added');
    }
  };

  const handleDeleteInfusion = async (id: string) => {
    const infusionToDelete = infusions.find(i => i.id === id);
    if (!infusionToDelete) return;
    lastDeletedInfusion.current = infusionToDelete;
    await deleteInfusion(id);
    refreshInfusions();
    if (showSnackbar) {
      showSnackbar('Infusion deleted', (
        <Button color="secondary" size="small" onClick={async () => {
          if (lastDeletedInfusion.current) {
            await addInfusion(lastDeletedInfusion.current);
            refreshInfusions();
            if (showSnackbar) {
              showSnackbar('Infusion restored');
            }
          }
        }}>Undo</Button>
      ));
    }
  };

  const handleEditInfusion = (infusion: Infusion) => {
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
      refreshInfusions();
      if (showSnackbar) {
        showSnackbar('Infusion updated');
      }
    }
  };

  if (!tea) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  const placeholderImg = `${import.meta.env.BASE_URL}tea-placeholder.png`;

  return (
    <Box>
      {/* Header with back button */}
      <Box sx={{ mb: 3 }}>
        <Button 
          variant="text" 
          size="small"
          startIcon={<ArrowBackIcon />}
          onClick={onBack}
          sx={{ mb: 2, color: 'text.secondary' }}
        >
          Back to Brewings
        </Button>
      </Box>

      {/* Tea info card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <img 
              src={tea.photo || placeholderImg} 
              alt={tea.name}
              style={{ 
                width: 64, 
                height: 64, 
                objectFit: 'cover', 
                borderRadius: 12,
                border: '1px solid #ccc'
              }} 
            />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 600,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: '100%'
                }}
                title={tea.name}
              >
                {tea.name}
              </Typography>
              {tea.vendor && (
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: '100%'
                  }}
                  title={tea.vendor}
                >
                  {tea.vendor}
                </Typography>
              )}
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {onEdit && (
                <IconButton size="small" onClick={onEdit}>
                  <EditIcon />
                </IconButton>
              )}
              {onDelete && (
                <IconButton size="small" color="error" onClick={onDelete}>
                  <DeleteIcon />
                </IconButton>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Brewing details card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Brewing Details
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <Chip 
              label={`Amount: ${brewing.amount} ${brewing.unit}`} 
              variant="outlined" 
              color="primary"
            />
            <Chip 
              label={`Date: ${new Date(brewing.date).toLocaleDateString()}`} 
              variant="outlined"
            />
            <Chip 
              label={`Time: ${new Date(brewing.date).toLocaleTimeString()}`} 
              variant="outlined"
            />
          </Box>
        </CardContent>
      </Card>

            {/* Add Infusion Form */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Add Infusion
          </Typography>
          <Box display="flex" gap={1} mb={2} flexWrap="wrap">
            <TextField 
              label="Water (ml)" 
              value={waterAmount} 
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWaterAmount(e.target.value)} 
              size="small" 
              type="number" 
            />
            <TextField 
              label="Temp (°C)" 
              value={temperature} 
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTemperature(e.target.value)} 
              size="small" 
              type="number" 
            />
            <TextField 
              label="Steep Time (s)" 
              value={steepTime} 
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSteepTime(e.target.value)} 
              size="small" 
              type="number" 
            />
            <TextField 
              label="Taste Notes" 
              value={tasteNotes} 
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTasteNotes(e.target.value)} 
              size="small" 
            />
            <Button variant="contained" onClick={handleAddInfusion}>Add</Button>
          </Box>
        </CardContent>
      </Card>

      {/* Infusions section */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Infusions ({infusions.length})
          </Typography>
          {infusions.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
              No infusions recorded for this brewing.
            </Typography>
          ) : (
            <List>
              {infusions.map((infusion, index) => (
                <React.Fragment key={infusion.id}>
                  <ListItem
                    secondaryAction={
                      <>
                        <IconButton edge="end" aria-label="edit" onClick={() => handleEditInfusion(infusion)}>
                          <EditIcon />
                        </IconButton>
                        <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteInfusion(infusion.id)}>
                          <DeleteIcon />
                        </IconButton>
                      </>
                    }
                    disablePadding
                  >
                    <ListItemButton>
                      <ListItemText
                        primary={`Infusion ${index + 1}`}
                        secondary={`Water: ${infusion.waterAmount}ml, Temp: ${infusion.temperature}°C, Time: ${infusion.steepTime}s`}
                      />
                    </ListItemButton>
                  </ListItem>
                  {infusion.tasteNotes && (
                    <Box sx={{ px: 2, pb: 1 }}>
                      <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                        Notes: {infusion.tasteNotes}
                      </Typography>
                    </Box>
                  )}
                  {index < infusions.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      {/* Edit Infusion Dialog */}
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

export default BrewingDetails; 