import { useState, useEffect } from 'react'
import { AppBar, Toolbar, Typography, Container, Box, Paper, Button, Stack, IconButton, MenuItem, Select, InputLabel, FormControl } from '@mui/material'
import HomeIcon from '@mui/icons-material/Home'
import TeaList from './components/TeaList'
import BrewingList from './components/BrewingList'
import InfusionList from './components/InfusionList'
import BrewingJournal from './components/BrewingJournal'
import { getTeas } from './db'
import type { Tea, Brewing } from './types'

// Navigation states
const VIEW_HOME = 'home'
const VIEW_LOG = 'log'
const VIEW_TRACKER = 'tracker'
const VIEW_ADD_TEA = 'add-tea'

function App() {
  const [selectedTea, setSelectedTea] = useState<Tea | null>(null)
  const [selectedBrewing, setSelectedBrewing] = useState<Brewing | null>(null)
  const [view, setView] = useState(VIEW_HOME)
  const [teas, setTeas] = useState<Tea[]>([])
  const [teaListKey, setTeaListKey] = useState(0) // for forcing TeaList refresh
  const [brewingListKey, setBrewingListKey] = useState(0) // for forcing BrewingList refresh
  const [recentTeas, setRecentTeas] = useState<string[]>([])

  // Load teas for dropdown
  useEffect(() => {
    getTeas().then(setTeas)
  }, [teaListKey])

  // Track recently used teas
  useEffect(() => {
    if (selectedTea) {
      setRecentTeas(prev => [selectedTea.id, ...prev.filter(id => id !== selectedTea.id)])
    }
  }, [selectedTea])

  // Home screen actions
  const handleAddTea = () => {
    setView(VIEW_ADD_TEA)
    setSelectedTea(null)
    setSelectedBrewing(null)
    setTeaListKey(k => k + 1) // force TeaList to show add form
  }
  const handleAddBrewing = () => {
    setView(VIEW_TRACKER)
    setSelectedBrewing(null)
    setBrewingListKey(k => k + 1) // force BrewingList to show add form
  }
  const handleAddInfusionToLastBrewing = () => {
    setView(VIEW_TRACKER)
    // Select the last tea and last brewing
    setSelectedTea(null)
    setSelectedBrewing(null)
    setTimeout(() => {
      setSelectedTea(prev => prev) // trigger rerender
    }, 0)
  }
  const handleTeaAdded = () => {
    setTeaListKey(k => k + 1)
  }

  // Home button (not shown on home)
  const HomeButton = view !== VIEW_HOME ? (
    <IconButton color="inherit" onClick={() => setView(VIEW_HOME)}>
      <HomeIcon />
    </IconButton>
  ) : null

  // Sorted teas: most recently used on top
  const sortedTeas = [...teas].sort((a, b) => {
    const aIdx = recentTeas.indexOf(a.id)
    const bIdx = recentTeas.indexOf(b.id)
    if (aIdx === -1 && bIdx === -1) return a.name.localeCompare(b.name)
    if (aIdx === -1) return 1
    if (bIdx === -1) return -1
    return aIdx - bIdx
  })

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="static">
        <Toolbar>
          {HomeButton}
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Tea Tracker
          </Typography>
        </Toolbar>
      </AppBar>
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Paper sx={{ p: 2 }}>
          {view === VIEW_HOME && (
            <Stack spacing={3} alignItems="center">
              <Typography variant="h5" gutterBottom>Welcome to Tea Tracker</Typography>
              <Button variant="contained" size="large" onClick={() => setView(VIEW_LOG)}>
                View Brewing Journal
              </Button>
              <Button variant="contained" size="large" onClick={handleAddTea}>
                Add New Tea
              </Button>
              <Button variant="contained" size="large" onClick={handleAddBrewing}>
                Add New Brewing
              </Button>
              <Button variant="contained" size="large" onClick={handleAddInfusionToLastBrewing}>
                Add Infusion to Last Brewing
              </Button>
            </Stack>
          )}
          {view === VIEW_LOG && (
            <BrewingJournal onSelectBrewing={(brewing, tea) => {
              setSelectedTea(tea)
              setSelectedBrewing(brewing)
              setView(VIEW_TRACKER)
            }} />
          )}
          {view === VIEW_ADD_TEA && (
            <>
              <Typography variant="h6" gutterBottom>Add a New Tea</Typography>
              <TeaList key={teaListKey} onSelect={tea => {
                setSelectedTea(tea)
                setView(VIEW_TRACKER)
              }} selectedTeaId={undefined} onTeaAdded={handleTeaAdded} />
            </>
          )}
          {view === VIEW_TRACKER && (
            <>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Select Tea</InputLabel>
                <Select
                  value={selectedTea?.id || ''}
                  label="Select Tea"
                  onChange={e => {
                    const tea = teas.find(t => t.id === e.target.value)
                    setSelectedTea(tea || null)
                    setSelectedBrewing(null)
                  }}
                >
                  {sortedTeas.map(tea => (
                    <MenuItem key={tea.id} value={tea.id}>{tea.name} {tea.type ? `(${tea.type})` : ''}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <BrewingList
                key={brewingListKey}
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
