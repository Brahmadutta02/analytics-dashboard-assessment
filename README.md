# EV Population Dashboard

A React-based dashboard for visualizing Electric Vehicle (EV) population data. This project was created using Vite and includes features such as:

- Light/Dark mode toggle
- Interactive charts and graphs
- Responsive design
- Key metrics visualization

## Features

- Summary cards showing total EVs, unique makes, and average range
- Pie chart showing distribution of EV makes
- Bar chart showing model year distribution
- Theme switching between light and dark modes
- Responsive layout that works on all screen sizes

## Technologies Used

- React
- Vite
- Material-UI
- Recharts
- Papa Parse (for CSV parsing)

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to `http://localhost:5173`

## Data Source

The dashboard uses a sample EV population dataset stored in `public/ev_data.csv`. The data includes information about:

- Vehicle Make and Model
- Model Year
- Electric Range
- County and City information
- Clean Alternative Fuel Vehicle (CAFV) Eligibility

## Building for Production

To create a production build:

```bash
npm run build
```

The built files will be in the `dist` directory.

## License

MIT
