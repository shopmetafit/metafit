import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import {
    DollarSign,
    TrendingUp,
    Loader,
    Download,
    Calendar,
    CreditCard,
    AlertCircle,
} from "lucide-react";

const VendorEarnings = () => {
    const { user } = useSelector((state) => state.auth);
    const [earnings, setEarnings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [period, setPeriod] = useState("monthly");

    useEffect(() => {
        fetchEarnings();
    }, [period]);

    const fetchEarnings = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("userToken");
            // In a real app, this would fetch earnings data
            const response = await axios.get(
                `${import.meta.env.VITE_BACKEND_URL}/api/vendor/earnings?period=${period}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            setEarnings(response.data);
            setError(null);
        } catch (err) {
            // Mock data for demo
            setEarnings({
                totalEarnings: 45200,
                totalSales: 52000,
                totalCommission: 5200,
                commissionRate: 10,
                pendingPayment: 12500,
                lastPayment: {
                    amount: 32700,
                    date: "2024-01-15",
                },
                monthlyData: [
                    { month: "Jan", sales: 52000, commission: 5200 },
                    { month: "Feb", sales: 48000, commission: 4800 },
                    { month: "Mar", sales: 61000, commission: 6100 },
                ],
            });
            console.error("Error fetching earnings:", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader className="animate-spin" size={40} />
            </div>
        );
    }

    const StatCard = ({ icon: Icon, label, value, subtext, color }) => (
        <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 border-l-4 ${color}`}>
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-gray-600 text-sm font-medium">{label}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">₹{value}</p>
                    {subtext && <p className="text-xs text-gray-500 mt-1">{subtext}</p>}
                </div>
                <Icon className="text-gray-300" size={40} />
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="p-8">
                <div className="max-w-6xl mx-auto">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Earnings</h1>
                            <p className="text-gray-600 mt-1">
                                Track your sales, commissions, and payments
                            </p>
                        </div>
                        <button className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition font-semibold">
                            <Download size={20} />
                            <span>Download Report</span>
                        </button>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-start gap-3">
                            <AlertCircle size={20} className="mt-0.5 flex-shrink-0" />
                            <div>{error}</div>
                        </div>
                    )}

                    {/* Period Filter */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6 flex items-center gap-4">
                        <Calendar size={20} className="text-gray-600" />
                        <select
                            value={period}
                            onChange={(e) => setPeriod(e.target.value)}
                            className="outline-none bg-gray-100 px-4 py-2.5 rounded-lg font-medium text-sm"
                        >
                            <option value="weekly">This Week</option>
                            <option value="monthly">This Month</option>
                            <option value="quarterly">This Quarter</option>
                            <option value="yearly">This Year</option>
                        </select>
                    </div>

                    {/* Stats Grid */}
                    {earnings && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <StatCard
                                    icon={DollarSign}
                                    label="Total Sales"
                                    value={earnings.totalSales.toLocaleString("en-IN")}
                                    color="border-blue-500"
                                />
                                <StatCard
                                    icon={TrendingUp}
                                    label="Your Earnings"
                                    value={(
                                        earnings.totalSales - earnings.totalCommission
                                    ).toLocaleString("en-IN")}
                                    color="border-emerald-500"
                                />
                                <StatCard
                                    icon={CreditCard}
                                    label="Commission Deducted"
                                    value={earnings.totalCommission.toLocaleString("en-IN")}
                                    subtext={`${earnings.commissionRate}% rate`}
                                    color="border-orange-500"
                                />
                                <StatCard
                                    icon={DollarSign}
                                    label="Pending Payment"
                                    value={earnings.pendingPayment.toLocaleString("en-IN")}
                                    subtext="Awaiting settlement"
                                    color="border-purple-500"
                                />
                            </div>

                            {/* Last Payment */}
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                <h2 className="text-lg font-bold text-gray-900 mb-4">
                                    Last Payment
                                </h2>
                                <div className="flex justify-between items-center p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                                    <div>
                                        <p className="text-sm text-gray-600 font-medium">Amount</p>
                                        <p className="text-2xl font-bold text-emerald-600">
                                            ₹{earnings.lastPayment.amount.toLocaleString("en-IN")}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-gray-600 font-medium">Date</p>
                                        <p className="text-lg font-semibold text-gray-900">
                                            {new Date(earnings.lastPayment.date).toLocaleDateString(
                                                "en-IN"
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Monthly Breakdown */}
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                <h2 className="text-lg font-bold text-gray-900 mb-6">
                                    Period Breakdown
                                </h2>
                                <div className="space-y-3">
                                    {earnings.monthlyData?.map((data, idx) => (
                                        <div
                                            key={idx}
                                            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition border border-gray-200"
                                        >
                                            <div className="flex-1">
                                                <p className="font-semibold text-gray-900">{data.month}</p>
                                                <p className="text-sm text-gray-600 mt-0.5">
                                                    Sales: ₹{data.sales.toLocaleString("en-IN")} | Commission: ₹{data.commission.toLocaleString("en-IN")}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-lg font-bold text-emerald-600">
                                                    ₹{(data.sales - data.commission).toLocaleString("en-IN")}
                                                </p>
                                                <p className="text-xs text-gray-500">Earnings</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Commission Info */}
                            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6">
                                <h3 className="text-lg font-bold text-emerald-900 mb-4">
                                    Commission Structure
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <p className="font-semibold text-emerald-900">Your Commission Rate</p>
                                        <p className="text-3xl font-bold text-emerald-600 mt-2">
                                            {earnings.commissionRate}%
                                        </p>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-emerald-900">How It Works</p>
                                        <p className="text-sm text-emerald-800 mt-2">
                                            For every sale, {earnings.commissionRate}% is deducted for platform fees and payment processing.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Payment Methods */}
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                <h2 className="text-lg font-bold text-gray-900 mb-4">
                                    Payment Method
                                </h2>
                                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 flex justify-between items-center">
                                    <div>
                                        <p className="font-semibold text-gray-900">
                                            {user?.bankDetails?.bankName || "Bank Account"}
                                        </p>
                                        <p className="text-sm text-gray-600 mt-0.5">
                                            {user?.bankDetails?.accountNumber?.slice(-4)
                                                ? `Account ending in ****${user.bankDetails.accountNumber.slice(-4)}`
                                                : "Not configured"}
                                        </p>
                                    </div>
                                    <button className="text-emerald-600 hover:text-emerald-700 font-semibold transition">
                                        Update
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VendorEarnings;
