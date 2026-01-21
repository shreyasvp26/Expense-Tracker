import api from './api';

/**
 * Fetch all transactions from backend
 */
export const getTransactions = async (limit = 100) => {
    try {
        const response = await api.get(`/transactions?limit=${limit}`);

        // Transform backend response to frontend format
        const transactions = response.data.transactions || [];

        return transactions.map(t => ({
            id: t.id || Math.random().toString(36).substr(2, 9),
            date: t.Date,
            amount: parseFloat(t.Amount),
            merchant: t.Recipient,
            type: t.Type, // "Income" or "Expense"
            bank: t.User_Bank,
            category: t.category || getCategoryFromMerchant(t.Recipient), // Fallback to merchant-based category
        }));
    } catch (error) {
        console.error('Error fetching transactions:', error);
        throw error;
    }
};

/**
 * Get category from merchant name (fallback when backend doesn't provide category)
 */
const getCategoryFromMerchant = (merchant) => {
    const merchantLower = merchant?.toLowerCase() || '';

    if (merchantLower.includes('amazon') || merchantLower.includes('flipkart') || merchantLower.includes('shop')) {
        return 'Shopping';
    }
    if (merchantLower.includes('uber') || merchantLower.includes('ola') || merchantLower.includes('petrol')) {
        return 'Transportation';
    }
    if (merchantLower.includes('swiggy') || merchantLower.includes('zomato') || merchantLower.includes('restaurant')) {
        return 'Food & Dining';
    }
    if (merchantLower.includes('netflix') || merchantLower.includes('spotify') || merchantLower.includes('prime')) {
        return 'Entertainment';
    }
    if (merchantLower.includes('electricity') || merchantLower.includes('water') || merchantLower.includes('gas')) {
        return 'Utilities';
    }
    if (merchantLower.includes('hospital') || merchantLower.includes('pharmacy') || merchantLower.includes('doctor')) {
        return 'Healthcare';
    }

    return 'Others';
};

/**
 * Calculate statistics from transactions
 */
export const calculateStats = (transactions) => {
    const expenses = transactions.filter(t => t.type === 'Expense');
    const income = transactions.filter(t => t.type === 'Income');

    const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);
    const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);

    return {
        totalExpenses,
        totalIncome,
        netBalance: totalIncome - totalExpenses,
        transactionCount: transactions.length,
    };
};

/**
 * Group transactions by category
 */
export const groupByCategory = (transactions) => {
    const expenses = transactions.filter(t => t.type === 'Expense');
    const categoryMap = {};

    expenses.forEach(t => {
        const category = t.category || 'Others';
        if (!categoryMap[category]) {
            categoryMap[category] = 0;
        }
        categoryMap[category] += t.amount;
    });

    return Object.entries(categoryMap).map(([name, value]) => ({
        name,
        value: parseFloat(value.toFixed(2)),
    }));
};

/**
 * Group transactions by date for time-based charts
 */
export const groupByDate = (transactions) => {
    const dateMap = {};

    transactions.forEach(t => {
        // Extract date (YYYY-MM-DD) from timestamp
        const date = t.date?.split(' ')[0] || new Date().toISOString().split('T')[0];

        if (!dateMap[date]) {
            dateMap[date] = { date, income: 0, expense: 0 };
        }

        if (t.type === 'Income') {
            dateMap[date].income += t.amount;
        } else {
            dateMap[date].expense += t.amount;
        }
    });

    // Sort by date and return
    return Object.values(dateMap)
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .map(item => ({
            ...item,
            income: parseFloat(item.income.toFixed(2)),
            expense: parseFloat(item.expense.toFixed(2)),
        }));
};
