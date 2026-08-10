const mongoose = require('mongoose');
const Checkout = require('./models/Checkout');
const ReferralAssignment = require('./models/ReferralAssignment');
const Vendor = require('./models/Vendor');
const Product = require('./models/Product');
const { processReferralPurchase } = require('./utils/referralUtils');

mongoose.connect('mongodb+srv://shopmetafit:lXg32cAJNDoNXo6v@cluster0.8dqecof.mongodb.net/metafit?retryWrites=true&w=majority&appName=Cluster0')
.then(async () => {
  const checkout = await Checkout.findOne().sort({ _id: -1 }).lean();
  
  if (checkout.referral?.vendorId || checkout.referral?.externalVendorId) {
      const vendorId = checkout.referral.vendorId || checkout.referral.externalVendorId;

      for (const item of checkout.checkoutItems) {
        console.log("Processing item: ", item.productId);
        const productId = String(item.productId);
        const orConditions = [{ externalVendorId: String(vendorId) }];
        if (mongoose.Types.ObjectId.isValid(vendorId)) {
          orConditions.push({ vendorId: new mongoose.Types.ObjectId(vendorId) });
        }

        let assignment = await ReferralAssignment.findOne({
          productId,
          isActive: true,
          assignmentStatus: "assigned",
          $or: orConditions,
        });

        if (!assignment) {
          console.log("Assignment not found, creating new one...");
          let vendorInfo = null;
          if (mongoose.Types.ObjectId.isValid(vendorId)) {
            vendorInfo = await Vendor.findById(vendorId).lean();
          } else {
            vendorInfo = await Vendor.findOne({
              $or: [{ vendorId: vendorId }, { externalVendorId: vendorId }]
            }).lean();
          }

          if (vendorInfo) {
            console.log("Vendor info found");
            const vendorSnapshotObj = {
              mentorId: vendorId,
              name: vendorInfo?.vendorName || vendorInfo?.businessName || "Partner",
              email: vendorInfo?.email || "",
              phone: vendorInfo?.phone || "",
              role: vendorInfo?.role || "vendor",
            };

            const normalizeCodeSegment = (value, fallback) => {
              const normalized = String(value || "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
              return normalized || fallback;
            };
            const vendorPart = normalizeCodeSegment(vendorId, "VEND").slice(-4);
            const productPart = normalizeCodeSegment(productId, "PROD").slice(-4);
            
            assignment = await ReferralAssignment.findOneAndUpdate(
              {
                productId: productId,
                $or: orConditions
              },
              {
                $setOnInsert: {
                  productId: productId,
                  vendorId: mongoose.Types.ObjectId.isValid(vendorId) ? vendorId : null,
                  externalVendorId: vendorId,
                  vendorSnapshot: vendorSnapshotObj,
                  assignedProductId: `AP-${vendorPart}-${productPart}`,
                  shareCode: `MWREF-${vendorPart}-${productPart}`,
                  refCode: `REF-${vendorPart}-${productPart}`,
                  commissionType: "percentage",
                  commissionValue: 10,
                  isActive: true,
                  assignmentStatus: "assigned",
                  isAssignedToAll: true,
                }
              },
              { new: true, upsert: true }
            );
          } else {
            console.log("Vendor info NOT found for ", vendorId);
          }
        }

        if (assignment) {
          console.log("Processing referral purchase...");
          await processReferralPurchase({
            orderId: String(checkout._id),
            orderObjectId: checkout._id,
            productId: item.productId,
            vendorId: vendorId,
            assignedProductId: assignment.assignedProductId,
            shareCode: assignment.shareCode,
            customerName: checkout.customerName,
            customerPhone: checkout.customerPhone,
            customerEmail: checkout.customerEmail,
            qty: item.quantity || 1,
            orderAmount: Number(item.price || 0) * Number(item.quantity || 1),
            paymentStatus: "paid",
            paymentReference: checkout.paymentDetails?.paymentReference,
            source: "mwellness-store",
            metadata: {
              checkoutId: checkout._id,
            },
          });
        }
      }
    }
    
  console.log('DONE');
  process.exit(0);
}).catch(console.error);
