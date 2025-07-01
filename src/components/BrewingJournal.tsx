import React, { useEffect, useState } from 'react';
import { List, ListItem, ListItemText, Typography, Box, Paper, ListItemButton } from '@mui/material';
import { getTeas, getBrewingsByTea, getInfusionsByBrewing } from '../db';
import type { Tea, Brewing, Infusion } from '../types';

interface BrewingJournalProps {
  onSelectBrewing?: (brewing: Brewing, tea: Tea) => void;
}

const BrewingJournal: React.FC<BrewingJournalProps> = ({ onSelectBrewing }) => {
  const [entries, setEntries] = useState<{
    tea: Tea;
    brewing: Brewing;
    infusions: Infusion[];
  }[]>([]);

  useEffect(() => {
    const fetchAll = async () => {
      const teas = await getTeas();
      const all: { tea: Tea; brewing: Brewing; infusions: Infusion[] }[] = [];
      for (const tea of teas) {
        const brewings = await getBrewingsByTea(tea.id);
        for (const brewing of brewings) {
          const infusions = await getInfusionsByBrewing(brewing.id);
          all.push({ tea, brewing, infusions });
        }
      }
      all.sort((a: { tea: Tea; brewing: Brewing; infusions: Infusion[] }, b: { tea: Tea; brewing: Brewing; infusions: Infusion[] }) => b.brewing.date.localeCompare(a.brewing.date));
      setEntries(all);
    };
    fetchAll();
  }, []);

  return (
    <Box mt={4}>
      <Typography variant="h6" gutterBottom>Brewing Journal</Typography>
      <Paper variant="outlined">
        <List>
          {entries.length === 0 && (
            <ListItem>
              <ListItemText primary="No brewings yet." />
            </ListItem>
          )}
          {entries.map(({ tea, brewing, infusions }) => {
            const totalWater = infusions.reduce((sum, i) => sum + i.waterAmount, 0);
            const content = (
              <ListItemText
                primary={`${tea.name} (${tea.type || 'Unknown'}) — ${brewing.amount} ${brewing.unit}`}
                secondary={`Brewed: ${new Date(brewing.date).toLocaleString()} | Total water: ${totalWater} ml`}
              />
            );
            return onSelectBrewing ? (
              <ListItem key={brewing.id} disablePadding>
                <ListItemButton onClick={() => onSelectBrewing(brewing, tea)}>
                  {content}
                </ListItemButton>
              </ListItem>
            ) : (
              <ListItem key={brewing.id}>{content}</ListItem>
            );
          })}
        </List>
      </Paper>
    </Box>
  );
};

export default BrewingJournal; 