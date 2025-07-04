import React, { useEffect, useState } from 'react';
import { TextField, Button, Box, Typography, Dialog, DialogTitle, DialogContent, DialogActions, MenuItem, Select, InputLabel, FormControl, Rating, Checkbox, FormControlLabel } from '@mui/material';
import { getTeas, addTea } from '../db';
import type { Tea } from '../types';
import { v4 as uuidv4 } from 'uuid';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';

const teaTypeOptions = [
  'Black Tea',
  'Green Tea',
  'White Tea',
  'Herbal',
  'Fruits',
  'Misc',
];

const placeholderImg = `${import.meta.env.BASE_URL}tea-placeholder.png`;

const TeaList: React.FC<{ selectedTeaId?: string; onTeaAdded?: (teaId?: string) => void; showSnackbar?: (msg: string, action?: React.ReactNode) => void }> = ({ selectedTeaId, onTeaAdded, showSnackbar }) => {
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
  const [photo, setPhoto] = useState<string | undefined>(undefined);
  const [editPhoto, setEditPhoto] = useState<string | undefined>(undefined);
  const [inStash, setInStash] = useState(true);
  const [editInStash, setEditInStash] = useState(true);

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
          setPhoto(tea.photo);
          setInStash(tea.inStash !== false);
        }
      });
    } else {
      setName('');
      setType('');
      setVendor('');
      setDescription('');
      setNote('');
      setRating(null);
      setPhoto(undefined);
      setInStash(true);
    }
  }, [selectedTeaId]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = ev => {
        setPhoto(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeletePhoto = () => setPhoto(undefined);

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
        photo: editPhoto,
        inStash: editInStash,
      });
      setEditTea(null);
      // eslint-disable-next-line
      showSnackbar && showSnackbar('Tea updated');
      if (onTeaAdded) onTeaAdded(editTea.id);
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>{selectedTeaId ? 'Edit Tea' : 'Add a New Tea'}</Typography>
      <Box display="flex" flexDirection="column" gap={1} mb={2}>
        <Box display="flex" alignItems="center" gap={2}>
          <img src={photo || placeholderImg} alt="Tea" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, border: '1px solid #ccc' }} />
          <input
            accept="image/*"
            capture="environment"
            style={{ display: 'none' }}
            id="add-tea-photo-input"
            type="file"
            onChange={handlePhotoChange}
          />
          <label htmlFor="add-tea-photo-input">
            <Button variant="outlined" component="span" startIcon={<PhotoCameraIcon />}>Upload Photo</Button>
          </label>
          {photo && (
            <IconButton aria-label="delete" onClick={handleDeletePhoto}><DeleteIcon /></IconButton>
          )}
        </Box>
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
        <FormControlLabel
          control={<Checkbox checked={inStash} onChange={e => setInStash(e.target.checked)} />}
          label="Currently in stash"
        />
        <Box display="flex" gap={1}>
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
              photo: photo,
              inStash: inStash,
            };
            await addTea(newTea);
            setName(''); setType(''); setVendor(''); setDescription(''); setNote(''); setRating(null); setPhoto(undefined); setInStash(true);
            if (onTeaAdded) onTeaAdded(newTea.id);
            // eslint-disable-next-line
            showSnackbar && showSnackbar(selectedTeaId ? 'Tea updated' : 'Tea added');
          }}>{selectedTeaId ? 'Save' : 'Add'}</Button>
          <Button variant="outlined" color="secondary" onClick={() => {
            setName(''); setType(''); setVendor(''); setDescription(''); setNote(''); setRating(null); setPhoto(undefined); setInStash(true);
            if (onTeaAdded) onTeaAdded(undefined);
          }}>Cancel</Button>
        </Box>
      </Box>
      <Dialog open={!!editTea} onClose={() => setEditTea(null)}>
        <DialogTitle>Edit Tea</DialogTitle>
        <DialogContent>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <img src={editPhoto || placeholderImg} alt="Tea" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, border: '1px solid #ccc' }} />
            <input
              accept="image/*"
              capture="environment"
              style={{ display: 'none' }}
              id="edit-tea-photo-input"
              type="file"
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = ev => {
                    setEditPhoto(ev.target?.result as string);
                  };
                  reader.readAsDataURL(file);
                }
              }}
            />
            <label htmlFor="edit-tea-photo-input">
              <Button variant="outlined" component="span" startIcon={<PhotoCameraIcon />}>Upload Photo</Button>
            </label>
            {editPhoto && (
              <IconButton aria-label="delete" onClick={() => setEditPhoto(undefined)}><DeleteIcon /></IconButton>
            )}
          </Box>
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
          <FormControlLabel
            control={<Checkbox checked={editInStash} onChange={e => setEditInStash(e.target.checked)} />}
            label="Currently in stash"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditTea(null)} color="secondary">Cancel</Button>
          <Button onClick={handleEditSave} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TeaList; 