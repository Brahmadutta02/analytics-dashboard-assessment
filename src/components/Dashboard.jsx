import { useState, useEffect, useContext, useMemo } from 'react';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  IconButton,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  useTheme,
  TablePagination,
  LinearProgress,
  Chip,
  TextField,
  InputAdornment,
  Tooltip as MuiTooltip,
  CircularProgress,
  Menu,
  MenuItem,
  Button,
  Fade,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ResponsiveContainer,
  ComposedChart,
} from 'recharts';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import ElectricCarIcon from '@mui/icons-material/ElectricCar';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import FilterListIcon from '@mui/icons-material/FilterList';
import DownloadIcon from '@mui/icons-material/Download';
import ClearIcon from '@mui/icons-material/Clear';
import TuneIcon from '@mui/icons-material/Tune';
import InfoIcon from '@mui/icons-material/Info';
import { ColorModeContext } from '../context/ThemeContext';
import Papa from 'papaparse';

const COLORS = [
  '#2196F3', // Blue
  '#4CAF50', // Green
  '#FFC107', // Amber
  '#F44336', // Red
  '#9C27B0', // Purple
  '#FF9800', // Orange
  '#00BCD4', // Cyan
  '#795548', // Brown
  '#607D8B', // Blue Grey
  '#E91E63', // Pink
];

const Dashboard = () => {
  const theme = useTheme();
  const colorMode = useContext(ColorModeContext);
  const [evData, setEvData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [sortField, setSortField] = useState('Make');
  const [sortOrder, setSortOrder] = useState('asc');
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [activeFilters, setActiveFilters] = useState({
    makes: [],
    years: [],
    types: [],
    range: { min: '', max: '' }
  });

  // Add new state for tracking filter history
  const [filterHistory, setFilterHistory] = useState({
    active: false,
    filters: null
  });

  // Get unique values for filters
  const uniqueValues = useMemo(() => ({
    makes: [...new Set(evData.map(item => item.Make))].sort(),
    years: [...new Set(evData.map(item => item['Model Year']))].sort(),
    types: [...new Set(evData.map(item => item['Electric Vehicle Type']))].sort(),
    range: {
      min: Math.min(...evData.map(item => parseInt(item['Electric Range']) || 0)),
      max: Math.max(...evData.map(item => parseInt(item['Electric Range']) || 0))
    }
  }), [evData]);

  const fetchData = async () => {
    try {
      setRefreshing(true);
      const response = await fetch('/Electric_Vehicle_Population_Data.csv');
      const reader = response.body.getReader();
      const result = await reader.read();
      const decoder = new TextDecoder('utf-8');
      const csvData = decoder.decode(result.value);
      const parsedData = Papa.parse(csvData, { header: true }).data;
      setEvData(parsedData);
      
      // Restore filters if they were active before refresh
      if (filterHistory.active && filterHistory.filters) {
        setActiveFilters(filterHistory.filters);
      }
      
      setLoading(false);
      setRefreshing(false);
      
      // Reset filter history after successful refresh
      setFilterHistory({ active: false, filters: null });
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
      setRefreshing(false);
      // Reset filter history on error
      setFilterHistory({ active: false, filters: null });
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Enhanced filtering logic
  const filteredData = useMemo(() => {
    return evData.filter(vehicle => {
      const matchesSearch = Object.values(vehicle).some(value => 
        value.toString().toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      const matchesMake = activeFilters.makes.length === 0 || 
        activeFilters.makes.includes(vehicle.Make);
      
      const matchesYear = activeFilters.years.length === 0 || 
        activeFilters.years.includes(vehicle['Model Year']);
      
      const matchesType = activeFilters.types.length === 0 || 
        activeFilters.types.includes(vehicle['Electric Vehicle Type']);
      
      const range = parseInt(vehicle['Electric Range']) || 0;
      const matchesRange = (
        (!activeFilters.range.min || range >= parseInt(activeFilters.range.min)) &&
        (!activeFilters.range.max || range <= parseInt(activeFilters.range.max))
      );

      return matchesSearch && matchesMake && matchesYear && matchesType && matchesRange;
    });
  }, [evData, searchTerm, activeFilters]);

  // Sort data
  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      }
      return aValue < bValue ? 1 : -1;
    });
  }, [filteredData, sortField, sortOrder]);

  const getMakeDistribution = () => {
    const distribution = evData.reduce((acc, curr) => {
      acc[curr.Make] = (acc[curr.Make] || 0) + 1;
      return acc;
    }, {});

    // Sort by count in descending order and calculate percentages
    return Object.entries(distribution)
      .map(([name, value]) => ({
        name,
        value,
        percentage: ((value / evData.length) * 100).toFixed(1)
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10); // Top 10 makes
  };

  const getModelYearDistribution = () => {
    const distribution = evData.reduce((acc, curr) => {
      const year = curr['Model Year'];
      if (!acc[year]) {
        acc[year] = {
          year,
          count: 0,
          avgRange: 0,
          totalRange: 0
        };
      }
      acc[year].count += 1;
      acc[year].totalRange += parseInt(curr['Electric Range']);
      acc[year].avgRange = Math.round(acc[year].totalRange / acc[year].count);
      return acc;
    }, {});

    return Object.values(distribution)
      .sort((a, b) => a.year - b.year)
      .map(item => ({
        ...item,
        percentage: ((item.count / evData.length) * 100).toFixed(1)
      }));
  };

  const getCountyDistribution = () => {
    const distribution = evData.reduce((acc, curr) => {
      const county = curr.County;
      if (!acc[county]) {
        acc[county] = {
          name: county,
          value: 0,
          avgRange: 0,
          totalRange: 0,
          uniqueMakes: new Set()
        };
      }
      acc[county].value += 1;
      acc[county].totalRange += parseInt(curr['Electric Range']);
      acc[county].avgRange = Math.round(acc[county].totalRange / acc[county].value);
      acc[county].uniqueMakes.add(curr.Make);
      return acc;
    }, {});

    return Object.values(distribution)
      .map(county => ({
        ...county,
        uniqueMakes: county.uniqueMakes.size,
        percentage: ((county.value / evData.length) * 100).toFixed(1)
      }))
      .sort((a, b) => b.value - a.value);
  };

  const getRangeByMake = () => {
    const rangeData = evData.reduce((acc, curr) => {
      const make = curr.Make;
      if (!acc[make]) {
        acc[make] = {
          make,
          count: 0,
          totalRange: 0,
          models: new Set(),
          years: new Set()
        };
      }
      acc[make].count += 1;
      acc[make].totalRange += parseInt(curr['Electric Range']);
      acc[make].models.add(curr.Model);
      acc[make].years.add(curr['Model Year']);
      return acc;
    }, {});

    return Object.values(rangeData)
      .map(make => ({
        make: make.make,
        averageRange: Math.round(make.totalRange / make.count),
        modelCount: make.models.size,
        yearSpan: make.years.size,
        totalVehicles: make.count,
        marketShare: ((make.count / evData.length) * 100).toFixed(1)
      }))
      .sort((a, b) => b.averageRange - a.averageRange);
  };

  const getStatistics = () => {
    const stats = evData.reduce((acc, curr) => {
      const range = parseInt(curr['Electric Range']);
      acc.totalRange += range;
      acc.ranges.push(range);
      acc.makes.add(curr.Make);
      acc.models.add(curr.Make + curr.Model);
      acc.counties.add(curr.County);
      acc.cities.add(curr.City);
      acc.years.add(curr['Model Year']);
      return acc;
    }, {
      totalRange: 0,
      ranges: [],
      makes: new Set(),
      models: new Set(),
      counties: new Set(),
      cities: new Set(),
      years: new Set()
    });

    // Calculate additional statistics
    stats.ranges.sort((a, b) => a - b);
    const len = stats.ranges.length;
    
    return {
      totalVehicles: len,
      averageRange: Math.round(stats.totalRange / len),
      medianRange: len % 2 === 0 
        ? Math.round((stats.ranges[len/2 - 1] + stats.ranges[len/2]) / 2)
        : stats.ranges[Math.floor(len/2)],
      minRange: Math.min(...stats.ranges),
      maxRange: Math.max(...stats.ranges),
      uniqueMakes: stats.makes.size,
      uniqueModels: stats.models.size,
      uniqueCounties: stats.counties.size,
      uniqueCities: stats.cities.size,
      yearRange: {
        oldest: Math.min(...stats.years),
        newest: Math.max(...stats.years)
      }
    };
  };

  const CustomPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name, value }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        style={{ fontSize: '12px', fontWeight: 'bold' }}
      >
        {`${name} (${value})`}
      </text>
    );
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleRefresh = () => {
    // Save current filter state before refresh
    if (Object.values(activeFilters).some(f => 
      Array.isArray(f) ? f.length > 0 : Object.values(f).some(v => v !== '')
    )) {
      setFilterHistory({
        active: true,
        filters: { ...activeFilters }
      });
    }
    
    // Reset search term
    setSearchTerm('');
    
    // Reset pagination
    setPage(0);
    
    // Fetch fresh data
    fetchData();
  };

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  const handleExportCSV = () => {
    const csvContent = Papa.unparse(filteredData);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'ev_data_export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFilterClick = (event) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };

  const handleFilterChange = (type, value) => {
    const newFilters = {
      ...activeFilters,
      [type]: value
    };
    setActiveFilters(newFilters);
    setFilterHistory({
      active: true,
      filters: newFilters
    });
    setPage(0);
  };

  const handleClearFilters = () => {
    setActiveFilters({
      makes: [],
      years: [],
      types: [],
      range: { min: '', max: '' }
    });
    setFilterHistory({
      active: false,
      filters: null
    });
    setPage(0);
  };

  // Add effect to update charts when filters change
  useEffect(() => {
    // Update statistics and charts based on filtered data
    if (filteredData.length > 0) {
      // Force charts to re-render with filtered data
      const chartsContainer = document.querySelector('.recharts-responsive-container');
      if (chartsContainer) {
        const event = new Event('resize');
        window.dispatchEvent(event);
      }
    }
  }, [filteredData]);

  // Add new statistics calculation
  const getAdvancedStatistics = () => {
    const stats = evData.reduce((acc, curr) => {
      const year = parseInt(curr['Model Year']) || 0;
      const range = parseInt(curr['Electric Range']) || 0;
      const model = curr.Make + curr.Model;
      
      if (!acc.yearlyData[year]) {
        acc.yearlyData[year] = {
          total: 0,
          growth: 0,
          totalRange: 0,
          models: new Set(),
          ranges: []
        };
      }
      acc.yearlyData[year].total++;
      acc.yearlyData[year].totalRange += range;
      acc.yearlyData[year].models.add(model);
      acc.yearlyData[year].ranges.push(range);
      
      return acc;
    }, {
      yearlyData: {}
    });

    // Calculate growth rates and prepare data
    const years = Object.keys(stats.yearlyData).sort();
    const growthRates = years.map((year, index) => {
      const currentTotal = stats.yearlyData[year].total;
      let growth = 0;
      
      if (index > 0) {
        const prevYear = years[index - 1];
        const prevTotal = stats.yearlyData[prevYear].total;
        growth = ((currentTotal - prevTotal) / prevTotal * 100).toFixed(1);
      }
      
      return {
        year,
        growth: parseFloat(growth),
        total: currentTotal
      };
    });

    // Enhanced range evolution calculation
    const rangeEvolution = Object.entries(stats.yearlyData)
      .map(([year, data]) => ({
        year,
        averageRange: Math.round(data.totalRange / data.total),
        modelCount: data.models.size,
        medianRange: data.ranges.sort((a, b) => a - b)[Math.floor(data.ranges.length / 2)],
        totalVehicles: data.total
      }))
      .sort((a, b) => a.year - b.year);

    // Calculate market share by type
    const total = Object.values(stats.yearlyData).reduce((sum, count) => sum + count, 0);
    const typeShare = Object.entries(stats.yearlyData).map(([year, count]) => ({
      year,
      share: ((count / total) * 100).toFixed(1)
    }));

    // Calculate manufacturer growth trends
    const makeGrowth = Object.entries(stats.yearlyData).map(([year, data]) => {
      const growth = data.growth;
      return {
        year,
        growth: parseFloat(growth)
      };
    }).sort((a, b) => b.growth - a.growth);

    return {
      growthRates,
      rangeEvolution,
      typeShare,
      makeGrowth
    };
  };

  // Add new chart components
  const GrowthChart = ({ data }) => {
    const theme = useTheme();
    const [hoveredBar, setHoveredBar] = useState(null);

    return (
      <Box sx={{ height: 400, position: 'relative' }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
            <XAxis 
              dataKey="year" 
              tick={{ fill: theme.palette.text.primary }}
              axisLine={{ stroke: theme.palette.divider }}
            />
            <YAxis 
              yAxisId="left"
              tick={{ fill: theme.palette.text.primary }}
              axisLine={{ stroke: theme.palette.divider }}
              label={{ 
                value: 'Growth Rate (%)', 
                angle: -90, 
                position: 'insideLeft',
                fill: theme.palette.text.primary 
              }}
            />
            <YAxis 
              yAxisId="right" 
              orientation="right"
              tick={{ fill: theme.palette.text.primary }}
              axisLine={{ stroke: theme.palette.divider }}
              label={{ 
                value: 'Total Vehicles', 
                angle: 90, 
                position: 'insideRight',
                fill: theme.palette.text.primary 
              }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: '8px',
                boxShadow: theme.shadows[3]
              }}
              formatter={(value, name) => [
                name === 'growth' 
                  ? `${value}%` 
                  : value.toLocaleString(),
                name === 'growth' 
                  ? 'Growth Rate' 
                  : 'Total Vehicles'
              ]}
            />
            <Legend 
              verticalAlign="top" 
              height={36}
              formatter={(value) => 
                value === 'growth' ? 'Growth Rate' : 'Total Vehicles'
              }
            />
            <Bar
              yAxisId="right"
              dataKey="total"
              fill={theme.palette.primary.main}
              radius={[4, 4, 0, 0]}
              name="total"
              onMouseEnter={(data, index) => setHoveredBar(index)}
              onMouseLeave={() => setHoveredBar(null)}
              opacity={0.8}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={theme.palette.primary.main}
                  style={{
                    filter: hoveredBar === index 
                      ? 'brightness(1.2)' 
                      : 'none',
                    transition: 'filter 0.3s'
                  }}
                />
              ))}
            </Bar>
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="growth"
              stroke={theme.palette.secondary.main}
              strokeWidth={3}
              dot={{
                r: 6,
                fill: theme.palette.background.paper,
                stroke: theme.palette.secondary.main,
                strokeWidth: 2
              }}
              activeDot={{
                r: 8,
                fill: theme.palette.secondary.main,
                stroke: theme.palette.background.paper,
                strokeWidth: 2
              }}
              name="growth"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </Box>
    );
  };

  const RangeEvolutionChart = ({ data }) => {
    const theme = useTheme();
    const [hoveredPoint, setHoveredPoint] = useState(null);

    return (
      <Box sx={{ height: 400, position: 'relative' }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
            <XAxis 
              dataKey="year" 
              tick={{ fill: theme.palette.text.primary }}
              axisLine={{ stroke: theme.palette.divider }}
            />
            <YAxis 
              yAxisId="left"
              tick={{ fill: theme.palette.text.primary }}
              axisLine={{ stroke: theme.palette.divider }}
              label={{ 
                value: 'Average Range (miles)', 
                angle: -90, 
                position: 'insideLeft',
                fill: theme.palette.text.primary 
              }}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              tick={{ fill: theme.palette.text.primary }}
              axisLine={{ stroke: theme.palette.divider }}
              label={{ 
                value: 'Number of Models', 
                angle: 90, 
                position: 'insideRight',
                fill: theme.palette.text.primary 
              }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: '8px',
                boxShadow: theme.shadows[3]
              }}
              formatter={(value, name) => [
                name === 'averageRange' 
                  ? `${value} miles`
                  : value,
                name === 'averageRange'
                  ? 'Average Range'
                  : 'Number of Models'
              ]}
            />
            <Legend 
              verticalAlign="top" 
              height={36}
              formatter={(value) => 
                value === 'averageRange' ? 'Average Range' : 'Number of Models'
              }
            />
            <Bar
              yAxisId="right"
              dataKey="modelCount"
              fill={theme.palette.primary.main}
              radius={[4, 4, 0, 0]}
              name="modelCount"
              opacity={0.8}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={theme.palette.primary.main}
                  style={{
                    filter: hoveredPoint === index ? 'brightness(1.2)' : 'none',
                    transition: 'filter 0.3s'
                  }}
                />
              ))}
            </Bar>
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="averageRange"
              stroke={theme.palette.secondary.main}
              strokeWidth={3}
              dot={{
                r: 6,
                fill: theme.palette.background.paper,
                stroke: theme.palette.secondary.main,
                strokeWidth: 2
              }}
              activeDot={{
                r: 8,
                fill: theme.palette.secondary.main,
                stroke: theme.palette.background.paper,
                strokeWidth: 2,
                onMouseEnter: (_, index) => setHoveredPoint(index),
                onMouseLeave: () => setHoveredPoint(null)
              }}
              name="averageRange"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </Box>
    );
  };

  if (loading) {
    return (
      <Box 
        sx={{ 
          width: '100%', 
          height: '100vh', 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2
        }}
      >
        <CircularProgress size={60} />
        <Typography variant="h6" color="textSecondary">
          Loading Dashboard Data...
        </Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Enhanced Header */}
      <Paper 
        elevation={3} 
        sx={{ 
          p: 3, 
          mb: 4, 
          background: theme.palette.mode === 'dark' 
            ? 'linear-gradient(45deg, #1a237e 30%, #283593 90%)'
            : 'linear-gradient(45deg, #1976d2 30%, #2196f3 90%)',
          color: '#fff'
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <ElectricCarIcon sx={{ fontSize: 40 }} />
            <Box>
              <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
                EV Population Dashboard
              </Typography>
              <Typography variant="subtitle1" sx={{ opacity: 0.8 }}>
                Real-time analytics of electric vehicle distribution
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <TextField
              size="small"
              placeholder="Search..."
              value={searchTerm}
              onChange={handleSearch}
              sx={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: 1,
                minWidth: '200px',
                '& .MuiOutlinedInput-root': {
                  color: 'white',
                  '& fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.5)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: 'white',
                  },
                },
                '& .MuiInputBase-input::placeholder': {
                  color: 'rgba(255, 255, 255, 0.7)',
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                  </InputAdornment>
                ),
              }}
            />
            <MuiTooltip title="Filter Data">
              <IconButton 
                onClick={handleFilterClick}
                sx={{ color: '#fff' }}
              >
                <TuneIcon />
              </IconButton>
            </MuiTooltip>
            <Menu
              anchorEl={filterAnchorEl}
              open={Boolean(filterAnchorEl)}
              onClose={handleFilterClose}
              TransitionComponent={Fade}
              PaperProps={{
                sx: {
                  mt: 1,
                  maxHeight: '80vh',
                  width: 320,
                  overflow: 'visible',
                  filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                  '&:before': {
                    content: '""',
                    display: 'block',
                    position: 'absolute',
                    top: 0,
                    right: 14,
                    width: 10,
                    height: 10,
                    bgcolor: 'background.paper',
                    transform: 'translateY(-50%) rotate(45deg)',
                    zIndex: 0,
                  },
                },
              }}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <Box sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    Filters
                  </Typography>
                  <Button
                    size="small"
                    startIcon={<ClearIcon />}
                    onClick={handleClearFilters}
                    disabled={!Object.values(activeFilters).some(f => 
                      Array.isArray(f) ? f.length > 0 : Object.values(f).some(v => v !== '')
                    )}
                  >
                    Clear All
                  </Button>
                </Box>

                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Manufacturer</InputLabel>
                  <Select
                    multiple
                    value={activeFilters.makes}
                    onChange={(e) => handleFilterChange('makes', e.target.value)}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip
                            key={value}
                            label={value}
                            size="small"
                            onDelete={() => {
                              handleFilterChange('makes', 
                                activeFilters.makes.filter(item => item !== value)
                              );
                            }}
                            onMouseDown={(event) => {
                              event.stopPropagation();
                            }}
                          />
                        ))}
                      </Box>
                    )}
                    MenuProps={{
                      PaperProps: {
                        style: {
                          maxHeight: 250
                        }
                      }
                    }}
                  >
                    {uniqueValues.makes.map((make) => (
                      <MenuItem key={make} value={make}>
                        {make}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Model Year</InputLabel>
                  <Select
                    multiple
                    value={activeFilters.years}
                    onChange={(e) => handleFilterChange('years', e.target.value)}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip
                            key={value}
                            label={value}
                            size="small"
                            onDelete={() => {
                              handleFilterChange('years', 
                                activeFilters.years.filter(item => item !== value)
                              );
                            }}
                            onMouseDown={(event) => {
                              event.stopPropagation();
                            }}
                          />
                        ))}
                      </Box>
                    )}
                    MenuProps={{
                      PaperProps: {
                        style: {
                          maxHeight: 250
                        }
                      }
                    }}
                  >
                    {uniqueValues.years.map((year) => (
                      <MenuItem key={year} value={year}>
                        {year}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Vehicle Type</InputLabel>
                  <Select
                    multiple
                    value={activeFilters.types}
                    onChange={(e) => handleFilterChange('types', e.target.value)}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip
                            key={value}
                            label={value}
                            size="small"
                            onDelete={() => {
                              handleFilterChange('types', 
                                activeFilters.types.filter(item => item !== value)
                              );
                            }}
                            onMouseDown={(event) => {
                              event.stopPropagation();
                            }}
                          />
                        ))}
                      </Box>
                    )}
                  >
                    {uniqueValues.types.map((type) => (
                      <MenuItem key={type} value={type}>
                        {type}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Typography variant="subtitle2" gutterBottom>
                  Electric Range (miles)
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <TextField
                    size="small"
                    placeholder="Min"
                    type="number"
                    value={activeFilters.range.min}
                    onChange={(e) => handleFilterChange('range', { 
                      ...activeFilters.range, 
                      min: e.target.value 
                    })}
                    InputProps={{
                      inputProps: { 
                        min: uniqueValues.range.min,
                        max: uniqueValues.range.max
                      }
                    }}
                  />
                  <Typography>to</Typography>
                  <TextField
                    size="small"
                    placeholder="Max"
                    type="number"
                    value={activeFilters.range.max}
                    onChange={(e) => handleFilterChange('range', { 
                      ...activeFilters.range, 
                      max: e.target.value 
                    })}
                    InputProps={{
                      inputProps: { 
                        min: uniqueValues.range.min,
                        max: uniqueValues.range.max
                      }
                    }}
                  />
                </Box>
              </Box>
            </Menu>
            <MuiTooltip title="Export Data">
              <IconButton 
                onClick={handleExportCSV}
                sx={{ color: '#fff' }}
              >
                <DownloadIcon />
              </IconButton>
            </MuiTooltip>
            <MuiTooltip title={refreshing ? "Refreshing..." : "Refresh Data"}>
              <IconButton 
                onClick={handleRefresh} 
                sx={{ 
                  color: '#fff',
                  position: 'relative'
                }}
                disabled={refreshing}
              >
                <RefreshIcon sx={{ 
                  animation: refreshing ? 'spin 1s linear infinite' : 'none',
                  '@keyframes spin': {
                    '0%': { transform: 'rotate(0deg)' },
                    '100%': { transform: 'rotate(360deg)' }
                  }
                }} />
                {filterHistory.active && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: -2,
                      right: -2,
                      width: 8,
                      height: 8,
                      backgroundColor: theme.palette.warning.main,
                      borderRadius: '50%'
                    }}
                  />
                )}
              </IconButton>
            </MuiTooltip>
            <MuiTooltip title="Toggle Theme">
              <IconButton onClick={colorMode.toggleColorMode} sx={{ color: '#fff' }}>
                {colorMode.mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
              </IconButton>
            </MuiTooltip>
          </Box>
        </Box>
      </Paper>

      <Grid container spacing={3}>
        {/* Enhanced Summary Cards */}
        <Grid item xs={12} md={3}>
          <Card elevation={3} sx={{ 
            transition: 'transform 0.2s, box-shadow 0.2s',
            '&:hover': { 
              transform: 'translateY(-5px)',
              boxShadow: theme.shadows[6]
            }
          }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="textSecondary" gutterBottom>
                Total EVs
              </Typography>
              <Typography variant="h3" component="div" sx={{ 
                fontWeight: 'bold', 
                color: theme.palette.primary.main,
                textShadow: '0px 2px 4px rgba(0,0,0,0.1)'
              }}>
                {filteredData.length.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                {getStatistics().yearRange.oldest} - {getStatistics().yearRange.newest}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card elevation={3} sx={{ 
            transition: 'transform 0.2s, box-shadow 0.2s',
            '&:hover': { 
              transform: 'translateY(-5px)',
              boxShadow: theme.shadows[6]
            }
          }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="textSecondary" gutterBottom>
                Vehicle Diversity
              </Typography>
              <Typography variant="h3" component="div" sx={{ 
                fontWeight: 'bold', 
                color: theme.palette.primary.main,
                textShadow: '0px 2px 4px rgba(0,0,0,0.1)'
              }}>
                {getStatistics().uniqueModels}
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                {getStatistics().uniqueMakes} Makes • {getStatistics().uniqueModels} Models
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card elevation={3} sx={{ 
            transition: 'transform 0.2s, box-shadow 0.2s',
            '&:hover': { 
              transform: 'translateY(-5px)',
              boxShadow: theme.shadows[6]
            }
          }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="textSecondary" gutterBottom>
                Range Statistics
              </Typography>
              <Typography variant="h3" component="div" sx={{ 
                fontWeight: 'bold', 
                color: theme.palette.primary.main,
                textShadow: '0px 2px 4px rgba(0,0,0,0.1)'
              }}>
                {getStatistics().averageRange}
                <Typography component="span" variant="h6" color="textSecondary">
                  {' '}miles
                </Typography>
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                Median: {getStatistics().medianRange} • Max: {getStatistics().maxRange}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card elevation={3} sx={{ 
            transition: 'transform 0.2s, box-shadow 0.2s',
            '&:hover': { 
              transform: 'translateY(-5px)',
              boxShadow: theme.shadows[6]
            }
          }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="textSecondary" gutterBottom>
                Geographic Coverage
              </Typography>
              <Typography variant="h3" component="div" sx={{ 
                fontWeight: 'bold', 
                color: theme.palette.primary.main,
                textShadow: '0px 2px 4px rgba(0,0,0,0.1)'
              }}>
                {getStatistics().uniqueCounties}
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                Counties • {getStatistics().uniqueCities} Cities
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Enhanced Charts */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ 
            p: 3, 
            height: '100%',
            transition: 'transform 0.2s, box-shadow 0.2s',
            '&:hover': { boxShadow: theme.shadows[6] }
          }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
              Top 10 EV Makes Distribution
            </Typography>
            <Box sx={{ height: 400 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={getMakeDistribution()}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={150}
                    innerRadius={60}
                    paddingAngle={2}
                    dataKey="value"
                    label={CustomPieLabel}
                  >
                    {getMakeDistribution().map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[index % COLORS.length]}
                        stroke="none"
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: theme.palette.background.paper,
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: '8px',
                    }}
                    formatter={(value, name, props) => [
                      `${value.toLocaleString()} vehicles (${props.payload.percentage}%)`,
                      name
                    ]}
                  />
                  <Legend
                    layout="vertical"
                    align="right"
                    verticalAlign="middle"
                    formatter={(value, entry) => {
                      const { payload } = entry;
                      return `${value} - ${payload.value.toLocaleString()} (${payload.percentage}%)`;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ 
            p: 3, 
            height: '100%',
            transition: 'transform 0.2s, box-shadow 0.2s',
            '&:hover': { boxShadow: theme.shadows[6] }
          }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
              Model Year Distribution
            </Typography>
            <Box sx={{ height: 400 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={getModelYearDistribution()}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: theme.palette.background.paper,
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Bar 
                    yAxisId="left"
                    dataKey="count" 
                    fill={theme.palette.primary.main} 
                    name="Vehicles"
                    radius={[4, 4, 0, 0]}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="avgRange"
                    stroke={theme.palette.secondary.main}
                    name="Avg Range"
                    strokeWidth={2}
                  />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ 
            p: 3, 
            height: '100%',
            transition: 'transform 0.2s, box-shadow 0.2s',
            '&:hover': { boxShadow: theme.shadows[6] }
          }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
              Manufacturer Analysis
            </Typography>
            <Box sx={{ height: 400 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={getRangeByMake()}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="make" angle={-45} textAnchor="end" height={80} />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: theme.palette.background.paper,
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="averageRange" 
                    stroke={theme.palette.primary.main}
                    strokeWidth={2}
                    name="Average Range (miles)"
                    dot={{ fill: theme.palette.primary.main }}
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="marketShare" 
                    stroke={theme.palette.secondary.main}
                    strokeWidth={2}
                    name="Market Share (%)"
                    dot={{ fill: theme.palette.secondary.main }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ 
            p: 3, 
            height: '100%',
            transition: 'transform 0.2s, box-shadow 0.2s',
            '&:hover': { boxShadow: theme.shadows[6] }
          }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
              Geographic Distribution
            </Typography>
            <Box sx={{ height: 400 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={getCountyDistribution()}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={150}
                    innerRadius={60}
                    paddingAngle={2}
                    dataKey="value"
                    label={CustomPieLabel}
                  >
                    {getCountyDistribution().map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[index % COLORS.length]}
                        stroke="none"
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: theme.palette.background.paper,
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: '8px',
                    }}
                    formatter={(value, name, props) => [
                      `${value} vehicles (${props.percentage}%)
Avg Range: ${props.payload.avgRange} miles
Makes: ${props.payload.uniqueMakes}`,
                      name
                    ]}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Enhanced Table */}
        <Grid item xs={12}>
          <Paper elevation={3} sx={{ 
            p: 3,
            transition: 'transform 0.2s, box-shadow 0.2s',
            '&:hover': { boxShadow: theme.shadows[6] }
          }}>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              mb: 3 
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  EV Details
                </Typography>
                <MuiTooltip title="Click column headers to sort">
                  <InfoIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                </MuiTooltip>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {(activeFilters.makes.length > 0 || 
                  activeFilters.years.length > 0 || 
                  activeFilters.types.length > 0 ||
                  activeFilters.range.min || 
                  activeFilters.range.max) && (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {activeFilters.makes.map(make => (
                      <Chip
                        key={make}
                        label={`Make: ${make}`}
                        onDelete={() => {
                          handleFilterChange('makes', 
                            activeFilters.makes.filter(m => m !== make)
                          );
                        }}
                        size="small"
                      />
                    ))}
                    {activeFilters.years.map(year => (
                      <Chip
                        key={year}
                        label={`Year: ${year}`}
                        onDelete={() => {
                          handleFilterChange('years', 
                            activeFilters.years.filter(y => y !== year)
                          );
                        }}
                        size="small"
                      />
                    ))}
                    {activeFilters.types.map(type => (
                      <Chip
                        key={type}
                        label={`Type: ${type}`}
                        onDelete={() => {
                          handleFilterChange('types', 
                            activeFilters.types.filter(t => t !== type)
                          );
                        }}
                        size="small"
                      />
                    ))}
                    {(activeFilters.range.min || activeFilters.range.max) && (
                      <Chip
                        label={`Range: ${activeFilters.range.min || '0'} - ${activeFilters.range.max || '∞'} miles`}
                        onDelete={() => {
                          handleFilterChange('range', { min: '', max: '' });
                        }}
                        size="small"
                      />
                    )}
                  </Box>
                )}
                <Typography variant="body2" color="textSecondary">
                  {filteredData.length.toLocaleString()} {filteredData.length === 1 ? 'result' : 'results'}
                </Typography>
                <MuiTooltip title="Filter Data">
                  <IconButton 
                    onClick={handleFilterClick}
                    color={Object.values(activeFilters).some(f => 
                      Array.isArray(f) ? f.length > 0 : Object.values(f).some(v => v !== '')
                    ) ? 'primary' : 'default'}
                  >
                    <TuneIcon />
                  </IconButton>
                </MuiTooltip>
              </Box>
            </Box>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    {['Make', 'Model', 'Year', 'County', 'City', 'Electric Range', 'Type'].map((header) => (
                      <TableCell
                        key={header}
                        sx={{
                          fontWeight: 'bold',
                          backgroundColor: theme.palette.action.hover,
                          cursor: 'pointer',
                          '&:hover': {
                            backgroundColor: theme.palette.action.selected,
                          }
                        }}
                        onClick={() => {
                          if (sortField === header) {
                            setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
                          } else {
                            setSortField(header);
                            setSortOrder('asc');
                          }
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          {header}
                          {sortField === header && (
                            <FilterListIcon 
                              sx={{ 
                                fontSize: 18,
                                transform: sortOrder === 'desc' ? 'rotate(180deg)' : 'none',
                                transition: 'transform 0.2s'
                              }} 
                            />
                          )}
                        </Box>
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sortedData
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((vehicle, index) => (
                    <TableRow 
                      key={index}
                      sx={{ 
                        '&:hover': { 
                          backgroundColor: theme.palette.action.hover,
                          transition: 'background-color 0.2s'
                        }
                      }}
                    >
                      <TableCell>{vehicle.Make}</TableCell>
                      <TableCell>{vehicle.Model}</TableCell>
                      <TableCell>{vehicle['Model Year']}</TableCell>
                      <TableCell>{vehicle.County}</TableCell>
                      <TableCell>{vehicle.City}</TableCell>
                      <TableCell>
                        <Chip 
                          label={`${vehicle['Electric Range']} miles`}
                          color="primary"
                          size="small"
                          sx={{ fontWeight: 'bold' }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={vehicle['Electric Vehicle Type']}
                          color="secondary"
                          size="small"
                          sx={{ fontWeight: 'bold' }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={filteredData.length}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[10, 25, 50, 100]}
            />
          </Paper>
        </Grid>
      </Grid>

      {/* New Analytics Section */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
            Advanced Analytics
          </Typography>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper 
            elevation={3} 
            sx={{ 
              p: 3,
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': { 
                transform: 'translateY(-4px)',
                boxShadow: theme.shadows[6]
              }
            }}
          >
            <Box sx={{ mb: 3 }}>
              <Typography 
                variant="h6" 
                gutterBottom 
                sx={{ 
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                Year-over-Year Growth
                <MuiTooltip title="Shows the annual growth rate and total vehicles for each year">
                  <InfoIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                </MuiTooltip>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Track the evolution of EV adoption with growth rates and total vehicle counts
              </Typography>
            </Box>
            <GrowthChart data={getAdvancedStatistics().growthRates} />
            <Box 
              sx={{ 
                mt: 2, 
                p: 2, 
                bgcolor: 'background.default',
                borderRadius: 1,
                border: `1px solid ${theme.palette.divider}`
              }}
            >
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Highest Growth
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {Math.max(...getAdvancedStatistics().growthRates.map(r => r.growth))}%
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Latest Growth
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {getAdvancedStatistics().growthRates[getAdvancedStatistics().growthRates.length - 1].growth}%
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper 
            elevation={3} 
            sx={{ 
              p: 3,
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': { 
                transform: 'translateY(-4px)',
                boxShadow: theme.shadows[6]
              }
            }}
          >
            <Box sx={{ mb: 3 }}>
              <Typography 
                variant="h6" 
                gutterBottom 
                sx={{ 
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                Range Evolution
                <MuiTooltip title="Track the progression of EV range capabilities and model diversity over time">
                  <InfoIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                </MuiTooltip>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Analysis of electric range improvements and model availability across years
              </Typography>
            </Box>
            <RangeEvolutionChart data={getAdvancedStatistics().rangeEvolution} />
            <Box 
              sx={{ 
                mt: 2, 
                p: 2, 
                bgcolor: 'background.default',
                borderRadius: 1,
                border: `1px solid ${theme.palette.divider}`
              }}
            >
              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Latest Average Range
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {getAdvancedStatistics().rangeEvolution[getAdvancedStatistics().rangeEvolution.length - 1].averageRange} miles
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Range Improvement
                  </Typography>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontWeight: 'bold',
                      color: theme.palette.success.main
                    }}
                  >
                    {(() => {
                      const data = getAdvancedStatistics().rangeEvolution;
                      const firstRange = data[0].averageRange;
                      const lastRange = data[data.length - 1].averageRange;
                      const improvement = ((lastRange - firstRange) / firstRange * 100).toFixed(1);
                      return `+${improvement}%`;
                    })()}
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Total Models
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {getAdvancedStatistics().rangeEvolution[getAdvancedStatistics().rangeEvolution.length - 1].modelCount}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard; 