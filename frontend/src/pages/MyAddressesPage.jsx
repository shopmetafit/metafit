import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from "../redux/slices/addressSlice";
import AddressCard from "../components/Profile/AddressCard";
import AddEditAddressModal from "../components/Profile/AddEditAddressModal";
import { Plus, MapPin, Loader2 } from "lucide-react";
import { toast } from "sonner";

const MyAddressesPage = () => {
  const dispatch = useDispatch();
  const { addresses, loading, saving, error } = useSelector((state) => state.address);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);

  useEffect(() => {
    dispatch(fetchAddresses());
  }, [dispatch]);

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
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4 mb-5">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-[#047ca8]" /> Saved Addresses
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Manage your delivery address book for faster checkout
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAddModal}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#047ca8] hover:bg-[#036e96] text-white font-semibold text-xs sm:text-sm rounded-xl transition-all shadow-sm cursor-pointer"
        >
          <Plus className="h-4 w-4" /> Add New Address
        </button>
      </div>

      {/* Content */}
      {loading && addresses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-500">
          <Loader2 className="h-8 w-8 animate-spin text-[#047ca8] mb-2" />
          <p className="text-sm font-medium">Loading your saved addresses...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center text-red-600 text-sm">
          {error}
        </div>
      ) : addresses.length === 0 ? (
        <div className="text-center py-16 px-4 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
          <div className="w-16 h-16 bg-blue-50 text-[#047ca8] rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">No addresses saved yet</h3>
          <p className="text-gray-500 text-xs sm:text-sm max-w-sm mx-auto mb-6">
            Add a delivery address to complete your future orders faster with one click.
          </p>
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#047ca8] hover:bg-[#036e96] text-white font-semibold rounded-xl text-sm transition-all shadow-sm cursor-pointer"
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
  );
};

export default MyAddressesPage;
