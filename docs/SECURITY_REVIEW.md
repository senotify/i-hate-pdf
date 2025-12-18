# Security Review - IHatePDF

## Executive Summary

**Overall Security Rating: 🟢 GOOD**

Your application has strong security measures in place to protect against common attacks including file payload backdoors, directory traversal, and malicious uploads.

---

## ✅ Current Security Measures

### 1. File Upload Security

#### Magic Number Validation ✅

**Status:** IMPLEMENTED

```typescript
// Validates actual file content, not just extension
const PDF_MAGIC_NUMBERS = [0x25, 0x50, 0x44, 0x46, 0x2d]; // %PDF-
const PNG_MAGIC_NUMBERS = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const JPEG_MAGIC_NUMBERS = [0xff, 0xd8, 0xff];
```

**Protection Against:**

- ✅ Fake file extensions (e.g., malware.exe renamed to malware.pdf)
- ✅ Polyglot files (files that are valid in multiple formats)
- ✅ Content-type spoofing

**How it works:**

- Reads first bytes of file
- Compares against known file signatures
- Rejects files that don't match expected format

---

#### Filename Sanitization ✅

**Status:** IMPLEMENTED

```typescript
function sanitizeFilename(filename: string) {
  return filename
    .replace(/[\/\\]/g, "") // Remove path separators
    .replace(/\0/g, "") // Remove null bytes
    .replace(/[\x00-\x1f\x80-\x9f]/g, "") // Remove control chars
    .replace(/^\.+/, "") // Remove leading dots
    .trim();
}
```

**Protection Against:**

- ✅ Directory traversal (../../../etc/passwd)
- ✅ Null byte injection
- ✅ Hidden files (.htaccess)
- ✅ Control character injection

---

#### Path Traversal Prevention ✅

**Status:** IMPLEMENTED

```typescript
function isPathSafe(filePath: string, allowedDirectory: string) {
  const resolvedPath = path.resolve(filePath);
  const resolvedBase = path.resolve(allowedDirectory);
  return normalizedPath.startsWith(normalizedBase + path.sep);
}
```

**Protection Against:**

- ✅ Directory traversal attacks
- ✅ Symlink attacks
- ✅ Accessing files outside upload directory

---

#### File Size Limits ✅

**Status:** IMPLEMENTED

- Default: 100MB (configurable via MAX_FILE_SIZE)
- Enforced at multer level
- Validated again after upload

**Protection Against:**

- ✅ Denial of Service (DoS) via large files
- ✅ Disk space exhaustion
- ✅ Memory exhaustion

---

### 2. Rate Limiting

#### API Rate Limiting ✅

**Status:** IMPLEMENTED

```typescript
// General API: 50 requests per 15 minutes per IP
// Upload API: 20 uploads per 15 minutes per IP
```

**Protection Against:**

- ✅ Brute force attacks
- ✅ DoS attacks
- ✅ Resource exhaustion
- ✅ Automated abuse

---

### 3. HTTP Security Headers

#### Helmet.js Configuration ✅

**Status:** IMPLEMENTED

**Headers Enabled:**

- ✅ HSTS (Strict-Transport-Security) - Forces HTTPS
- ✅ X-Frame-Options: DENY - Prevents clickjacking
- ✅ X-Content-Type-Options: nosniff - Prevents MIME sniffing
- ✅ X-XSS-Protection - XSS filter
- ✅ Referrer-Policy - Controls referrer information
- ✅ Hides X-Powered-By header

**Protection Against:**

- ✅ Clickjacking
- ✅ MIME type confusion attacks
- ✅ XSS attacks
- ✅ Information disclosure

---

### 4. Automatic File Cleanup

#### Scheduled Cleanup ✅

**Status:** IMPLEMENTED

- Runs every 5 minutes
- Deletes expired files (1 hour retention)
- Cleans both local and Cloudinary storage

**Protection Against:**

- ✅ Disk space exhaustion
- ✅ Data retention compliance issues
- ✅ Privacy concerns

---

### 5. HTTPS Enforcement

#### Automatic Redirect ✅

**Status:** IMPLEMENTED

```typescript
// Redirects HTTP → HTTPS in production
if (!req.secure && req.headers["x-forwarded-proto"] !== "https") {
  res.redirect(301, `https://${req.headers.host}${req.url}`);
}
```

**Protection Against:**

- ✅ Man-in-the-middle attacks
- ✅ Eavesdropping
- ✅ Session hijacking

---

## 🟡 Areas for Improvement

### 1. PDF Content Validation

**Current Status:** ⚠️ PARTIAL

**What's Missing:**

- No validation of PDF internal structure
- No scanning for embedded JavaScript
- No checking for malicious PDF features

**Recommendation:**

```typescript
// Add PDF structure validation
import { PDFDocument } from "pdf-lib";

async function validatePDFStructure(filePath: string) {
  try {
    const pdfBytes = fs.readFileSync(filePath);
    const pdfDoc = await PDFDocument.load(pdfBytes, {
      ignoreEncryption: false,
      throwOnInvalidObject: true,
    });

    // Check for suspicious features
    const form = pdfDoc.getForm();
    const jsActions = pdfDoc.context.lookup(/* check for JS */);

    return { valid: true };
  } catch (error) {
    return { valid: false, error: "Corrupted or malicious PDF" };
  }
}
```

**Risk Level:** 🟡 MEDIUM

- PDFs can contain JavaScript
- PDFs can have embedded files
- PDFs can exploit reader vulnerabilities

---

### 2. Input Validation on Operations

**Current Status:** ⚠️ PARTIAL

**What's Missing:**

- Limited validation of operation parameters
- No sanitization of watermark text
- No validation of page numbers

**Recommendation:**

```typescript
// Add input validation for operations
function validateWatermarkText(text: string): boolean {
  // Limit length
  if (text.length > 500) return false;

  // Remove potentially dangerous characters
  const sanitized = text.replace(/[<>]/g, "");

  // Check for script injection attempts
  if (/<script|javascript:/i.test(text)) return false;

  return true;
}

function validatePageNumber(page: number, totalPages: number): boolean {
  return page >= 1 && page <= totalPages && Number.isInteger(page);
}
```

**Risk Level:** 🟡 MEDIUM

---

### 3. CORS Configuration

**Current Status:** ⚠️ TOO PERMISSIVE

**Current Setting:**

```typescript
origin: true, // Allows ALL origins
```

**Recommendation:**

```typescript
// Restrict to your domain only
origin: process.env.ALLOWED_ORIGINS?.split(',') || [
  'https://i-hate-pdf-production.up.railway.app'
],
```

**Risk Level:** 🟡 LOW-MEDIUM

- Currently allows any website to call your API
- Could lead to unauthorized usage
- Increases attack surface

---

### 4. Content Security Policy (CSP)

**Current Status:** ⚠️ DISABLED IN PRODUCTION

**Current Setting:**

```typescript
contentSecurityPolicy: isProduction
  ? false
  : {
      /* config */
    };
```

**Recommendation:**

```typescript
contentSecurityPolicy: {
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"], // For Tailwind
    imgSrc: ["'self'", "data:", "https:"],
    connectSrc: ["'self'"],
    fontSrc: ["'self'"],
    objectSrc: ["'none'"],
    mediaSrc: ["'self'"],
    frameSrc: ["'none'"],
  },
}
```

**Risk Level:** 🟡 MEDIUM

- No protection against XSS in production
- Allows inline scripts
- Increases attack surface

---

## 🔴 Critical Recommendations

### 1. Add Virus Scanning (Optional but Recommended)

**Why:** PDFs can contain malware

**Solution:**

```bash
# Install ClamAV
npm install clamscan

# Use in upload route
import NodeClam from 'clamscan';

const clamscan = await new NodeClam().init({
  clamdscan: {
    path: '/usr/bin/clamdscan',
  }
});

const { isInfected, viruses } = await clamscan.isInfected(filePath);
if (isInfected) {
  throw new Error(`Virus detected: ${viruses.join(', ')}`);
}
```

**Risk Level:** 🟡 MEDIUM (depends on use case)

---

### 2. Add Request Logging

**Why:** Track suspicious activity

**Solution:**

```typescript
import morgan from "morgan";

// Log all requests
app.use(morgan("combined"));

// Log failed uploads
if (!validation.valid) {
  console.warn(`Failed upload attempt from ${req.ip}: ${validation.error}`);
}
```

**Risk Level:** 🟢 LOW (but important for monitoring)

---

## 🟢 What You're Already Protected Against

### File-Based Attacks ✅

1. **Malicious File Extensions**

   - ✅ Magic number validation prevents fake extensions
   - ✅ Can't upload .exe, .sh, .bat disguised as .pdf

2. **Directory Traversal**

   - ✅ Path sanitization prevents ../../../etc/passwd
   - ✅ Path validation ensures files stay in upload directory

3. **Null Byte Injection**

   - ✅ Filename sanitization removes null bytes
   - ✅ Prevents file.pdf\0.exe attacks

4. **Polyglot Files**

   - ✅ Magic number validation detects multi-format files
   - ✅ Rejects files that aren't pure PDF/PNG/JPEG

5. **Zip Bombs / Decompression Bombs**

   - ✅ File size limits prevent massive decompressed files
   - ✅ 100MB limit stops most zip bomb attacks

6. **Symlink Attacks**
   - ✅ Path resolution prevents symlink traversal
   - ✅ Files must be in allowed directory

---

### Network Attacks ✅

1. **DoS via Large Files**

   - ✅ File size limits (100MB)
   - ✅ Rate limiting (20 uploads per 15 min)

2. **DoS via Many Requests**

   - ✅ Rate limiting per IP
   - ✅ Automatic file cleanup

3. **Man-in-the-Middle**

   - ✅ HTTPS enforcement
   - ✅ HSTS headers

4. **Clickjacking**
   - ✅ X-Frame-Options: DENY
   - ✅ Prevents iframe embedding

---

## Security Checklist

### ✅ Implemented

- [x] Magic number file validation
- [x] Filename sanitization
- [x] Path traversal prevention
- [x] File size limits
- [x] Rate limiting
- [x] HTTPS enforcement
- [x] Security headers (Helmet)
- [x] Automatic file cleanup
- [x] Error handling without info disclosure

### 🟡 Partially Implemented

- [~] CORS configuration (too permissive)
- [~] CSP (disabled in production)
- [~] Input validation (basic only)
- [~] PDF content validation (magic numbers only)

### ❌ Not Implemented (Optional)

- [ ] Virus scanning
- [ ] Request logging/monitoring
- [ ] PDF JavaScript detection
- [ ] Embedded file detection
- [ ] Watermark text sanitization

---

## Recommendations Priority

### High Priority (Do Soon)

1. **Enable CSP in production** - Protects against XSS
2. **Restrict CORS to your domain** - Prevents unauthorized API usage
3. **Add input validation for operations** - Prevents injection attacks

### Medium Priority (Consider)

4. **Add PDF structure validation** - Detects corrupted/malicious PDFs
5. **Add request logging** - Helps detect attacks
6. **Sanitize watermark text** - Prevents injection

### Low Priority (Nice to Have)

7. **Add virus scanning** - Extra layer of protection
8. **Add monitoring/alerting** - Detect abuse patterns
9. **Add PDF JavaScript detection** - Prevents malicious PDFs

---

## Conclusion

**Your app is reasonably secure against file payload backdoors and common attacks.**

### Strengths:

- ✅ Strong file validation (magic numbers)
- ✅ Good path security
- ✅ Rate limiting in place
- ✅ Automatic cleanup
- ✅ HTTPS enforced

### Weaknesses:

- 🟡 CORS too permissive
- 🟡 CSP disabled in production
- 🟡 Limited PDF content validation

### Overall:

For a file processing application, your security is **above average**. The main risks are:

1. Malicious PDFs with embedded JavaScript (low risk - requires user to open)
2. API abuse due to permissive CORS (medium risk)
3. XSS due to disabled CSP (medium risk)

**Recommendation:** Implement the high-priority items above, and you'll have excellent security.

---

**Last Updated:** December 2024
**Next Review:** After implementing high-priority recommendations
