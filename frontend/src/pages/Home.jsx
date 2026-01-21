import { Link } from 'react-router-dom';
import { ArrowRight, TrendingUp, PieChart, Shield, Zap } from 'lucide-react';
import Button from '../components/ui/Button';

const Home = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-primary-50 to-purple-50">
            {/* Hero Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
                <div className="text-center animate-fade-in">
                    {/* Main Heading */}
                    <h1 className="text-5xl md:text-7xl font-extrabold mb-6 animate-slide-up">
                        <span className="gradient-text">Expense Tracker</span>
                    </h1>

                    <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto animate-slide-up" style={{ animationDelay: '0.1s' }}>
                        Track your expenses effortlessly with AI-powered categorization and beautiful visualizations
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                        <Link to="/signup">
                            <Button size="lg" icon={ArrowRight}>
                                Get Started Free
                            </Button>
                        </Link>
                        <Link to="/login">
                            <Button variant="secondary" size="lg">
                                Login
                            </Button>
                        </Link>
                    </div>

                    {/* Hero Image/Illustration Placeholder */}
                    <div className="relative max-w-4xl mx-auto animate-scale-in" style={{ animationDelay: '0.3s' }}>
                        <div className="glass-card p-8 rounded-2xl">
                            <div className="bg-gradient-to-br from-primary-600 via-purple-600 to-pink-600 rounded-xl p-12 text-white">
                                <div className="grid grid-cols-3 gap-4 mb-6">
                                    <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 text-center">
                                        <div className="text-3xl font-bold">₹45,230</div>
                                        <div className="text-sm opacity-90">Total Expenses</div>
                                    </div>
                                    <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 text-center">
                                        <div className="text-3xl font-bold">₹65,000</div>
                                        <div className="text-sm opacity-90">Income</div>
                                    </div>
                                    <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 text-center">
                                        <div className="text-3xl font-bold">₹19,770</div>
                                        <div className="text-sm opacity-90">Savings</div>
                                    </div>
                                </div>
                                <div className="text-center text-sm opacity-75">
                                    Real-time expense tracking at your fingertips
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Features Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-800">
                    Why Choose Expense Tracker?
                </h2>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {/* Feature 1 */}
                    <div className="card text-center animate-slide-up" style={{ animationDelay: '0.1s' }}>
                        <div className="bg-gradient-to-br from-primary-500 to-primary-700 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Zap className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Instant Tracking</h3>
                        <p className="text-gray-600">
                            Automatically capture and categorize expenses from SMS notifications
                        </p>
                    </div>

                    {/* Feature 2 */}
                    <div className="card text-center animate-slide-up" style={{ animationDelay: '0.2s' }}>
                        <div className="bg-gradient-to-br from-purple-500 to-purple-700 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <PieChart className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Visual Insights</h3>
                        <p className="text-gray-600">
                            Beautiful charts and graphs to understand your spending patterns
                        </p>
                    </div>

                    {/* Feature 3 */}
                    <div className="card text-center animate-slide-up" style={{ animationDelay: '0.3s' }}>
                        <div className="bg-gradient-to-br from-pink-500 to-pink-700 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <TrendingUp className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Smart Analytics</h3>
                        <p className="text-gray-600">
                            AI-powered categorization and spending trend analysis
                        </p>
                    </div>

                    {/* Feature 4 */}
                    <div className="card text-center animate-slide-up" style={{ animationDelay: '0.4s' }}>
                        <div className="bg-gradient-to-br from-green-500 to-green-700 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Shield className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Secure & Private</h3>
                        <p className="text-gray-600">
                            Your financial data is encrypted and stored securely
                        </p>
                    </div>
                </div>
            </div>

            {/* CTA Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="gradient-bg rounded-2xl p-12 text-center text-white animate-gradient">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">
                        Ready to Take Control of Your Finances?
                    </h2>
                    <p className="text-xl mb-8 opacity-90">
                        Join thousands of users who are already managing their money smarter
                    </p>
                    <Link to="/signup">
                        <Button variant="secondary" size="lg" className="bg-white text-primary-600 hover:bg-gray-100">
                            Start Tracking Now
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Home;
