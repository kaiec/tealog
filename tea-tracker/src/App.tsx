import React, { useState } from 'react'
import { AppBar, Toolbar, Typography, Container, Box, Paper } from '@mui/material'
import TeaList from './components/TeaList'
import BrewingList from './components/BrewingList'
import InfusionList from './components/InfusionList'
import type { Tea, Brewing } from './types'

function App() {
  const [selectedTea, setSelectedTea] = useState<Tea | null>(null)
  const [selectedBrewing, setSelectedBrewing] = useState<Brewing | null>(null)

  // Reset brewing selection if tea changes
  const handleSelectTea = (tea: Tea) => {
    setSelectedTea(tea)
    setSelectedBrewing(null)
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div">
            Tea Tracker
          </Typography>
        </Toolbar>
      </AppBar>
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Paper sx={{ p: 2 }}>
          <TeaList onSelect={handleSelectTea} selectedTeaId={selectedTea?.id} />
          <BrewingList
            tea={selectedTea}
            onSelect={setSelectedBrewing}
            selectedBrewingId={selectedBrewing?.id}
          />
          <InfusionList brewing={selectedBrewing} />
        </Paper>
      </Container>
    </Box>
  )
}

export default App
