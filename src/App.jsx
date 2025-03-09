import { ThemeProvider, CssBaseline } from '@mui/material';
import { ColorModeContext, useMode } from './context/ThemeContext';
import Dashboard from './components/Dashboard';

function App() {
  const [theme, colorMode] = useMode();

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Dashboard />
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}

export default App;
