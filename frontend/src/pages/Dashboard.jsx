import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Wallet, CreditCard, RefreshCw, Filter, AlertCircle } from 'lucide-react';
import { getTransactions, calculateStats, groupByCategory, groupByDate } from '../services/expenseService';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { SkeletonCard, SkeletonTable } from '../components/ui/Loading';
import { format } from 'date-fns';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d', '#ffc658', '#ff7c7c'];

const Dashboard = () => {
    const [transactions, setTransactions] = useState([]);
    const [filteredTransactions, setFilteredTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState(null);
    const [categoryData, setCategoryData] = useState([]);
    const [timeData, setTimeData] = useState([]);

    // Filters
    const [filters, setFilters] = useState({
        type: 'all', // all, income, expense
        category: 'all',
        dateRange: 'all', // all, week, month
    });

    const fetchData = async () => {
        setLoading(true);
        setError(null);

        try {
            const data = await getTransactions();
            setTransactions(data);
            setFilteredTransactions(data);

            // Calculate stats
            const calculatedStats = calculateStats(data);
            setStats(calculatedStats);

            // Group data for charts
            const categoryGrouped = groupByCategory(data);
            setCategoryData(categoryGrouped);

            const timeGrouped = groupByDate(data);
            setTimeData(timeGrouped);
        } catch (err) {
            setError(err.message || 'Failed to fetch transactions');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Apply filters
    useEffect(() => {
        let filtered = [...transactions];

        // Filter by type
        if (filters.type !== 'all') {
            const typeFilter = filters.type === 'income' ? 'Income' : 'Expense';
            filtered = filtered.filter(t => t.type === typeFilter);
        }

        // Filter by category
        if (filters.category !== 'all') {
            filtered = filtered.filter(t => t.category === filters.category);
        }

        // Filter by date range
        if (filters.dateRange !== 'all') {
            const now = new Date();
            const filterDate = new Date();

            if (filters.dateRange === 'week') {
                filterDate.setDate(now.getDate() - 7);
            } else if (filters.dateRange === 'month') {
                filterDate.setMonth(now.getMonth() - 1);
            }

            filtered = filtered.filter(t => {
                const transactionDate = new Date(t.date);
                return transactionDate >= filterDate;
            });
        }

        setFilteredTransactions(filtered);

        // Recalculate stats for filtered data
        if (filtered.length > 0) {
            const calculatedStats = calculateStats(filtered);
            setStats(calculatedStats);

            const categoryGrouped = groupByCategory(filtered);
            setCategoryData(categoryGrouped);

            const timeGrouped = groupByDate(filtered);
            setTimeData(timeGrouped);
        }
    }, [filters, transactions]);

    const handleFilterChange = (filterType, value) => {
        setFilters(prev => ({ ...prev, [filterType]: value }));
    };

    // Get unique categories for filter
    const categories = [...new Set(transactions.map(t => t.category))];

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="mb-8">
                        <div className="h-10 bg-gray-200 rounded w-1/4 mb-4 animate-pulse"></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
                    </div>
                    <SkeletonTable />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Card className="max-w-md text-center">
                    <AlertCircle className="w-16 h-16 text-danger-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Error Loading Data</h2>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <Button onClick={fetchData} icon={RefreshCw}>
                        Try Again
                    </Button>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800 mb-2">Dashboard</h1>
                        <p className="text-gray-600">Track your expenses and income</p>
                    </div>
                    <Button onClick={fetchData} icon={RefreshCw} variant="outline">
                        Refresh
                    </Button>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* Total Expenses */}
                    <Card className="stat-card from-danger-500 to-danger-700" hover={false}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-white/80 text-sm font-medium mb-1">Total Expenses</p>
                                <p className="text-3xl font-bold">₹{stats?.totalExpenses.toFixed(2) || 0}</p>
                            </div>
                            <TrendingDown className="w-12 h-12 opacity-80" />
                        </div>
                    </Card>

                    {/* Total Income */}
                    <Card className="stat-card from-success-500 to-success-700" hover={false}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-white/80 text-sm font-medium mb-1">Total Income</p>
                                <p className="text-3xl font-bold">₹{stats?.totalIncome.toFixed(2) || 0}</p>
                            </div>
                            <TrendingUp className="w-12 h-12 opacity-80" />
                        </div>
                    </Card>

                    {/* Net Balance */}
                    <Card className="stat-card from-primary-500 to-primary-700" hover={false}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-white/80 text-sm font-medium mb-1">Net Balance</p>
                                <p className="text-3xl font-bold">₹{stats?.netBalance.toFixed(2) || 0}</p>
                            </div>
                            <Wallet className="w-12 h-12 opacity-80" />
                        </div>
                    </Card>

                    {/* Transaction Count */}
                    <Card className="stat-card from-purple-500 to-purple-700" hover={false}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-white/80 text-sm font-medium mb-1">Transactions</p>
                                <p className="text-3xl font-bold">{stats?.transactionCount || 0}</p>
                            </div>
                            <CreditCard className="w-12 h-12 opacity-80" />
                        </div>
                    </Card>
                </div>

                {/* Filters */}
                <Card className="mb-8">
                    <div className="flex items-center gap-2 mb-4">
                        <Filter className="w-5 h-5 text-gray-600" />
                        <h3 className="text-lg font-semibold text-gray-800">Filters</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Type Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                            <select
                                value={filters.type}
                                onChange={(e) => handleFilterChange('type', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                            >
                                <option value="all">All</option>
                                <option value="income">Income</option>
                                <option value="expense">Expense</option>
                            </select>
                        </div>

                        {/* Category Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                            <select
                                value={filters.category}
                                onChange={(e) => handleFilterChange('category', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                            >
                                <option value="all">All Categories</option>
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>

                        {/* Date Range Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                            <select
                                value={filters.dateRange}
                                onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                            >
                                <option value="all">All Time</option>
                                <option value="week">Last 7 Days</option>
                                <option value="month">Last 30 Days</option>
                            </select>
                        </div>
                    </div>
                </Card>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    {/* Pie Chart - Category Distribution */}
                    <Card>
                        <h3 className="text-xl font-semibold text-gray-800 mb-6">Expenses by Category</h3>
                        {categoryData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={categoryData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                        outerRadius={100}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {categoryData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value) => `₹${value}`} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-64 flex items-center justify-center text-gray-500">
                                No expense data available
                            </div>
                        )}
                    </Card>

                    {/* Line Chart - Time-based Trends */}
                    <Card>
                        <h3 className="text-xl font-semibold text-gray-800 mb-6">Spending Trends</h3>
                        {timeData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={timeData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis />
                                    <Tooltip formatter={(value) => `₹${value}`} />
                                    <Legend />
                                    <Line type="monotone" dataKey="income" stroke="#22c55e" strokeWidth={2} name="Income" />
                                    <Line type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2} name="Expense" />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-64 flex items-center justify-center text-gray-500">
                                No transaction data available
                            </div>
                        )}
                    </Card>
                </div>

                {/* Recent Transactions Table */}
                <Card>
                    <h3 className="text-xl font-semibold text-gray-800 mb-6">Recent Transactions</h3>
                    {filteredTransactions.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-200">
                                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Merchant</th>
                                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Category</th>
                                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Type</th>
                                        <th className="text-right py-3 px-4 font-semibold text-gray-700">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredTransactions.slice(0, 10).map((transaction, index) => (
                                        <tr key={transaction.id || index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                            <td className="py-3 px-4 text-gray-600">{transaction.date}</td>
                                            <td className="py-3 px-4 text-gray-800 font-medium">{transaction.merchant}</td>
                                            <td className="py-3 px-4">
                                                <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">
                                                    {transaction.category}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className={`px-3 py-1 rounded-full text-sm ${transaction.type === 'Income'
                                                        ? 'bg-success-100 text-success-700'
                                                        : 'bg-danger-100 text-danger-700'
                                                    }`}>
                                                    {transaction.type}
                                                </span>
                                            </td>
                                            <td className={`py-3 px-4 text-right font-semibold ${transaction.type === 'Income' ? 'text-success-600' : 'text-danger-600'
                                                }`}>
                                                {transaction.type === 'Income' ? '+' : '-'}₹{transaction.amount.toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 text-lg">No transactions found</p>
                            <p className="text-gray-400 text-sm mt-2">Transactions will appear here once you start tracking expenses</p>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
};

export default Dashboard;
