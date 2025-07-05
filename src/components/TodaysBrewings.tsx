import React, { useEffect, useState } from 'react';
import { Box, Typography, Card, CardContent, List, ListItem, ListItemButton, Chip, Button } from '@mui/material';
import { getTeas, getAllBrewings } from '../db';
import type { Tea, Brewing } from '../types';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

interface TodaysBrewingsProps {
  onBack: () => void;
  onSelectBrewing: (brewing: Brewing, tea: Tea) => void;
}

const TodaysBrewings: React.FC<TodaysBrewingsProps> = ({ onBack, onSelectBrewing }) => {
  const [todaysBrewings, setTodaysBrewings] = useState<Array<{ brewing: Brewing; tea: Tea | { id: string; name: string; vendor: string; type: string; photo: string | undefined; inStash: boolean } }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTodaysBrewings() {
      try {
        const [teas, allBrewings] = await Promise.all([getTeas(), getAllBrewings()]);
        
        // Get today's date (start and end of day)
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
        
        // Filter brewings from today
        const todaysBrewingsData = allBrewings
          .filter(brewing => {
            const brewingDate = new Date(brewing.date);
            return brewingDate >= startOfDay && brewingDate <= endOfDay;
          })
          .map(brewing => {
            const tea = teas.find(t => t.id === brewing.teaId);
            return { brewing, tea: tea || { id: '', name: 'Unknown Tea', vendor: '', type: '', photo: undefined, inStash: true } };
          })
          .sort((a, b) => new Date(b.brewing.date).getTime() - new Date(a.brewing.date).getTime()); // Most recent first
        
        setTodaysBrewings(todaysBrewingsData);
      } catch (error) {
        console.error('Error fetching today\'s brewings:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchTodaysBrewings();
  }, []);

  const placeholderImg = `${import.meta.env.BASE_URL}tea-placeholder.png`;

  if (loading) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography>Loading today's brewings...</Typography>
      </Box>
    );
  }

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
          Back to Home
        </Button>
        <Typography variant="h5" gutterBottom>
          Today's Brewings
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Select a brewing to add an infusion
        </Typography>
      </Box>

      {todaysBrewings.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No brewings today
            </Typography>
            <Typography variant="body2" color="text.secondary">
              You haven't brewed any tea today. Start by adding a new brewing!
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <List>
          {todaysBrewings.map(({ brewing, tea }) => (
            <ListItem key={brewing.id} disablePadding sx={{ mb: 2 }}>
              <Card sx={{ width: '100%' }}>
                <ListItemButton onClick={() => onSelectBrewing(brewing, tea as Tea)}>
                  <CardContent sx={{ width: '100%', p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                      <img 
                        src={tea.photo || placeholderImg} 
                        alt={tea.name}
                        style={{ 
                          width: 64, 
                          height: 64, 
                          objectFit: 'cover', 
                          borderRadius: 12,
                          border: '1px solid #ccc',
                          flexShrink: 0
                        }} 
                      />
                      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Typography 
                          variant="h6" 
                          sx={{ 
                            fontWeight: 600,
                            lineHeight: 1.2
                          }}
                        >
                          {tea.name}
                        </Typography>
                        {tea.vendor && (
                          <Typography 
                            variant="body2" 
                            color="text.secondary"
                            sx={{ lineHeight: 1.2 }}
                          >
                            {tea.vendor}
                          </Typography>
                        )}
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 0.5 }}>
                          <Chip 
                            label={`${brewing.amount} ${brewing.unit}`} 
                            size="small" 
                            variant="outlined" 
                            color="primary"
                          />
                          <Chip 
                            label={new Date(brewing.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} 
                            size="small" 
                            variant="outlined"
                          />
                        </Box>
                      </Box>
                    </Box>
                  </CardContent>
                </ListItemButton>
              </Card>
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
};

export default TodaysBrewings; 