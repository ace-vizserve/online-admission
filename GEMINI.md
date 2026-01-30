# Front-End Tasks for Enrolment Portal - Developer (Ace)

## Priority 1: Student Pass Type Selection Enhancement

### Pass Type Selection UI/UX

- [ ] Review current pass type selection flow in enrolment portal
- [ ] Update pass type selection component to clearly differentiate between:
  - Student's Pass (STP)
  - Dependant's Pass (DP)
  - Long Term Visit Pass (LTVP)
  - Local students (no pass required)
- [ ] Add clear visual indicators/icons for each pass type
- [ ] Implement conditional form field rendering based on selected pass type
- [ ] Add validation to ensure pass type is selected before proceeding

### ICA Information Integration

- [ ] Add informational tooltips/modals explaining each pass type
- [ ] Include link to ICA approved institutions page: https://www.ica.gov.sg/
- [ ] Display pass requirements specific to selected type

## Priority 2: Photo Guidelines Integration

### Photo Upload Interface

- [ ] Update photo upload component with ICA photo guidelines
- [ ] Add reference link to ICA Photo Guidelines: https://www.ica.gov.sg/photo-guidelines
- [ ] Implement client-side photo validation:
  - Check image dimensions (refer to ICA guidelines)
  - Check file size limits
  - Check file format (JPEG/PNG)
  - Check background color requirements
  - Basic face detection if possible
- [ ] Add visual examples of acceptable vs rejected photos
- [ ] Display real-time feedback during photo upload
- [ ] Show preview with guidelines overlay before final submission
- [ ] Add error messages with specific guidance when photo doesn't meet requirements

### Photo Guidelines Display

- [ ] Create expandable section showing ICA photo requirements:
  - Dimensions and size
  - Background requirements
  - Facial expression requirements
  - Clothing/accessories restrictions
  - Image quality standards
- [ ] Make guidelines easily accessible during upload process

## Priority 3: Pre-Counselling Acknowledgement Form Updates

### Form Content Updates

- [ ] Review current Pre-Course Counselling Acknowledgement Form structure
- [ ] Add new mandatory acknowledgement sections:
  - Student's Pass approval disclaimer (ICA sole authority)
  - School assistance statement
  - Non-refundable application fees notice
- [ ] Update form text based on Eduvalue's confirmed statements:

"The approval and issuance of a Student's Pass is determined solely by the
Immigration & Checkpoints Authority (ICA). While the school will provide
assistance with the application process, the final decision is beyond the
control of the Private Education Institution (PEI)."

"Parents are kindly advised that all Student's Pass application fees paid
are non-refundable, regardless of the outcome of the application."

### Form UI/UX Enhancements

- [ ] Design clear checkbox acknowledgement elements for each statement
- [ ] Implement required field validation for all acknowledgements
- [ ] Add visual emphasis (bold/highlighted) for critical statements
- [ ] Ensure form is mobile-responsive
- [ ] Add scroll-to-accept functionality if form is long
- [ ] Implement e-signature capture if required
- [ ] Add confirmation modal before final submission

### Form Accessibility

- [ ] Ensure all text meets WCAG contrast requirements
- [ ] Add proper ARIA labels for screen readers
- [ ] Ensure keyboard navigation works properly
- [ ] Test with accessibility tools

## Priority 4: Required Documents Section

### Document Upload Interface

- [ ] Create/update document checklist based on ICA requirements
- [ ] Link to ICA document requirements: https://www.ica.gov.sg/documents/approved-pei
- [ ] Implement multi-document upload component
- [ ] Add document type dropdown for each upload:
- Passport/Travel document (min 6 months validity)
- Birth certificate
- Academic transcripts
- Medical examination report
- Immunisation records
- Recent photograph (ICA compliant)
- Parent/Guardian identification
- Financial documents (if applicable)
- Other supporting documents

### Document Validation

- [ ] Add client-side file type validation (PDF, JPG, PNG)
- [ ] Add file size limits per document
- [ ] Check for required documents before submission
- [ ] Display upload progress for each document
- [ ] Show thumbnail preview after successful upload
- [ ] Allow document deletion/replacement before final submission

### Document Status Display

- [ ] Show clear status indicators:
- Not uploaded
- Uploading
- Uploaded successfully
- Failed (with error message)
- Pending verification
- Verified
- [ ] Add admin-facing verification interface (if within scope)

## Priority 5: Vaccination Requirements Section

### Immunisation Form Integration

- [ ] Review Immunisation Registration Form structure (from attached PDF)
- [ ] Create digital form mirroring ForeignChild verification requirements
- [ ] Add link to verification system: https://www.foreign-child-verification.gov.sg (or actual URL)
- [ ] Implement form sections:
- Section I: Personal Information
  - Name of applicant
  - Travel document number
  - Date of birth
  - Country of birth
  - Sex
- Section II: Immunisation Information
  - Mandatory vaccinations (Diphtheria, Tetanus, Pertussis, Measles)
  - Recommended vaccinations (TB, Hepatitis B, Polio, HIB, Pneumococcal, Mumps, Rubella, Varicella, HPV, Influenza)
- [ ] Add date pickers for immunisation dates
- [ ] Implement dose tracking (Dose 1, 2, 3, Booster 1, 2, etc.)
- [ ] Add vaccine code selection dropdown (from Appendix A)

### Immunisation Validation

- [ ] Validate minimum age requirements per vaccine
- [ ] Validate minimum intervals between doses
- [ ] Check for mandatory vs recommended vaccination completion
- [ ] Add warnings if vaccination schedule appears incomplete
- [ ] Allow upload of vaccination certificate/proof

### Immunisation Guidelines Display

- [ ] Add informational tooltips explaining each vaccine
- [ ] Display age requirements and intervals
- [ ] Show vaccination schedule reference
- [ ] Link to CDA resources and Singapore NCIS

## Priority 6: Student's Pass Application Information

### Application Process Display

- [ ] Add dedicated section explaining STP application process
- [ ] Display estimated processing time (10 working days)
- [ ] Show required documents checklist specific to STP
- [ ] Link to SOLAR+ system: https://www.solar.ica.gov.sg (or actual URL)
- [ ] Add timeline visualization showing process stages

### Important Notices Section

- [ ] Create prominent notice area with key information:
- ICA is sole authority for pass approval
- School provides assistance only
- All fees are non-refundable
- Documents must be submitted upon registration
- Processing time is ~10 working days with complete documents
- Employment restrictions for Student's Pass holders
- MOM work pass requirements for internships
- [ ] Make notices collapsible but expanded by default
- [ ] Use appropriate visual styling (info boxes, warning colors)

## Priority 7: Form Flow and Progress Tracking

### Multi-Step Form Implementation

- [ ] Design step-by-step progress indicator
- [ ] Implement form state management (consider React Context or Redux)
- [ ] Add form persistence (save draft functionality)
- [ ] Show completion percentage
- [ ] Allow navigation between steps with validation
- [ ] Add "Save and Continue Later" option
- [ ] Implement session timeout warning

### Form Navigation

- [ ] Add "Previous" and "Next" buttons
- [ ] Implement "Save Draft" button
- [ ] Add "Submit" button with confirmation modal
- [ ] Show step validation status (complete/incomplete/error)
- [ ] Smooth scroll to validation errors

## Priority 8: Data Validation and Error Handling

### Client-Side Validation

- [ ] Implement real-time field validation
- [ ] Add comprehensive error messages
- [ ] Validate email format
- [ ] Validate phone number format (international support)
- [ ] Validate date formats and logical dates (e.g., birth date in past)
- [ ] Check passport expiry (must be 6+ months valid)
- [ ] Validate required field completion
- [ ] Check for duplicate submissions

### Error Display

- [ ] Show inline error messages near fields
- [ ] Display summary of errors at top of form
- [ ] Use appropriate color coding (red for errors)
- [ ] Add icons for visual clarity
- [ ] Ensure errors are accessible (ARIA announcements)

## Priority 9: Integration and Data Flow

### API Integration

- [ ] Connect form submission to backend API
- [ ] Implement proper request/response handling
- [ ] Add loading states during submission
- [ ] Handle API errors gracefully
- [ ] Implement retry logic for failed submissions
- [ ] Send confirmation email after successful submission

### Data Completeness

- [ ] Ensure all required fields are captured for internal reports
- [ ] Validate data completeness before final submission
- [ ] Add data review step before submission
- [ ] Implement data export format for admin reports (class lists, etc.)
- [ ] Ensure proper data mapping for Student Information System

## Priority 10: User Experience Enhancements

### Responsive Design

- [ ] Test on mobile devices (iOS/Android)
- [ ] Test on tablets
- [ ] Test on various desktop screen sizes
- [ ] Ensure touch-friendly elements on mobile
- [ ] Optimize load times for slower connections

### Help and Guidance

- [ ] Add contextual help text throughout form
- [ ] Implement FAQ accordion section
- [ ] Add chat support widget (if available)
- [ ] Create help tooltip system
- [ ] Add "Contact Us" button with support info

### Confirmation and Communication

- [ ] Design submission success page
- [ ] Show submission reference number
- [ ] Display next steps clearly
- [ ] Send confirmation email with details
- [ ] Provide PDF download of submitted form
- [ ] Show expected timeline for response

## Priority 11: Testing and Quality Assurance

### Functional Testing

- [ ] Test all form fields and validations
- [ ] Test file upload functionality
- [ ] Test form submission flow end-to-end
- [ ] Test with valid and invalid data
- [ ] Test error handling scenarios
- [ ] Test form persistence/draft saving
- [ ] Cross-browser testing (Chrome, Firefox, Safari, Edge)

### User Acceptance Testing

- [ ] Prepare test scenarios for admissions team
- [ ] Conduct UAT session
- [ ] Document feedback and issues
- [ ] Fix identified issues
- [ ] Re-test after fixes

## Priority 12: Documentation

### Technical Documentation

- [ ] Document component structure
- [ ] Document API endpoints and payloads
- [ ] Document validation rules
- [ ] Create setup/deployment guide
- [ ] Document environment variables and configuration

### User Documentation

- [ ] Create user guide for parents
- [ ] Create admin guide for admissions officers
- [ ] Document common issues and troubleshooting
- [ ] Create video walkthrough (optional)

## Priority 13: Deployment and Monitoring

### Deployment Tasks

- [ ] Deploy to staging environment
- [ ] Conduct staging testing
- [ ] Fix any staging-specific issues
- [ ] Deploy to production
- [ ] Verify production deployment
- [ ] Monitor for errors post-deployment

### Monitoring

- [ ] Set up error logging
- [ ] Monitor form submission success rate
- [ ] Track form abandonment rate
- [ ] Monitor page load times
- [ ] Set up alerts for critical errors

## Related Resources to Review

- ICA SOLAR+ System: https://www.solar.ica.gov.sg
- ICA Document Requirements: https://www.ica.gov.sg/documents/approved-pei
- ICA Photo Guidelines: https://www.ica.gov.sg/photo-guidelines
- Foreign Child Vaccination Verification: https://www.foreign-child-verification.gov.sg
- CDA Immunisation Schedule: https://www.nir.cda.gov.sg/nirp/eservices/immunisationSchedule
- Attached: C4.1.1_02-Pre-Course-Counselling-Student-Selection-and-Admissions.docx
- Attached: ImmunisationFormsForForeignChild.pdf

## Notes

- Coordinate with Ms. Wynne on Student's Pass application in-charge person designation
- Prepare refresher session materials for system usage and data completion
- Clarify timing of student contract issuance (current practice vs post-STP approval)
- All changes should support accurate internal reporting (class lists, etc.)
