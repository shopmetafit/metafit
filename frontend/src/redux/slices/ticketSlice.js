import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const getAuthHeaders = () => {
  const token = localStorage.getItem("userToken");
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  };
};

// ── Customer Thunks ──

export const fetchUserTickets = createAsyncThunk(
  "tickets/fetchUserTickets",
  async ({ status, page = 1, limit = 20 } = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      if (status && status !== "All") params.append("status", status);
      params.append("page", page);
      params.append("limit", limit);

      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/tickets/my-tickets?${params.toString()}`,
        getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch tickets"
      );
    }
  }
);

export const fetchTicketDetails = createAsyncThunk(
  "tickets/fetchTicketDetails",
  async (ticketId, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/tickets/${ticketId}`,
        getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch ticket details"
      );
    }
  }
);

export const createTicket = createAsyncThunk(
  "tickets/createTicket",
  async ({ category, subject, description, orderId }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/tickets`,
        { category, subject, description, orderId: orderId || null },
        getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create support ticket"
      );
    }
  }
);

export const replyTicket = createAsyncThunk(
  "tickets/replyTicket",
  async ({ ticketId, message }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/tickets/${ticketId}/reply`,
        { message },
        getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to send reply"
      );
    }
  }
);

export const closeCustomerTicket = createAsyncThunk(
  "tickets/closeCustomerTicket",
  async (ticketId, { rejectWithValue }) => {
    try {
      const response = await axios.patch(
        `${import.meta.env.VITE_BACKEND_URL}/api/tickets/${ticketId}/close`,
        {},
        getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to close ticket"
      );
    }
  }
);

// ── Admin Thunks ──

export const fetchAdminTickets = createAsyncThunk(
  "tickets/fetchAdminTickets",
  async (
    {
      status,
      category,
      priority,
      search,
      startDate,
      endDate,
      page = 1,
      limit = 20,
    } = {},
    { rejectWithValue }
  ) => {
    try {
      const params = new URLSearchParams();
      if (status && status !== "All") params.append("status", status);
      if (category && category !== "All") params.append("category", category);
      if (priority && priority !== "All") params.append("priority", priority);
      if (search) params.append("search", search);
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      params.append("page", page);
      params.append("limit", limit);

      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/admin/tickets?${params.toString()}`,
        getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch admin tickets"
      );
    }
  }
);

export const fetchAdminTicketStats = createAsyncThunk(
  "tickets/fetchAdminTicketStats",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/admin/tickets/stats`,
        getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch ticket stats"
      );
    }
  }
);

export const adminUpdateTicketStatus = createAsyncThunk(
  "tickets/adminUpdateTicketStatus",
  async ({ id, status, priority, note }, { rejectWithValue }) => {
    try {
      const response = await axios.patch(
        `${import.meta.env.VITE_BACKEND_URL}/api/admin/tickets/${id}/status`,
        { status, priority, note },
        getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update ticket status"
      );
    }
  }
);

export const adminReplyTicket = createAsyncThunk(
  "tickets/adminReplyTicket",
  async ({ id, message }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/admin/tickets/${id}/reply`,
        { message },
        getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to send admin reply"
      );
    }
  }
);

export const adminDeleteTicket = createAsyncThunk(
  "tickets/adminDeleteTicket",
  async (ticketId, { rejectWithValue }) => {
    try {
      const response = await axios.delete(
        `${import.meta.env.VITE_BACKEND_URL}/api/admin/tickets/${ticketId}`,
        getAuthHeaders()
      );
      return { ...response.data, ticketId };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete ticket"
      );
    }
  }
);

const ticketSlice = createSlice({
  name: "tickets",
  initialState: {
    tickets: [],
    currentTicket: null,
    stats: {
      total: 0,
      open: 0,
      inProgress: 0,
      waitingForCustomer: 0,
      resolved: 0,
      closed: 0,
    },
    pagination: {
      page: 1,
      limit: 20,
      total: 0,
      pages: 0,
    },
    loading: false,
    detailsLoading: false,
    creating: false,
    replying: false,
    error: null,
    successMessage: null,
  },
  reducers: {
    clearCurrentTicket: (state) => {
      state.currentTicket = null;
    },
    clearTicketMessages: (state) => {
      state.error = null;
      state.successMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch User Tickets
      .addCase(fetchUserTickets.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserTickets.fulfilled, (state, action) => {
        state.loading = false;
        state.tickets = action.payload.tickets || [];
        state.pagination = action.payload.pagination || state.pagination;
      })
      .addCase(fetchUserTickets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch Ticket Details
      .addCase(fetchTicketDetails.pending, (state) => {
        state.detailsLoading = true;
        state.error = null;
      })
      .addCase(fetchTicketDetails.fulfilled, (state, action) => {
        state.detailsLoading = false;
        state.currentTicket = action.payload.ticket;
      })
      .addCase(fetchTicketDetails.rejected, (state, action) => {
        state.detailsLoading = false;
        state.error = action.payload;
      })

      // Create Ticket
      .addCase(createTicket.pending, (state) => {
        state.creating = true;
        state.error = null;
      })
      .addCase(createTicket.fulfilled, (state, action) => {
        state.creating = false;
        state.tickets.unshift(action.payload.ticket);
        state.currentTicket = action.payload.ticket;
        state.successMessage = "Ticket created successfully!";
      })
      .addCase(createTicket.rejected, (state, action) => {
        state.creating = false;
        state.error = action.payload;
      })

      // Reply Ticket
      .addCase(replyTicket.pending, (state) => {
        state.replying = true;
        state.error = null;
      })
      .addCase(replyTicket.fulfilled, (state, action) => {
        state.replying = false;
        state.currentTicket = action.payload.ticket;
        const index = state.tickets.findIndex(
          (t) => t._id === action.payload.ticket._id
        );
        if (index !== -1) {
          state.tickets[index] = action.payload.ticket;
        }
      })
      .addCase(replyTicket.rejected, (state, action) => {
        state.replying = false;
        state.error = action.payload;
      })

      // Close Customer Ticket
      .addCase(closeCustomerTicket.fulfilled, (state, action) => {
        state.currentTicket = action.payload.ticket;
        const index = state.tickets.findIndex(
          (t) => t._id === action.payload.ticket._id
        );
        if (index !== -1) {
          state.tickets[index] = action.payload.ticket;
        }
      })

      // Admin Fetch Tickets
      .addCase(fetchAdminTickets.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminTickets.fulfilled, (state, action) => {
        state.loading = false;
        state.tickets = action.payload.tickets || [];
        state.pagination = action.payload.pagination || state.pagination;
      })
      .addCase(fetchAdminTickets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Admin Fetch Stats
      .addCase(fetchAdminTicketStats.fulfilled, (state, action) => {
        state.stats = action.payload.stats || state.stats;
      })

      // Admin Update Status
      .addCase(adminUpdateTicketStatus.fulfilled, (state, action) => {
        state.currentTicket = action.payload.ticket;
        const index = state.tickets.findIndex(
          (t) => t._id === action.payload.ticket._id
        );
        if (index !== -1) {
          state.tickets[index] = action.payload.ticket;
        }
      })

      // Admin Reply Ticket
      .addCase(adminReplyTicket.pending, (state) => {
        state.replying = true;
      })
      .addCase(adminReplyTicket.fulfilled, (state, action) => {
        state.replying = false;
        state.currentTicket = action.payload.ticket;
        const index = state.tickets.findIndex(
          (t) => t._id === action.payload.ticket._id
        );
        if (index !== -1) {
          state.tickets[index] = action.payload.ticket;
        }
      })
      .addCase(adminReplyTicket.rejected, (state, action) => {
        state.replying = false;
        state.error = action.payload;
      })

      // Admin Delete Ticket
      .addCase(adminDeleteTicket.fulfilled, (state, action) => {
        const deletedId = action.payload.ticketId;
        state.tickets = state.tickets.filter(
          (t) => t._id !== deletedId && t.ticketNumber !== deletedId
        );
        if (
          state.currentTicket?._id === deletedId ||
          state.currentTicket?.ticketNumber === deletedId
        ) {
          state.currentTicket = null;
        }
        if (state.stats && state.stats.total > 0) {
          state.stats.total -= 1;
        }
      })
      .addCase(adminDeleteTicket.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { clearCurrentTicket, clearTicketMessages } = ticketSlice.actions;
export default ticketSlice.reducer;
