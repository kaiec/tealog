import React, { useEffect, useState } from 'react';
import { Card, CardContent, Typography, Box, Rating, Paper, List, ListItemButton, TextField, IconButton, Tooltip } from '@mui/material';
import { getTeas, getAllBrewings } from '../db';
import type { Tea as TeaBase } from '../types';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import AddIcon from '@mui/icons-material/Add';

type Tea = TeaBase & { recentBrewed?: string | null };

const TeaListView: React.FC<{ onSelectTea: (teaId: string) => void; onAddTea?: () => void }> = ({ onSelectTea, onAddTea }) => {
  const [teas, setTeas] = useState<Tea[]>([]);
  const [search, setSearch] = useState('');
  const [showOnlyStash, setShowOnlyStash] = useState(false);
  useEffect(() => {
    async function fetchTeasWithBrewed() {
      const [teas, brewings] = await Promise.all([getTeas(), getAllBrewings()]);
      // Map teaId to most recent brewing date
      const teaIdToRecentBrew = new Map<string, string>();
      for (const brewing of brewings) {
        const prev = teaIdToRecentBrew.get(brewing.teaId);
        if (!prev || brewing.date > prev) {
          teaIdToRecentBrew.set(brewing.teaId, brewing.date);
        }
      }
      // Attach recentBrewed to each tea
      setTeas(teas.map(tea => ({ ...tea, recentBrewed: teaIdToRecentBrew.get(tea.id) || null })));
    }
    fetchTeasWithBrewed();
  }, []);
  const placeholderImg = `${import.meta.env.BASE_URL}tea-placeholder.png`;
  const filteredTeas = teas.filter(tea => {
    const q = search.toLowerCase();
    const matches = (
      tea.name.toLowerCase().includes(q) ||
      (tea.vendor?.toLowerCase().includes(q) ?? false) ||
      (tea.type?.toLowerCase().includes(q) ?? false)
    );
    return matches && (!showOnlyStash || tea.inStash !== false);
  });
  // Sort: inStash first, then by most recently brewed (desc)
  const sortedTeas = [...filteredTeas].sort((a, b) => {
    if ((a.inStash !== false) !== (b.inStash !== false)) {
      return (a.inStash !== false) ? -1 : 1;
    }
    // Both same stash status, sort by recentBrewed desc
    if (a.recentBrewed && b.recentBrewed) {
      return b.recentBrewed.localeCompare(a.recentBrewed);
    }
    if (a.recentBrewed) return -1;
    if (b.recentBrewed) return 1;
    return a.name.localeCompare(b.name);
  });
  return (
    <Box>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
        <Typography variant="h5" gutterBottom>All Teas</Typography>
        {onAddTea && (
          <Tooltip title="Add Tea">
            <IconButton color="primary" onClick={onAddTea} size="large">
              <AddIcon />
            </IconButton>
          </Tooltip>
        )}
      </Box>
      <Box display="flex" alignItems="center" gap={1} mb={1}>
        <TextField
          label="Search teas..."
          variant="outlined"
          size="small"
          fullWidth
          margin="normal"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <Tooltip title={showOnlyStash ? "Show all teas" : "Show only teas in stash"}>
          <IconButton onClick={() => setShowOnlyStash(v => !v)}>
            {showOnlyStash ? <CheckCircleIcon color="success" /> : <RemoveCircleOutlineIcon color="disabled" />}
          </IconButton>
        </Tooltip>
      </Box>
      <Paper variant="outlined">
        <List>
          {filteredTeas.length === 0 && (
            <Typography variant="body1" color="text.secondary" sx={{ p: 2 }}>No teas found.</Typography>
          )}
          {sortedTeas.map(tea => (
            <ListItemButton key={tea.id} onClick={() => onSelectTea(tea.id)}>
              <Card sx={{ width: '100%', mb: 1, display: 'flex', alignItems: 'center', gap: 2, p: 1, boxShadow: 'none' }}>
                <img src={tea.photo || placeholderImg} alt="Tea" style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 8, border: '1px solid #ccc' }} />
                <CardContent sx={{ flex: 1, p: 0, '&:last-child': { pb: 0 } }}>
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 180 }}
                  >
                    {tea.name}
                  </Typography>
                  {tea.vendor && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 180 }}
                    >
                      {tea.vendor}
                    </Typography>
                  )}
                </CardContent>
                {tea.inStash !== false ? (
                  <Tooltip title="In stash"><CheckCircleIcon color="success" /></Tooltip>
                ) : (
                  <Tooltip title="Not in stash"><RemoveCircleOutlineIcon color="disabled" /></Tooltip>
                )}
              </Card>
            </ListItemButton>
          ))}
        </List>
      </Paper>
    </Box>
  );
};
export default TeaListView; 