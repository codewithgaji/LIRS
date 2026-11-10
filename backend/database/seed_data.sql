-- LIRS sample data: 6 departments, 10 staff accounts, 52 letters
-- run it in pgAdmin's Query Tool on lirs_register, after the tables exist (alembic or schema.sql)
-- demo password for EVERY account below: Lirs2026!  (stored as a bcrypt hash)

-- RESTART IDENTITY makes ids start from 1 again, the inserts below rely on that
TRUNCATE TABLE correspondence_status_history, correspondence, users, departments RESTART IDENTITY CASCADE;

-- ---------------- Departments ----------------
INSERT INTO departments (name, code) VALUES
  ('Corporate Tax Audit', 'CTA'),
  ('Personal Income Tax', 'PIT'),
  ('Tax Payer Services', 'TPS'),
  ('Legal & Enforcement', 'LGE'),
  ('Revenue Monitoring', 'RVM'),
  ('Informal Sector', 'IFS');

-- ---------------- Staff accounts ----------------
INSERT INTO users (full_name, email, password_hash, role, department_id, station, is_active) VALUES
  ('Adebayo Ogunlesi', 'admin@lirs.gov.ng', '$2b$12$YUr5chmHIbFBGoPyt957KO9ewqHWCDbkrfWBDS1Z/CVtWxQEnMEv6', 'admin_officer', 1, 'Alausa Head Office', TRUE),
  ('Funmilayo Adeniyi', 'admin2@lirs.gov.ng', '$2b$12$YUr5chmHIbFBGoPyt957KO9ewqHWCDbkrfWBDS1Z/CVtWxQEnMEv6', 'admin_officer', 3, 'Alausa Head Office', TRUE),
  ('Chukwuemeka Obi', 'admin3@lirs.gov.ng', '$2b$12$YUr5chmHIbFBGoPyt957KO9ewqHWCDbkrfWBDS1Z/CVtWxQEnMEv6', 'admin_officer', 4, 'Ikeja Station', TRUE),
  ('Yetunde Bakare', 'manager@lirs.gov.ng', '$2b$12$YUr5chmHIbFBGoPyt957KO9ewqHWCDbkrfWBDS1Z/CVtWxQEnMEv6', 'station_manager', 1, 'Ikeja Station', TRUE),
  ('Musa Danjuma', 'manager2@lirs.gov.ng', '$2b$12$YUr5chmHIbFBGoPyt957KO9ewqHWCDbkrfWBDS1Z/CVtWxQEnMEv6', 'station_manager', 2, 'Lekki Station', TRUE),
  ('Ngozi Eze', 'manager3@lirs.gov.ng', '$2b$12$YUr5chmHIbFBGoPyt957KO9ewqHWCDbkrfWBDS1Z/CVtWxQEnMEv6', 'station_manager', 5, 'Apapa Station', TRUE),
  ('Tunde Salami', 'officer@lirs.gov.ng', '$2b$12$YUr5chmHIbFBGoPyt957KO9ewqHWCDbkrfWBDS1Z/CVtWxQEnMEv6', 'account_officer', 1, 'Ikeja Station', TRUE),
  ('Aisha Lawal', 'officer2@lirs.gov.ng', '$2b$12$YUr5chmHIbFBGoPyt957KO9ewqHWCDbkrfWBDS1Z/CVtWxQEnMEv6', 'account_officer', 2, 'Lekki Station', TRUE),
  ('Peter Okonkwo', 'officer3@lirs.gov.ng', '$2b$12$YUr5chmHIbFBGoPyt957KO9ewqHWCDbkrfWBDS1Z/CVtWxQEnMEv6', 'account_officer', 3, 'Apapa Station', TRUE),
  ('Blessing Ajayi', 'officer4@lirs.gov.ng', '$2b$12$YUr5chmHIbFBGoPyt957KO9ewqHWCDbkrfWBDS1Z/CVtWxQEnMEv6', 'account_officer', 6, 'Surulere Station', TRUE);

-- ---------------- Correspondence register ----------------
INSERT INTO correspondence
  (reference_number, direction, date_received, letter_title, company_name, contact_phone,
   priority, status, admin_officer_id, station_manager_id, account_officer_id, department_id, remarks)
VALUES
  ('LIRS/COR/2026/0001', 'incoming', '2026-01-13', 'Application for Tax Clearance Certificate', 'Flour Mills of Nigeria Plc', '+2349091783868', 'high', 'closed', 3, 4, 10, 2, 'Matter resolved and file closed.'),
  ('LIRS/COR/2026/0002', 'incoming', '2026-01-17', 'Objection to Assessment Notice', 'Lafarge Africa Plc', '+2348180628755', 'low', 'closed', 1, 6, 9, 5, 'Matter resolved and file closed.'),
  ('LIRS/COR/2026/0003', 'incoming', '2026-01-21', 'Request for Instalment Payment Plan', 'Julius Berger Nigeria Plc', '+2348019140241', 'low', 'pending', 2, 5, NULL, 5, 'Awaiting assignment at the registry desk.'),
  ('LIRS/COR/2026/0004', 'incoming', '2026-01-24', 'Submission of Annual PAYE Returns', 'Access Holdings Plc', '+2348026192512', 'low', 'closed', 1, 5, 8, 2, 'Matter resolved and file closed.'),
  ('LIRS/COR/2026/0005', 'incoming', '2026-01-30', 'Notice of Change of Registered Address', 'Nigerian Breweries Plc', '+2348042525850', 'high', 'closed', 1, 5, 9, 1, 'Matter resolved and file closed.'),
  ('LIRS/COR/2026/0006', 'incoming', '2026-02-04', 'Request for Tax Audit Reconciliation', 'Transcorp Hotels Plc', '+2348125636687', 'urgent', 'closed', 3, 6, 10, 6, 'Matter resolved and file closed.'),
  ('LIRS/COR/2026/0007', 'outgoing', '2026-02-08', 'Appeal Against Penalty and Interest Charges', 'Ecobank Nigeria Limited', '+2349079449878', 'low', 'pending', 2, 6, NULL, 2, 'Awaiting assignment at the registry desk.'),
  ('LIRS/COR/2026/0008', 'incoming', '2026-02-13', 'Application for Withholding Tax Credit Notes', 'Beta Glass Plc', '+2348061654529', 'normal', 'returned', 2, 6, 9, 1, 'Returned to registry: incomplete documentation.'),
  ('LIRS/COR/2026/0009', 'incoming', '2026-02-20', 'Clarification on Consumption Tax Liability', 'Zenith Bank Plc', '+2349013276295', 'normal', 'responded', 1, 5, 8, 3, 'Response letter dispatched to the taxpayer.'),
  ('LIRS/COR/2026/0010', 'incoming', '2026-02-23', 'Request for Refund of Overpaid PAYE', 'Guaranty Trust Bank Plc', '+2348154211079', 'normal', 'returned', 1, 4, 9, 6, 'Returned to registry: incomplete documentation.'),
  ('LIRS/COR/2026/0011', 'incoming', '2026-02-28', 'Notification of Company Restructuring', 'MTN Nigeria Communications Plc', '+2347054425691', 'normal', 'returned', 3, 6, 8, 5, 'Returned to registry: incomplete documentation.'),
  ('LIRS/COR/2026/0012', 'incoming', '2026-03-06', 'Submission of Audited Financial Statements', 'Honeywell Flour Mills Plc', '+2348086939189', 'low', 'responded', 2, 5, 7, 3, 'Response letter dispatched to the taxpayer.'),
  ('LIRS/COR/2026/0013', 'incoming', '2026-03-10', 'Request for Extension of Filing Deadline', 'Interswitch Limited', '+2349049349479', 'high', 'under_review', 3, 5, 7, 1, 'File under review; supporting documents requested.'),
  ('LIRS/COR/2026/0014', 'outgoing', '2026-03-13', 'Enquiry on Direct Assessment for Directors', 'PZ Cussons Nigeria Plc', '+2349037236122', 'high', 'pending', 3, 5, NULL, 4, 'Awaiting assignment at the registry desk.'),
  ('LIRS/COR/2026/0015', 'incoming', '2026-03-19', 'Application for Tax Identification Number Update', 'Airtel Networks Limited', '+2348075630779', 'high', 'responded', 3, 4, 7, 3, 'Response letter dispatched to the taxpayer.'),
  ('LIRS/COR/2026/0016', 'incoming', '2026-03-23', 'Response to Demand Notice', 'Coscharis Motors Limited', '+2349019876636', 'high', 'closed', 2, 6, 10, 6, 'Matter resolved and file closed.'),
  ('LIRS/COR/2026/0017', 'incoming', '2026-03-27', 'Request for Reconciliation Meeting', 'Ardova Plc', '+2348126071280', 'low', 'under_review', 3, 5, 7, 5, 'File under review; supporting documents requested.'),
  ('LIRS/COR/2026/0018', 'incoming', '2026-04-03', 'Notice of Cessation of Business Operations', 'Chi Limited', '+2349032686894', 'urgent', 'assigned', 3, 4, 10, 2, 'Assigned to the account officer for initial review.'),
  ('LIRS/COR/2026/0019', 'incoming', '2026-04-06', 'Application for Exemption on Charitable Income', 'Nestle Nigeria Plc', '+2348056839790', 'normal', 'closed', 3, 4, 8, 5, 'Matter resolved and file closed.'),
  ('LIRS/COR/2026/0020', 'incoming', '2026-04-13', 'Submission of Monthly Remittance Schedule', 'Seplat Energy Plc', '+2348113558592', 'normal', 'under_review', 1, 6, 9, 1, 'File under review; supporting documents requested.'),
  ('LIRS/COR/2026/0021', 'outgoing', '2026-04-14', 'Application for Tax Clearance Certificate', 'UAC of Nigeria Plc', '+2348186668283', 'high', 'pending', 3, 6, NULL, 4, 'Awaiting assignment at the registry desk.'),
  ('LIRS/COR/2026/0022', 'incoming', '2026-04-20', 'Objection to Assessment Notice', 'Eko Hotels Limited', '+2348045141877', 'high', 'closed', 3, 4, 7, 5, 'Matter resolved and file closed.'),
  ('LIRS/COR/2026/0023', 'incoming', '2026-04-27', 'Request for Instalment Payment Plan', 'Oando Plc', '+2349084546282', 'normal', 'closed', 1, 6, 7, 4, 'Matter resolved and file closed.'),
  ('LIRS/COR/2026/0024', 'incoming', '2026-04-29', 'Submission of Annual PAYE Returns', 'Sahara Group Limited', '+2349044118570', 'normal', 'assigned', 3, 4, 7, 5, 'Assigned to the account officer for initial review.'),
  ('LIRS/COR/2026/0025', 'incoming', '2026-05-03', 'Notice of Change of Registered Address', 'Chellarams Plc', '+2348090968438', 'normal', 'under_review', 1, 6, 9, 3, 'File under review; supporting documents requested.'),
  ('LIRS/COR/2026/0026', 'incoming', '2026-05-09', 'Request for Tax Audit Reconciliation', 'Dangote Industries Limited', '+2349065207237', 'normal', 'under_review', 1, 6, 7, 6, 'File under review; supporting documents requested.'),
  ('LIRS/COR/2026/0027', 'incoming', '2026-05-15', 'Appeal Against Penalty and Interest Charges', 'Flour Mills of Nigeria Plc', '+2347087070081', 'urgent', 'closed', 3, 5, 10, 4, 'Matter resolved and file closed.'),
  ('LIRS/COR/2026/0028', 'outgoing', '2026-05-18', 'Application for Withholding Tax Credit Notes', 'Lafarge Africa Plc', '+2348199805597', 'high', 'responded', 3, 6, 10, 1, 'Response letter dispatched to the taxpayer.'),
  ('LIRS/COR/2026/0029', 'incoming', '2026-05-25', 'Clarification on Consumption Tax Liability', 'Julius Berger Nigeria Plc', '+2347089627002', 'normal', 'closed', 2, 5, 7, 5, 'Matter resolved and file closed.'),
  ('LIRS/COR/2026/0030', 'incoming', '2026-05-30', 'Request for Refund of Overpaid PAYE', 'Access Holdings Plc', '+2348015997881', 'normal', 'assigned', 2, 6, 8, 3, 'Assigned to the account officer for initial review.'),
  ('LIRS/COR/2026/0031', 'incoming', '2026-06-01', 'Notification of Company Restructuring', 'Nigerian Breweries Plc', '+2349080242697', 'normal', 'closed', 1, 4, 7, 4, 'Matter resolved and file closed.'),
  ('LIRS/COR/2026/0032', 'incoming', '2026-06-08', 'Submission of Audited Financial Statements', 'Transcorp Hotels Plc', '+2348048601315', 'normal', 'pending', 2, 5, NULL, 6, 'Awaiting assignment at the registry desk.'),
  ('LIRS/COR/2026/0033', 'incoming', '2026-06-10', 'Request for Extension of Filing Deadline', 'Ecobank Nigeria Limited', '+2347062898142', 'high', 'assigned', 1, 6, 10, 3, 'Assigned to the account officer for initial review.'),
  ('LIRS/COR/2026/0034', 'incoming', '2026-06-17', 'Enquiry on Direct Assessment for Directors', 'Beta Glass Plc', '+2348046667726', 'low', 'under_review', 2, 6, 10, 3, 'File under review; supporting documents requested.'),
  ('LIRS/COR/2026/0035', 'outgoing', '2026-06-21', 'Application for Tax Identification Number Update', 'Zenith Bank Plc', '+2348158587635', 'normal', 'under_review', 1, 6, 8, 3, 'File under review; supporting documents requested.'),
  ('LIRS/COR/2026/0036', 'incoming', '2026-06-26', 'Response to Demand Notice', 'Guaranty Trust Bank Plc', '+2348076906163', 'normal', 'closed', 2, 5, 10, 1, 'Matter resolved and file closed.'),
  ('LIRS/COR/2026/0037', 'incoming', '2026-06-29', 'Request for Reconciliation Meeting', 'MTN Nigeria Communications Plc', '+2349070510268', 'high', 'returned', 1, 6, 9, 6, 'Returned to registry: incomplete documentation.'),
  ('LIRS/COR/2026/0038', 'incoming', '2026-07-06', 'Notice of Cessation of Business Operations', 'Honeywell Flour Mills Plc', '+2349084825452', 'high', 'under_review', 3, 5, 7, 4, 'File under review; supporting documents requested.'),
  ('LIRS/COR/2026/0039', 'incoming', '2026-07-09', 'Application for Exemption on Charitable Income', 'Interswitch Limited', '+2348038599269', 'normal', 'responded', 3, 4, 10, 3, 'Response letter dispatched to the taxpayer.'),
  ('LIRS/COR/2026/0040', 'incoming', '2026-07-13', 'Submission of Monthly Remittance Schedule', 'PZ Cussons Nigeria Plc', '+2348140141464', 'normal', 'assigned', 2, 5, 7, 1, 'Assigned to the account officer for initial review.'),
  ('LIRS/COR/2026/0041', 'incoming', '2026-07-19', 'Application for Tax Clearance Certificate', 'Airtel Networks Limited', '+2347025732497', 'high', 'responded', 1, 4, 7, 3, 'Response letter dispatched to the taxpayer.'),
  ('LIRS/COR/2026/0042', 'outgoing', '2026-07-22', 'Objection to Assessment Notice', 'Coscharis Motors Limited', '+2347059802669', 'urgent', 'responded', 2, 6, 7, 4, 'Response letter dispatched to the taxpayer.'),
  ('LIRS/COR/2026/0043', 'incoming', '2026-07-29', 'Request for Instalment Payment Plan', 'Ardova Plc', '+2348064135552', 'low', 'assigned', 3, 4, 7, 4, 'Assigned to the account officer for initial review.'),
  ('LIRS/COR/2026/0044', 'incoming', '2026-08-03', 'Submission of Annual PAYE Returns', 'Chi Limited', '+2348083383804', 'normal', 'returned', 3, 5, 10, 1, 'Returned to registry: incomplete documentation.'),
  ('LIRS/COR/2026/0045', 'incoming', '2026-08-08', 'Notice of Change of Registered Address', 'Nestle Nigeria Plc', '+2349074998943', 'normal', 'closed', 2, 4, 10, 4, 'Matter resolved and file closed.'),
  ('LIRS/COR/2026/0046', 'incoming', '2026-08-10', 'Request for Tax Audit Reconciliation', 'Seplat Energy Plc', '+2348140783117', 'high', 'under_review', 1, 4, 9, 3, 'File under review; supporting documents requested.'),
  ('LIRS/COR/2026/0047', 'incoming', '2026-08-14', 'Appeal Against Penalty and Interest Charges', 'UAC of Nigeria Plc', '+2349075383153', 'normal', 'returned', 1, 5, 9, 5, 'Returned to registry: incomplete documentation.'),
  ('LIRS/COR/2026/0048', 'incoming', '2026-08-19', 'Application for Withholding Tax Credit Notes', 'Eko Hotels Limited', '+2348070637174', 'high', 'under_review', 3, 4, 8, 2, 'File under review; supporting documents requested.'),
  ('LIRS/COR/2026/0049', 'outgoing', '2026-08-27', 'Clarification on Consumption Tax Liability', 'Oando Plc', '+2348088089785', 'normal', 'assigned', 3, 6, 9, 6, 'Assigned to the account officer for initial review.'),
  ('LIRS/COR/2026/0050', 'incoming', '2026-09-01', 'Request for Refund of Overpaid PAYE', 'Sahara Group Limited', '+2347014026313', 'high', 'assigned', 2, 6, 9, 1, 'Assigned to the account officer for initial review.'),
  ('LIRS/COR/2026/0051', 'incoming', '2026-09-05', 'Notification of Company Restructuring', 'Chellarams Plc', '+2348162632966', 'high', 'assigned', 1, 4, 8, 1, 'Assigned to the account officer for initial review.'),
  ('LIRS/COR/2026/0052', 'incoming', '2026-09-08', 'Submission of Audited Financial Statements', 'Dangote Industries Limited', '+2347018428942', 'normal', 'returned', 3, 4, 7, 5, 'Returned to registry: incomplete documentation.');

-- first history row for every letter (what the old mysql trigger used to do)
INSERT INTO correspondence_status_history (correspondence_id, old_status, new_status, changed_by, notes)
SELECT id, NULL, status, admin_officer_id, 'Letter registered' FROM correspondence;

-- ---------------- Extra audit-trail entries ----------------
-- adds a realistic second step for letters that have moved past 'assigned'.
INSERT INTO correspondence_status_history (correspondence_id, old_status, new_status, changed_by, notes)
SELECT c.id, 'assigned', c.status, c.account_officer_id, 'Progressed by the assigned account officer'
FROM correspondence c
WHERE c.status IN ('under_review', 'responded', 'closed');

