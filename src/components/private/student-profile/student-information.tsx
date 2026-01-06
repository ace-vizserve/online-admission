"use client";

import { Label } from "@/components/ui/label";
import { Student } from "@/types";
import { differenceInYears, formatDate } from "date-fns";
import {
  BadgeInfo,
  BookOpenCheck,
  Cake,
  CalendarDays,
  Globe,
  HeartHandshake,
  Languages,
  LucideMapPinHouse,
  MapPin,
  Phone,
  PhoneCall,
  Smile,
  User,
  Users,
  VenetianMask,
} from "lucide-react";
import React from "react";

function StudentInformation({ label, studentInformation }: { label: string; studentInformation: Student }) {
  const {
    nationality,
    firstName,
    lastName,
    middleName,
    birthDay,
    contactPerson,
    contactPersonNumber,
    gender,
    homeAddress,
    homePhone,
    livingWithWhom,
    nric,
    parentMaritalStatus,
    postalCode,
    preferredName,
    primaryLanguage,
    religion,
    religionOther,
  } = studentInformation;

  const age = differenceInYears(new Date(), new Date(birthDay));
  const maskedNric = nric ? nric.slice(0, 3) + "****" + nric.slice(-2) : "N/A";

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="space-y-1">
        <h1 className="font-black text-2xl md:text-4xl text-slate-900 tracking-tight">{label}</h1>
        <p className="text-sm font-medium text-slate-500">
          Review the student's personal and household details. All fields are read-only.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-12">
        {/* Section: Personal Identity */}
        <section className="space-y-4">
          <SectionHeader title="Personal Identity" icon={<User className="size-5 text-indigo-500" />} />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6 bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100">
            <DataField label="First Name" value={firstName} icon={<User />} />
            <DataField label="Middle Name" value={middleName || undefined} icon={<User />} />
            <DataField label="Last Name" value={lastName} icon={<User />} />
            <DataField label="Preferred Name" value={preferredName} icon={<Smile />} />
            <DataField label="Date of Birth" value={formatDate(new Date(birthDay), "dd/MM/yyyy")} icon={<Cake />} />
            <DataField label="Age" value={`${age} Years Old`} icon={<CalendarDays />} />
          </div>
        </section>

        {/* Section: Contact & Household */}
        <section className="space-y-4">
          <SectionHeader title="Contact & Household" icon={<Phone className="size-5 text-indigo-500" />} />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6 bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100">
            <DataField label="Primary Contact" value={contactPerson} icon={<Phone />} />
            <DataField label="Emergency Number" value={contactPersonNumber} icon={<PhoneCall />} />
            <DataField label="Home Phone" value={homePhone || "Not Provided"} icon={<Phone />} />
            <DataField label="Residential Address" value={homeAddress} icon={<LucideMapPinHouse />} />
            <DataField label="Postal Code" value={postalCode} icon={<MapPin />} />
            <DataField label="Living Arrangement" value={`Lives with ${livingWithWhom}`} icon={<Users />} />
          </div>
        </section>

        {/* Section: Legal & Diversity */}
        <section className="space-y-4">
          <SectionHeader title="Legal & Diversity" icon={<BadgeInfo className="size-5 text-indigo-500" />} />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6 bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100">
            <DataField label="Gender" value={gender} icon={<VenetianMask />} />
            <DataField label="NRIC / Identity No." value={maskedNric} icon={<BadgeInfo />} />
            <DataField label="Marital Status (Parents)" value={parentMaritalStatus} icon={<HeartHandshake />} />
            <DataField label="Nationality" value={nationality} icon={<Globe />} />
            <DataField label="Native Language" value={primaryLanguage} icon={<Languages />} />
            <DataField
              label="Religion"
              value={religion !== "Other" ? religion : religionOther!}
              icon={<BookOpenCheck />}
            />
          </div>
        </section>
      </div>
    </div>
  );
}

/* Helper Component for Section Headers */
function SectionHeader({ title, icon }: { title: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 pb-2">
      <div className="p-2 bg-indigo-50 rounded-lg">{icon}</div>
      <h2 className="font-bold text-lg text-slate-800 tracking-tight">{title}</h2>
    </div>
  );
}

/* Helper Component for Data Fields */
function DataField({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | undefined;
  icon: React.ReactElement<{ className: string }>;
}) {
  return (
    <div className="space-y-1.5 group">
      <Label className="text-[10px] uppercase tracking-[0.1em] font-black text-slate-400 ml-1">{label}</Label>
      <div className="flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 bg-white border-slate-200 group-hover:border-slate-300 shadow-sm">
        {React.cloneElement(icon, {
          className: "size-4 text-slate-400 shrink-0 group-hover:text-indigo-500 transition-colors",
        })}

        <span className="text-sm font-bold text-slate-700 truncate capitalize">{value}</span>
      </div>
    </div>
  );
}

export default StudentInformation;
