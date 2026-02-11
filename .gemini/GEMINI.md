# AdmissionGuidelines.tsx Implementation Guide

**Document Version:** 1.0  
**Last Updated:** February 11, 2026  
**Purpose:** Detailed implementation instructions for updating AdmissionGuidelines.tsx component to align with official ICA guidelines, HFSE C4.1.1_02 manual, and CDA vaccination requirements

---

## Table of Contents

1. [Overview](#overview)
2. [Current State Analysis](#current-state-analysis)
3. [Required Component Changes](#required-component-changes)
4. [Section-by-Section Implementation](#section-by-section-implementation)
5. [New Components Needed](#new-components-needed)
6. [Content Updates](#content-updates)
7. [Implementation Checklist](#implementation-checklist)

---

## Overview

### What This Guide Covers

This implementation guide provides step-by-step instructions for updating the `AdmissionGuidelines.tsx` component to support:

- **Three application types**: NEW, RENEWAL, and TRANSFER
- **DP/LTVP exemption** clarification with registration requirement
- **Vaccination requirements** aligned with CDA official form (aged 12 years 0 day or below)
- **Pre-course counselling** aligned with HFSE C4.1.1_02 manual and GD4.0 requirements
- **Employment/internship restrictions** for Student's Pass holders
- **Entrance test requirements** for NEW applications
- **Document verification process** by Office of Admin and Operations

### Key Principles

1. **Maintain existing component structure** - Don't break existing functionality
2. **Add tabs/accordions** for type-specific content (NEW/RENEWAL/TRANSFER)
3. **Use existing UI components** from your design system (Tabs, Card, Badge, Alert)
4. **Update text content** to match official terminology
5. **Keep responsive design** - mobile-first approach

---

## Current State Analysis

### What the Current HTML Has

Based on the Admissions-Guidelines.html file, the current implementation includes:

✅ **Hero/Introduction Section**

- Basic introductory text
- Focus only on NEW applications

✅ **Two-Box Disclaimer Section**

- ICA Authority disclaimer
- Non-refundable fees disclaimer
- ⚠️ Needs update to mention all three types

✅ **Required Documents Section**

- Single list of documents
- ⚠️ Needs tabs for NEW/RENEWAL/TRANSFER

✅ **Photo Guidelines Section**

- ICA photo requirements
- ✅ Can stay mostly the same

✅ **Vaccination Section**

- Basic vaccination information
- ⚠️ Needs update with precise CDA terminology

✅ **Processing Timeline Section**

- Single timeline (10 working days)
- ⚠️ Needs tabs for three different timelines

✅ **Enrollment Portal Steps**

- 4-step process
- ⚠️ Needs to become 5 steps with type selection

✅ **Pre-Course Counselling Section**

- Basic acknowledgement info
- ⚠️ Needs expansion with GD4.0 requirements

✅ **FAQ Section**

- General FAQs
- ⚠️ Needs type-specific FAQs for NEW/RENEWAL/TRANSFER

### What's Missing

❌ **Application Type Selection/Differentiation**

- No three-column layout for NEW/RENEWAL/TRANSFER
- No "Does NOT Apply To" section for DP/LTVP

❌ **RENEWAL-Specific Content**

- No simplified document list
- No 1-week timeline
- No renewal FAQs

❌ **TRANSFER-Specific Content**

- No transfer documents requirements
- No 2-4 week timeline
- No previous school clearance information
- No transfer FAQs

❌ **Entrance Test Information**

- Not mentioned in NEW application requirements

❌ **Document Verification Process**

- No mention of Office of Admin and Operations verification
- No mention of "Verified" in Admissions System

❌ **Expanded Employment Restrictions**

- Partial mention, needs full GD4.0 language

---

## Required Component Changes

### 1. Add State Management for Application Types

```tsx
// Add to component state
const [selectedApplicationType, setSelectedApplicationType] = useState<"new" | "renewal" | "transfer">("new");
```

### 2. Import Additional UI Components

```tsx
// Add these imports if not already present
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Globe2, RefreshCcw, FileCheck2, AlertTriangle, Info } from "lucide-react";
```

### 3. Component Structure Overview

```
AdmissionGuidelines.tsx
├── Hero Section (UPDATE)
├── Disclaimer Boxes (UPDATE TEXT)
├── Who This Applies To (MAJOR RESTRUCTURE - 3 columns + exemptions)
├── Required Documents (ADD TABS - NEW/RENEWAL/TRANSFER)
├── Photo Guidelines (MINOR UPDATE)
├── Vaccination Requirements (UPDATE TEXT)
├── Processing Timeline (ADD TABS - NEW/RENEWAL/TRANSFER)
├── Enrollment Portal Steps (UPDATE - 5 steps)
├── Pre-Course Counselling (EXPAND CONTENT)
└── FAQ Section (ADD TYPE-SPECIFIC FAQS)
```

---

## Section-by-Section Implementation

### Section 1: Hero/Introduction

**Current Location:** Top of the page

**Action Required:** UPDATE TEXT

**Current Text:**

```tsx
<div className="hero-section">
  <h1>Student's Pass Application Information for International Students</h1>
  <p>This service is for new students...</p>
</div>
```

**Updated Implementation:**

```tsx
<div className="hero-section">
  <h1>Student's Pass Services for International Students</h1>
  <p className="text-lg text-muted-foreground max-w-3xl">
    HFSE International School provides comprehensive assistance for all Student's Pass application types:{" "}
    <strong>NEW applications</strong> for first-time students,
    <strong>RENEWALS</strong> for continuing students, and <strong>TRANSFERS</strong> for students from other Private
    Education Institutions (PEI).
  </p>
  <p className="text-base text-muted-foreground max-w-3xl mt-4">
    Our experienced admissions team will guide you through the entire process, ensuring all documentation meets ICA
    requirements and is submitted correctly through the SOLARPLUS system.
  </p>
</div>
```

---

### Section 2: Important Disclaimers

**Current Location:** Two-box amber alert section

**Action Required:** UPDATE TEXT to mention all three types

**Current Implementation:**

```tsx
<div className="grid md:grid-cols-2 gap-4">
  <Alert variant="warning">
    <AlertTitle>ICA Authority & School Assistance</AlertTitle>
    <AlertDescription>The approval and issuance of a Student's Pass is determined solely by ICA...</AlertDescription>
  </Alert>

  <Alert variant="warning">
    <AlertTitle>Application Fees - Non-Refundable</AlertTitle>
    <AlertDescription>
      Please be advised that all Student's Pass application fees paid are non-refundable...
    </AlertDescription>
  </Alert>
</div>
```

**Updated Implementation:**

```tsx
<div className="grid md:grid-cols-2 gap-4">
  <Alert variant="warning">
    <AlertTriangle className="h-4 w-4" />
    <AlertTitle>ICA Authority</AlertTitle>
    <AlertDescription>
      The approval and issuance of a Student's Pass (whether <strong>NEW, RENEWAL, or TRANSFER</strong>) is determined
      solely by the Immigration & Checkpoints Authority (ICA). While the school will provide comprehensive assistance
      with the application process, the final decision remains beyond the control of the Private Education Institution
      (PEI).
    </AlertDescription>
  </Alert>

  <Alert variant="warning">
    <AlertTriangle className="h-4 w-4" />
    <AlertTitle>Non-Refundable Fees</AlertTitle>
    <AlertDescription>
      Parents are kindly advised that all Student's Pass application fees paid (for{" "}
      <strong>NEW applications, RENEWALS, or TRANSFERS</strong>) are non-refundable, regardless of the outcome of the
      application. These fees are separate from school tuition fees and apply whether your application is approved or
      rejected.
    </AlertDescription>
  </Alert>
</div>
```

---

### Section 3: Who This Applies To

**Current Location:** Single card with two columns

**Action Required:** MAJOR RESTRUCTURE - Three columns + exemptions section

**New Implementation Structure:**

```tsx
<section className="space-y-6">
  <h2 className="text-2xl font-semibold">Who This Applies To</h2>

  {/* Three Application Types */}
  <div className="grid md:grid-cols-3 gap-6">
    {/* Column 1: NEW Applications */}
    <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Globe2 className="h-5 w-5 text-blue-600" />
          <CardTitle>NEW Student's Pass</CardTitle>
        </div>
        <Badge variant="secondary" className="w-fit">
          First-Time Applicants
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-semibold mb-2">Applies To:</h4>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            <li>International students enrolling for the first time at HFSE</li>
            <li>Students who do not hold any existing Student's Pass</li>
            <li>Students who have never had a Student's Pass before</li>
            <li>Students transferring from non-PEI schools (e.g., government schools)</li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-2">Requirements:</h4>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            <li>Full document set required (verified for originality)</li>
            <li>Vaccination verification (if aged 12 years 0 day or below)</li>
            <li>Entrance Test (English and Mathematics)</li>
            <li>Processing time: ~10 working days</li>
          </ul>
        </div>
      </CardContent>
    </Card>

    {/* Column 2: RENEWAL Applications */}
    <Card className="border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <RefreshCcw className="h-5 w-5 text-green-600" />
          <CardTitle>Student's Pass Renewal</CardTitle>
        </div>
        <Badge variant="secondary" className="w-fit">
          Continuing Students
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-semibold mb-2">Applies To:</h4>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            <li>Current HFSE students whose Student's Pass is expiring</li>
            <li>Students continuing enrollment at HFSE for next academic year</li>
            <li>Students whose pass expiry date is approaching</li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-2">Requirements:</h4>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            <li>Current pass number and expiry date</li>
            <li>Proof of continued enrollment</li>
            <li>Simplified documentation</li>
            <li>Processing time: ~1 week</li>
          </ul>
        </div>
        <Alert className="mt-4">
          <Info className="h-4 w-4" />
          <AlertDescription className="text-xs">
            Renewals are handled through separate administrative process. Contact admissions office if your pass expires
            within 3 months.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>

    {/* Column 3: TRANSFER Applications */}
    <Card className="border-purple-200 bg-purple-50/50 dark:border-purple-900 dark:bg-purple-950/50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <FileCheck2 className="h-5 w-5 text-purple-600" />
          <CardTitle>Student's Pass Transfer</CardTitle>
        </div>
        <Badge variant="secondary" className="w-fit">
          From Another PEI
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-semibold mb-2">Applies To:</h4>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            <li>Students with existing Student's Pass from another Private Education Institution (PEI)</li>
            <li>Students transferring schools within Singapore</li>
            <li>Students whose previous PEI has closed or changed status</li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-2">Requirements:</h4>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            <li>Copy of current Student's Pass</li>
            <li>Current pass number and expiry date</li>
            <li>Previous school clearance/transfer approval</li>
            <li>Processing time: Variable (ICA review required)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  </div>

  {/* Does NOT Apply To Section */}
  <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/50">
    <CardHeader>
      <CardTitle>Does NOT Apply To</CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <p className="text-sm">
        <strong>All Student's Pass services DO NOT apply to:</strong>
      </p>
      <ul className="list-disc pl-5 space-y-2 text-sm">
        <li>
          Students holding a valid <strong>Dependent's Pass (DP)</strong> - exempt from Student's Pass
        </li>
        <li>
          Students holding a valid <strong>Long-Term Visit Pass (LTVP)</strong> - exempt from Student's Pass
        </li>
        <li>
          <strong>Singapore Citizens</strong> - no pass required
        </li>
        <li>
          <strong>Singapore Permanent Residents (PR)</strong> - no pass required
        </li>
      </ul>
      <Alert className="mt-4">
        <Info className="h-4 w-4" />
        <AlertTitle>Important Note</AlertTitle>
        <AlertDescription>
          DP/LTVP holders are exempt from Student's Pass application fees, but the school must still{" "}
          <strong>register them with ICA</strong> before studies begin. This registration is handled by our Office of
          Admin and Operations.
        </AlertDescription>
      </Alert>
    </CardContent>
  </Card>
</section>
```

---

### Section 4: Required Documents

**Current Location:** Single card with document list

**Action Required:** ADD TABS for three application types

**New Implementation:**

```tsx
<section className="space-y-6">
  <h2 className="text-2xl font-semibold">Required Documents</h2>

  <Card>
    <CardHeader>
      <CardTitle>Documents by Application Type</CardTitle>
      <CardDescription>
        Requirements vary based on whether you're applying for NEW, RENEWAL, or TRANSFER
      </CardDescription>
    </CardHeader>
    <CardContent>
      <Tabs defaultValue="new" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="new">NEW Applications</TabsTrigger>
          <TabsTrigger value="renewal">RENEWAL</TabsTrigger>
          <TabsTrigger value="transfer">TRANSFER</TabsTrigger>
        </TabsList>

        {/* Tab 1: NEW Applications */}
        <TabsContent value="new" className="space-y-4 mt-4">
          <h3 className="font-semibold text-lg">Documents for NEW Student's Pass</h3>

          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">1. Travel Document</h4>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>Valid passport with minimum 6 months validity</li>
                <li>Passport photo page and entry stamp</li>
                <li>Must be same document used for CDA vaccination verification (if applicable)</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-2">2. School Documents</h4>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>Proof of acceptance from HFSE (Letter of Offer)</li>
                <li>Completed online Enrolment Form</li>
                <li>Previous school records/transcripts (originals verified)</li>
                <li>
                  <strong>Completed Entrance Test (English and Mathematics)</strong>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-2">
                3. Medical Records & Vaccination (Children aged 12 years 0 day or below)
              </h4>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>Medical examination report</li>
                <li>
                  <strong>Immunisation Registration Form</strong> certified by licensed doctor
                </li>
                <li>Mandatory vaccinations: Diphtheria, Tetanus, Pertussis (DTP), Measles, Tuberculosis (BCG)</li>
                <li>Recommended vaccinations per Singapore National Childhood Immunisation Schedule (NCIS)</li>
                <li>Submission to Communicable Diseases Agency (CDA) via National Immunisation Registry (NIR)</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-2">4. Financial Proof</h4>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>Bank statements showing sufficient funds</li>
                <li>Sponsor's financial documents (if applicable)</li>
                <li>Declaration of financial support</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-2">5. Family Documents</h4>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>Student's birth certificate</li>
                <li>Parent/guardian passports</li>
                <li>Family registration documents (if applicable)</li>
              </ul>
            </div>
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Submission:</strong> All documents must be uploaded during online enrollment. Original documents
              will be verified by Office of Admin and Operations.
            </AlertDescription>
          </Alert>
        </TabsContent>

        {/* Tab 2: RENEWAL Applications */}
        <TabsContent value="renewal" className="space-y-4 mt-4">
          <h3 className="font-semibold text-lg">Documents for Student's Pass Renewal</h3>

          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">1. Current Pass Details</h4>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>Student's Pass card (front and back)</li>
                <li>Pass number and expiry date</li>
                <li>Current pass validity proof</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-2">2. Enrollment Proof</h4>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>Proof of continued enrollment at HFSE</li>
                <li>Current academic transcript/report</li>
                <li>Attendance records</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-2">3. Updated Information</h4>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>Updated passport (if changed or validity &lt;6 months)</li>
                <li>Updated residential address (if changed)</li>
                <li>Parent/guardian contact updates</li>
              </ul>
            </div>
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Note:</strong> Simplified process for continuing students. Processing typically faster than new
              applications (approximately 1 week).
            </AlertDescription>
          </Alert>
        </TabsContent>

        {/* Tab 3: TRANSFER Applications */}
        <TabsContent value="transfer" className="space-y-4 mt-4">
          <h3 className="font-semibold text-lg">Documents for Student's Pass Transfer</h3>

          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">1. Current Pass Documentation</h4>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>Copy of existing Student's Pass (front and back)</li>
                <li>Current pass number and expiry date</li>
                <li>Pass validity verification</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-2">2. Previous School Documents</h4>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>
                  <strong>Transfer approval from previous PEI</strong>
                </li>
                <li>Previous school clearance letter</li>
                <li>Academic records from previous school</li>
                <li>Attendance records</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-2">3. HFSE Enrollment Proof</h4>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>Letter of Offer/acceptance from HFSE</li>
                <li>Completed online Enrolment Form</li>
                <li>Proof of withdrawal from previous school</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-2">4. Supporting Documents</h4>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>Updated passport (if validity &lt;6 months)</li>
                <li>Updated residential address proof</li>
                <li>Parent/guardian authorization</li>
              </ul>
            </div>
          </div>

          <Alert variant="warning">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Important</AlertTitle>
            <AlertDescription>
              Transfer must be approved by ICA before enrollment can be finalized. Keep current pass valid throughout
              transfer process.
            </AlertDescription>
          </Alert>
        </TabsContent>
      </Tabs>
    </CardContent>
  </Card>
</section>
```

---

### Section 5: Vaccination Requirements

**Current Location:** Vaccination card

**Action Required:** UPDATE TEXT with precise CDA terminology

**Updated Implementation:**

```tsx
<section className="space-y-6">
  <h2 className="text-2xl font-semibold">Vaccination Requirements</h2>

  <Card>
    <CardHeader>
      <CardTitle>Mandatory Vaccination Verification</CardTitle>
      <CardDescription>
        Foreign-born children aged 12 years 0 day or below applying for a NEW Student's Pass
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-6">
      <Alert className="border-blue-200 bg-blue-50/50">
        <Info className="h-4 w-4" />
        <AlertTitle>NEW Applications Only</AlertTitle>
        <AlertDescription>
          Foreign-born children <strong>aged 12 years 0 day or below</strong> applying for a NEW Student's Pass must
          submit vaccination verification to the Communicable Diseases Agency (CDA) through the National Immunisation
          Registry (NIR) system.
          <br />
          <br />
          <strong>This requirement applies to NEW applications only.</strong> RENEWAL and TRANSFER applications do not
          require re-submission of vaccination records unless there are updates.
        </AlertDescription>
      </Alert>

      <div>
        <h3 className="font-semibold mb-3">
          Mandatory Vaccinations (Compulsory under Singapore Infectious Diseases Act)
        </h3>

        <div className="space-y-4">
          <div className="p-4 border rounded-lg">
            <h4 className="font-semibold mb-2">1. Diphtheria, Tetanus, Pertussis (DTP)</h4>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>Minimum age: 6 weeks old</li>
              <li>Required doses: Primary series (Dose 1, 2, 3) + Boosters</li>
              <li>Minimum interval: 4 weeks between primary doses, 6 months before booster</li>
            </ul>
          </div>

          <div className="p-4 border rounded-lg">
            <h4 className="font-semibold mb-2">2. Measles</h4>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>Minimum age: 12 months old</li>
              <li>Required doses: 1 dose (if child ≥12 months), 2 doses (if child ≥15 months)</li>
              <li>Minimum interval: 4 weeks between doses</li>
              <li>
                <strong>Note:</strong> Doses given before 12 months do not count
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-3">Recommended Vaccinations (Per Singapore NCIS)</h3>
        <div className="grid md:grid-cols-2 gap-2 text-sm">
          <div className="flex items-start gap-2">
            <span className="text-muted-foreground">3.</span>
            <span>Tuberculosis (BCG)</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-muted-foreground">4.</span>
            <span>Hepatitis B</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-muted-foreground">5.</span>
            <span>Polio (IPV)</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-muted-foreground">6.</span>
            <span>Haemophilus Influenzae Type B (Hib)</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-muted-foreground">7.</span>
            <span>Pneumococcal (PCV)</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-muted-foreground">8.</span>
            <span>Mumps, Rubella (MMR)</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-muted-foreground">9.</span>
            <span>Varicella (Chicken Pox)</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-muted-foreground">10.</span>
            <span>Influenza (seasonal)</span>
          </div>
        </div>
      </div>

      <div className="p-4 bg-muted rounded-lg space-y-2">
        <h4 className="font-semibold">Important Requirements:</h4>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li>
            <strong>Immunisation Registration Form</strong> must be certified by a licensed doctor
          </li>
          <li>Documentary proof of all vaccinations required</li>
          <li>Same travel document (passport) used for NIR and ICA applications</li>
          <li>Passport validity must be at least 6 months at time of application</li>
        </ul>
      </div>

      <div className="flex flex-col gap-2 text-sm">
        <p className="font-semibold">Official Resources:</p>
        <a
          href="https://www.nir.cda.gov.sg/nirp/eservices/immunisationSchedule"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline">
          CDA NIR Portal: https://www.nir.cda.gov.sg/nirp/eservices/immunisationSchedule
        </a>
        <a
          href="https://www.healthhub.sg/programmes/16/growing-up"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline">
          Singapore NCIS: https://www.healthhub.sg/programmes/16/growing-up
        </a>
      </div>
    </CardContent>
  </Card>
</section>
```

---

### Section 6: Processing Timeline

**Current Location:** Single timeline card

**Action Required:** ADD TABS for three different timelines

**New Implementation:**

```tsx
<section className="space-y-6">
  <h2 className="text-2xl font-semibold">Processing Timeline</h2>

  <Card>
    <CardHeader>
      <CardTitle>Expected Processing Time by Application Type</CardTitle>
    </CardHeader>
    <CardContent>
      <Tabs defaultValue="new" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="new">NEW (~10 working days)</TabsTrigger>
          <TabsTrigger value="renewal">RENEWAL (~1 week)</TabsTrigger>
          <TabsTrigger value="transfer">TRANSFER (2-4 weeks)</TabsTrigger>
        </TabsList>

        {/* NEW Applications Timeline */}
        <TabsContent value="new" className="space-y-4 mt-4">
          <h3 className="font-semibold">NEW Applications Processing</h3>
          <p className="text-sm text-muted-foreground">
            Estimated Time: <strong>Approximately 10 working days</strong>
          </p>

          <div className="space-y-3 mt-4">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-24 text-sm font-semibold">Week 1-2:</div>
              <div className="text-sm">
                Document submission and verification by school. Office of Admin and Operations verifies originality of
                documents.
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-24 text-sm font-semibold">Week 2-3:</div>
              <div className="text-sm">School submits to ICA via SOLARPLUS system</div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-24 text-sm font-semibold">Week 3-4:</div>
              <div className="text-sm">ICA processing and review</div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-24 text-sm font-semibold">Week 4-5:</div>
              <div className="text-sm">Decision notification (approval/rejection communicated by school)</div>
            </div>
          </div>

          <Alert className="mt-4">
            <Info className="h-4 w-4" />
            <AlertTitle>Important Notes</AlertTitle>
            <AlertDescription>
              <ul className="list-disc pl-5 space-y-1 text-sm mt-2">
                <li>Apply at least 2 months before course start</li>
                <li>Not more than 3 months in advance</li>
                <li>You don't need to be in Singapore during processing</li>
                <li>Processing times depend on document completeness</li>
                <li>School cannot influence ICA decision</li>
              </ul>
            </AlertDescription>
          </Alert>
        </TabsContent>

        {/* RENEWAL Applications Timeline */}
        <TabsContent value="renewal" className="space-y-4 mt-4">
          <h3 className="font-semibold">RENEWAL Applications Processing</h3>
          <p className="text-sm text-muted-foreground">
            Estimated Time: <strong>Approximately 1 week (simplified process)</strong>
          </p>

          <div className="space-y-3 mt-4">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-16 text-sm font-semibold">Week 1:</div>
              <div className="text-sm">Student provides current pass details</div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-16 text-sm font-semibold">Week 1:</div>
              <div className="text-sm">School verifies continued enrollment status</div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-16 text-sm font-semibold">Week 1:</div>
              <div className="text-sm">School submits renewal to ICA via SOLARPLUS</div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-16 text-sm font-semibold">Week 1-2:</div>
              <div className="text-sm">ICA approval (typically faster for renewals)</div>
            </div>
          </div>

          <Alert className="mt-4">
            <Info className="h-4 w-4" />
            <AlertTitle>Important Notes</AlertTitle>
            <AlertDescription>
              <ul className="list-disc pl-5 space-y-1 text-sm mt-2">
                <li>Apply before pass expiry (ideally 3 months before)</li>
                <li>Ensure continuous enrollment status</li>
                <li>Keep current pass valid until renewal approved</li>
                <li>Faster processing than new applications due to existing records</li>
              </ul>
            </AlertDescription>
          </Alert>
        </TabsContent>

        {/* TRANSFER Applications Timeline */}
        <TabsContent value="transfer" className="space-y-4 mt-4">
          <h3 className="font-semibold">TRANSFER Applications Processing</h3>
          <p className="text-sm text-muted-foreground">
            Estimated Time: <strong>Variable (typically 2-4 weeks)</strong>
          </p>

          <div className="space-y-3 mt-4">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-16 text-sm font-semibold">Week 1:</div>
              <div className="text-sm">Obtain clearance from previous PEI</div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-16 text-sm font-semibold">Week 1-2:</div>
              <div className="text-sm">Submit transfer request to HFSE admissions</div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-16 text-sm font-semibold">Week 2:</div>
              <div className="text-sm">School prepares transfer documentation</div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-16 text-sm font-semibold">Week 2-3:</div>
              <div className="text-sm">School submits transfer to ICA via SOLARPLUS</div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-16 text-sm font-semibold">Week 3-4:</div>
              <div className="text-sm">ICA reviews transfer eligibility</div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-16 text-sm font-semibold">Week 4+:</div>
              <div className="text-sm">Transfer approval decision communicated</div>
            </div>
          </div>

          <Alert variant="warning" className="mt-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Important Notes</AlertTitle>
            <AlertDescription>
              <ul className="list-disc pl-5 space-y-1 text-sm mt-2">
                <li>Requires previous school's cooperation and clearance</li>
                <li>ICA must approve transfer before HFSE enrollment begins</li>
                <li>Keep current pass valid during entire transfer process</li>
                <li>Processing time depends on previous school's response time</li>
                <li>
                  <strong>Cannot start classes until ICA approves transfer</strong>
                </li>
              </ul>
            </AlertDescription>
          </Alert>
        </TabsContent>
      </Tabs>
    </CardContent>
  </Card>
</section>
```

---

### Section 7: Enrollment Portal Steps

**Current Location:** 4-step process

**Action Required:** UPDATE to 5 steps with application type selection

**Updated Implementation:**

```tsx
<section className="space-y-6">
  <h2 className="text-2xl font-semibold">Enrolment Portal Steps</h2>

  <Card>
    <CardHeader>
      <CardTitle>Complete Your Application Online</CardTitle>
      <CardDescription>
        Follow these steps when registering through the school's online enrolment portal
      </CardDescription>
    </CardHeader>
    <CardContent>
      <div className="space-y-6">
        {/* Step 1 */}
        <div className="flex gap-4">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
            1
          </div>
          <div className="flex-1">
            <h3 className="font-semibold mb-2">Select Application Type</h3>
            <p className="text-sm text-muted-foreground">
              Choose the appropriate application type based on your situation:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1 text-sm">
              <li>
                <strong>NEW Student's Pass Application</strong> (first-time international students)
              </li>
              <li>
                <strong>Student's Pass Renewal</strong> (for continuing HFSE students with expiring pass)
              </li>
              <li>
                <strong>Student's Pass Transfer</strong> (from another PEI)
              </li>
            </ul>
            <Alert className="mt-3">
              <Info className="h-4 w-4" />
              <AlertDescription className="text-xs">
                If you hold a valid Dependent's Pass (DP) or Long-Term Visit Pass (LTVP), you do not need to apply for a
                Student's Pass. The school will register you with ICA.
              </AlertDescription>
            </Alert>
          </div>
        </div>

        {/* Step 2 */}
        <div className="flex gap-4">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
            2
          </div>
          <div className="flex-1">
            <h3 className="font-semibold mb-2">Upload ICA-Compliant Photo</h3>
            <p className="text-sm text-muted-foreground">
              Ensure your photo meets ICA technical specifications. Required for all application types. Photo must meet
              biometric standards as specified by ICA.
            </p>
          </div>
        </div>

        {/* Step 3 */}
        <div className="flex gap-4">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
            3
          </div>
          <div className="flex-1">
            <h3 className="font-semibold mb-2">Upload Required Documents</h3>
            <p className="text-sm text-muted-foreground mb-2">Upload documents based on your application type:</p>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>
                <strong>NEW:</strong> Full document set (passport, vaccination for children ≤12 years, financial,
                medical, academic records)
              </li>
              <li>
                <strong>RENEWAL:</strong> Current pass details, enrollment proof, updated information
              </li>
              <li>
                <strong>TRANSFER:</strong> Current pass copy, previous school clearance, academic records
              </li>
            </ul>
            <p className="text-xs text-muted-foreground mt-2">
              All original documents will be verified by the Office of Admin and Operations to ensure authenticity.
            </p>
          </div>
        </div>

        {/* Step 4 */}
        <div className="flex gap-4">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
            4
          </div>
          <div className="flex-1">
            <h3 className="font-semibold mb-2">Complete All Information Accurately</h3>
            <p className="text-sm text-muted-foreground">
              Ensure all fields are fully and accurately completed. The Office of Admin and Operations will review your
              Enrolment Form (Online) before submission to ICA.{" "}
              <strong>Incomplete or inaccurate information delays processing and may result in rejection.</strong>
            </p>
          </div>
        </div>

        {/* Step 5 */}
        <div className="flex gap-4">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
            5
          </div>
          <div className="flex-1">
            <h3 className="font-semibold mb-2">Acknowledge Pre-Course Counselling</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Sign the Pre-Course Counselling Acknowledgement Form confirming you understand:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>ICA authority and school's limitations in approval process</li>
              <li>Non-refundable nature of application fees (for all types)</li>
              <li>Student's Pass holder restrictions (employment/internship regulations)</li>
              <li>All Student's Pass policies and relevant Singapore laws</li>
            </ul>
            <Alert variant="warning" className="mt-3">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                This acknowledgement is <strong>MANDATORY</strong> for all international students requiring Student's
                Pass services (NEW, RENEWAL, or TRANSFER) as per GD4.0 requirements.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</section>
```

---

### Section 8: Pre-Course Counselling

**Current Location:** Basic acknowledgement card

**Action Required:** EXPAND with GD4.0 requirements

**Updated Implementation:**

```tsx
<section className="space-y-6">
  <h2 className="text-2xl font-semibold">Pre-Course Counselling</h2>

  <Card>
    <CardHeader>
      <CardTitle>Mandatory Pre-Course Counselling and Acknowledgement</CardTitle>
      <CardDescription>Required for all international students (NEW, RENEWAL, or TRANSFER)</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      <Alert className="border-amber-200 bg-amber-50/50">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Mandatory Requirement</AlertTitle>
        <AlertDescription>
          Mandatory Pre-Course Counselling and Acknowledgement for all international students requiring Student's Pass
          services (NEW, RENEWAL, or TRANSFER). This must be signed before proceeding with enrollment or pass
          processing.
          <br />
          <br />
          This requirement ensures compliance with GD4.0 standards and that all prospective students and parents receive
          accurate information about Student's Pass application procedures, school policies, and relevant Singapore
          regulations.
        </AlertDescription>
      </Alert>

      <div>
        <h3 className="font-semibold mb-3">Information Provided During Pre-Course Counselling:</h3>
        <div className="grid md:grid-cols-2 gap-3">
          <ul className="list-disc pl-5 space-y-2 text-sm">
            <li>Student's Pass application procedures and requirements (for NEW, RENEWAL, and TRANSFER)</li>
            <li>Limitations of school authority in Student's Pass approval (ICA has sole decision-making power)</li>
            <li>Non-refundable nature of ICA application fees (for all application types)</li>
            <li>Processing timelines for different application types</li>
            <li>Renewal requirements and timelines for continuing students</li>
            <li>Transfer procedures if changing institutions</li>
          </ul>
          <ul className="list-disc pl-5 space-y-2 text-sm">
            <li>Course information and suitability assessment</li>
            <li>School fee structure and refund policy</li>
            <li>Student support services available</li>
            <li>Other essential student and school policies</li>
            <li>Relevant Singapore laws and regulations (Infectious Diseases Act, Immigration Act)</li>
          </ul>
        </div>
      </div>

      <div className="p-4 border-2 border-red-200 bg-red-50/50 rounded-lg dark:border-red-900 dark:bg-red-950/50">
        <h4 className="font-semibold mb-2 text-red-900 dark:text-red-100">Student's Pass Holder Restrictions:</h4>
        <ul className="list-disc pl-5 space-y-1 text-sm text-red-900 dark:text-red-100">
          <li>
            <strong>NOT permitted</strong> to engage in any form of employment without valid Ministry of Manpower (MOM)
            work pass
          </li>
          <li>
            <strong>NOT permitted</strong> to attend industrial attachment/internship programmes (paid or unpaid)
            without MOM work pass
          </li>
          <li>Must maintain valid pass status throughout enrollment</li>
        </ul>
      </div>

      <div className="p-4 bg-muted rounded-lg">
        <h4 className="font-semibold mb-2">Quality Monitoring:</h4>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li>Quality of pre-course counselling monitored through New Parent Satisfaction Survey</li>
          <li>Admissions Officer trained and monitored by Office of Admin and Operations</li>
          <li>Management Team approval required for student selection process</li>
        </ul>
      </div>
    </CardContent>
  </Card>
</section>
```

---

### Section 9: FAQ Section

**Current Location:** Basic FAQ list

**Action Required:** ADD type-specific FAQs organized by category

**New Implementation Structure:**

```tsx
<section className="space-y-6">
  <h2 className="text-2xl font-semibold">Frequently Asked Questions</h2>

  {/* General FAQs */}
  <Card>
    <CardHeader>
      <CardTitle>General Questions (All Application Types)</CardTitle>
    </CardHeader>
    <CardContent>
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="faq-1">
          <AccordionTrigger>Can the school guarantee Student's Pass approval?</AccordionTrigger>
          <AccordionContent>
            <p className="text-sm">
              No. The approval and issuance of a Student's Pass (whether NEW, RENEWAL, or TRANSFER) is determined solely
              by the Immigration & Checkpoints Authority (ICA). While the school will provide comprehensive assistance
              with the application process by ensuring all documentation is correct and submitted properly through the
              SOLARPLUS system, the final decision remains beyond the control of the Private Education Institution
              (PEI).
            </p>
            <p className="text-sm mt-2">
              HFSE International School cannot influence or guarantee ICA's decision for any application type. Our role
              is to facilitate the application process, verify document authenticity, and ensure compliance with ICA
              requirements.
            </p>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="faq-2">
          <AccordionTrigger>Are ICA application fees refundable if the application is rejected?</AccordionTrigger>
          <AccordionContent>
            <p className="text-sm">
              No. Parents are kindly advised that all Student's Pass application fees paid (for NEW applications,
              RENEWALS, or TRANSFERS) are non-refundable, regardless of the outcome of the application. These fees are
              separate from school tuition fees and apply whether your application is approved or rejected.
            </p>
            <p className="text-sm mt-2">
              This is a standard policy set by the Immigration & Checkpoints Authority (ICA) and applies to all
              application types. If your application is rejected, including any appeals, the school will process refunds
              according to the Refund Policy stated in the Student Contract (covering school tuition fees only, not ICA
              fees).
            </p>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </CardContent>
  </Card>

  {/* NEW Application FAQs */}
  <Card>
    <CardHeader>
      <div className="flex items-center gap-2">
        <Globe2 className="h-5 w-5 text-blue-600" />
        <CardTitle>NEW Application Questions</CardTitle>
      </div>
    </CardHeader>
    <CardContent>
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="new-faq-1">
          <AccordionTrigger>Can I apply for the Student's Pass myself instead of through the school?</AccordionTrigger>
          <AccordionContent>
            <p className="text-sm">
              No. For NEW Student's Pass applications, HFSE requires all new international students to apply through the
              school's Student's Pass Processing Service. This service is mandatory for new applicants as it ensures:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1 text-sm">
              <li>All documents are prepared according to ICA specifications</li>
              <li>Original documents are verified for authenticity</li>
              <li>Applications are submitted correctly through the SOLARPLUS system</li>
              <li>Compliance with Private Education Institution (PEI) regulations</li>
              <li>Minimized delays and errors in the application process</li>
            </ul>
            <p className="text-sm mt-2">
              The school's experience with the ICA application process helps ensure compliance and increases the
              likelihood of a smooth application with proper documentation.
            </p>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="new-faq-2">
          <AccordionTrigger>What are the vaccination requirements for NEW applications?</AccordionTrigger>
          <AccordionContent>
            <p className="text-sm mb-2">
              Foreign-born children <strong>aged 12 years 0 day or below</strong> applying for a NEW Student's Pass must
              submit vaccination verification to the Communicable Diseases Agency (CDA) through the National
              Immunisation Registry (NIR) system.
            </p>
            <div className="text-sm mb-2">
              <strong>Mandatory vaccinations (required under Singapore Infectious Diseases Act):</strong>
              <ol className="list-decimal pl-5 mt-1 space-y-1">
                <li>Diphtheria, Tetanus, Pertussis (DTP) - primary series + boosters</li>
                <li>Measles - 1 dose (≥12 months) or 2 doses (≥15 months)</li>
              </ol>
            </div>
            <div className="text-sm mb-2">
              <strong>Strongly recommended vaccinations (per Singapore NCIS):</strong>
              <div className="grid grid-cols-2 gap-1 mt-1 text-xs">
                <span>3. Tuberculosis (BCG)</span>
                <span>4. Hepatitis B</span>
                <span>5. Polio (IPV)</span>
                <span>6. Haemophilus Influenzae Type B (Hib)</span>
                <span>7. Pneumococcal (PCV)</span>
                <span>8. Mumps, Rubella (MMR)</span>
                <span>9. Varicella (Chicken Pox)</span>
                <span>10. Influenza (seasonal)</span>
              </div>
            </div>
            <div className="text-sm">
              <strong>Process:</strong>
              <ul className="list-disc pl-5 mt-1 space-y-1">
                <li>Complete Immunisation Registration Form certified by licensed doctor</li>
                <li>Provide documentary proof of all vaccinations</li>
                <li>Submit via CDA NIR portal: https://www.nir.cda.gov.sg/</li>
              </ul>
            </div>
            <Alert className="mt-3">
              <Info className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Important: Same travel document (passport) must be used for NIR submission and ICA Student's Pass
                application. Passport must have at least 6 months validity.
              </AlertDescription>
            </Alert>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="new-faq-3">
          <AccordionTrigger>What entrance test is required for NEW applications?</AccordionTrigger>
          <AccordionContent>
            <p className="text-sm mb-2">
              All new applicants must complete an Entrance Test covering <strong>English and Mathematics</strong> as
              part of HFSE's student selection process. This test helps assess the applicant's suitability for the
              course and ensures they meet minimum entry requirements.
            </p>
            <div className="text-sm mb-2">
              <strong>Process:</strong>
              <ul className="list-disc pl-5 mt-1 space-y-1">
                <li>Conducted by Admissions Officer during application stage</li>
                <li>Tests English language proficiency and Mathematics competency</li>
                <li>Completed test filed in Student P-file</li>
                <li>Results reviewed by Management Team for final approval</li>
              </ul>
            </div>
            <div className="text-sm">
              <strong>Special circumstances:</strong>
              <ul className="list-disc pl-5 mt-1 space-y-1">
                <li>Students who fail may be offered tutorial/enrichment classes or grade adjustment</li>
                <li>Students with special needs (ADHD, ASD) assessed by Learning Support Teacher</li>
                <li>Special needs students undergo 5-day trial class to assess behavior</li>
                <li>Borderline students interviewed by Office of Academics before acceptance</li>
              </ul>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </CardContent>
  </Card>

  {/* RENEWAL Application FAQs */}
  <Card>
    <CardHeader>
      <div className="flex items-center gap-2">
        <RefreshCcw className="h-5 w-5 text-green-600" />
        <CardTitle>RENEWAL Application Questions</CardTitle>
      </div>
    </CardHeader>
    <CardContent>
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="renewal-faq-1">
          <AccordionTrigger>When should I apply for Student's Pass renewal?</AccordionTrigger>
          <AccordionContent>
            <p className="text-sm mb-2">
              Current HFSE students should apply for Student's Pass renewal <strong>at least 3 months before</strong>{" "}
              your current pass expires. The school will notify eligible students when renewal applications should
              begin.
            </p>
            <div className="text-sm mb-2">
              <strong>Renewal timeline:</strong>
              <ul className="list-disc pl-5 mt-1 space-y-1">
                <li>3 months before expiry: Begin renewal application</li>
                <li>1 week typical processing time</li>
                <li>Before current pass expires: Renewal must be approved</li>
              </ul>
            </div>
            <p className="text-sm">
              Processing time for renewals is typically faster than new applications (approximately 1 week) because you
              already have existing records in the ICA system. However, it's critical to apply early to ensure
              continuous validity.
            </p>
            <Alert variant="warning" className="mt-3">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                <strong>Important:</strong> Never let your Student's Pass expire - this can affect your legal status in
                Singapore and may complicate future renewal applications.
              </AlertDescription>
            </Alert>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="renewal-faq-2">
          <AccordionTrigger>Do I need to resubmit vaccination records for renewal?</AccordionTrigger>
          <AccordionContent>
            <p className="text-sm">
              No. Students renewing their Student's Pass at HFSE do not need to resubmit vaccination records unless
              there have been significant updates or if specifically requested by CDA or ICA.
            </p>
            <p className="text-sm mt-2">
              Your vaccination records from the initial NEW application remain valid in the National Immunisation
              Registry (NIR) system. The CDA maintains these records permanently.
            </p>
            <p className="text-sm mt-2">
              However, you must ensure all other information is current: residential address in Singapore, passport
              validity (minimum 6 months), contact details, and emergency contact information.
            </p>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </CardContent>
  </Card>

  {/* TRANSFER Application FAQs */}
  <Card>
    <CardHeader>
      <div className="flex items-center gap-2">
        <FileCheck2 className="h-5 w-5 text-purple-600" />
        <CardTitle>TRANSFER Application Questions</CardTitle>
      </div>
    </CardHeader>
    <CardContent>
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="transfer-faq-1">
          <AccordionTrigger>I have a Student's Pass from another school. Can I transfer to HFSE?</AccordionTrigger>
          <AccordionContent>
            <p className="text-sm mb-2">
              Yes. If you currently hold a valid Student's Pass from another Private Education Institution (PEI) in
              Singapore, you can apply for a transfer to HFSE.
            </p>
            <div className="text-sm mb-2">
              <strong>The transfer process requires:</strong>
              <ol className="list-decimal pl-5 mt-1 space-y-1">
                <li>Copy of your current Student's Pass (front and back)</li>
                <li>Current pass number and expiry date</li>
                <li>Transfer approval/clearance from your previous institution</li>
                <li>Proof of withdrawal from previous school</li>
                <li>Letter of Offer/acceptance from HFSE</li>
                <li>Academic records from previous school</li>
                <li>ICA approval of the transfer application</li>
              </ol>
            </div>
            <Alert variant="warning" className="mt-3">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle className="text-xs font-semibold">Important Considerations</AlertTitle>
              <AlertDescription className="text-xs">
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  <li>Transfer must be approved by ICA before enrollment at HFSE</li>
                  <li>Keep your current Student's Pass valid throughout the transfer process</li>
                  <li>Processing typically takes 2-4 weeks (longer than renewals)</li>
                  <li>Requires cooperation and clearance from previous PEI</li>
                  <li>
                    <strong>Cannot start classes at HFSE until ICA approves transfer</strong>
                  </li>
                </ul>
              </AlertDescription>
            </Alert>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="transfer-faq-2">
          <AccordionTrigger>Can I start classes at HFSE before my transfer is approved?</AccordionTrigger>
          <AccordionContent>
            <p className="text-sm mb-2">
              <strong>
                No. You MUST wait for ICA approval of your Student's Pass transfer before you can begin classes at HFSE.
              </strong>
            </p>
            <div className="text-sm mb-2">
              <strong>Reasons:</strong>
              <ul className="list-disc pl-5 mt-1 space-y-1">
                <li>Attending classes without proper pass authorization violates ICA regulations</li>
                <li>Your Student's Pass is still legally tied to your previous PEI until transfer approved</li>
                <li>Starting classes prematurely may jeopardize your immigration status</li>
                <li>HFSE cannot legally enroll you until ICA approves the transfer</li>
              </ul>
            </div>
            <div className="text-sm">
              <strong>Correct process:</strong>
              <ol className="list-decimal pl-5 mt-1 space-y-1">
                <li>Maintain enrollment at current school while transfer is processing</li>
                <li>Keep current Student's Pass valid and in good standing</li>
                <li>Wait for ICA transfer approval notification</li>
                <li>School will notify you immediately upon approval</li>
                <li>Complete HFSE enrollment formalities</li>
                <li>Begin classes only after all approvals finalized</li>
              </ol>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </CardContent>
  </Card>

  {/* DP/LTVP Exemption FAQs */}
  <Card>
    <CardHeader>
      <CardTitle>Dependent's Pass / LTVP Exemption Questions</CardTitle>
    </CardHeader>
    <CardContent>
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="dp-faq-1">
          <AccordionTrigger>I have a Dependent's Pass / LTVP. Do I need a Student's Pass?</AccordionTrigger>
          <AccordionContent>
            <p className="text-sm mb-2">
              No. If your child holds a valid Dependent's Pass (DP) or Long-Term Visit Pass (LTVP), they do not need a
              separate Student's Pass to study at HFSE.
            </p>
            <div className="text-sm mb-2">
              <strong>However, important requirements still apply:</strong>
              <ul className="list-disc pl-5 mt-1 space-y-1">
                <li>
                  The school MUST still register them with the Immigration & Checkpoints Authority (ICA) before they can
                  begin their studies
                </li>
                <li>This registration process is separate from a Student's Pass application</li>
                <li>Registration is handled by our Office of Admin and Operations</li>
                <li>No ICA application fees for DP/LTVP registration</li>
                <li>Registration confirms the school and student details with ICA</li>
              </ul>
            </div>
            <div className="text-sm">
              <strong>Process:</strong>
              <ol className="list-decimal pl-5 mt-1 space-y-1">
                <li>Inform our admissions team during enrollment that your child holds DP/LTVP</li>
                <li>Provide copy of current DP/LTVP card</li>
                <li>Provide DP/LTVP number and expiry date</li>
                <li>School will facilitate necessary ICA registration paperwork</li>
                <li>Registration must be completed before classes begin</li>
              </ol>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </CardContent>
  </Card>
</section>
```

---

## New Components Needed

### 1. Accordion Component

If not already in your component library, you'll need an Accordion component:

```tsx
import * as AccordionPrimitive from "@radix-ui/react-accordion";
// Or use your existing accordion implementation
```

---

## Content Updates Summary

### Terminology Changes Required

**Throughout the entire component, update these terms:**

| Replace                      | With                                                          |
| ---------------------------- | ------------------------------------------------------------- |
| "aged 12 years or below"     | "aged 12 years 0 day or below"                                |
| "Health Promotion Board"     | "Communicable Diseases Agency (CDA)"                          |
| "vaccination certificate"    | "Immunisation Registration Form certified by licensed doctor" |
| "Dependant's Pass"           | "Dependent's Pass (DP)"                                       |
| "Student Pass"               | "Student's Pass"                                              |
| "school fees"                | "school tuition fees"                                         |
| "processing time is 10 days" | "processing time is approximately 10 working days"            |

---

## Implementation Checklist

### Phase 1: Critical Updates (Week 1)

- [ ] Update hero section text to mention all three types
- [ ] Update disclaimer boxes to mention NEW/RENEWAL/TRANSFER
- [ ] Restructure "Who This Applies To" with three columns
- [ ] Add DP/LTVP exemption section with registration clarification
- [ ] Update vaccination age to "12 years 0 day or below"

### Phase 2: Tabbed Content (Week 2)

- [ ] Add tabs to Required Documents section (NEW/RENEWAL/TRANSFER)
- [ ] Add tabs to Processing Timeline section (NEW/RENEWAL/TRANSFER)
- [ ] Add entrance test information to NEW documents tab
- [ ] Update enrollment steps to 5 steps with type selection

### Phase 3: FAQ Expansion (Week 3)

- [ ] Add NEW application FAQs (minimum 3)
- [ ] Add RENEWAL application FAQs (minimum 2)
- [ ] Add TRANSFER application FAQs (minimum 2)
- [ ] Add DP/LTVP exemption FAQs (minimum 1)
- [ ] Update existing FAQs to mention all three types

### Phase 4: Pre-Course Counselling (Week 4)

- [ ] Expand Pre-Course Counselling section with GD4.0 content
- [ ] Add employment/internship restrictions prominently
- [ ] Add MOM work pass requirement statements
- [ ] Add monitoring/quality assurance information

### Phase 5: Testing & Polish (Week 5)

- [ ] Test all tabs functionality
- [ ] Test mobile responsive layout
- [ ] Verify all links work (CDA, ICA, NIR portals)
- [ ] Check color contrast for accessibility
- [ ] Verify all terminology updated consistently

### Phase 6: Deployment (Week 6)

- [ ] Final review with admissions team
- [ ] User acceptance testing
- [ ] Deploy to staging environment
- [ ] Final testing on staging
- [ ] Deploy to production

---

## Key Implementation Notes

### 1. State Management

Consider adding state to track selected application type for potential future features:

```tsx
const [applicationType, setApplicationType] = useState<"new" | "renewal" | "transfer">("new");
```

### 2. Responsive Design

Ensure all three-column layouts stack properly on mobile:

```tsx
className = "grid md:grid-cols-3 gap-6"; // Three columns on desktop
// Automatically stacks to single column on mobile
```

### 3. Color Coding

Use consistent color themes throughout:

- **NEW**: Blue (`blue-600`, `blue-50`, etc.)
- **RENEWAL**: Green (`green-600`, `green-50`, etc.)
- **TRANSFER**: Purple (`purple-600`, `purple-50`, etc.)

### 4. External Links

All external links should open in new tab with security:

```tsx
<a href="https://..." target="_blank" rel="noopener noreferrer">
```

### 5. Icons

Import and use appropriate Lucide icons:

```tsx
import { Globe2, RefreshCcw, FileCheck2, AlertTriangle, Info } from "lucide-react";
```

---

## Testing Scenarios

### Test Case 1: NEW Application Flow

1. User selects NEW application type
2. Sees NEW-specific documents (including vaccination, entrance test)
3. Sees 10-working-day timeline
4. Sees NEW-specific FAQs

### Test Case 2: RENEWAL Application Flow

1. User selects RENEWAL type
2. Sees simplified document requirements
3. Sees 1-week timeline
4. Sees RENEWAL-specific FAQs

### Test Case 3: TRANSFER Application Flow

1. User selects TRANSFER type
2. Sees transfer-specific documents (previous school clearance)
3. Sees 2-4 week timeline
4. Sees TRANSFER-specific FAQs

### Test Case 4: DP/LTVP Exemption

1. User sees clear "Does NOT Apply To" section
2. Understands registration still required
3. Sees DP/LTVP-specific FAQs

---

## Maintenance Notes

### Regular Updates Required

1. **Vaccination Requirements** - Check CDA website quarterly for updates
2. **Processing Times** - Verify with admissions team annually
3. **ICA Links** - Test all external links quarterly
4. **FAQ Content** - Review based on parent questions monthly

### Version Control

Track changes to this component carefully:

- Version 1.0: Initial implementation (current HTML)
- Version 2.0: Addition of three application types (this update)
- Future: Add online application form integration

---

_End of Implementation Guide_

**Next Steps:**

1. Review this guide with development team
2. Estimate implementation timeline
3. Create development tickets/tasks
4. Begin Phase 1 implementation
5. Conduct regular progress reviews
