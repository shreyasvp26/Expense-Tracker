# Expense Tracker Frontend

A modern, visually appealing React frontend for the Expense Tracker system with authentication, dashboard visualizations, and seamless FastAPI backend integration.

## 🚀 Features

- **Modern UI/UX**: Built with React and Tailwind CSS for a beautiful, responsive design
- **Authentication**: Mock authentication system (ready to be replaced with real backend auth)
- **Dashboard**: Comprehensive dashboard with:
  - Statistics cards (Total Expenses, Income, Net Balance, Transaction Count)
  - Category-wise pie chart
  - Time-based line chart for spending trends
  - Recent transactions table
  - Advanced filtering (by type, category, date range)
- **Visualizations**: Interactive charts using Recharts
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices

## 🛠️ Tech Stack

- **React 18** - UI library
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **React Router v6** - Client-side routing
- **Axios** - HTTP client for API calls
- **Recharts** - Charting library
- **Lucide React** - Modern icon library
- **date-fns** - Date formatting utilities

## 📦 Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and set your backend URL:
   ```
   VITE_API_BASE_URL=http://localhost:8000
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:5173`

## 🎯 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint

## 📁 Project Structure

```
frontend/
├── public/              # Static assets
├── src/
│   ├── components/      # Reusable components
│   │   ├── ui/         # UI components (Button, Input, Card, Loading)
│   │   ├── Navbar.jsx
│   │   ├── Footer.jsx
│   │   └── ProtectedRoute.jsx
│   ├── context/        # React Context
│   │   └── AuthContext.jsx
│   ├── pages/          # Page components
│   │   ├── Home.jsx
│   │   ├── Signup.jsx
│   │   ├── Login.jsx
│   │   └── Dashboard.jsx
│   ├── services/       # API services
│   │   ├── api.js
│   │   ├── authService.js
│   │   └── expenseService.js
│   ├── App.jsx         # Main app component
│   ├── main.jsx        # Entry point
│   └── index.css       # Global styles
├── index.html
├── vite.config.js
├── tailwind.config.js
└── package.json
```

## 🔗 Backend Integration

The frontend integrates with the FastAPI backend through the following endpoints:

- `GET /transactions` - Fetch all transactions

### API Configuration

The API base URL is configured in `vite.config.js` with a proxy:

```javascript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:8000',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api/, ''),
    },
  },
}
```

## 🔐 Authentication

Currently, the frontend uses a **mock authentication system** stored in localStorage. This allows the app to function independently while the backend authentication is being developed.

### Mock Auth Features:
- User signup with validation
- User login with credential checking
- Session persistence
- Protected routes

### Replacing with Real Auth:

When backend authentication is ready, update `src/services/authService.js` to make real API calls:

```javascript
export const signup = async (userData) => {
  const response = await api.post('/auth/signup', userData);
  return response.data;
};

export const login = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};
```

## 📊 Dashboard Features

### Statistics Cards
- **Total Expenses**: Sum of all expense transactions
- **Total Income**: Sum of all income transactions
- **Net Balance**: Income minus expenses
- **Transaction Count**: Total number of transactions

### Filters
- **Type**: Filter by Income/Expense/All
- **Category**: Filter by specific category
- **Date Range**: Last 7 days, Last 30 days, or All time

### Charts
- **Pie Chart**: Category-wise expense distribution
- **Line Chart**: Time-based income and expense trends

### Transactions Table
- Displays recent transactions with date, merchant, category, type, and amount
- Color-coded by transaction type (green for income, red for expenses)

## 🎨 Design System

### Colors
- **Primary**: Blue gradient (#667eea to #764ba2)
- **Success**: Green (#22c55e)
- **Danger**: Red (#ef4444)
- **Purple**: Accent color (#8b5cf6)

### Animations
- Fade in
- Slide up/down
- Scale in
- Gradient animation

## ⚠️ Assumptions & Limitations

1. **No Backend Authentication**: Frontend uses mock auth until backend implements auth endpoints
2. **Limited Backend Endpoints**: Only `/transactions` endpoint is available
3. **Frontend Filtering**: All filtering is done client-side
4. **No Pagination**: All transactions are fetched at once (limit: 100)
5. **Read-Only Transactions**: No create/update/delete operations (transactions come from SMS ingestion)
6. **Category Fallback**: If backend doesn't return category, frontend infers it from merchant name

## 🚧 Missing Backend Features

The following backend features would enhance the frontend:

1. Authentication endpoints (`/signup`, `/login`, `/logout`, `/me`)
2. Category field in transaction response
3. Query parameters for filtering (`/transactions?start_date=X&end_date=Y&category=Z`)
4. Aggregation endpoints (`/analytics/category-totals`, `/analytics/monthly-trends`)
5. Pagination support

## 🔮 Future Enhancements

1. Add transaction manually (form to create expenses)
2. Edit/delete transactions
3. Budget management (set monthly budgets per category)
4. Export data (CSV/PDF)
5. Advanced search and filters
6. Dark mode toggle
7. Toast notifications
8. User profile management
9. Multi-user support
10. Offline support (PWA)

## 🤝 Contributing

This is a portfolio project. Feel free to fork and customize for your own use.

## 📝 License

MIT License - feel free to use this project for learning and portfolio purposes.

## 👨‍💻 Author

Built as part of the Expense Tracker system portfolio project.
