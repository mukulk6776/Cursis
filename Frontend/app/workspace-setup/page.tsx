"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  ChevronRight,
  LoaderCircle,
} from "lucide-react";
import { DataoraLogo } from "@/components/brand/DataoraLogo";
import { useAuth } from "@/components/auth/AuthProvider";
import { saveWorkspaceSetupToFirestore } from "@/lib/auth/firebase";
import { isAllowedEmailDomain, EMAIL_RESTRICTION_MESSAGE } from "@/lib/auth/email-validation";
import { saveWorkspaceCustomization, mapDepartmentsToModules } from "@/lib/workspace-customization";

type FormData = {
  companyName: string;
  businessType: string;
  fullName: string;
  workEmail: string;
  phoneNumber: string;
  teamSize: string;
  expectedUsers: string;
  mainDepartment: string;
  departmentsInvolved: string[];
  featuresWanted: string[];
  currentTools: string[];
  businessChallenges: string[];
  integrationRequirements: string[];
  timeline: string;
  planPreference: string;
  contactMethod: string;
  bestTimeToContact: string;
  additionalNotes: string;
};

const STEP_LABELS = [
  "Company",
  "Team",
  "Departments",
  "Features",
  "Challenges",
  "Requirements",
  "Contact",
  "Review",
];

const businessTypes = [
  "Retail & Storefront",
  "E-Commerce & D2C",
  "Manufacturing & Production",
  "Wholesale & B2B Distribution",
  "Technology & Software",
  "Agency & Professional Services",
  "Healthcare & Pharma",
  "Other Industry",
];

const teamSizes = ["1 - 10", "11 - 50", "51 - 200", "201 - 500", "500+ employees"];

const expectedUsersOptions = ["1 - 5 users", "6 - 20 users", "21 - 50 users", "51 - 100 users", "100+ users"];

const mainDepartments = [
  "Executive & Management",
  "Operations & Logistics",
  "Sales & Business Development",
  "Finance & Accounting",
  "IT & Systems",
  "Customer Support",
];

const departmentsList = [
  { id: "ops", label: "Operations & Logistics", desc: "Supply chain, workflows, multi-location" },
  { id: "inventory", label: "Warehouse & Inventory", desc: "Stock, SKUs, reorders, transfers" },
  { id: "pos", label: "POS & Checkout", desc: "Counter sales, barcode, receipts" },
  { id: "sales", label: "Sales & CRM", desc: "Leads, customer history, loyalty" },
  { id: "finance", label: "Billing & Finance", desc: "Invoicing, GST, payments, udhar" },
  { id: "expenses", label: "Expenses & Accounting", desc: "P&L tracking, petty cash, vouchers" },
  { id: "hr", label: "HR & Employee Mgmt", desc: "Attendance, payroll, permissions" },
  { id: "analytics", label: "Analytics & Reports", desc: "Real-time BI, sales dashboards" },
  { id: "web", label: "Custom Web Builder", desc: "Online store, customer portals" },
  { id: "ai", label: "AI & Automation", desc: "Smart forecasts, automated workflows" },
];

const featuresList = [
  { id: "pos_billing", title: "Smart POS & Billing", desc: "Fast checkout with offline support & GST compliance." },
  { id: "multi_loc_inv", title: "Multi-Location Inventory", desc: "Real-time stock tracking across stores & warehouses." },
  { id: "crm_loyalty", title: "Customer CRM & Loyalty", desc: "Track purchase history, reward points & campaigns." },
  { id: "expense_tracking", title: "Expense Tracking & Audit", desc: "Categorized expenses & financial health tools." },
  { id: "employee_mgmt", title: "Employee & Role Control", desc: "Permissions, shift logs, and staff performance." },
  { id: "ai_insights", title: "AI Insights & Assistant", desc: "Demand forecasting & automated anomaly detection." },
  { id: "web_builder", title: "Custom Web Store Builder", desc: "Launch branded storefront synced with inventory." },
  { id: "credit_ledger", title: "Udhar & Credit Ledger", desc: "Automated payment reminders and interest tracking." },
  { id: "financial_reports", title: "Automated Financial Reports", desc: "Balance sheets, P&L statements & tax exports." },
  { id: "webhooks_api", title: "Custom API & Webhooks", desc: "Developer APIs for ERP and custom tool integrations." },
];

const toolsList = [
  "Spreadsheets (Excel/Google Sheets)",
  "Tally Prime / ERP 9",
  "Zoho Books / CRM",
  "QuickBooks",
  "Custom Legacy ERP",
  "Pen & Paper / Ledger Books",
  "Shopify / WooCommerce",
  "SAP / Oracle",
];

const challengesList = [
  "Data fragmentation across multiple tools",
  "Slow POS checkout and long customer queues",
  "Inventory discrepancies between stores & online",
  "Manual, error-prone financial reporting",
  "Lack of real-time multi-location visibility",
  "High operating and software licensing costs",
  "Difficulty tracking customer credit (Udhar)",
];

const integrationsList = [
  "Payment Gateways (UPI, Razorpay, Stripe)",
  "WhatsApp & SMS Notifications",
  "Custom ERP & REST APIs",
  "E-Commerce Platforms (Shopify, Amazon)",
  "Tally & Accounting Export Sync",
  "Thermal Printers & Barcode Scanners",
];

const timelineOptions = [
  { id: "immediate", label: "Immediately", desc: "Ready to deploy within 48 hours" },
  { id: "2weeks", label: "Within 2 Weeks", desc: "Evaluating and planning rollout" },
  { id: "1month", label: "Within 1 Month", desc: "Building internal requirements" },
  { id: "exploring", label: "Just Exploring", desc: "Comparing enterprise solutions" },
];

const planOptions = [
  { id: "team_growth", label: "Team Growth", desc: "For scaling businesses with 10-50 team members" },
  { id: "enterprise_custom", label: "Enterprise Custom", desc: "Dedicated infrastructure, SLA, & custom modules" },
  { id: "cloud_dedicated", label: "Dedicated Cloud", desc: "Isolated single-tenant cloud instance" },
];

const contactMethods = ["Email", "WhatsApp", "Phone Call", "Video Meeting"];
const contactTimes = ["Morning (9 AM - 12 PM)", "Afternoon (12 PM - 4 PM)", "Evening (4 PM - 7 PM)"];

const STEPS_TOTAL = 8;

const stepVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 24 : -24,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 24 : -24,
    opacity: 0,
  }),
};

export default function WorkspaceSetupPage() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const shouldReduceMotion = useReducedMotion();

  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    companyName: "",
    businessType: "Retail & Storefront",
    fullName: currentUser?.name || "",
    workEmail: currentUser?.email || "",
    phoneNumber: "",
    teamSize: "11 - 50",
    expectedUsers: "6 - 20 users",
    mainDepartment: "Operations & Logistics",
    departmentsInvolved: ["ops", "inventory", "sales", "finance"],
    featuresWanted: ["pos_billing", "multi_loc_inv", "ai_insights"],
    currentTools: ["Spreadsheets (Excel/Google Sheets)", "Tally Prime / ERP 9"],
    businessChallenges: ["Data fragmentation across multiple tools", "Lack of real-time multi-location visibility"],
    integrationRequirements: ["Payment Gateways (UPI, Razorpay, Stripe)", "WhatsApp & SMS Notifications"],
    timeline: "immediate",
    planPreference: "enterprise_custom",
    contactMethod: "Email",
    bestTimeToContact: "Afternoon (12 PM - 4 PM)",
    additionalNotes: "",
  });

  const toggleArrayItem = (key: keyof FormData, item: string) => {
    setFormData((prev) => {
      const list = (prev[key] as string[]) || [];
      const updated = list.includes(item) ? list.filter((i) => i !== item) : [...list, item];
      return { ...prev, [key]: updated };
    });
  };

  const isStepValid = (step: number) => {
    if (step === 1) return formData.companyName.trim().length > 0;
    if (step === 2) {
      return (
        formData.fullName.trim().length > 0 &&
        formData.workEmail.trim().length > 0 &&
        isAllowedEmailDomain(formData.workEmail.trim())
      );
    }
    return true;
  };

  const handleNext = () => {
    if (!isStepValid(currentStep)) return;
    if (currentStep < STEPS_TOTAL) {
      setDirection(1);
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setDirection(-1);
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const enabledModules = mapDepartmentsToModules(formData.departmentsInvolved, formData.featuresWanted);
      saveWorkspaceCustomization({
        companyName: formData.companyName || "My Workspace",
        businessType: formData.businessType || "Technology & Software",
        fullName: formData.fullName,
        workEmail: formData.workEmail,
        teamSize: formData.teamSize,
        expectedUsers: formData.expectedUsers,
        enabledModules,
        challenges: formData.businessChallenges,
      });

      if (currentUser?.id) {
        await saveWorkspaceSetupToFirestore(currentUser.id, {
          ...formData,
          enabledModules,
        });
      }
    } catch (err) {
      console.warn("Firestore sync warning:", err);
    }
    await new Promise((resolve) => setTimeout(resolve, 850));
    setIsSubmitting(false);
    setIsCompleted(true);
  };

  const handleContinueToCursis = () => {
    router.push("/dashboard");
  };

  return (
    <div className="relative min-h-screen bg-[#f7f8fc] text-slate-900 flex flex-col font-sans overflow-x-hidden">
      {/* 1 & 2. SOFT PASTEL ANIMATED BACKGROUND BLOBS */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0" aria-hidden="true">
        {/* Soft Lavender Blob */}
        <motion.div
          animate={
            shouldReduceMotion
              ? undefined
              : {
                  x: [0, 45, -25, 0],
                  y: [0, -35, 30, 0],
                  scale: [1, 1.15, 0.95, 1],
                }
          }
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-32 -left-20 size-[32rem] rounded-full bg-indigo-200/40 blur-[100px]"
        />

        {/* Pale Blue Blob */}
        <motion.div
          animate={
            shouldReduceMotion
              ? undefined
              : {
                  x: [0, -50, 35, 0],
                  y: [0, 40, -30, 0],
                  scale: [1, 1.1, 0.9, 1],
                }
          }
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 -right-28 size-[34rem] rounded-full bg-sky-200/40 blur-[110px]"
        />

        {/* Light Pink Blob */}
        <motion.div
          animate={
            shouldReduceMotion
              ? undefined
              : {
                  x: [0, 30, -40, 0],
                  y: [0, -45, 25, 0],
                  scale: [1, 1.08, 0.95, 1],
                }
          }
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-10 left-10 size-[30rem] rounded-full bg-pink-200/40 blur-[100px]"
        />

        {/* Soft Peach Blob */}
        <motion.div
          animate={
            shouldReduceMotion
              ? undefined
              : {
                  x: [0, -30, 40, 0],
                  y: [0, 30, -40, 0],
                  scale: [1, 1.12, 0.92, 1],
                }
          }
          transition={{ duration: 24, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-20 right-1/4 size-[28rem] rounded-full bg-amber-200/35 blur-[95px]"
        />

        {/* Light Mint Center Accent Blob */}
        <motion.div
          animate={
            shouldReduceMotion
              ? undefined
              : {
                  x: [0, 20, -20, 0],
                  y: [0, -20, 20, 0],
                  scale: [1, 1.05, 0.98, 1],
                }
          }
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/3 left-1/3 size-[26rem] rounded-full bg-emerald-100/45 blur-[120px]"
        />
      </div>

      {/* HEADER BAR */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/60 bg-white/75 px-6 backdrop-blur-md sm:px-12 shadow-sm">
        <Link href="/" className="flex items-center" aria-label="Cursis home">
          <DataoraLogo size="sm" priority />
        </Link>

        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 hidden sm:inline-block">
            Step {currentStep} of {STEPS_TOTAL}
          </span>
          <div className="w-28 sm:w-36 h-2 rounded-full bg-slate-200/70 overflow-hidden">
            <motion.div
              className="h-full bg-slate-950 rounded-full"
              initial={{ width: "12.5%" }}
              animate={{ width: `${(currentStep / STEPS_TOTAL) * 100}%` }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            />
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="relative z-10 flex-1 max-w-4xl mx-auto w-full px-4 py-8 sm:py-12">
        {/* 8. FINAL SUCCESS SCREEN */}
        {isCompleted ? (
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.96, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-3xl border border-white/80 bg-white/85 p-8 sm:p-14 shadow-2xl backdrop-blur-xl text-center"
          >
            <motion.div
              initial={shouldReduceMotion ? false : { scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="mx-auto grid size-20 place-items-center rounded-3xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 shadow-inner"
            >
              <CheckCircle2 className="size-10" />
            </motion.div>

            <span className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-slate-900/5 border border-slate-900/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-slate-700">
              Requirements Received
            </span>

            <h1 className="mt-4 text-3xl sm:text-5xl font-semibold tracking-tight text-slate-950">
              You&apos;re all set.
            </h1>

            <p className="mt-4 text-base sm:text-lg leading-relaxed text-slate-600 max-w-lg mx-auto">
              Thanks for sharing your requirements. The Cursis team will review your information and contact you shortly.
            </p>

            <div className="mt-8 rounded-2xl border border-slate-200/70 bg-slate-50/80 p-6 text-left space-y-3.5 text-xs sm:text-sm text-slate-700 shadow-inner">
              <div className="flex justify-between border-b border-slate-200/60 pb-2.5">
                <span className="font-medium text-slate-500">Company Name</span>
                <span className="font-semibold text-slate-900">{formData.companyName}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-2.5">
                <span className="font-medium text-slate-500">Contact Person</span>
                <span className="font-semibold text-slate-900">{formData.fullName} ({formData.workEmail})</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-2.5">
                <span className="font-medium text-slate-500">Team & Users</span>
                <span className="font-semibold text-slate-900">{formData.teamSize} employees ({formData.expectedUsers})</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-slate-500">Selected Features</span>
                <span className="font-semibold text-slate-900">{formData.featuresWanted.length} Modules Selected</span>
              </div>
            </div>

            {/* 9. CONTINUE TO CURSIS BUTTON (NAVIGATES TO PUBLIC MARKETING HOMEPAGE) */}
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <motion.button
                whileHover={shouldReduceMotion ? undefined : { y: -2, boxShadow: "0 12px 30px -8px rgba(15, 23, 42, 0.25)" }}
                whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
                type="button"
                onClick={handleContinueToCursis}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-2xl bg-slate-950 px-9 py-4 text-base font-semibold text-white shadow-lg transition-colors hover:bg-slate-800"
              >
                Continue to Cursis
                <ArrowRight className="size-5" />
              </motion.button>
            </div>
          </motion.div>
        ) : (
          /* 3. GLASSMORPHIC FORM CONTAINER WITH ENTRANCE ANIMATION */
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-3xl border border-white/80 bg-white/85 p-6 sm:p-10 shadow-2xl backdrop-blur-xl"
          >
            {/* 5. PROGRESS INDICATOR STEPPER */}
            <div className="mb-8 overflow-x-auto pb-2 scrollbar-none">
              <div className="flex items-center gap-1.5 min-w-[620px]">
                {STEP_LABELS.map((label, index) => {
                  const stepNum = index + 1;
                  const isCurrent = currentStep === stepNum;
                  const isDone = currentStep > stepNum;

                  return (
                    <div key={label} className="flex items-center">
                      <button
                        type="button"
                        onClick={() => {
                          if (isDone) {
                            setDirection(stepNum > currentStep ? 1 : -1);
                            setCurrentStep(stepNum);
                          }
                        }}
                        disabled={!isDone && !isCurrent}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                          isCurrent
                            ? "bg-slate-950 text-white shadow-sm"
                            : isDone
                            ? "bg-slate-200/80 text-slate-800 hover:bg-slate-300/80"
                            : "bg-slate-100/60 text-slate-400 cursor-not-allowed"
                        }`}
                      >
                        {isDone ? (
                          <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0" />
                        ) : (
                          <span className="size-4 rounded-full bg-white/30 text-[10px] grid place-items-center font-bold">
                            {stepNum}
                          </span>
                        )}
                        <span>{label}</span>
                      </button>

                      {index < STEP_LABELS.length - 1 && (
                        <ChevronRight className="size-3.5 text-slate-300 mx-0.5 shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 4. MULTI-STEP TRANSITIONS (HORIZONTAL SLIDE) */}
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={currentStep}
                custom={direction}
                variants={shouldReduceMotion ? undefined : stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.28, ease: "easeInOut" }}
              >
                {/* STEP 1 — COMPANY */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <div>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-900/5 border border-slate-900/10 px-3 py-1 text-xs font-semibold text-slate-700">
                        Step 1 — Company Details
                      </span>
                      <h1 className="mt-3 text-2xl sm:text-3xl font-semibold tracking-tight text-slate-950">
                        Tell us about your organization
                      </h1>
                      <p className="mt-1.5 text-sm text-slate-500">
                        We will optimize your Cursis environment based on your business model.
                      </p>
                    </div>

                    <div className="space-y-5 pt-2">
                      <div>
                        <label htmlFor="companyName" className="block text-sm font-medium text-slate-800 mb-1.5">
                          Company / Business Name <span className="text-rose-500">*</span>
                        </label>
                        <input
                          id="companyName"
                          type="text"
                          placeholder="e.g. Acme Global Enterprises"
                          value={formData.companyName}
                          onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                          className="h-12 w-full rounded-2xl border border-slate-200 bg-white/90 px-4 text-sm font-medium outline-none focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10 transition-all shadow-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-800 mb-2">
                          Industry / Business Type
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {businessTypes.map((type) => {
                            const isSelected = formData.businessType === type;
                            return (
                              <motion.button
                                key={type}
                                whileHover={shouldReduceMotion ? undefined : { y: -2, scale: 1.01 }}
                                whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
                                type="button"
                                onClick={() => setFormData({ ...formData, businessType: type })}
                                className={`flex items-center gap-3 rounded-2xl border p-3.5 text-left text-sm font-medium transition-all ${
                                  isSelected
                                    ? "border-slate-950 bg-slate-950 text-white shadow-md"
                                    : "border-slate-200/90 bg-white/90 text-slate-700 hover:border-slate-300"
                                }`}
                              >
                                <Building2 className="size-4 shrink-0" />
                                <span>{type}</span>
                              </motion.button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2 — TEAM */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-900/5 border border-slate-900/10 px-3 py-1 text-xs font-semibold text-slate-700">
                        Step 2 — Team & Capacity
                      </span>
                      <h1 className="mt-3 text-2xl sm:text-3xl font-semibold tracking-tight text-slate-950">
                        Who will manage this workspace?
                      </h1>
                      <p className="mt-1.5 text-sm text-slate-500">
                        Enter your contact details and expected workspace usage scale.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      <div>
                        <label htmlFor="fullName" className="block text-sm font-medium text-slate-800 mb-1.5">
                          Full Name <span className="text-rose-500">*</span>
                        </label>
                        <input
                          id="fullName"
                          type="text"
                          placeholder="e.g. Sarah Jenkins"
                          value={formData.fullName}
                          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                          className="h-12 w-full rounded-2xl border border-slate-200 bg-white/90 px-4 text-sm font-medium outline-none focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10 transition-all shadow-sm"
                        />
                      </div>

                      <div>
                        <label htmlFor="workEmail" className="block text-sm font-medium text-slate-800 mb-1.5">
                          Work Email <span className="text-rose-500">*</span>
                        </label>
                        <input
                          id="workEmail"
                          type="email"
                          placeholder="you@gmail.com or you@outlook.com"
                          value={formData.workEmail}
                          onChange={(e) => setFormData({ ...formData, workEmail: e.target.value })}
                          className={`h-12 w-full rounded-2xl border bg-white/90 px-4 text-sm font-medium outline-none transition-all shadow-sm ${
                            formData.workEmail && !isAllowedEmailDomain(formData.workEmail)
                              ? "border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10"
                              : "border-slate-200 focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
                          }`}
                        />
                        {formData.workEmail && !isAllowedEmailDomain(formData.workEmail) ? (
                          <p className="mt-1 text-[11px] text-rose-600 font-medium">
                            {EMAIL_RESTRICTION_MESSAGE}
                          </p>
                        ) : (
                          <p className="mt-1 text-[11px] text-slate-400">
                            Only Gmail and Microsoft accounts are accepted.
                          </p>
                        )}
                      </div>

                      <div className="sm:col-span-2">
                        <label htmlFor="phoneNumber" className="block text-sm font-medium text-slate-800 mb-1.5">
                          Phone Number (Optional)
                        </label>
                        <input
                          id="phoneNumber"
                          type="tel"
                          placeholder="+1 (555) 000-0000"
                          value={formData.phoneNumber}
                          onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                          className="h-12 w-full rounded-2xl border border-slate-200 bg-white/90 px-4 text-sm font-medium outline-none focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10 transition-all shadow-sm"
                        />
                      </div>
                    </div>

                    <div className="pt-3 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-800 mb-2">
                          Company Team Size
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {teamSizes.map((size) => (
                            <button
                              key={size}
                              type="button"
                              onClick={() => setFormData({ ...formData, teamSize: size })}
                              className={`rounded-xl border px-4 py-2.5 text-xs font-semibold transition-all ${
                                formData.teamSize === size
                                  ? "border-slate-950 bg-slate-950 text-white shadow-sm"
                                  : "border-slate-200 bg-white/90 text-slate-700 hover:border-slate-300"
                              }`}
                            >
                              {size}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-800 mb-2">
                          Expected Number of Cursis Users
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {expectedUsersOptions.map((opt) => (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => setFormData({ ...formData, expectedUsers: opt })}
                              className={`rounded-xl border px-4 py-2.5 text-xs font-semibold transition-all ${
                                formData.expectedUsers === opt
                                  ? "border-slate-950 bg-slate-950 text-white shadow-sm"
                                  : "border-slate-200 bg-white/90 text-slate-700 hover:border-slate-300"
                              }`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 3 — DEPARTMENTS */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <div>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-900/5 border border-slate-900/10 px-3 py-1 text-xs font-semibold text-slate-700">
                        Step 3 — Departments
                      </span>
                      <h1 className="mt-3 text-2xl sm:text-3xl font-semibold tracking-tight text-slate-950">
                        Which departments will use Cursis?
                      </h1>
                      <p className="mt-1.5 text-sm text-slate-500">
                        Select your primary lead department and all participating teams.
                      </p>
                    </div>

                    <div className="space-y-5 pt-2">
                      <div>
                        <label className="block text-sm font-medium text-slate-800 mb-2">
                          Main Department
                        </label>
                        <select
                          value={formData.mainDepartment}
                          onChange={(e) => setFormData({ ...formData, mainDepartment: e.target.value })}
                          className="h-12 w-full rounded-2xl border border-slate-200 bg-white/90 px-4 text-sm font-medium outline-none focus:border-slate-950 shadow-sm"
                        >
                          {mainDepartments.map((dept) => (
                            <option key={dept} value={dept}>
                              {dept}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-800 mb-2">
                          Departments Involved (Multi-select)
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {departmentsList.map((dept) => {
                            const isSelected = formData.departmentsInvolved.includes(dept.id);
                            return (
                              <motion.button
                                key={dept.id}
                                whileHover={shouldReduceMotion ? undefined : { y: -2, scale: 1.01 }}
                                whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
                                type="button"
                                onClick={() => toggleArrayItem("departmentsInvolved", dept.id)}
                                className={`flex flex-col text-left p-4 rounded-2xl border transition-all ${
                                  isSelected
                                    ? "border-slate-950 bg-slate-950 text-white shadow-md"
                                    : "border-slate-200/90 bg-white/90 text-slate-800 hover:border-slate-300"
                                }`}
                              >
                                <span className="font-semibold text-sm">{dept.label}</span>
                                <span className={`text-xs mt-1 ${isSelected ? "text-slate-300" : "text-slate-500"}`}>
                                  {dept.desc}
                                </span>
                              </motion.button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 4 — FEATURES (6. FEATURE SELECTION ANIMATION) */}
                {currentStep === 4 && (
                  <div className="space-y-6">
                    <div>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-900/5 border border-slate-900/10 px-3 py-1 text-xs font-semibold text-slate-700">
                        Step 4 — Cursis Features
                      </span>
                      <h1 className="mt-3 text-2xl sm:text-3xl font-semibold tracking-tight text-slate-950">
                        Select features you want to enable
                      </h1>
                      <p className="mt-1.5 text-sm text-slate-500">
                        Click cards to toggle workspace modules.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                      {featuresList.map((feat) => {
                        const isSelected = formData.featuresWanted.includes(feat.id);
                        return (
                          <motion.button
                            key={feat.id}
                            whileHover={shouldReduceMotion ? undefined : { y: -2, scale: 1.02 }}
                            whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
                            type="button"
                            onClick={() => toggleArrayItem("featuresWanted", feat.id)}
                            className={`flex flex-col text-left p-4.5 rounded-2xl border transition-all ${
                              isSelected
                                ? "border-slate-950 bg-slate-950 text-white shadow-lg ring-1 ring-slate-950/20"
                                : "border-slate-200/90 bg-white/90 text-slate-900 hover:border-slate-300 hover:bg-slate-50/80"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-sm">{feat.title}</span>
                              <motion.div
                                animate={{ scale: isSelected ? 1 : 0.9 }}
                                className={`size-5 rounded-full border grid place-items-center ${
                                  isSelected ? "border-white bg-white text-slate-950" : "border-slate-300"
                                }`}
                              >
                                {isSelected && <CheckCircle2 className="size-4 text-slate-950" />}
                              </motion.div>
                            </div>
                            <span
                              className={`text-xs mt-2 leading-relaxed ${
                                isSelected ? "text-slate-300" : "text-slate-500"
                              }`}
                            >
                              {feat.desc}
                            </span>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* STEP 5 — CHALLENGES */}
                {currentStep === 5 && (
                  <div className="space-y-6">
                    <div>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-900/5 border border-slate-900/10 px-3 py-1 text-xs font-semibold text-slate-700">
                        Step 5 — Tools & Challenges
                      </span>
                      <h1 className="mt-3 text-2xl sm:text-3xl font-semibold tracking-tight text-slate-950">
                        Current tools and business challenges
                      </h1>
                      <p className="mt-1.5 text-sm text-slate-500">
                        Help us tailor your migration and workflow setup.
                      </p>
                    </div>

                    <div className="space-y-6 pt-2">
                      <div>
                        <label className="block text-sm font-medium text-slate-800 mb-2">
                          Current Tools Used
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {toolsList.map((tool) => {
                            const isSelected = formData.currentTools.includes(tool);
                            return (
                              <button
                                key={tool}
                                type="button"
                                onClick={() => toggleArrayItem("currentTools", tool)}
                                className={`rounded-xl border px-3.5 py-2 text-xs font-semibold transition-all ${
                                  isSelected
                                    ? "border-slate-950 bg-slate-950 text-white shadow-sm"
                                    : "border-slate-200 bg-white/90 text-slate-700 hover:border-slate-300"
                                }`}
                              >
                                {tool}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-800 mb-2">
                          Biggest Business Challenges
                        </label>
                        <div className="space-y-2">
                          {challengesList.map((challenge) => {
                            const isSelected = formData.businessChallenges.includes(challenge);
                            return (
                              <motion.button
                                key={challenge}
                                whileHover={shouldReduceMotion ? undefined : { y: -1, scale: 1.005 }}
                                whileTap={shouldReduceMotion ? undefined : { scale: 0.99 }}
                                type="button"
                                onClick={() => toggleArrayItem("businessChallenges", challenge)}
                                className={`w-full flex items-center justify-between text-left p-3.5 rounded-xl border text-xs sm:text-sm font-medium transition-all ${
                                  isSelected
                                    ? "border-slate-950 bg-slate-950 text-white shadow-sm"
                                    : "border-slate-200 bg-white/90 text-slate-800 hover:border-slate-300"
                                }`}
                              >
                                <span>{challenge}</span>
                                {isSelected && <CheckCircle2 className="size-4 shrink-0 ml-2" />}
                              </motion.button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 6 — REQUIREMENTS & INTEGRATIONS */}
                {currentStep === 6 && (
                  <div className="space-y-6">
                    <div>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-900/5 border border-slate-900/10 px-3 py-1 text-xs font-semibold text-slate-700">
                        Step 6 — Requirements & Integrations
                      </span>
                      <h1 className="mt-3 text-2xl sm:text-3xl font-semibold tracking-tight text-slate-950">
                        Integrations and timeline
                      </h1>
                      <p className="mt-1.5 text-sm text-slate-500">
                        Specify required third-party connections and rollout goals.
                      </p>
                    </div>

                    <div className="space-y-6 pt-2">
                      <div>
                        <label className="block text-sm font-medium text-slate-800 mb-2">
                          Integration Requirements
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {integrationsList.map((integ) => {
                            const isSelected = formData.integrationRequirements.includes(integ);
                            return (
                              <button
                                key={integ}
                                type="button"
                                onClick={() => toggleArrayItem("integrationRequirements", integ)}
                                className={`flex items-center justify-between text-left p-3.5 rounded-xl border text-xs sm:text-sm font-medium transition-all ${
                                  isSelected
                                    ? "border-slate-950 bg-slate-950 text-white shadow-sm"
                                    : "border-slate-200 bg-white/90 text-slate-800 hover:border-slate-300"
                                }`}
                              >
                                <span>{integ}</span>
                                {isSelected && <CheckCircle2 className="size-4 shrink-0 ml-2" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-800 mb-2">
                          Getting-Started Timeline
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {timelineOptions.map((t) => (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => setFormData({ ...formData, timeline: t.id })}
                              className={`flex flex-col text-left p-3.5 rounded-xl border transition-all ${
                                formData.timeline === t.id
                                  ? "border-slate-950 bg-slate-950 text-white shadow-sm"
                                  : "border-slate-200 bg-white/90 text-slate-800 hover:border-slate-300"
                              }`}
                            >
                              <span className="font-semibold text-sm">{t.label}</span>
                              <span
                                className={`text-xs mt-0.5 ${
                                  formData.timeline === t.id ? "text-slate-300" : "text-slate-500"
                                }`}
                              >
                                {t.desc}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-800 mb-2">
                          Team / Enterprise Plan
                        </label>
                        <div className="space-y-2">
                          {planOptions.map((plan) => (
                            <button
                              key={plan.id}
                              type="button"
                              onClick={() => setFormData({ ...formData, planPreference: plan.id })}
                              className={`w-full flex flex-col text-left p-3.5 rounded-xl border transition-all ${
                                formData.planPreference === plan.id
                                  ? "border-slate-950 bg-slate-950 text-white shadow-sm"
                                  : "border-slate-200 bg-white/90 text-slate-800 hover:border-slate-300"
                              }`}
                            >
                              <span className="font-semibold text-sm">{plan.label}</span>
                              <span
                                className={`text-xs mt-0.5 ${
                                  formData.planPreference === plan.id ? "text-slate-300" : "text-slate-500"
                                }`}
                              >
                                {plan.desc}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 7 — CONTACT PREFERENCES */}
                {currentStep === 7 && (
                  <div className="space-y-6">
                    <div>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-900/5 border border-slate-900/10 px-3 py-1 text-xs font-semibold text-slate-700">
                        Step 7 — Contact Preferences
                      </span>
                      <h1 className="mt-3 text-2xl sm:text-3xl font-semibold tracking-tight text-slate-950">
                        How should our team contact you?
                      </h1>
                      <p className="mt-1.5 text-sm text-slate-500">
                        Set your preferred channel and time for onboarding consultation.
                      </p>
                    </div>

                    <div className="space-y-5 pt-2">
                      <div>
                        <label className="block text-sm font-medium text-slate-800 mb-2">
                          Preferred Contact Method
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                          {contactMethods.map((method) => (
                            <button
                              key={method}
                              type="button"
                              onClick={() => setFormData({ ...formData, contactMethod: method })}
                              className={`rounded-xl border py-3 text-xs font-semibold text-center transition-all ${
                                formData.contactMethod === method
                                  ? "border-slate-950 bg-slate-950 text-white shadow-sm"
                                  : "border-slate-200 bg-white/90 text-slate-800 hover:border-slate-300"
                              }`}
                            >
                              {method}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-800 mb-2">
                          Best Time to Contact
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          {contactTimes.map((time) => (
                            <button
                              key={time}
                              type="button"
                              onClick={() => setFormData({ ...formData, bestTimeToContact: time })}
                              className={`rounded-xl border p-3 text-xs font-semibold text-center transition-all ${
                                formData.bestTimeToContact === time
                                  ? "border-slate-950 bg-slate-950 text-white shadow-sm"
                                  : "border-slate-200 bg-white/90 text-slate-800 hover:border-slate-300"
                              }`}
                            >
                              {time}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label htmlFor="additionalNotes" className="block text-sm font-medium text-slate-800 mb-1.5">
                          Additional Requirements
                        </label>
                        <textarea
                          id="additionalNotes"
                          rows={4}
                          placeholder="Mention any custom workflows, compliance needs, or special hardware setups..."
                          value={formData.additionalNotes}
                          onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })}
                          className="w-full rounded-2xl border border-slate-200 bg-white/90 p-4 text-sm font-medium outline-none focus:border-slate-950 transition-all shadow-sm"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 8 — REVIEW & SUBMIT */}
                {currentStep === 8 && (
                  <div className="space-y-6">
                    <div>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-900/5 border border-slate-900/10 px-3 py-1 text-xs font-semibold text-slate-700">
                        Step 8 — Review & Submit
                      </span>
                      <h1 className="mt-3 text-2xl sm:text-3xl font-semibold tracking-tight text-slate-950">
                        Review your Cursis workspace details
                      </h1>
                      <p className="mt-1.5 text-sm text-slate-500">
                        Confirm your information before sending it to our enterprise team.
                      </p>
                    </div>

                    <div className="space-y-4 pt-2">
                      <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 space-y-4 text-sm shadow-sm">
                        <div className="flex justify-between items-start border-b border-slate-200/80 pb-3">
                          <div>
                            <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
                              Company & Team
                            </span>
                            <h3 className="text-base font-semibold text-slate-950 mt-0.5">
                              {formData.companyName || "Unnamed Business"}
                            </h3>
                            <p className="text-xs text-slate-600 mt-0.5">
                              {formData.businessType} • {formData.teamSize} ({formData.expectedUsers})
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setDirection(-1);
                              setCurrentStep(1);
                            }}
                            className="text-xs font-semibold text-slate-700 hover:underline"
                          >
                            Edit
                          </button>
                        </div>

                        <div className="flex justify-between items-start border-b border-slate-200/80 pb-3">
                          <div>
                            <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
                              Contact Info
                            </span>
                            <p className="font-medium text-slate-950 mt-0.5">
                              {formData.fullName} ({formData.workEmail})
                            </p>
                            <p className="text-xs text-slate-600 mt-0.5">
                              Phone: {formData.phoneNumber || "N/A"} • Preferred: {formData.contactMethod} ({formData.bestTimeToContact})
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setDirection(-1);
                              setCurrentStep(2);
                            }}
                            className="text-xs font-semibold text-slate-700 hover:underline"
                          >
                            Edit
                          </button>
                        </div>

                        <div className="flex justify-between items-start border-b border-slate-200/80 pb-3">
                          <div>
                            <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
                              Selected Features ({formData.featuresWanted.length})
                            </span>
                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                              {formData.featuresWanted.map((fid) => {
                                const item = featuresList.find((f) => f.id === fid);
                                return (
                                  <span
                                    key={fid}
                                    className="rounded-lg bg-slate-100 border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-800"
                                  >
                                    {item?.title || fid}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setDirection(-1);
                              setCurrentStep(4);
                            }}
                            className="text-xs font-semibold text-slate-700 hover:underline"
                          >
                            Edit
                          </button>
                        </div>

                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
                              Integrations & Deployment
                            </span>
                            <p className="text-xs text-slate-700 mt-1 font-medium">
                              Plan: {formData.planPreference} • Timeline: {formData.timeline}
                            </p>
                            <p className="text-xs text-slate-600 mt-0.5">
                              Integrations: {formData.integrationRequirements.join(", ") || "None"}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setDirection(-1);
                              setCurrentStep(6);
                            }}
                            className="text-xs font-semibold text-slate-700 hover:underline"
                          >
                            Edit
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* 7. BUTTON ANIMATIONS & NAVIGATION CONTROLS */}
            <div className="mt-10 flex items-center justify-between border-t border-slate-200/80 pt-6">
              <motion.button
                whileHover={shouldReduceMotion || currentStep === 1 ? undefined : { y: -2 }}
                whileTap={shouldReduceMotion || currentStep === 1 ? undefined : { scale: 0.98 }}
                type="button"
                onClick={handleBack}
                disabled={currentStep === 1}
                className={`inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold transition-all ${
                  currentStep === 1 ? "opacity-0 pointer-events-none" : "text-slate-700 hover:bg-slate-100/80"
                }`}
              >
                <ArrowLeft className="size-4" />
                Back
              </motion.button>

              {currentStep < STEPS_TOTAL ? (
                <motion.button
                  whileHover={
                    shouldReduceMotion || !isStepValid(currentStep)
                      ? undefined
                      : { y: -2, boxShadow: "0 10px 25px -5px rgba(15, 23, 42, 0.2)" }
                  }
                  whileTap={shouldReduceMotion || !isStepValid(currentStep) ? undefined : { scale: 0.98 }}
                  type="button"
                  onClick={handleNext}
                  disabled={!isStepValid(currentStep)}
                  className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-7 py-3 text-sm font-semibold text-white shadow-md transition-colors hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next Step
                  <ArrowRight className="size-4" />
                </motion.button>
              ) : (
                <motion.button
                  whileHover={
                    shouldReduceMotion || isSubmitting
                      ? undefined
                      : { y: -2, boxShadow: "0 12px 30px -8px rgba(15, 23, 42, 0.3)" }
                  }
                  whileTap={shouldReduceMotion || isSubmitting ? undefined : { scale: 0.98 }}
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2.5 rounded-2xl bg-slate-950 px-9 py-3.5 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-slate-800 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <LoaderCircle className="size-4 animate-spin" />
                      Submitting Requirements...
                    </>
                  ) : (
                    <>
                      Submit Workspace Setup
                      <CheckCircle2 className="size-4" />
                    </>
                  )}
                </motion.button>
              )}
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
