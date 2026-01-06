"use client";

import { Label } from "@/components/ui/label";
import { cn, extractSiblings } from "@/lib/utils";
import { FamilyInfo } from "@/types";
import { formatDate } from "date-fns";
import {
  BadgeInfo,
  Briefcase,
  Cake,
  Globe,
  Heart,
  Landmark,
  Mail,
  Phone,
  School,
  Smile,
  User,
  Users,
} from "lucide-react";
import React from "react";

function FamilyInformation({ label, familyInformation }: { label: string; familyInformation: FamilyInfo }) {
  const siblings = extractSiblings(familyInformation);

  const renderDataField = (
    label: string,
    value: string | null | undefined,
    icon: React.ReactElement<{ className: string }>
  ) => (
    <div className="space-y-1.5 group">
      <Label className="text-[10px] uppercase tracking-[0.1em] font-black text-slate-400 ml-1">{label}</Label>
      <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-white group-hover:border-slate-300 transition-all duration-200 shadow-sm">
        {React.cloneElement(icon, {
          className: "size-4 text-slate-400 shrink-0 group-hover:text-indigo-500 transition-colors",
        })}
        <span className="text-sm font-bold text-slate-700 truncate capitalize">{value || undefined}</span>
      </div>
    </div>
  );

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="space-y-1">
        <h1 className="font-black text-2xl md:text-4xl text-slate-900 tracking-tight">{label}</h1>
        <p className="text-sm font-medium text-slate-500">View-only details about parents, guardian, and siblings.</p>
      </div>

      <div className="space-y-16">
        {/* FATHER SECTION */}
        {familyInformation.fatherEmail && (
          <section className="space-y-6">
            <SectionHeader title="Father's Details" icon={<User className="size-5" />} color="text-blue-600" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100">
              {renderDataField("First Name", familyInformation.fatherFirstName, <User />)}
              {renderDataField("Middle Name", familyInformation.fatherMiddleName, <User />)}
              {renderDataField("Last Name", familyInformation.fatherLastName, <User />)}
              {renderDataField("Preferred Name", familyInformation.fatherPreferredName, <Smile />)}
              {renderDataField(
                "Birthday",
                familyInformation.fatherBirthDay ? formatDate(familyInformation.fatherBirthDay, "dd MMM yyyy") : null,
                <Cake />
              )}
              {renderDataField("Religion", familyInformation.fatherReligion, <Landmark />)}
              {renderDataField("Email Address", familyInformation.fatherEmail, <Mail />)}
              {renderDataField("Mobile No.", familyInformation.fatherMobile, <Phone />)}
              {renderDataField("Nationality", familyInformation.fatherNationality, <Globe />)}
              {renderDataField(
                "Identity No.",
                familyInformation.fatherNric
                  ? familyInformation.fatherNric.slice(0, 3) + "****" + familyInformation.fatherNric.slice(-2)
                  : null,
                <BadgeInfo />
              )}
              {renderDataField("Employer", familyInformation.fatherCompanyName, <Briefcase />)}
              {renderDataField("Occupation", familyInformation.fatherPosition, <Briefcase />)}
            </div>
          </section>
        )}

        {/* MOTHER SECTION */}
        {familyInformation.motherEmail && (
          <section className="space-y-6">
            <SectionHeader title="Mother's Details" icon={<Heart className="size-5" />} color="text-rose-500" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100">
              {renderDataField("First Name", familyInformation.motherFirstName, <User />)}
              {renderDataField("Middle Name", familyInformation.motherMiddleName, <User />)}
              {renderDataField("Last Name", familyInformation.motherLastName, <User />)}
              {renderDataField("Preferred Name", familyInformation.motherPreferredName, <Smile />)}
              {renderDataField(
                "Birthday",
                familyInformation.motherBirthDay ? formatDate(familyInformation.motherBirthDay, "dd MMM yyyy") : null,
                <Cake />
              )}
              {renderDataField("Religion", familyInformation.motherReligion, <Landmark />)}
              {renderDataField("Email Address", familyInformation.motherEmail, <Mail />)}
              {renderDataField("Mobile No.", familyInformation.motherMobile, <Phone />)}
              {renderDataField("Nationality", familyInformation.motherNationality, <Globe />)}
              {renderDataField(
                "Identity No.",
                familyInformation.motherNric
                  ? familyInformation.motherNric.slice(0, 3) + "****" + familyInformation.motherNric.slice(-2)
                  : null,
                <BadgeInfo />
              )}
              {renderDataField("Employer", familyInformation.motherCompanyName, <Briefcase />)}
              {renderDataField("Occupation", familyInformation.motherPosition, <Briefcase />)}
            </div>
          </section>
        )}

        {/* GUARDIAN SECTION (Conditional) */}
        {familyInformation.guardianEmail && (
          <section className="space-y-6">
            <SectionHeader title="Guardian's Details" icon={<Users className="size-5" />} color="text-indigo-600" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100">
              {renderDataField("First Name", familyInformation.guardianFirstName, <User />)}
              {renderDataField("Last Name", familyInformation.guardianLastName, <User />)}
              {renderDataField("Email", familyInformation.guardianEmail, <Mail />)}
              {renderDataField("Mobile", familyInformation.guardianMobile, <Phone />)}
              {renderDataField("Employer", familyInformation.guardianCompanyName, <Briefcase />)}
              {renderDataField("Position", familyInformation.guardianPosition, <Briefcase />)}
            </div>
          </section>
        )}

        {/* SIBLINGS SECTION */}
        {siblings && siblings.length > 0 && (
          <section className="space-y-6">
            <SectionHeader title="Sibling Records" icon={<Users className="size-5" />} color="text-purple-600" />
            <div className="space-y-4">
              {siblings.map((sibling, index) => (
                <div
                  key={index}
                  className="bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-2 h-full bg-indigo-500 opacity-0 group-hover:opacity-100 transition-all" />
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {renderDataField("Full Name", sibling.siblingFullName as string, <User />)}
                    {renderDataField(
                      "Date of Birth",
                      sibling.siblingBirthDay ? formatDate(sibling.siblingBirthDay as string, "dd/MM/yyyy") : null,
                      <Cake />
                    )}
                    {renderDataField("Religion", sibling.siblingReligion as string, <Landmark />)}

                    <div className="lg:col-span-2">
                      {renderDataField("School / Company Name", sibling.siblingSchoolCompany as string, <School />)}
                    </div>
                    {renderDataField(
                      "Education/Occupation",
                      sibling.siblingEducationOccupation as string,
                      <Briefcase />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function SectionHeader({ title, icon, color }: { title: string; icon: React.ReactNode; color: string }) {
  return (
    <div className="flex items-center gap-3 pb-2">
      <div className={cn("p-2 bg-indigo-50 rounded-lg", color)}>{icon}</div>
      <h2 className="font-bold text-lg text-slate-800 tracking-tight">{title}</h2>
    </div>
  );
}
export default FamilyInformation;
