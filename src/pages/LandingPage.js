import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Sparkles,
  Building2,
  UserPlus,
  Clock,
  CalendarCheck,
  Wallet,
  ShieldCheck,
  BellRing,
  FileText,
} from 'lucide-react';
import '../styles/tailwind.css';
import '../styles/Landing.css';

const STEPS = [
  {
    icon: Building2,
    title: 'Set up your company',
    text: 'Add your logo, payslip template, leave policy and holidays once.',
  },
  {
    icon: UserPlus,
    title: 'Add employees',
    text: 'Each person gets their own Employee ID, profile, documents and login.',
  },
  {
    icon: Clock,
    title: 'Track attendance',
    text: 'Employees check in and out; total hours are worked out automatically.',
  },
  {
    icon: CalendarCheck,
    title: 'Approve leave',
    text: 'Requests, balances and approvals in one place, with email updates.',
  },
  {
    icon: Wallet,
    title: 'Run payroll',
    text: 'Process salaries, mark them credited and generate payslips in a click.',
  },
];

const FEATURES = [
  {
    icon: ShieldCheck,
    title: 'Your company, your data',
    text: "Every company's employees, payroll and records are kept completely separate.",
  },
  {
    icon: BellRing,
    title: 'Missed check-out alerts',
    text: 'If someone forgets to check out, they and HR get an email - and HR can correct the day.',
  },
  {
    icon: FileText,
    title: 'Letters & payslips ready',
    text: 'Offer, experience and relieving letters plus payslips on your own template, as PDFs.',
  },
];

function LandingPage() {
  return (
    <div className="landing bg-background">
      <div className="landing__bg" />
      <div className="landing__blob landing__blob--one" />
      <div className="landing__blob landing__blob--two" />

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-16 px-4 py-6 sm:px-6">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-client text-sm font-bold text-client-foreground">
              HR
            </span>
            <span className="text-lg font-semibold tracking-tight text-foreground">HRMS</span>
          </div>
          <Link
            to="/login"
            className="inline-flex h-9 items-center rounded-lg bg-client px-4 text-sm font-medium text-client-foreground shadow-sm transition-colors hover:bg-client/90"
          >
            Sign in
          </Link>
        </header>

        <section className="landing__fade-up max-w-3xl">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-client/20 bg-client/5 px-3 py-1 text-xs font-medium text-client">
            <Sparkles className="size-3.5" />
            HR, attendance and payroll for growing companies
          </span>
          <h1 className="mt-5 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Run your whole team <span className="text-client">from one place.</span>
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            HRMS brings employee records, attendance, leave, payroll and HR letters together, so
            admins spend less time on spreadsheets and employees always know where they stand.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              to="/login"
              className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-client px-5 text-sm font-medium text-client-foreground shadow-sm transition-colors hover:bg-client/90"
            >
              Get started
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </section>

        <section>
          <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-muted-foreground">How it works</h2>
          <ol className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {STEPS.map(({ icon: Icon, title, text }, index) => (
              <li key={title} className="rounded-xl border border-border/80 bg-card p-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="flex size-7 items-center justify-center rounded-full bg-client text-xs font-semibold text-client-foreground">
                    {index + 1}
                  </span>
                  <Icon className="size-4 text-client" />
                </div>
                <div className="mt-3 text-sm font-semibold text-foreground">{title}</div>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="grid gap-4 pb-10 md:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-xl border border-border/80 bg-card p-5 shadow-sm">
              <span className="flex size-10 items-center justify-center rounded-xl bg-client/10 text-client">
                <Icon className="size-5" />
              </span>
              <div className="mt-4 font-semibold text-foreground">{title}</div>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{text}</p>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}

export default LandingPage;
