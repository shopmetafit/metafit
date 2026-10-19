import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import {
  LifeBuoy,
  PlusCircle,
  MessageSquare,
  Package,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Send,
  User,
  MapPin,
  Loader2,
  X,
  FileQuestion,
  Filter,
  Check,
  Headphones,
  ExternalLink,
  ChevronDown,
  Info,
  ShieldCheck,
  RefreshCw,
  Search,
  Phone,
  Mail,
  ArrowLeft,
  Sparkles,
  HelpCircle,
  Copy,
  CheckCheck,
} from "lucide-react";
import {
  fetchUserTickets,
  fetchTicketDetails,
  createTicket,
  replyTicket,
  closeCustomerTicket,
  clearCurrentTicket,
} from "../redux/slices/ticketSlice";
import { fetchUserOrders } from "../redux/slices/orderSlice";
import { toast } from "sonner";
import SEO from "../components/SEO/SEO";

const CATEGORIES = [
  "Order & Delivery",
  "Payment Issues",
  "Return & Refund",
  "Damaged or Wrong Product",
  "Product Information",
  "Account Issues",
  "Other",
];

const ORDER_RELATED_CATEGORIES = [
  "Order & Delivery",
  "Payment Issues",
  "Return & Refund",
  "Damaged or Wrong Product",
];

const VERIFIED_FAQS = [
  {
    q: "How can I track my shipment?",
    a: "Once your order is dispatched, you will receive tracking updates via SMS and Email. You can also track your package in real-time from the My Orders section by clicking 'Track Order'.",
    cat: "Order & Delivery",
  },
  {
    q: "What is the standard delivery timeline?",
    a: "Orders are dispatched within 24–48 business hours. Deliveries typically take 2–5 business days depending on your location across India via BlueDart and premier courier partners.",
    cat: "Order & Delivery",
  },
  {
    q: "How do I report a damaged, defective, or incorrect product?",
    a: "Please open a support ticket under the 'Damaged or Wrong Product' category within 48 hours of delivery. Select the affected order, describe the issue, and our team will arrange a prompt replacement or refund.",
    cat: "Damaged or Wrong Product",
  },
  {
    q: "What is the return and refund policy?",
    a: "Unopened wellness products with intact seals can be returned within 7 days of delivery. Once verified at our fulfillment center, refunds are processed back to your original payment method within 5–7 business days.",
    cat: "Return & Refund",
  },
  {
    q: "My payment was deducted, but the order was not confirmed. What should I do?",
    a: "If your money was debited but the order is missing from My Orders, the transaction usually auto-reverses within 24–48 hours by your bank or payment gateway. Open a ticket with 'Payment Issues' and provide the payment reference ID if not reversed within 3 days.",
    cat: "Payment Issues",
  },
  {
    q: "Are all products 100% authentic and tested?",
    a: "Yes, every product on M Wellness Bazaar is sourced directly from certified wellness brands with complete lab testing, FSSAI compliance, and strict quality assurance.",
    cat: "Product Information",
  },
];

const getStatusBadge = (status) => {
  switch (status) {
    case "Open":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <Clock className="w-3 h-3 text-emerald-600" /> Open
        </span>
      );
    case "In Progress":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          <RefreshCw className="w-3 h-3 text-blue-600 animate-spin" /> In Progress
        </span>
      );
    case "Waiting for Customer":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <AlertCircle className="w-3 h-3 text-amber-600" /> Action Required
        </span>
      );
    case "Resolved":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
          <CheckCircle2 className="w-3 h-3 text-teal-600" /> Resolved
        </span>
      );
    case "Closed":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
          <Check className="w-3 h-3 text-slate-500" /> Closed
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
          {status}
        </span>
      );
  }
};

const SupportPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const { user } = useSelector((state) => state.auth);
  const { tickets, currentTicket, loading, detailsLoading } = useSelector(
    (state) => state.tickets
  );
  const { orders } = useSelector((state) => state.orders);

  // Active Main Tab: "tickets" | "create" | "faqs"
  const activeTab = searchParams.get("tab") || "tickets";
  const selectedTicketIdParam = searchParams.get("ticketId");

  // Filters & Search for Tickets
  const [ticketSearch, setTicketSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // New Ticket Form State
  const [formData, setFormData] = useState({
    category: "Order & Delivery",
    orderId: "",
    subject: "",
    description: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdSuccessTicket, setCreatedSuccessTicket] = useState(null);

  // Conversation Detail Modal
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [isReplying, setIsReplying] = useState(false);
  const [copiedTicketNumber, setCopiedTicketNumber] = useState(false);

  // FAQ Search & Accordion State
  const [faqSearch, setFaqSearch] = useState("");
  const [faqCategoryFilter, setFaqCategoryFilter] = useState("All");
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  // Load Initial Data
  useEffect(() => {
    const token = localStorage.getItem("userToken");
    if (!token || !user) {
      navigate("/login?redirect=/support");
      return;
    }
    dispatch(fetchUserTickets({ status: statusFilter }));
    dispatch(fetchUserOrders());
  }, [dispatch, user, navigate, statusFilter]);

  // Open ticket if ID is in URL
  useEffect(() => {
    if (selectedTicketIdParam) {
      dispatch(fetchTicketDetails(selectedTicketIdParam))
        .unwrap()
        .then((res) => {
          setSelectedTicket(res.ticket);
        })
        .catch(() => {
          toast.error("Could not load the requested ticket.");
        });
    }
  }, [selectedTicketIdParam, dispatch]);

  // Keep selectedTicket updated when currentTicket changes
  useEffect(() => {
    if (currentTicket && selectedTicket && currentTicket._id === selectedTicket._id) {
      setSelectedTicket(currentTicket);
    }
  }, [currentTicket]);

  const handleTabChange = (newTab) => {
    setSearchParams({ tab: newTab });
  };

  const isOrderRelated = ORDER_RELATED_CATEGORIES.includes(formData.category);

  // Form Submission
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!formData.subject || formData.subject.trim().length < 3) {
      toast.error("Subject must be at least 3 characters.");
      return;
    }

    if (!formData.description || formData.description.trim().length < 10) {
      toast.error("Please provide a detailed description (at least 10 characters).");
      return;
    }

    if (isOrderRelated && orders.length > 0 && !formData.orderId) {
      const confirmContinue = window.confirm(
        "You haven't selected a specific order. Would you like to select an order to help resolve this faster?"
      );
      if (confirmContinue) {
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const res = await dispatch(
        createTicket({
          category: formData.category,
          subject: formData.subject.trim(),
          description: formData.description.trim(),
          orderId: formData.orderId || null,
        })
      ).unwrap();

      toast.success(`Ticket #${res.ticket.ticketNumber} created successfully!`);
      setCreatedSuccessTicket(res.ticket);
      setFormData({
        category: "Order & Delivery",
        orderId: "",
        subject: "",
        description: "",
      });
      dispatch(fetchUserTickets({ status: statusFilter }));
    } catch (err) {
      toast.error(err || "Failed to create support ticket. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Ticket Details Modal
  const handleOpenTicket = (ticket) => {
    setSelectedTicket(ticket);
    dispatch(fetchTicketDetails(ticket._id));
  };

  const handleCloseTicketModal = () => {
    setSelectedTicket(null);
    setReplyText("");
    dispatch(clearCurrentTicket());
    if (selectedTicketIdParam) {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("ticketId");
      setSearchParams(newParams);
    }
  };

  const handleCopyTicket = (num) => {
    navigator.clipboard?.writeText(num);
    setCopiedTicketNumber(true);
    setTimeout(() => setCopiedTicketNumber(false), 2000);
    toast.success("Ticket ID copied to clipboard");
  };

  // Reply to ticket
  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || isReplying || !selectedTicket) return;

    setIsReplying(true);
    try {
      const res = await dispatch(
        replyTicket({
          ticketId: selectedTicket._id,
          message: replyText.trim(),
        })
      ).unwrap();

      toast.success("Reply submitted successfully");
      setSelectedTicket(res.ticket);
      setReplyText("");
    } catch (err) {
      toast.error(err || "Failed to send reply");
    } finally {
      setIsReplying(false);
    }
  };

  // Customer closes ticket
  const handleMarkClosed = async () => {
    if (!selectedTicket) return;
    if (
      !window.confirm(
        "Are you sure your issue is resolved? This will mark the ticket as closed."
      )
    ) {
      return;
    }

    try {
      const res = await dispatch(closeCustomerTicket(selectedTicket._id)).unwrap();
      toast.success("Ticket closed. Thank you!");
      setSelectedTicket(res.ticket);
      dispatch(fetchUserTickets({ status: statusFilter }));
    } catch (err) {
      toast.error(err || "Failed to close ticket");
    }
  };

  // Filtered Tickets by Search Query
  const displayedTickets = useMemo(() => {
    if (!tickets || tickets.length === 0) return [];
    if (!ticketSearch.trim()) return tickets;
    const query = ticketSearch.toLowerCase().trim();
    return tickets.filter((t) => {
      const numMatch = t.ticketNumber?.toLowerCase().includes(query);
      const subMatch = t.subject?.toLowerCase().includes(query);
      const ordMatch = t.orderNumber?.toLowerCase().includes(query);
      const catMatch = t.category?.toLowerCase().includes(query);
      return numMatch || subMatch || ordMatch || catMatch;
    });
  }, [tickets, ticketSearch]);

  // Filtered FAQs
  const filteredFaqs = useMemo(() => {
    let result = VERIFIED_FAQS;
    if (faqCategoryFilter !== "All") {
      result = result.filter((f) => f.cat === faqCategoryFilter);
    }
    if (faqSearch.trim()) {
      const q = faqSearch.toLowerCase().trim();
      result = result.filter(
        (f) =>
          f.q.toLowerCase().includes(q) ||
          f.a.toLowerCase().includes(q) ||
          f.cat.toLowerCase().includes(q)
      );
    }
    return result;
  }, [faqSearch, faqCategoryFilter]);

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 antialiased py-3 sm:py-6">
      <SEO
        title="Help & Support — M Wellness Bazaar Customer Care"
        description="Fast assistance, track support tickets, and resolve order or product queries with the M Wellness Bazaar customer care team."
        canonical="/support"
      />

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        {/* ── Breadcrumb Navigation ── */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1.5 text-xs text-slate-500 mb-3 sm:mb-4 overflow-x-auto whitespace-nowrap"
        >
          <Link to="/" className="hover:text-[#022824] transition-colors font-medium">
            Home
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <Link to="/profile" className="hover:text-[#022824] transition-colors font-medium">
            My Account
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <span className="text-slate-900 font-semibold">Help & Support</span>
        </nav>

        {/* ── Top Account Navigation Tabs ── */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-1 mb-4 sm:mb-6 grid grid-cols-4 gap-1 sm:flex sm:items-center sm:gap-1.5">
          <Link
            to="/profile"
            className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-1 sm:gap-2 px-2.5 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all text-center"
          >
            <User className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="hidden sm:inline">Profile Information</span>
            <span className="sm:hidden font-medium">Profile</span>
          </Link>
          <Link
            to="/my-orders"
            className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-1 sm:gap-2 px-2.5 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all text-center"
          >
            <Package className="w-4 h-4 text-sky-600 shrink-0" />
            <span className="hidden sm:inline">My Orders</span>
            <span className="sm:hidden font-medium">Orders</span>
          </Link>
          <Link
            to="/my-addresses"
            className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-1 sm:gap-2 px-2.5 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all text-center"
          >
            <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="hidden sm:inline">Saved Addresses</span>
            <span className="sm:hidden font-medium">Addresses</span>
          </Link>
          <Link
            to="/support"
            className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-1 sm:gap-2 px-2.5 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold bg-[#022824] text-white shadow-xs text-center"
          >
            <Headphones className="w-4 h-4 text-teal-300 shrink-0" />
            <span className="hidden sm:inline">Help & Support</span>
            <span className="sm:hidden font-bold">Support</span>
          </Link>
        </div>

        {/* ── Premium Compact Support Header ── */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#022824] via-[#043e38] to-[#022824] text-white p-5 sm:p-7 mb-5 shadow-sm border border-teal-900/50">
          {/* Subtle brand ambient glow */}
          <div className="absolute -right-8 -bottom-10 w-48 h-48 bg-teal-400/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute left-1/3 -top-10 w-36 h-36 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-900/80 text-teal-300 text-[11px] font-semibold border border-teal-700/50 mb-2">
                <Sparkles className="w-3 h-3 text-teal-300" />
                <span>Customer Care Center</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                How can we help you?
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-teal-100/80 leading-relaxed">
                Track active inquiries, submit a new assistance request, or browse verified answers to common questions.
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0 self-start md:self-center">
              {activeTab !== "create" ? (
                <button
                  type="button"
                  onClick={() => handleTabChange("create")}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-[#022824] text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4 text-[#022824]" />
                  <span>Open a Ticket</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleTabChange("tickets")}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all border border-white/15 cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4 text-teal-300" />
                  <span>View My Tickets ({tickets.length})</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Main Support Navigation Tabs ── */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-1.5 mb-5 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none w-full sm:w-auto">
            <button
              type="button"
              onClick={() => handleTabChange("tickets")}
              className={`inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === "tickets"
                  ? "bg-[#022824] text-white shadow-xs"
                  : "bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <MessageSquare className={`w-4 h-4 ${activeTab === "tickets" ? "text-teal-400" : "text-slate-400"}`} />
              <span>My Tickets</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  activeTab === "tickets" ? "bg-teal-900 text-teal-200" : "bg-slate-100 text-slate-600"
                }`}
              >
                {tickets.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => handleTabChange("create")}
              className={`inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === "create"
                  ? "bg-[#022824] text-white shadow-xs"
                  : "bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <PlusCircle className={`w-4 h-4 ${activeTab === "create" ? "text-teal-400" : "text-slate-400"}`} />
              <span>Open New Ticket</span>
            </button>
            <button
              type="button"
              onClick={() => handleTabChange("faqs")}
              className={`inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === "faqs"
                  ? "bg-[#022824] text-white shadow-xs"
                  : "bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <FileQuestion className={`w-4 h-4 ${activeTab === "faqs" ? "text-teal-400" : "text-slate-400"}`} />
              <span>Instant FAQs</span>
            </button>
          </div>

          <div className="hidden md:flex items-center gap-1.5 pr-2 text-xs text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
            <span className="text-[11px] font-medium text-slate-500">Official Customer Desk</span>
          </div>
        </div>

        {/* =========================================================================
            TAB 1: MY TICKETS LIST
        ========================================================================= */}
        {activeTab === "tickets" && (
          <div>
            {/* Search and Status Filter Toolbar */}
            {tickets.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200/90 p-2.5 sm:p-3 mb-4 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by ticket #, subject, or order..."
                    value={ticketSearch}
                    onChange={(e) => setTicketSearch(e.target.value)}
                    className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 transition-all"
                  />
                  {ticketSearch && (
                    <button
                      type="button"
                      onClick={() => setTicketSearch("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                      aria-label="Clear search"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Filter className="w-3.5 h-3.5 text-slate-400 hidden sm:inline" />
                  <span className="text-xs text-slate-500 font-semibold hidden sm:inline">Status:</span>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold px-3 py-2 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 cursor-pointer w-full sm:w-auto"
                  >
                    <option value="All">All Tickets ({tickets.length})</option>
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Waiting for Customer">Action Required</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>
              </div>
            )}

            {loading ? (
              <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center shadow-xs">
                <Loader2 className="w-8 h-8 text-teal-600 animate-spin mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-700">
                  Loading your support tickets...
                </p>
                <p className="text-xs text-slate-400 mt-1">Connecting to customer care desk</p>
              </div>
            ) : tickets.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200/90 p-8 sm:p-12 text-center shadow-xs max-w-md mx-auto">
                <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-800 flex items-center justify-center mx-auto mb-4 border border-teal-100">
                  <LifeBuoy className="w-7 h-7" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1">
                  No Support Tickets Found
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mb-5 leading-relaxed">
                  {statusFilter === "All"
                    ? "You haven't opened any support tickets yet. Need help with an order, delivery, or product?"
                    : `You have no tickets matching status: "${statusFilter}".`}
                </p>
                <button
                  type="button"
                  onClick={() => handleTabChange("create")}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#022824] hover:bg-[#033b34] text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4 text-teal-300" />
                  <span>Open a Support Ticket</span>
                </button>
              </div>
            ) : displayedTickets.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200/90 p-8 text-center shadow-xs">
                <Search className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-800">
                  No tickets matched "{ticketSearch}"
                </p>
                <p className="text-xs text-slate-400 mt-1">Try searching by ticket number or category.</p>
                <button
                  type="button"
                  onClick={() => setTicketSearch("")}
                  className="mt-3 text-xs font-bold text-teal-700 hover:underline"
                >
                  Clear Search
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {displayedTickets.map((ticket) => {
                  const lastMessage =
                    ticket.messages && ticket.messages.length > 0
                      ? ticket.messages[ticket.messages.length - 1]
                      : null;

                  return (
                    <div
                      key={ticket._id}
                      onClick={() => handleOpenTicket(ticket)}
                      className="bg-white rounded-xl border border-slate-200/90 hover:border-teal-600/50 p-4 sm:p-5 shadow-2xs hover:shadow-xs transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <span className="font-mono font-bold text-xs text-[#022824] bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200/70">
                            #{ticket.ticketNumber}
                          </span>
                          {getStatusBadge(ticket.status)}
                          <span className="text-[11px] text-slate-500 font-semibold px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200">
                            {ticket.category}
                          </span>
                          {ticket.orderNumber && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-sky-800 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200 font-semibold">
                              <Package className="w-3 h-3 text-sky-600" />
                              Order #{ticket.orderNumber}
                            </span>
                          )}
                        </div>

                        <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-teal-900 transition-colors truncate">
                          {ticket.subject}
                        </h3>

                        {lastMessage ? (
                          <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                            <span className="font-semibold text-slate-700">
                              {lastMessage.senderRole === "admin" ||
                                lastMessage.senderRole === "support"
                                ? "Support Team: "
                                : "You: "}
                            </span>
                            {lastMessage.message}
                          </p>
                        ) : (
                          <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                            {ticket.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between md:justify-end gap-4 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                        <div className="text-left md:text-right">
                          <p className="text-[10px] uppercase font-bold text-slate-400">
                            Last Activity
                          </p>
                          <p className="text-xs font-semibold text-slate-700">
                            {new Date(
                              ticket.lastReplyAt || ticket.createdAt
                            ).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </p>
                        </div>

                        <button
                          type="button"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-50 group-hover:bg-[#022824] text-teal-800 group-hover:text-white text-xs font-bold transition-all shadow-2xs"
                        >
                          <span>View</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            TAB 2: OPEN NEW TICKET FORM
        ========================================================================= */}
        {activeTab === "create" && (
          <div className="max-w-3xl mx-auto">
            {createdSuccessTicket ? (
              <div className="bg-white rounded-2xl border border-teal-200/80 p-6 sm:p-8 text-center shadow-xs">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-4 border border-emerald-200">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h2 className="text-xl font-extrabold text-slate-900">
                  Support Ticket Submitted!
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-1">
                  Your request has been logged. Our customer support team will investigate and respond promptly.
                </p>

                <div className="my-6 p-4 bg-slate-50 rounded-xl border border-slate-200 inline-block text-left max-w-md w-full space-y-2">
                  <div className="flex justify-between items-center py-1 border-b border-slate-200 text-xs">
                    <span className="text-slate-500 font-medium">Ticket ID:</span>
                    <span className="font-mono font-bold text-slate-900">
                      #{createdSuccessTicket.ticketNumber}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-200 text-xs">
                    <span className="text-slate-500 font-medium">Category:</span>
                    <span className="font-semibold text-slate-800">
                      {createdSuccessTicket.category}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1 text-xs">
                    <span className="text-slate-500 font-medium">Status:</span>
                    <span className="font-bold text-emerald-700">Open</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setCreatedSuccessTicket(null);
                      handleOpenTicket(createdSuccessTicket);
                    }}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#022824] text-white text-xs font-bold hover:bg-[#033b34] transition-all cursor-pointer shadow-xs"
                  >
                    View Ticket Conversation
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCreatedSuccessTicket(null);
                      handleTabChange("tickets");
                    }}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition-all cursor-pointer"
                  >
                    Back to All Tickets
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-8 shadow-xs">
                <div className="border-b border-slate-100 pb-4 mb-5">
                  <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
                    Open a Support Ticket
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Please provide full details so we can investigate and assist you swiftly.
                  </p>
                </div>

                <form onSubmit={handleCreateSubmit} className="space-y-4 sm:space-y-5">
                  {/* Category Selection */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Issue Category <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({ ...formData, category: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 cursor-pointer"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Order Selector (if order-related) */}
                  {isOrderRelated && (
                    <div className="p-3.5 sm:p-4 bg-teal-50/60 rounded-xl border border-teal-100">
                      <label className="block text-xs font-bold text-teal-900 uppercase tracking-wider mb-1">
                        Select Related Order (Recommended)
                      </label>
                      <p className="text-[11px] text-teal-700 mb-2">
                        Selecting your order helps our specialists inspect tracking, fulfillment, and payment details immediately.
                      </p>

                      {orders && orders.length > 0 ? (
                        <select
                          value={formData.orderId}
                          onChange={(e) =>
                            setFormData({ ...formData, orderId: e.target.value })
                          }
                          className="w-full px-3 py-2 bg-white border border-teal-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 cursor-pointer"
                        >
                          <option value="">-- No specific order / General inquiry --</option>
                          {orders.map((ord) => (
                            <option key={ord._id} value={ord._id}>
                              Order #{ord.orderNumber || ord._id.slice(-8)} — ₹
                              {ord.totalPrice} ({ord.status || "Placed"} on{" "}
                              {new Date(ord.createdAt).toLocaleDateString()})
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="text-xs text-slate-500 italic bg-white p-2.5 rounded-lg border border-teal-100">
                          No previous orders found for this account.
                        </div>
                      )}
                    </div>
                  )}

                  {/* Subject */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Subject / Brief Summary <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {formData.subject.length} / 200
                      </span>
                    </div>
                    <input
                      type="text"
                      required
                      minLength={3}
                      maxLength={200}
                      placeholder="e.g. Package marked delivered but not received"
                      value={formData.subject}
                      onChange={(e) =>
                        setFormData({ ...formData, subject: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 transition-all"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Detailed Description <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {formData.description.length} / 5000
                      </span>
                    </div>
                    <textarea
                      required
                      rows={5}
                      minLength={10}
                      maxLength={5000}
                      placeholder="Please explain your issue clearly. Mention relevant dates, product names, or payment reference IDs..."
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 leading-relaxed"
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl bg-[#022824] hover:bg-[#033b34] text-white font-bold text-xs sm:text-sm shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-teal-300" />
                          <span>Submitting Ticket...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 text-teal-300" />
                          <span>Submit Support Ticket</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            TAB 3: INSTANT VERIFIED FAQS
        ========================================================================= */}
        {activeTab === "faqs" && (
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-8 shadow-xs mb-6">
              <div className="border-b border-slate-100 pb-4 mb-5">
                <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
                  Frequently Asked Questions
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Find instant answers to common questions about orders, delivery, refunds, and products.
                </p>
              </div>

              {/* FAQ Search */}
              <div className="relative mb-4">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search questions (e.g. tracking, refund, damage, authenticity)..."
                  value={faqSearch}
                  onChange={(e) => setFaqSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-4 scrollbar-none">
                {["All", "Order & Delivery", "Return & Refund", "Payment Issues", "Product Information"].map(
                  (cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setFaqCategoryFilter(cat)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${faqCategoryFilter === cat
                          ? "bg-slate-900 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                    >
                      {cat}
                    </button>
                  )
                )}
              </div>

              {/* Accordion List */}
              <div className="space-y-2.5">
                {filteredFaqs.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-500">
                    No FAQs found matching your criteria.
                  </div>
                ) : (
                  filteredFaqs.map((faq, idx) => {
                    const isOpen = openFaqIndex === idx;
                    return (
                      <div
                        key={idx}
                        className="border border-slate-200 rounded-xl overflow-hidden transition-all"
                      >
                        <button
                          type="button"
                          onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                          className="w-full flex items-center justify-between p-3.5 sm:p-4 text-left font-bold text-xs sm:text-sm text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer"
                        >
                          <span className="pr-4">{faq.q}</span>
                          <ChevronDown
                            className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${isOpen ? "rotate-180 text-teal-700" : ""
                              }`}
                          />
                        </button>
                        {isOpen && (
                          <div className="p-4 pt-0 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/60">
                            <p>{faq.a}</p>
                            <span className="inline-block mt-2.5 text-[10px] font-bold uppercase tracking-wider text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200/60">
                              {faq.cat}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Bottom Need Help Box */}
              <div className="mt-8 p-4 bg-teal-50/70 rounded-xl border border-teal-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-teal-950">
                    Didn't find an answer to your question?
                  </h4>
                  <p className="text-[11px] text-teal-800 mt-0.5">
                    Open a support ticket and our customer care team will respond directly.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleTabChange("create")}
                  className="px-4 py-2 rounded-lg bg-[#022824] text-white text-xs font-bold hover:bg-[#033b34] transition-all cursor-pointer whitespace-nowrap shadow-xs"
                >
                  Create Ticket
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TICKET DETAIL & CONVERSATION MODAL
        ========================================================================= */}
        {selectedTicket && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div
              className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="bg-[#022824] text-white p-4 sm:p-5 flex items-start justify-between gap-3 shrink-0">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleCopyTicket(selectedTicket.ticketNumber)}
                      className="font-mono text-xs font-bold bg-white/15 hover:bg-white/25 text-teal-200 px-2 py-0.5 rounded inline-flex items-center gap-1 transition"
                      title="Click to copy ticket number"
                    >
                      <span>#{selectedTicket.ticketNumber}</span>
                      {copiedTicketNumber ? (
                        <CheckCheck className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3 text-teal-300" />
                      )}
                    </button>
                    {getStatusBadge(selectedTicket.status)}
                    <span className="text-xs text-teal-200/90 font-medium">
                      {selectedTicket.category}
                    </span>
                  </div>
                  <h2 className="text-sm sm:text-base font-bold text-white mt-1.5 truncate">
                    {selectedTicket.subject}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={handleCloseTicketModal}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-gray-300 hover:text-white transition-colors cursor-pointer"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Order Information Strip if linked */}
              {selectedTicket.order && (
                <div className="bg-sky-50 px-4 py-2.5 border-b border-sky-100 flex items-center justify-between text-xs text-sky-900 shrink-0">
                  <div className="flex items-center gap-2 truncate">
                    <Package className="w-4 h-4 text-sky-600 shrink-0" />
                    <span>
                      Linked Order: <b>#{selectedTicket.order.orderNumber || selectedTicket.order._id}</b>
                    </span>
                    <span className="hidden sm:inline text-sky-700">
                      (₹{selectedTicket.order.totalPrice} • {selectedTicket.order.status})
                    </span>
                  </div>
                  <Link
                    to={`/order/${selectedTicket.order._id}`}
                    target="_blank"
                    className="inline-flex items-center gap-1 text-sky-700 hover:text-sky-950 font-bold underline shrink-0 ml-2"
                  >
                    <span>View Order</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              )}

              {/* Conversation Messages Thread */}
              <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-3.5 bg-[#f8fafc]">
                {detailsLoading ? (
                  <div className="text-center py-10">
                    <Loader2 className="w-6 h-6 text-teal-600 animate-spin mx-auto mb-2" />
                    <p className="text-xs text-slate-500 font-medium">Loading messages...</p>
                  </div>
                ) : (
                  selectedTicket.messages &&
                  selectedTicket.messages.map((msg, index) => {
                    const isStaff =
                      msg.senderRole === "admin" || msg.senderRole === "support";
                    return (
                      <div
                        key={msg._id || index}
                        className={`flex gap-2.5 ${isStaff ? "justify-start" : "justify-end"
                          }`}
                      >
                        {isStaff && (
                          <div className="w-7 h-7 rounded-full bg-[#022824] text-teal-200 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                            MW
                          </div>
                        )}

                        <div
                          className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-3.5 shadow-2xs ${isStaff
                              ? "bg-white border border-slate-200 text-slate-800"
                              : "bg-[#022824] text-white"
                            }`}
                        >
                          <div
                            className={`flex items-center justify-between gap-3 text-[11px] mb-1 font-semibold ${isStaff ? "text-teal-800" : "text-teal-200"
                              }`}
                          >
                            <span>
                              {isStaff ? "M Wellness Support Specialist" : "You"}
                            </span>
                            <span className="text-[10px] opacity-75 font-normal">
                              {new Date(msg.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                                day: "numeric",
                                month: "short",
                              })}
                            </span>
                          </div>

                          <p className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">
                            {msg.message}
                          </p>
                        </div>

                        {!isStaff && (
                          <div className="w-7 h-7 rounded-full bg-slate-700 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                            {user.name ? user.name[0].toUpperCase() : "U"}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Reply Box & Action Footer */}
              <div className="p-4 bg-white border-t border-slate-200 shrink-0">
                {selectedTicket.status === "Closed" ? (
                  <div className="p-3 bg-slate-50 rounded-xl text-center text-xs text-slate-600 font-medium border border-slate-200">
                    This ticket has been marked as <b>Closed</b>. If you require further assistance, please open a new ticket.
                  </div>
                ) : (
                  <div>
                    <form onSubmit={handleSendReply} className="flex gap-2">
                      <textarea
                        rows={2}
                        required
                        placeholder="Type your reply to customer support..."
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        className="flex-1 px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 resize-none font-medium"
                      />
                      <button
                        type="submit"
                        disabled={isReplying || !replyText.trim()}
                        className="px-4 py-2 bg-[#022824] hover:bg-[#033b34] text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0"
                      >
                        {isReplying ? (
                          <Loader2 className="w-4 h-4 animate-spin text-teal-300" />
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5 text-teal-300" />
                            <span className="hidden sm:inline">Send</span>
                          </>
                        )}
                      </button>
                    </form>

                    <div className="mt-2.5 flex items-center justify-between text-xs text-slate-500">
                      <span>Status: {getStatusBadge(selectedTicket.status)}</span>
                      {selectedTicket.status !== "Closed" && (
                        <button
                          type="button"
                          onClick={handleMarkClosed}
                          className="text-xs text-slate-500 hover:text-rose-600 underline font-medium cursor-pointer"
                        >
                          Issue resolved? Mark Ticket as Closed
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SupportPage;
