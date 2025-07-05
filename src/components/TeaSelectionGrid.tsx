import React, { useEffect, useState } from 'react';
import { Grid, Card, CardContent, Typography, Box, CardActionArea } from '@mui/material';
import { getTeas, getAllBrewings } from '../db';
import type { Tea as TeaBase } from '../types';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

type Tea = TeaBase & { recentBrewed?: string | null };

interface TeaSelectionGridProps {
  onSelectTea: (tea: Tea) => void;
  selectedTeaId?: string;
}

const TeaSelectionGrid: React.FC<TeaSelectionGridProps> = ({ onSelectTea, selectedTeaId }) => {
  const [teas, setTeas] = useState<Tea[]>([]);
  const [recentTeas, setRecentTeas] = useState<string[]>([]);

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

      // Filter to only teas in stash and attach recentBrewed info
      const stashTeas = teas
        .filter(tea => tea.inStash !== false)
        .map(tea => ({ 
          ...tea, 
          recentBrewed: teaIdToRecentBrew.get(tea.id) || null 
        }));

      // Sort by most recently used
      const sortedTeas = stashTeas.sort((a, b) => {
        if (a.recentBrewed && b.recentBrewed) {
          return b.recentBrewed.localeCompare(a.recentBrewed);
        }
        if (a.recentBrewed) return -1;
        if (b.recentBrewed) return 1;
        return a.name.localeCompare(b.name);
      });

      setTeas(sortedTeas);

      // Extract recent tea IDs for highlighting
      const recentIds = sortedTeas
        .filter(tea => tea.recentBrewed)
        .slice(0, 5)
        .map(tea => tea.id);
      setRecentTeas(recentIds);
    }

    fetchTeasWithBrewed();
  }, []);

  const placeholderImg = `${import.meta.env.BASE_URL}tea-placeholder.png`;

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Select Tea to Brew
      </Typography>
      <Grid container spacing={2}>
        {teas.map((tea) => (
          <Grid item xs={6} sm={4} key={tea.id}>
            <Card 
              sx={{ 
                height: '100%',
                border: selectedTeaId === tea.id ? 2 : 1,
                borderColor: selectedTeaId === tea.id ? 'primary.main' : 'divider',
                position: 'relative',
                '&:hover': {
                  boxShadow: 4,
                }
              }}
            >
              <CardActionArea 
                onClick={() => onSelectTea(tea)}
                sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
              >
                <Box sx={{ position: 'relative', p: 1 }}>
                  <img 
                    src={tea.photo || placeholderImg} 
                    alt={tea.name}
                    style={{ 
                      width: '100%', 
                      height: 120, 
                      objectFit: 'cover', 
                      borderRadius: 8 
                    }} 
                  />
                  {tea.inStash !== false && (
                    <CheckCircleIcon 
                      sx={{ 
                        position: 'absolute', 
                        top: 8, 
                        right: 8, 
                        color: 'success.main',
                        backgroundColor: 'white',
                        borderRadius: '50%',
                        fontSize: 20
                      }} 
                    />
                  )}
                </Box>
                <CardContent sx={{ flex: 1, p: 1, textAlign: 'center' }}>
                  <Typography 
                    variant="subtitle2" 
                    sx={{ 
                      fontWeight: 500,
                      fontSize: '0.875rem',
                      lineHeight: 1.2,
                      mb: 0.5,
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
                      variant="caption" 
                      color="text.secondary"
                      sx={{ 
                        fontSize: '0.75rem',
                        lineHeight: 1.2,
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
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
      {teas.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body1" color="text.secondary">
            No teas in stash. Add some teas first!
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default TeaSelectionGrid; 