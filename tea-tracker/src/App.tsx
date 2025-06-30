import React, { useState } from 'react'
import { AppBar, Toolbar, Typography, Container, Box, Paper, Button, Stack } from '@mui/material'
import TeaList from './components/TeaList'
import BrewingList from './components/BrewingList'
import InfusionList from './components/InfusionList'
import BrewingJournal from './components/BrewingJournal'
import type { Tea, Brewing } from './types'

function App() {
  const [selectedTea, setSelectedTea] = useState<Tea | null>(null)
  const [selectedBrewing, setSelectedBrewing] = useState<Brewing | null>(null)
  const [showJournal, setShowJournal] = useState(false)

  // Reset brewing selection if tea changes
  const handleSelectTea = (tea: Tea) => {
    setSelectedTea(tea)
    setSelectedBrewing(null)
  }

  const handleJournalSelect = (brewing: Brewing, tea: Tea) => {
    setSelectedTea(tea)
    setSelectedBrewing(brewing)
    setShowJournal(false)
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Tea Tracker
          </Typography>
          <Button color="inherit" onClick={() => setShowJournal(j => !j)}>
            {showJournal ? 'Back to Tracker' : 'Brewing Journal'}
          </Button>
        </Toolbar>
      </AppBar>
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Paper sx={{ p: 2 }}>
          {showJournal ? (
            <BrewingJournal onSelectBrewing={handleJournalSelect} />
          ) : (
            <>
              <TeaList onSelect={handleSelectTea} selectedTeaId={selectedTea?.id} />
              <BrewingList
                tea={selectedTea}
                onSelect={setSelectedBrewing}
                selectedBrewingId={selectedBrewing?.id}
              />
              <InfusionList brewing={selectedBrewing} />
            </>
          )}
        </Paper>
      </Container>
    </Box>
  )
}

export default App
