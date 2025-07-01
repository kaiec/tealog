import { useState, useEffect } from 'react'
import { AppBar, Toolbar, Typography, Container, Box, Paper, Button, Stack, IconButton, MenuItem, Select, InputLabel, FormControl, Snackbar } from '@mui/material'
import TeaList from './components/TeaList'
import BrewingList from './components/BrewingList'
import InfusionList from './components/InfusionList'
import BrewingJournal from './components/BrewingJournal'
import TeaListView from './components/TeaListView'
import TeaDetails from './components/TeaDetails'
import { getTeas } from './db'
import type { Tea, Brewing } from './types'
import MenuIcon from '@mui/icons-material/Menu'
import Menu from '@mui/material/Menu'

// Navigation states
const VIEW_HOME = 'home'
const VIEW_LOG = 'log'
const VIEW_TRACKER = 'tracker'
const VIEW_ADD_TEA = 'add-tea'
const VIEW_TEA_LIST = 'tea-list'
const VIEW_TEA_DETAILS = 'tea-details'
const VIEW_EDIT_TEA = 'edit-tea'

function App() {
  const [selectedTea, setSelectedTea] = useState<Tea | null>(null)
  const [selectedBrewing, setSelectedBrewing] = useState<Brewing | null>(null)
  const [view, setViewState] = useState(VIEW_HOME)
  const [teas, setTeas] = useState<Tea[]>([])
  const [teaListKey, setTeaListKey] = useState(0) // for forcing TeaList refresh
  const [brewingListKey, setBrewingListKey] = useState(0) // for forcing BrewingList refresh
  const [recentTeas, setRecentTeas] = useState<string[]>([])
  const [snackbar, setSnackbar] = useState<{ open: boolean, message: string, action?: React.ReactNode }>({ open: false, message: '' })
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null)
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [selectedTeaId, setSelectedTeaId] = useState<string | null>(null)
  const [editTeaId, setEditTeaId] = useState<string | null>(null)

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

  useEffect(() => {
    const handler = () => setUpdateAvailable(true)
    window.addEventListener('pwa-update-available', handler)
    return () => window.removeEventListener('pwa-update-available', handler)
  }, [])

  // Set view and push to history
  const setView = (newView: string) => {
    setViewState(newView)
    if (newView !== VIEW_EDIT_TEA) setEditTeaId(null)
    window.history.pushState({ view: newView }, '')
  }

  // On mount, set initial state and listen for popstate
  useEffect(() => {
    // Set initial state
    window.history.replaceState({ view: VIEW_HOME }, '')
    const onPopState = (event: PopStateEvent) => {
      if (event.state && event.state.view) {
        setViewState(event.state.view)
      }
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

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
  const handleTeaAdded = (newTeaId?: string) => {
    setTeaListKey(k => k + 1)
    setView(VIEW_TEA_LIST)
  }

  const showSnackbar = (message: string, action?: React.ReactNode) => {
    setSnackbar({ open: true, message, action })
  }

  const handleSnackbarClose = () => {
    setSnackbar(s => ({ ...s, open: false }))
  }

  const openMenu = (event: React.MouseEvent<HTMLElement>) => setMenuAnchorEl(event.currentTarget)
  const closeMenu = () => setMenuAnchorEl(null)
  const handleMenuSelect = (viewName: string) => {
    setView(viewName)
    closeMenu()
  }

  // Sorted teas: most recently used on top
  const sortedTeas = [...teas].sort((a, b) => {
    const aIdx = recentTeas.indexOf(a.id)
    const bIdx = recentTeas.indexOf(b.id)
    if (aIdx === -1 && bIdx === -1) return a.name.localeCompare(b.name)
    if (aIdx === -1) return 1
    if (bIdx === -1) return -1
    return aIdx - bIdx
  })

  // Add a handler for viewing tea list
  const handleViewTeaList = () => {
    setView(VIEW_TEA_LIST)
    setSelectedTeaId(null)
  }

  // Add a handler for viewing tea details
  const handleViewTeaDetails = (teaId: string) => {
    setSelectedTeaId(teaId)
    setView(VIEW_TEA_DETAILS)
  }

  const handleEditTea = (teaId: string) => {
    setEditTeaId(teaId)
    setView(VIEW_EDIT_TEA)
  }

  return (
    <Box sx={{ minHeight: '100vh', width: '100vw', overflowX: 'hidden', display: 'flex', flexDirection: 'column', bgcolor: 'background.default', backgroundImage: `url(${import.meta.env.BASE_URL}tea-leaves-139617_1280.jpg)`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
      {view !== VIEW_HOME && (
        <AppBar position="static" color="primary" elevation={3} sx={{ boxShadow: '0 2px 8px 0 rgba(56,142,60,0.10)' }}>
          <Toolbar>
            <img src={`${import.meta.env.BASE_URL}logo.svg`} alt="TeaMinder Logo" style={{ height: 32, marginRight: 8, maxWidth: '100%' }} />
            <Typography variant="h5" component="div" sx={{ flexGrow: 1, fontWeight: 400, letterSpacing: 1 }}>
              TeaMinder
            </Typography>
            <IconButton color="inherit" edge="end" onClick={openMenu}>
              <MenuIcon />
            </IconButton>
            <Menu anchorEl={menuAnchorEl} open={Boolean(menuAnchorEl)} onClose={closeMenu} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }}>
              <MenuItem onClick={() => handleMenuSelect(VIEW_HOME)}>Home</MenuItem>
              <MenuItem onClick={() => handleMenuSelect(VIEW_LOG)}>View Brewing Journal</MenuItem>
              <MenuItem onClick={() => handleMenuSelect(VIEW_ADD_TEA)}>Add New Tea</MenuItem>
              <MenuItem onClick={() => handleMenuSelect(VIEW_TRACKER)}>Add New Brewing</MenuItem>
              <MenuItem onClick={handleAddInfusionToLastBrewing}>Add Infusion to Last Brewing</MenuItem>
              <MenuItem onClick={() => handleMenuSelect(VIEW_TEA_LIST)}>View All Teas</MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>
      )}
      <Container maxWidth="sm" sx={{ flex: 1, display: 'flex', flexDirection: 'column', py: 4, minHeight: 0, width: '100%', maxWidth: '100vw' }}>
        <Paper sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 2, minHeight: 0, width: '100%', maxWidth: '100vw' }}>
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            {view === VIEW_HOME && (
              <Stack spacing={3} alignItems="center" sx={{ flex: 1, justifyContent: 'center' }}>
                <Box textAlign="center">
                  <img src={`${import.meta.env.BASE_URL}logo.svg`} alt="TeaMinder Logo" style={{ height: 80, marginBottom: 8, maxWidth: '100%' }} />
                  <Typography variant="h4" sx={{ fontWeight: 400, letterSpacing: 2, color: 'white' }}>
                    TeaMinder
                  </Typography>
                </Box>
                <Button variant="contained" size="large" fullWidth sx={{ minHeight: 56 }} onClick={() => setView(VIEW_LOG)}>
                  View Brewing Journal
                </Button>
                <Button variant="contained" size="large" fullWidth sx={{ minHeight: 56 }} onClick={handleAddTea}>
                  Add New Tea
                </Button>
                <Button variant="contained" size="large" fullWidth sx={{ minHeight: 56 }} onClick={handleAddBrewing}>
                  Add New Brewing
                </Button>
                <Button variant="contained" size="large" fullWidth sx={{ minHeight: 56 }} onClick={handleAddInfusionToLastBrewing}>
                  Add Infusion to Last Brewing
                </Button>
                <Button variant="contained" size="large" fullWidth sx={{ minHeight: 56 }} onClick={handleViewTeaList}>
                  View All Teas
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
              <TeaList key={teaListKey} selectedTeaId={undefined} onTeaAdded={handleTeaAdded} showSnackbar={showSnackbar} />
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
                  showSnackbar={showSnackbar}
                />
                <InfusionList brewing={selectedBrewing} showSnackbar={showSnackbar} />
              </>
            )}
            {view === VIEW_TEA_LIST && (
              <TeaListView onSelectTea={handleViewTeaDetails} />
            )}
            {view === VIEW_TEA_DETAILS && selectedTeaId && (
              <TeaDetails
                teaId={selectedTeaId}
                onBack={handleViewTeaList}
                onEdit={() => handleEditTea(selectedTeaId)}
                onAddBrewing={() => {
                  const tea = teas.find(t => t.id === selectedTeaId) || null;
                  setSelectedTea(tea);
                  setView(VIEW_TRACKER);
                }}
              />
            )}
            {view === VIEW_EDIT_TEA && editTeaId && (
              <TeaList key={editTeaId} selectedTeaId={editTeaId} onTeaAdded={id => {
                setEditTeaId(null)
                if (id) {
                  setSelectedTeaId(id)
                  setView(VIEW_TEA_DETAILS)
                }
              }} showSnackbar={showSnackbar} />
            )}
            {/* Empty state placeholder for any view with no content */}
            {view !== VIEW_HOME && view !== VIEW_LOG && view !== VIEW_ADD_TEA && view !== VIEW_TRACKER && view !== VIEW_TEA_LIST && view !== VIEW_TEA_DETAILS && view !== VIEW_EDIT_TEA && (
              <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'text.secondary' }}>
                <Typography variant="body1">No content to display.</Typography>
              </Box>
            )}
          </Box>
        </Paper>
      </Container>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        message={snackbar.message}
        action={snackbar.action}
      />
      <Snackbar
        open={updateAvailable}
        message="A new version is available. Reload?"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        action={
          <Button color="secondary" size="small" onClick={() => window.location.reload()}>
            Reload
          </Button>
        }
      />
    </Box>
  )
}

export default App
