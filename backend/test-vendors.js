const axios = require('axios');

const METAFIT_ADMIN_API_BASE_URL = "https://metafit-services.vercel.app";

const allowedExternalVendorRoles = new Set([
  "Yoga Instructor", "Ayurvedic Doctor", "Lab Test", "lab test",
  "Treatment and Retreat", "Treatment & Retreat", "Naturopathy and Wellness",
  "Naturopathy Doctor", "Naturopathy", "Human Psychology",
]);

const normalizeExternalVendor = (vendor = {}) => {
  const vendorId = String(vendor.mentorId || vendor._id || vendor.id || "").trim();
  let role = String(vendor.role || "").trim();
  if (role.toLowerCase() === "lab test") role = "Lab Test";
  return { id: vendorId, vendorId, role };
};

const fetchMetafitVendors = async () => {
  const [ instructorsResponse, naturopathyResponse, ayurvedicResponse, psychologyResponse, labTestResponse ] = await Promise.allSettled([
    axios.get(`${METAFIT_ADMIN_API_BASE_URL}/admin/api/v2/all-instructor`),
    axios.get(`${METAFIT_ADMIN_API_BASE_URL}/admin/api/v2/admin/naturopathy-vendors`),
    axios.get(`${METAFIT_ADMIN_API_BASE_URL}/admin/api/v2/ayurvedic-doctors`),
    axios.get(`${METAFIT_ADMIN_API_BASE_URL}/admin/api/v2/human-psychology-instructors`),
    axios.get(`${METAFIT_ADMIN_API_BASE_URL}/admin/api/v2/view-all-vendor-lab-tests`),
  ]);

  const records = [];
  if (instructorsResponse.status === "fulfilled" && Array.isArray(instructorsResponse.value.data)) records.push(...instructorsResponse.value.data);
  if (naturopathyResponse.status === "fulfilled") records.push(...(naturopathyResponse.value.data?.vendors || []));
  if (ayurvedicResponse.status === "fulfilled") records.push(...(ayurvedicResponse.value.data?.doctors || []));
  if (psychologyResponse.status === "fulfilled") records.push(...(psychologyResponse.value.data || []));
  if (labTestResponse.status === "fulfilled") records.push(...(labTestResponse.value.data?.vendors || []));

  return records.map(normalizeExternalVendor).filter(v => v.vendorId && allowedExternalVendorRoles.has(v.role)).slice(0, 5);
};

fetchMetafitVendors().then(console.log).catch(console.error);
