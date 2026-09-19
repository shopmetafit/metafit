/**
 * Pure Node.js Standard PDF 1.4 Generator for M Wellness Bazaar
 * Zero external dependencies, pure binary buffer generation
 */

function escapePdfText(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/[^\x20-\x7E]/g, ""); // strip non-ascii characters safely
}

function generateInvoicePdfBuffer(order) {
  const streamLines = [];

  // Helpers
  const setColor = (r, g, b) =>
    streamLines.push(`${(r / 255).toFixed(3)} ${(g / 255).toFixed(3)} ${(b / 255).toFixed(3)} rg`);
  const setStrokeColor = (r, g, b) =>
    streamLines.push(`${(r / 255).toFixed(3)} ${(g / 255).toFixed(3)} ${(b / 255).toFixed(3)} RG`);
  const setLineWidth = (w) => streamLines.push(`${w} w`);
  const drawRect = (x, y, w, h, fill = false, stroke = false) => {
    streamLines.push(`${x} ${y} ${w} ${h} re`);
    if (fill && stroke) streamLines.push("B");
    else if (fill) streamLines.push("f");
    else if (stroke) streamLines.push("S");
  };
  const drawLine = (x1, y1, x2, y2) => {
    streamLines.push(`${x1} ${y1} m ${x2} ${y2} l S`);
  };
  const writeText = (text, x, y, size = 10, bold = false, color = [0, 0, 0]) => {
    setColor(...color);
    streamLines.push("BT");
    streamLines.push(`/${bold ? "F2" : "F1"} ${size} Tf`);
    streamLines.push(`${x} ${y} Td`);
    streamLines.push(`(${escapePdfText(text)}) Tj`);
    streamLines.push("ET");
  };

  // Page dimensions: 595 x 842 (A4)
  // Background Header Banner (#047ca8)
  setColor(4, 124, 168);
  drawRect(0, 772, 595, 70, true, false);

  // Header Title
  writeText("M WELLNESS BAZAAR", 40, 810, 22, true, [255, 255, 255]);
  writeText("TAX INVOICE / ORDER SUMMARY", 40, 788, 11, false, [220, 240, 250]);

  // Order & Date Info Box (Top Right)
  const orderNum = order.orderNumber || (order._id ? `MWB-${order._id.toString().slice(-8).toUpperCase()}` : "MWB-ORDER");
  const orderDate = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    : new Date().toLocaleDateString("en-IN");

  writeText(`Invoice No: ${orderNum}`, 360, 810, 10, true, [255, 255, 255]);
  writeText(`Date: ${orderDate}`, 360, 792, 10, false, [255, 255, 255]);

  // Section 1: Customer & Shipping Address Details Box
  setColor(248, 250, 252);
  setStrokeColor(226, 232, 240);
  setLineWidth(1);
  drawRect(40, 650, 515, 100, true, true);

  writeText("CUSTOMER & SHIPPING DETAILS", 52, 730, 10, true, [15, 23, 42]);

  const addr = order.shippingAddress || {};
  const customerName =
    addr.fullName ||
    `${addr.firstName || ""} ${addr.lastName || ""}`.trim() ||
    order.customerName ||
    (order.user && order.user.name) ||
    "Valued Customer";
  const customerPhone = addr.phone || order.customerPhone || "N/A";
  const customerEmail = order.customerEmail || (order.user && order.user.email) || "N/A";

  const fullAddressStr = [
    addr.house,
    addr.area,
    addr.landmark,
    addr.street || addr.address,
    addr.city,
    addr.district,
    addr.state,
    addr.postalCode || addr.pincode,
    addr.country || "India",
  ]
    .filter(Boolean)
    .join(", ");

  writeText(`Name: ${customerName}`, 52, 710, 9, true, [51, 65, 85]);
  writeText(`Phone: ${customerPhone}`, 52, 695, 9, false, [71, 85, 105]);
  writeText(`Email: ${customerEmail}`, 52, 680, 9, false, [71, 85, 105]);

  const displayAddress =
    fullAddressStr.length > 75 ? fullAddressStr.substring(0, 72) + "..." : fullAddressStr;
  writeText(`Address: ${displayAddress}`, 52, 665, 9, false, [71, 85, 105]);

  // Order Meta Statuses Box
  setColor(241, 245, 249);
  drawRect(40, 590, 515, 45, true, true);

  const paymentStatusText = order.isPaid ? "PAID" : (order.paymentStatus || "PENDING").toUpperCase();
  const paymentMethodText = (order.paymentMethod || "Online Payment").toUpperCase();
  const orderStatusText = (order.status || "PROCESSING").toUpperCase();

  writeText("Payment Method:", 52, 618, 9, false, [100, 116, 139]);
  writeText(paymentMethodText, 135, 618, 9, true, [15, 23, 42]);

  writeText("Payment Status:", 230, 618, 9, false, [100, 116, 139]);
  writeText(paymentStatusText, 310, 618, 9, true, order.isPaid ? [16, 185, 129] : [217, 119, 6]);

  writeText("Order Status:", 410, 618, 9, false, [100, 116, 139]);
  writeText(orderStatusText, 475, 618, 9, true, [14, 165, 233]);

  // Section 2: Items Table Header
  setColor(4, 124, 168);
  drawRect(40, 550, 515, 26, true, false);

  writeText("S.No", 50, 558, 9, true, [255, 255, 255]);
  writeText("Item Description", 90, 558, 9, true, [255, 255, 255]);
  writeText("Qty", 360, 558, 9, true, [255, 255, 255]);
  writeText("Unit Price", 410, 558, 9, true, [255, 255, 255]);
  writeText("Amount", 490, 558, 9, true, [255, 255, 255]);

  // Table Body Rows
  let currentY = 525;
  const items = order.orderItems || [];

  items.forEach((item, index) => {
    if (currentY < 180) return;

    if (index % 2 === 1) {
      setColor(248, 250, 252);
      drawRect(40, currentY - 5, 515, 24, true, false);
    }

    setStrokeColor(241, 245, 249);
    setLineWidth(0.5);
    drawLine(40, currentY - 5, 555, currentY - 5);

    const itemName = item.name
      ? item.name.length > 42
        ? item.name.substring(0, 39) + "..."
        : item.name
      : "Product Item";
    const qty = item.quantity || item.qty || 1;
    const price = Number(item.price || 0);
    const lineTotal = price * qty;

    writeText(String(index + 1), 52, currentY, 9, false, [51, 65, 85]);
    writeText(itemName, 90, currentY, 9, false, [15, 23, 42]);
    writeText(String(qty), 365, currentY, 9, false, [51, 65, 85]);
    writeText(`INR ${price.toFixed(2)}`, 410, currentY, 9, false, [51, 65, 85]);
    writeText(`INR ${lineTotal.toFixed(2)}`, 490, currentY, 9, true, [15, 23, 42]);

    currentY -= 24;
  });

  // Section 3: Summary / Totals Box
  const summaryY = Math.max(currentY - 20, 160);

  setColor(248, 250, 252);
  setStrokeColor(226, 232, 240);
  setLineWidth(1);
  drawRect(315, summaryY - 110, 240, 120, true, true);

  const itemsSubtotal = items.reduce(
    (sum, i) => sum + Number(i.price || 0) * Number(i.quantity || i.qty || 1),
    0
  );
  const serviceFee = Number(order.serviceFee || Math.round(itemsSubtotal * 0.03));
  const shippingCharge = Number(order.deliveryCharge || 0);
  const discount = Number(order.couponDiscount || 0);
  const grandTotal = Number(
    order.totalPrice || itemsSubtotal + serviceFee + shippingCharge - discount
  );

  let boxY = summaryY - 5;

  writeText("Subtotal:", 330, boxY, 9, false, [100, 116, 139]);
  writeText(`INR ${itemsSubtotal.toFixed(2)}`, 470, boxY, 9, false, [51, 65, 85]);
  boxY -= 18;

  writeText("Handling Fee (3%):", 330, boxY, 9, false, [100, 116, 139]);
  writeText(`INR ${serviceFee.toFixed(2)}`, 470, boxY, 9, false, [51, 65, 85]);
  boxY -= 18;

  writeText("Shipping Charge:", 330, boxY, 9, false, [100, 116, 139]);
  writeText(
    shippingCharge > 0 ? `INR ${shippingCharge.toFixed(2)}` : "FREE",
    470,
    boxY,
    9,
    false,
    shippingCharge > 0 ? [51, 65, 85] : [16, 185, 129]
  );
  boxY -= 18;

  if (discount > 0) {
    writeText(`Discount (${order.couponCode || "COUPON"}):`, 330, boxY, 9, false, [100, 116, 139]);
    writeText(`- INR ${discount.toFixed(2)}`, 470, boxY, 9, false, [220, 38, 38]);
    boxY -= 18;
  }

  setStrokeColor(203, 213, 225);
  drawLine(330, boxY + 5, 545, boxY + 5);

  writeText("Grand Total:", 330, boxY - 10, 11, true, [15, 23, 42]);
  writeText(`INR ${grandTotal.toFixed(2)}`, 465, boxY - 10, 11, true, [4, 124, 168]);

  // Footer Branding & Note
  setStrokeColor(226, 232, 240);
  drawLine(40, 50, 555, 50);

  writeText("Thank you for shopping with M Wellness Bazaar!", 40, 35, 9, true, [4, 124, 168]);
  writeText("This is a computer-generated invoice and requires no physical signature.", 40, 22, 8, false, [148, 163, 184]);

  // Construct standard PDF 1.4 binary structure
  const contentStream = streamLines.join("\n");
  const contentBuf = Buffer.from(contentStream, "utf-8");

  const pdfObjects = [];
  pdfObjects.push("%PDF-1.4\n");

  const offsets = [];
  let currentOffset = Buffer.from(pdfObjects[0]).length;

  const addObject = (id, str) => {
    offsets[id] = currentOffset;
    const objStr = `${id} 0 obj\n${str}\nendobj\n`;
    pdfObjects.push(objStr);
    currentOffset += Buffer.from(objStr, "utf-8").length;
  };

  addObject(1, "<< /Type /Catalog /Pages 2 0 R >>");
  addObject(2, "<< /Type /Pages /Kids [3 0 R] /Count 1 >>");
  addObject(3, "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>");
  addObject(4, `<< /Length ${contentBuf.length} >>\nstream\n${contentStream}\nendstream`);
  addObject(5, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  addObject(6, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");

  const startXref = currentOffset;
  let xrefStr = `xref\n0 7\n0000000000 65535 f \n`;
  for (let i = 1; i <= 6; i++) {
    xrefStr += String(offsets[i]).padStart(10, "0") + " 00000 n \n";
  }
  xrefStr += `trailer\n<< /Size 7 /Root 1 0 R >>\nstartxref\n${startXref}\n%%EOF\n`;
  pdfObjects.push(xrefStr);

  return Buffer.from(pdfObjects.join(""), "utf-8");
}

module.exports = { generateInvoicePdfBuffer };
