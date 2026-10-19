import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  LifeBuoy,
  Search,
  Filter,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Package,
  Send,
  X,
  ExternalLink,
  ChevronRight,
  User,
  Mail,
  Phone,
  ShieldAlert,
  Loader2,
  Calendar,
  SlidersHorizontal,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  fetchAdminTickets,
  fetchAdminTicketStats,
  fetchTicketDetails,
  adminUpdateTicketStatus,
  adminReplyTicket,
  adminDeleteTicket,
  clearCurrentTicket,
} from "../../redux/slices/ticketSlice";
import { Link } from "react-router-dom";

const CATEGORIES = [
  "All",
  "Order & Delivery",
  "Payment Issues",
  "Return & Refund",
  "Damaged or Wrong Product",
  "Product Information",
  "Account Issues",
  "Other",
];

const STATUSES = [
  "All",
  "Open",
  "In Progress",
  "Waiting for Customer",
  "Resolved",
  "Closed",
];

const PRIORITIES = ["All", "Low", "Medium", "High", "Urgent"];

const getStatusBadge = (status) => {
  switch (status) {
    case "Open":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
          <Clock className="w-3 h-3" /> Open
        </span>
      );
    case "In Progress":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
          <RefreshCw className="w-3 h-3" /> In Progress
        </span>
      );
    case "Waiting for Customer":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
          <AlertCircle className="w-3 h-3" /> Waiting Customer
        </span>
      );
    case "Resolved":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-100 text-teal-800">
          <CheckCircle2 className="w-3 h-3" /> Resolved
        </span>
      );
    case "Closed":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-200 text-gray-800">
          Closed
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-800">
          {status}
        </span>
      );
  }
};

const getPriorityBadge = (priority) => {
  switch (priority) {
    case "Urgent":
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-red-100 text-red-700">
          Urgent
        </span>
      );
    case "High":
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-orange-100 text-orange-700">
          High
        </span>
      );
    case "Low":
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-gray-600">
          Low
        </span>
      );
    default:
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
          Medium
        </span>
      );
  }
};

const TicketManagement = () => {
  const dispatch = useDispatch();
  const { tickets, stats, pagination, loading, detailsLoading, replying } =
    useSelector((state) => state.tickets);
  const { user } = useSelector((state) => state.auth);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedPriority, setSelectedPriority] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);

  // Detail Modal
  const [activeTicket, setActiveTicket] = useState(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [newPriority, setNewPriority] = useState("");
  const [statusNote, setStatusNote] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Delete Ticket Confirmation State
  const [ticketToDelete, setTicketToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load tickets and stats
  const loadTickets = () => {
    dispatch(
      fetchAdminTickets({
        status: selectedStatus,
        category: selectedCategory,
        priority: selectedPriority,
        search: searchTerm,
        page: currentPage,
        limit: 15,
      })
    );
    dispatch(fetchAdminTicketStats());
  };

  useEffect(() => {
    loadTickets();
  }, [
    dispatch,
    selectedStatus,
    selectedCategory,
    selectedPriority,
    currentPage,
  ]);

  // Handle Search on Enter or debounce
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    loadTickets();
  };

  // Open ticket conversation modal
  const handleOpenTicket = async (ticket) => {
    setActiveTicket(ticket);
    setNewStatus(ticket.status);
    setNewPriority(ticket.priority || "Medium");
    try {
      const res = await dispatch(fetchTicketDetails(ticket._id)).unwrap();
      setActiveTicket(res.ticket);
      setNewStatus(res.ticket.status);
      setNewPriority(res.ticket.priority || "Medium");
    } catch {
      toast.error("Failed to load ticket conversation");
    }
  };

  const handleCloseModal = () => {
    setActiveTicket(null);
    setReplyMessage("");
    setStatusNote("");
    dispatch(clearCurrentTicket());
  };

  const handleConfirmDelete = (ticket) => {
    setTicketToDelete(ticket);
  };

  const handleExecuteDelete = async () => {
    if (!ticketToDelete || isDeleting) return;
    setIsDeleting(true);
    try {
      const res = await dispatch(adminDeleteTicket(ticketToDelete._id)).unwrap();
      toast.success(res.message || "Ticket permanently deleted");
      if (activeTicket && activeTicket._id === ticketToDelete._id) {
        handleCloseModal();
      }
      setTicketToDelete(null);
      loadTickets();
    } catch (err) {
      toast.error(err || "Failed to delete ticket");
    } finally {
      setIsDeleting(false);
    }
  };

  // Admin reply
  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyMessage.trim() || !activeTicket) return;

    try {
      const res = await dispatch(
        adminReplyTicket({
          id: activeTicket._id,
          message: replyMessage.trim(),
        })
      ).unwrap();

      toast.success("Reply sent to customer");
      setActiveTicket(res.ticket);
      setReplyMessage("");
      loadTickets();
    } catch (err) {
      toast.error(err || "Failed to send reply");
    }
  };

  // Status and Priority Update
  const handleUpdateStatus = async () => {
    if (!activeTicket) return;
    setUpdatingStatus(true);
    try {
      const res = await dispatch(
        adminUpdateTicketStatus({
          id: activeTicket._id,
          status: newStatus,
          priority: newPriority,
          note: statusNote.trim() || undefined,
        })
      ).unwrap();

      toast.success("Ticket updated successfully");
      setActiveTicket(res.ticket);
      setStatusNote("");
      loadTickets();
    } catch (err) {
      toast.error(err || "Failed to update ticket status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 text-gray-800">
      {/* ── Top Bar ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <LifeBuoy className="w-7 h-7 text-teal-600" />
            Support Ticket Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Monitor, assign, and respond to customer queries, order issues, and feedback.
          </p>
        </div>

        <button
          onClick={loadTickets}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-xs font-bold text-gray-700 hover:bg-gray-50 transition shadow-xs cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5 text-teal-600" />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* ── Stat Metric Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <p className="text-xs text-gray-500 font-medium">Total Tickets</p>
          <p className="text-xl font-black text-gray-900 mt-1">
            {stats.total || 0}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-xs">
          <p className="text-xs text-emerald-600 font-medium">Open</p>
          <p className="text-xl font-black text-emerald-700 mt-1">
            {stats.open || 0}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-xs">
          <p className="text-xs text-blue-600 font-medium">In Progress</p>
          <p className="text-xl font-black text-blue-700 mt-1">
            {stats.inProgress || 0}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-xs">
          <p className="text-xs text-amber-600 font-medium">Waiting Customer</p>
          <p className="text-xl font-black text-amber-700 mt-1">
            {stats.waitingForCustomer || 0}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-teal-200 shadow-xs">
          <p className="text-xs text-teal-600 font-medium">Resolved</p>
          <p className="text-xl font-black text-teal-700 mt-1">
            {stats.resolved || 0}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <p className="text-xs text-gray-500 font-medium">Closed</p>
          <p className="text-xl font-black text-gray-700 mt-1">
            {stats.closed || 0}
          </p>
        </div>
      </div>

      {/* ── Search & Filter Controls ── */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs mb-6 space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Ticket ID, Subject, Customer Name, Email, or Order Number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2 bg-[#022824] hover:bg-[#033b34] text-white text-xs font-bold rounded-lg transition cursor-pointer"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-100 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-gray-500 font-semibold">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-gray-50 border border-gray-200 rounded-md px-2.5 py-1 font-medium focus:outline-none focus:ring-1 focus:ring-teal-600 cursor-pointer"
            >
              {STATUSES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-gray-500 font-semibold">Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-gray-50 border border-gray-200 rounded-md px-2.5 py-1 font-medium focus:outline-none focus:ring-1 focus:ring-teal-600 cursor-pointer"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-gray-500 font-semibold">Priority:</span>
            <select
              value={selectedPriority}
              onChange={(e) => {
                setSelectedPriority(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-gray-50 border border-gray-200 rounded-md px-2.5 py-1 font-medium focus:outline-none focus:ring-1 focus:ring-teal-600 cursor-pointer"
            >
              {PRIORITIES.map((pr) => (
                <option key={pr} value={pr}>
                  {pr}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── Tickets Table ── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 text-teal-600 animate-spin mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-600">
              Fetching support tickets...
            </p>
          </div>
        ) : tickets.length === 0 ? (
          <div className="p-12 text-center">
            <LifeBuoy className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-base font-bold text-gray-800">No Tickets Found</p>
            <p className="text-xs text-gray-500 mt-1">
              No tickets match your active filter criteria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Ticket ID</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Category & Subject</th>
                  <th className="py-3 px-4">Order Ref</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Last Activity</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {tickets.map((t) => (
                  <tr
                    key={t._id}
                    className="hover:bg-gray-50/80 transition-colors cursor-pointer"
                    onClick={() => handleOpenTicket(t)}
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-[#022824]">
                      #{t.ticketNumber}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-gray-900">
                        {t.customerName}
                      </div>
                      <div className="text-[11px] text-gray-500">
                        {t.customerEmail}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <span className="text-[10px] uppercase font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded">
                        {t.category}
                      </span>
                      <p className="font-bold text-gray-900 mt-1 truncate">
                        {t.subject}
                      </p>
                    </td>
                    <td className="py-3.5 px-4">
                      {t.orderNumber ? (
                        <span className="inline-flex items-center gap-1 text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                          <Package className="w-3 h-3" />
                          {t.orderNumber}
                        </span>
                      ) : (
                        <span className="text-gray-400 italic">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">{getStatusBadge(t.status)}</td>
                    <td className="py-3.5 px-4">
                      {getPriorityBadge(t.priority || "Medium")}
                    </td>
                    <td className="py-3.5 px-4 text-gray-500 whitespace-nowrap">
                      {new Date(t.lastReplyAt || t.createdAt).toLocaleDateString(
                        "en-IN",
                        {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        }
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenTicket(t);
                          }}
                          className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded font-bold text-xs transition cursor-pointer"
                        >
                          Manage
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleConfirmDelete(t);
                          }}
                          className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                          title="Delete Ticket"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Pagination ── */}
        {pagination && pagination.pages > 1 && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>
              Page {pagination.page} of {pagination.pages} ({pagination.total}{" "}
              tickets)
            </span>
            <div className="flex gap-1">
              <button
                disabled={pagination.page <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded font-semibold disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={pagination.page >= pagination.pages}
                onClick={() =>
                  setCurrentPage((p) => Math.min(pagination.pages, p + 1))
                }
                className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded font-semibold disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          ADMIN CONVERSATION & STATUS MODAL
      ========================================================================= */}
      {activeTicket && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-[#022824] text-white p-4 sm:p-5 flex items-start justify-between gap-3 shrink-0">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-bold bg-white/20 text-teal-200 px-2 py-0.5 rounded">
                    #{activeTicket.ticketNumber}
                  </span>
                  {getStatusBadge(activeTicket.status)}
                  <span className="text-xs text-teal-200 font-medium">
                    {activeTicket.category}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-white mt-1 truncate">
                  {activeTicket.subject}
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleConfirmDelete(activeTicket)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-200 border border-rose-500/30 text-xs font-semibold transition cursor-pointer"
                  title="Delete this ticket"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-300" />
                  <span className="hidden sm:inline">Delete Ticket</span>
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-gray-300 hover:text-white transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Customer & Order Metadata Toolbar */}
            <div className="bg-gray-50 border-b border-gray-200 p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs shrink-0">
              <div>
                <p className="text-gray-400 font-semibold uppercase">Customer</p>
                <p className="font-bold text-gray-900 mt-0.5">
                  {activeTicket.customerName}
                </p>
                <p className="text-gray-500">{activeTicket.customerEmail}</p>
                {activeTicket.customerPhone && (
                  <p className="text-gray-500">{activeTicket.customerPhone}</p>
                )}
              </div>

              <div>
                <p className="text-gray-400 font-semibold uppercase">
                  Linked Order
                </p>
                {activeTicket.order ? (
                  <div className="mt-0.5">
                    <p className="font-bold text-sky-800">
                      Order #{activeTicket.order.orderNumber || activeTicket.order._id}
                    </p>
                    <p className="text-gray-500">
                      Amount: ₹{activeTicket.order.totalPrice} • Status:{" "}
                      {activeTicket.order.status}
                    </p>
                    <Link
                      to={`/admin/orders`}
                      target="_blank"
                      className="inline-flex items-center gap-1 text-teal-700 hover:underline font-bold mt-1"
                    >
                      <span>View in Admin Orders</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                ) : (
                  <p className="text-gray-500 mt-0.5 italic">
                    No order linked to this ticket
                  </p>
                )}
              </div>

              {/* Status / Priority Quick Updater */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <label className="font-semibold text-gray-600">Status:</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="bg-white border border-gray-300 rounded px-2 py-1 font-bold text-xs"
                  >
                    {STATUSES.filter((s) => s !== "All").map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <label className="font-semibold text-gray-600">Priority:</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value)}
                    className="bg-white border border-gray-300 rounded px-2 py-1 font-bold text-xs"
                  >
                    {PRIORITIES.filter((p) => p !== "All").map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleUpdateStatus}
                    disabled={updatingStatus}
                    className="px-2.5 py-1 bg-teal-700 hover:bg-teal-800 text-white rounded font-bold transition disabled:opacity-50 cursor-pointer ml-auto"
                  >
                    {updatingStatus ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>
            </div>

            {/* Conversation Messages */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 bg-[#f8fafc]">
              {detailsLoading ? (
                <div className="text-center py-10">
                  <Loader2 className="w-6 h-6 text-teal-600 animate-spin mx-auto mb-2" />
                  <p className="text-xs text-gray-500">Loading conversation...</p>
                </div>
              ) : (
                activeTicket.messages &&
                activeTicket.messages.map((msg, index) => {
                  const isStaff =
                    msg.senderRole === "admin" || msg.senderRole === "support";
                  return (
                    <div
                      key={msg._id || index}
                      className={`flex gap-3 ${
                        isStaff ? "justify-end" : "justify-start"
                      }`}
                    >
                      {!isStaff && (
                        <div className="w-8 h-8 rounded-full bg-[#047ca8] text-white flex items-center justify-center text-xs font-bold shrink-0">
                          {activeTicket.customerName
                            ? activeTicket.customerName[0].toUpperCase()
                            : "C"}
                        </div>
                      )}

                      <div
                        className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-3.5 shadow-2xs ${
                          isStaff
                            ? "bg-[#022824] text-white"
                            : "bg-white border border-gray-200 text-gray-800"
                        }`}
                      >
                        <div
                          className={`flex items-center justify-between gap-3 text-[11px] mb-1 font-semibold ${
                            isStaff ? "text-teal-200" : "text-gray-500"
                          }`}
                        >
                          <span>{msg.senderName} ({msg.senderRole})</span>
                          <span className="text-[10px] opacity-75">
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

                      {isStaff && (
                        <div className="w-8 h-8 rounded-full bg-teal-800 text-teal-200 flex items-center justify-center text-xs font-bold shrink-0">
                          {user?.name ? user.name[0].toUpperCase() : "A"}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Admin Reply Composer */}
            <div className="p-4 bg-white border-t border-gray-200 shrink-0">
              <form onSubmit={handleSendReply} className="flex gap-2">
                <textarea
                  rows={2}
                  required
                  placeholder="Type your official support response to the customer (email notification will be sent)..."
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 resize-none font-medium"
                />
                <button
                  type="submit"
                  disabled={replying || !replyMessage.trim()}
                  className="px-5 py-2 bg-[#022824] hover:bg-[#033b34] text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0"
                >
                  {replying ? (
                    <Loader2 className="w-4 h-4 animate-spin text-teal-300" />
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5 text-teal-300" />
                      <span>Reply to Customer</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirmation Modal for Permanent Ticket Deletion ── */}
      {ticketToDelete && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-gray-200 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  Delete Support Ticket?
                </h3>
                <p className="text-xs text-rose-600 font-semibold font-mono">
                  #{ticketToDelete.ticketNumber}
                </p>
              </div>
            </div>

            <div className="p-3 bg-rose-50/60 rounded-xl border border-rose-100 text-xs text-gray-700 space-y-1.5">
              <p className="font-semibold text-rose-900">
                This will permanently delete this ticket and all message history.
              </p>
              <p className="text-gray-600">
                Customer: <b>{ticketToDelete.customerName}</b> ({ticketToDelete.customerEmail})
              </p>
              <p className="text-gray-600">
                Subject: <span className="italic font-medium">{ticketToDelete.subject}</span>
              </p>
              <p className="text-rose-700 text-[11px] font-medium pt-1">
                ⚠️ This action is permanent and cannot be undone.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setTicketToDelete(null)}
                className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 text-xs font-bold hover:bg-gray-50 transition disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleExecuteDelete}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Permanently Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketManagement;
