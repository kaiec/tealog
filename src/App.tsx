import { useState, useEffect } from 'react'
import { AppBar, Toolbar, Typography, Container, Box, Paper, Button, Stack, IconButton, MenuItem, Select, InputLabel, FormControl, Snackbar } from '@mui/material'
import TeaList from './components/TeaList'
import BrewingList from './components/BrewingList'
import BrewingJournal from './components/BrewingJournal'
import TeaListView from './components/TeaListView'
import TeaDetails from './components/TeaDetails'
import TeaSelectionGrid from './components/TeaSelectionGrid'
import BrewingDetails from './components/BrewingDetails'
import { getTeas } from './db'
import type { Tea, Brewing } from './types'
import MenuIcon from '@mui/icons-material/Menu'
import Menu from '@mui/material/Menu'
import AddIcon from '@mui/icons-material/Add'
import SpeedDial from '@mui/material/SpeedDial'
import SpeedDialAction from '@mui/material/SpeedDialAction'
import LocalCafeIcon from '@mui/icons-material/LocalCafe'
import SpaIcon from '@mui/icons-material/Spa'
import WaterDropIcon from '@mui/icons-material/WaterDrop'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'

// Navigation states
const VIEW_HOME = 'home'
const VIEW_LOG = 'brewing-journal'
const VIEW_TRACKER = 'brewing-tracker'
const VIEW_ADD_TEA = 'add-tea'
const VIEW_TEA_LIST = 'tea-list'
const VIEW_TEA_DETAILS = 'tea-details'
const VIEW_EDIT_TEA = 'edit-tea'
const VIEW_BREWING_DETAILS = 'brewing-details'

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
  const [selectedBrewingForDetails, setSelectedBrewingForDetails] = useState<Brewing | null>(null)

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

  // Helper functions for tea selection state management
  const selectTea = (tea: Tea) => {
    setSelectedTea(tea)
    setSelectedBrewing(null)
    // Don't push new history state - just update the current state
    const currentState = window.history.state || { view: VIEW_TRACKER, teaSelected: false }
    const newState = { ...currentState, teaSelected: true }
    window.history.replaceState(newState, '')
  }

  const deselectTea = () => {
    setSelectedTea(null)
    setSelectedBrewing(null)
    // Don't push new history state - just update the current state
    const currentState = window.history.state || { view: VIEW_TRACKER, teaSelected: true }
    const newState = { ...currentState, teaSelected: false }
    window.history.replaceState(newState, '')
  }

  // Set view and push to history
  const setView = (newView: string, clearState: boolean = false, forceTeaSelected?: boolean) => {
    setViewState(newView)
    if (clearState || newView !== VIEW_EDIT_TEA) {
      setEditTeaId(null)
      setSelectedTeaId(null)
      setSelectedBrewingForDetails(null)
    }
    if (newView === VIEW_HOME) {
      // Clear all state when going home
      setSelectedTea(null)
      setSelectedBrewing(null)
    }
    // Set tea selection state for VIEW_TRACKER
    const state: { view: string; teaSelected?: boolean; teaId?: string; editTeaId?: string; brewingId?: string } = { view: newView }
    if (newView === VIEW_TRACKER) {
      // Use explicit teaSelected state if provided, otherwise use current selectedTea state
      state.teaSelected = forceTeaSelected !== undefined ? forceTeaSelected : selectedTea !== null
    }
    if (newView === VIEW_TEA_DETAILS && selectedTeaId) {
      state.teaId = selectedTeaId
    }
    if (newView === VIEW_EDIT_TEA && editTeaId) {
      state.editTeaId = editTeaId
    }
    if (newView === VIEW_BREWING_DETAILS && selectedBrewingForDetails) {
      state.brewingId = selectedBrewingForDetails.id
    }
    window.history.pushState(state, '')
  }

  // On mount, set initial state and listen for popstate
  useEffect(() => {
    // Set initial state
    window.history.replaceState({ view: VIEW_HOME }, '')
    const onPopState = (event: PopStateEvent) => {
      if (event.state && event.state.view) {
        setViewState(event.state.view)
        // Clear state when navigating back to home
        if (event.state.view === VIEW_HOME) {
          setSelectedTea(null)
          setSelectedBrewing(null)
          setSelectedTeaId(null)
          setSelectedBrewingForDetails(null)
          setEditTeaId(null)
        }
        // Handle tea selection state in VIEW_TRACKER
        if (event.state.view === VIEW_TRACKER) {
          if (event.state.teaSelected === false) {
            setSelectedTea(null)
            setSelectedBrewing(null)
          } else if (event.state.teaSelected === true && !selectedTea) {
            setSelectedTea(null)
            setSelectedBrewing(null)
          }
        }
        // Handle other view-specific state
        if (event.state.view === VIEW_TEA_DETAILS && event.state.teaId) {
          setSelectedTeaId(event.state.teaId)
        }
        if (event.state.view === VIEW_EDIT_TEA && event.state.editTeaId) {
          setEditTeaId(event.state.editTeaId)
        }
        if (event.state.view === VIEW_BREWING_DETAILS && event.state.brewingId) {
          import('./db').then(db => {
            db.getBrewingsByTea && db.getTeas && db.getTeas().then(teasList => {
              const findBrewing = async () => {
                for (const tea of teasList) {
                  const brewings = await db.getBrewingsByTea(tea.id)
                  const found = brewings.find(b => b.id === event.state.brewingId)
                  if (found) {
                    setSelectedBrewingForDetails(found)
                    setViewState(VIEW_BREWING_DETAILS)
                    return
                  }
                }
                setSelectedBrewingForDetails(null)
              }
              findBrewing()
            })
          })
        }
      } else {
        // If no state, go to home
        setViewState(VIEW_HOME)
        setSelectedTea(null)
        setSelectedBrewing(null)
        setSelectedTeaId(null)
        setSelectedBrewingForDetails(null)
        setEditTeaId(null)
      }
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [selectedTea, teas]) // Add teas as dependency

  // Home screen actions
  const handleAddTea = () => {
    setView(VIEW_ADD_TEA)
    setSelectedTea(null)
    setSelectedBrewing(null)
    setTeaListKey(k => k + 1) // force TeaList to show add form
  }
  const handleAddBrewing = () => {
    setSelectedTea(null) // Ensure we start with tea selection
    setSelectedBrewing(null)
    setBrewingListKey(k => k + 1) // force BrewingList to show add form
    setView(VIEW_TRACKER, false, false) // Explicitly set teaSelected to false
  }
  const handleAddInfusionToLastBrewing = () => {
    setSelectedTea(null) // Ensure we start with tea selection
    setSelectedBrewing(null)
    setView(VIEW_TRACKER, false, false) // Explicitly set teaSelected to false
  }
  const handleTeaAdded = () => {
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
    if (viewName === VIEW_TRACKER) {
      setSelectedTea(null) // Ensure we start with tea selection
      setSelectedBrewing(null)
      setView(VIEW_TRACKER, false, false) // Explicitly set teaSelected to false
    } else {
      setView(viewName)
    }
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

  // Helper to show brewing details and update history
  const handleShowBrewingDetails = (brewing: Brewing) => {
    setSelectedBrewingForDetails(brewing)
    setViewState(VIEW_BREWING_DETAILS)
    window.history.pushState({ view: VIEW_BREWING_DETAILS, brewingId: brewing.id }, '')
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
                <Button variant="contained" size="large" fullWidth sx={{ minHeight: 56 }} onClick={handleViewTeaList}>
                  View All Teas
                </Button>
                <Box sx={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1200 }}>
                  <SpeedDial
                    ariaLabel="Add actions"
                    icon={<AddIcon />}
                    direction="up"
                  >
                    <SpeedDialAction
                      icon={<SpaIcon />}
                      tooltipTitle="Add Tea"
                      onClick={handleAddTea}
                    />
                    <SpeedDialAction
                      icon={<LocalCafeIcon />}
                      tooltipTitle="Add Brewing"
                      onClick={handleAddBrewing}
                    />
                    <SpeedDialAction
                      icon={<WaterDropIcon />}
                      tooltipTitle="Add Infusion"
                      onClick={handleAddInfusionToLastBrewing}
                    />
                  </SpeedDial>
                </Box>
              </Stack>
            )}
            {view === VIEW_LOG && (
              <BrewingJournal onSelectBrewing={(brewing, tea) => {
                setSelectedTea(tea)
                setSelectedBrewing(brewing)
                setView(VIEW_TRACKER, false, true) // Explicitly set teaSelected to true
              }} />
            )}
            {view === VIEW_ADD_TEA && (
              <TeaList 
                key={teaListKey} 
                selectedTeaId={undefined} 
                onTeaAdded={(teaId) => {
                  if (teaId) {
                    handleTeaAdded()
                  } else {
                    setView(VIEW_HOME, true)
                  }
                }} 
                showSnackbar={showSnackbar} 
              />
            )}
            {view === VIEW_TRACKER && (
              <>
                {!selectedTea ? (
                  <TeaSelectionGrid
                    onSelectTea={selectTea}
                    selectedTeaId={undefined}
                  />
                ) : (
                  <>
                    <Box sx={{ mb: 3 }}>
                      <Button 
                        variant="text" 
                        size="small"
                        startIcon={<ArrowBackIcon />}
                        onClick={deselectTea}
                        sx={{ mb: 2, color: 'text.secondary' }}
                      >
                        Back to Tea Selection
                      </Button>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, bgcolor: 'background.paper', borderRadius: 2, border: 1, borderColor: 'divider' }}>
                        <img 
                          src={selectedTea.photo || `${import.meta.env.BASE_URL}tea-placeholder.png`} 
                          alt={selectedTea.name}
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
                            title={selectedTea.name}
                          >
                            {selectedTea.name}
                          </Typography>
                          {selectedTea.vendor && (
                            <Typography 
                              variant="body2" 
                              color="text.secondary"
                              sx={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                maxWidth: '100%'
                              }}
                              title={selectedTea.vendor}
                            >
                              {selectedTea.vendor}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </Box>
                    <BrewingList
                      key={brewingListKey}
                      tea={selectedTea}
                      onSelect={setSelectedBrewing}
                      selectedBrewingId={selectedBrewing?.id}
                      showSnackbar={showSnackbar}
                      onBrewingClick={handleShowBrewingDetails}
                    />
                  </>
                )}
              </>
            )}
            {view === VIEW_TEA_LIST && (
              <TeaListView 
                onSelectTea={handleViewTeaDetails} 
                onAddTea={handleAddTea} 
              />
            )}
            {view === VIEW_TEA_DETAILS && selectedTeaId && (
              <TeaDetails
                teaId={selectedTeaId}
                onBack={() => setView(VIEW_TEA_LIST, true)}
                onEdit={() => handleEditTea(selectedTeaId)}
                onAddBrewing={() => {
                  const tea = teas.find(t => t.id === selectedTeaId) || null;
                  setSelectedTea(tea);
                  setView(VIEW_TRACKER, false, true); // Explicitly set teaSelected to true
                }}
              />
            )}
            {view === VIEW_EDIT_TEA && editTeaId && (
              <TeaList 
                key={editTeaId} 
                selectedTeaId={editTeaId} 
                onTeaAdded={id => {
                  if (id) {
                    setSelectedTeaId(id)
                    setView(VIEW_TEA_DETAILS)
                  } else {
                    setView(VIEW_TEA_DETAILS, true)
                  }
                }} 
                showSnackbar={showSnackbar} 
              />
            )}
            {view === VIEW_BREWING_DETAILS && (
              selectedBrewingForDetails ? (
                <BrewingDetails
                  brewing={selectedBrewingForDetails}
                  onBack={() => {
                    setSelectedBrewingForDetails(null)
                    setView(VIEW_TRACKER, true)
                  }}
                  showSnackbar={showSnackbar}
                />
              ) : (
                <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'text.secondary' }}>
                  <Typography variant="body1">No brewing selected. Please go back and select a brewing.</Typography>
                  <Button onClick={() => setView(VIEW_TRACKER, true)}>Back to Brewings</Button>
                </Box>
              )
            )}
            {/* Empty state placeholder for any view with no content */}
            {view !== VIEW_HOME && view !== VIEW_LOG && view !== VIEW_ADD_TEA && view !== VIEW_TRACKER && view !== VIEW_TEA_LIST && view !== VIEW_TEA_DETAILS && view !== VIEW_EDIT_TEA && view !== VIEW_BREWING_DETAILS && (
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
