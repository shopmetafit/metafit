# ⚡ WHEN YOU GET BLUE DART CREDENTIALS - DO THIS

**Blue Dart will send you 5 things. Here's exactly what to do.**

---

## 📦 Blue Dart Will Send

```
API Key:         oTGxtPZICkfe4dMRz4LeimZtU2c8Kyl3
API Secret:      LjiIAfVGbJxEO25l
Login ID:        GG940111
License Key:     kh7mnhqkmgegoksipxr0urmqesessup
Customer Code:   940111
```

(These are examples - yours will be different)

---

## ⚡ What You Do (5 minutes)

### 1. Open .env File
```bash
nano .env
```

### 2. Replace These Lines

**Find:**
```bash
BLUEDART_API_KEY=oTGxtPZICkfe4dMRz4LeimZtU2c8Kyl3
BLUEDART_API_SECRET=LjiIAfVGbJxEO25l
BLUEDART_LOGIN_ID=GG940111
BLUEDART_LICENSE_KEY=kh7mnhqkmgegoksipxr0urmqesessup
BLUEDART_CUSTOMER_CODE=940111
```

**Replace With:**
```bash
BLUEDART_API_KEY=<your_api_key_from_bluedart>
BLUEDART_API_SECRET=<your_api_secret_from_bluedart>
BLUEDART_LOGIN_ID=<your_login_id_from_bluedart>
BLUEDART_LICENSE_KEY=<your_license_key_from_bluedart>
BLUEDART_CUSTOMER_CODE=<your_customer_code_from_bluedart>
```

### 3. Save File
```bash
Ctrl + X, then Y, then Enter
```

### 4. Test Configuration
```bash
node test-bluedart.js
```

Should show all ✓ checks passing

### 5. Start Server
```bash
npm run dev
```

Should show:
```
Server running on http://0.0.0.0:9000
[TRACKING SYNC] Starting background sync...
```

### 6. Test with Real Order
```bash
bash TEST_WITH_CURL.sh
```

Should now generate real AWB!

---

## ✅ Done!

That's literally it. You're now live with Blue Dart.

---

## 🔍 If Something Goes Wrong

### Error: "JWT Token generation failed"
→ Check credentials are correct (copy-paste exactly)
→ Check internet connection
→ Try again

### Error: "Insufficient Blue Dart balance"
→ Normal! You have $0 balance
→ Blue Dart needs to add credit
→ Ask them to add shipping balance

### Error: "Order not found"
→ Check you're using correct order ID
→ Make sure you created order first

---

## 📋 Checklist

- [ ] Received 5 credentials from Blue Dart
- [ ] Opened .env file
- [ ] Replaced 5 lines with your values
- [ ] Saved .env
- [ ] Ran `node test-bluedart.js`
- [ ] All checks passed ✓
- [ ] Started server `npm run dev`
- [ ] Server started successfully
- [ ] Tested with `bash TEST_WITH_CURL.sh`
- [ ] Real AWB generated!

---

## 🎉 You're Live!

Your Blue Dart integration is now active with real credentials.

Users can now:
- ✅ Place orders
- ✅ Pay
- ✅ Get shipping
- ✅ Track orders

Admin can:
- ✅ Generate waybills
- ✅ Update addresses
- ✅ Retry failures
- ✅ View tracking

---

## 📞 Need Help?

Read: `PRODUCTION_READY_SETUP.md`

---

**That's all. You're done! 🚀**
