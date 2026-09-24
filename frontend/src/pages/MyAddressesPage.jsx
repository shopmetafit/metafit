import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import {
  fetchAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from "../redux/slices/addressSlice";
import AddressCard from "../components/Profile/AddressCard";
import AddEditAddressModal from "../components/Profile/AddEditAddressModal";
import {
  Plus,
  MapPin,
  Loader2,
  ChevronRight,
  User,
  Package,
  Heart,
} from "lucide-react";
import { toast } from "sonner";

const MyAddressesPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { addresses, loading, saving, error } = useSelector(
    (state) => state.address
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    dispatch(fetchAddresses());
  }, [dispatch, user, navigate]);

  const handleOpenAddModal = () => {
    setEditingAddress(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (address) => {
    setEditingAddress(address);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingAddress(null);
  };

  const handleFormSubmit = async (formData) => {
    try {
      if (editingAddress) {
        const res = await dispatch(
          updateAddress({ id: editingAddress._id, addressData: formData })
        );
        if (!res.error) {
          toast.success("Address updated successfully!");
          handleCloseModal();
        } else {
          toast.error(res.payload?.message || "Failed to update address");
        }
      } else {
        const res = await dispatch(addAddress(formData));
        if (!res.error) {
          toast.success("Address added successfully!");
          handleCloseModal();
        } else {
          toast.error(res.payload?.message || "Failed to add address");
        }
      }
    } catch (err) {
      toast.error("An unexpected error occurred");
    }
  };

  const handleSetDefault = async (id) => {
    try {
      const res = await dispatch(setDefaultAddress(id));
      if (!res.error) {
        toast.success("Default address updated!");
      } else {
        toast.error(res.payload?.message || "Failed to set default address");
      }
    } catch (err) {
      toast.error("Failed to update default address");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this address?")) {
      try {
        const res = await dispatch(deleteAddress(id));
        if (!res.error) {
          toast.success("Address deleted");
        } else {
          toast.error(res.payload?.message || "Failed to delete address");
        }
      } catch (err) {
        toast.error("Failed to delete address");
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#f1f3f6] text-gray-800 antialiased py-4 sm:py-6">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        {/* ── Breadcrumb Navigation ── */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1.5 text-xs text-gray-500 font-medium mb-4 overflow-x-auto whitespace-nowrap"
        >
          <Link to="/" className="hover:text-[#022824] transition-colors">
            Home
          </Link>
          <ChevronRight className="h-3 w-3 text-gray-400 shrink-0" />
          <Link to="/profile" className="hover:text-[#022824] transition-colors">
            My Account
          </Link>
          <ChevronRight className="h-3 w-3 text-gray-400 shrink-0" />
          <span className="text-gray-900 font-semibold">Saved Addresses</span>
        </nav>

        {/* ── Top Account Navigation Tabs ── */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-xs p-1 sm:p-1.5 mb-4 sm:mb-6 grid grid-cols-3 gap-1 sm:flex sm:items-center sm:gap-1">
          <Link
            to="/profile"
            className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-1 sm:gap-2 px-2 sm:px-5 py-2 rounded-md text-xs sm:text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all text-center"
          >
            <User className="w-4 h-4 text-gray-500 shrink-0" />
            <span className="hidden sm:inline">Profile Information</span>
            <span className="sm:hidden font-medium">Profile</span>
          </Link>
          <Link
            to="/my-orders"
            className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-1 sm:gap-2 px-2 sm:px-5 py-2 rounded-md text-xs sm:text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all text-center"
          >
            <Package className="w-4 h-4 text-[#047ca8] shrink-0" />
            <span className="hidden sm:inline">My Orders</span>
            <span className="sm:hidden font-medium">Orders</span>
          </Link>
          <Link
            to="/my-addresses"
            className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-1 sm:gap-2 px-2 sm:px-5 py-2 rounded-md text-xs sm:text-sm font-semibold bg-[#022824] text-white shadow-xs text-center"
          >
            <MapPin className="w-4 h-4 text-teal-300 shrink-0" />
            <span className="hidden sm:inline">Saved Addresses</span>
            <span className="sm:hidden font-medium">Addresses</span>
          </Link>
        </div>

        {/* ── Main Full Screen Addresses Card ── */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-xs p-5 sm:p-7">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center border border-teal-100">
                <MapPin className="h-5 w-5 text-[#047ca8]" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">
                  Saved Addresses
                </h1>
                <p className="text-xs text-gray-500 mt-0.5">
                  Manage your delivery addresses for seamless & fast checkout
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleOpenAddModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#022824] hover:bg-[#044a42] text-white font-semibold text-xs sm:text-sm rounded-md transition-all shadow-xs cursor-pointer"
            >
              <Plus className="h-4 w-4" /> Add New Address
            </button>
          </div>

          {/* Content */}
          {loading && addresses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500">
              <Loader2 className="h-8 w-8 animate-spin text-[#047ca8] mb-2" />
              <p className="text-sm font-medium">Loading your saved addresses...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 text-center text-red-600 text-sm">
              {error}
            </div>
          ) : addresses.length === 0 ? (
            <div className="text-center py-20 px-4 bg-gray-50/50 rounded-lg border border-dashed border-gray-200">
              <div className="w-16 h-16 bg-blue-50 text-[#047ca8] rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-100">
                <MapPin className="h-8 w-8" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-1">No addresses saved yet</h2>
              <p className="text-gray-500 text-xs sm:text-sm max-w-sm mx-auto mb-6">
                Add a delivery address to complete your future orders faster with one click.
              </p>
              <button
                type="button"
                onClick={handleOpenAddModal}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#022824] hover:bg-[#044a42] text-white font-semibold rounded-md text-sm transition-all shadow-xs cursor-pointer"
              >
                <Plus className="h-4 w-4" /> Add Your First Address
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {addresses.map((addr) => (
                <AddressCard
                  key={addr._id}
                  address={addr}
                  onEdit={handleOpenEditModal}
                  onDelete={handleDelete}
                  onSetDefault={handleSetDefault}
                />
              ))}
            </div>
          )}

          {/* Add / Edit Modal */}
          <AddEditAddressModal
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            onSubmit={handleFormSubmit}
            initialData={editingAddress}
            isSaving={saving}
          />
        </div>
      </div>
    </div>
  );
};

export default MyAddressesPage;
