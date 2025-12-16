import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  ExternalLink,
  Globe,
  GraduationCap,
  Heart,
  Shield,
  Users,
} from "lucide-react";

function AdmissionGuidelines() {
  const requirements = [
    {
      icon: Heart,
      text: "HFSE mission, vision and virtues are based on Christian teachings and we require all students to attend our Christian Living/Values Education & Language class. While all are eligible applicants regardless of nationality, culture, race or religion are welcome, it is advised that applicants and their parents should be comfortable with these school practices.",
      category: "Values",
    },
    {
      icon: Shield,
      text: "Student/Parent/Guardian have read, understood, agreed to and will comply with all the requirements especially in the strict discipline of the school.",
      category: "Commitment",
    },
    {
      icon: AlertCircle,
      text: "Any person who smokes, drinks alcoholic beverages, uses prohibited drugs or abuse illegal substances will not be admitted.",
      category: "Policy",
    },
    {
      icon: CheckCircle2,
      text: "Anyone seeking admission must be of good conduct and have attendance of no less than 80% in the previous school.",
      category: "Academic",
    },
    {
      icon: BookOpen,
      text: "A student who has studied in a Singapore government or government-aided school and is seeking admission into a certain class level must have passed the previous level.",
      category: "Academic",
    },
    {
      icon: BookOpen,
      text: "A student who has not studied in a Singapore government or government-aided school previously and is seeking admission must take a placement test in Mathematics and English and must pass both subjects before they are qualified for admission.",
      category: "Academic",
    },
    {
      icon: AlertCircle,
      text: "Students who fail in one or both subject/s and intend to downgrade to a lower level will still need to sit and pass the placement test for that level.",
      category: "Academic",
    },
    {
      icon: Users,
      text: "Student/Parent/Guardian will treat all information received in the application forms as private and confidential and any dissemination, distribution or duplication of such information, unless required by law or other statutory regulations is strictly prohibited and is the sole property of HFSE International School.",
      category: "Privacy",
    },
  ];

  return (
    <div className="relative w-full min-h-screen bg-gradient-to-br from-blue-50 via-white to-amber-50">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-72 h-72 bg-blue-200/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-amber-200/20 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-16">
        {/* Hero Section */}
        <div className="text-center space-y-6 mb-16">
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-white rounded-full shadow-lg border-2 border-blue-100">
            <GraduationCap className="w-6 h-6 text-blue-600" />
            <span className="text-sm font-semibold text-blue-600 uppercase tracking-wide">Join Our HAPI Family</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-blue-600 to-amber-600 bg-clip-text text-transparent">
              Admission Requirements
            </span>
          </h1>

          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Everything you need to know about joining HFSE International School — where every child succeeds, one happy
            family at a time
          </p>

          {/* Key Values */}
          <div className="flex flex-wrap justify-center gap-4 pt-6">
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-blue-100">
              <Heart className="w-4 h-4 text-red-500" />
              <span className="text-sm font-medium text-gray-700">Family-Centered</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-blue-100">
              <Shield className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">Christian Values</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-blue-100">
              <Globe className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-gray-700">Global Citizens</span>
            </div>
          </div>
        </div>

        {/* Main Content Card */}
        <Card className="border-none shadow-2xl bg-white/80 backdrop-blur-sm mb-12">
          <CardHeader className="space-y-4 pb-8 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-blue-600" />
              </div>
              <Badge variant="secondary" className="text-sm font-semibold bg-blue-50 text-blue-700 border-blue-200">
                Important Guidelines
              </Badge>
            </div>
            <CardTitle className="text-3xl font-bold text-gray-900">Admission Requirements</CardTitle>
            <p className="text-gray-600">
              Please review all requirements carefully before applying to join our HAPI family
            </p>
          </CardHeader>

          <CardContent className="pt-8">
            <div className="grid gap-4 md:gap-5">
              {requirements.map((req, index) => {
                const Icon = req.icon;
                return (
                  <div
                    key={index}
                    className="group relative overflow-hidden rounded-xl border-2 border-gray-100 bg-white p-6 transition-all duration-300 hover:border-blue-200 hover:shadow-lg">
                    {/* Category Badge */}
                    <div className="absolute top-4 right-4">
                      <span className="inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full bg-gradient-to-r from-blue-50 to-amber-50 text-blue-700 border border-blue-200">
                        {req.category}
                      </span>
                    </div>

                    <div className="flex gap-4">
                      {/* Icon */}
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                          <Icon className="w-6 h-6 text-white" strokeWidth={2.5} />
                        </div>
                      </div>

                      {/* Text */}
                      <p className="text-gray-700 leading-relaxed pt-1 pr-24">{req.text}</p>
                    </div>

                    {/* Decorative gradient line */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-amber-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                );
              })}
            </div>
          </CardContent>

          <CardFooter className="pt-12 pb-8 flex-col items-stretch border-t border-gray-100 bg-gradient-to-br from-blue-50/50 to-amber-50/50">
            <EducationLevelTable />
          </CardFooter>
        </Card>

        {/* Parent Portal Guide Card */}
        <Card className="border-none shadow-2xl bg-white/80 backdrop-blur-sm overflow-hidden py-0">
          <CardHeader className="space-y-4 pt-6 pb-6 bg-gradient-to-r from-blue-50 to-amber-50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <BookOpen className="w-5 h-5 text-blue-600" />
              </div>
              <Badge variant="secondary" className="text-sm font-semibold bg-white/80 text-blue-700">
                Resources
              </Badge>
            </div>
            <CardTitle className="text-3xl font-bold text-gray-900">Parent Portal Guide</CardTitle>
            <p className="text-gray-600">Learn how to navigate and use the parent portal effectively</p>
          </CardHeader>

          <CardContent className="p-6">
            <div
              className="relative w-full rounded-xl overflow-hidden shadow-xl border-4 border-white"
              style={{ paddingTop: "56.25%" }}>
              <iframe
                loading="lazy"
                className="absolute top-0 left-0 w-full h-full border-none"
                src="https://www.canva.com/design/DAGsorqq-Co/lHEDFsXWfMrp4U8rsVQY-Q/view?embed"
                allowFullScreen
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-6 pb-8 px-6 bg-gradient-to-br from-blue-50/50 to-amber-50/50">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Heart className="w-4 h-4 text-red-500" />
                Created by HFSE Creatives Team
              </p>
              <p className="text-xs text-gray-500">Last updated: 2024</p>
            </div>
            <a
              href="https://www.canva.com/design/DAGsorqq-Co/lHEDFsXWfMrp4U8rsVQY-Q/view?utm_content=DAGsorqq-Co&utm_campaign=designshare&utm_medium=embeds&utm_source=link"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
              View Full Guide
              <ExternalLink className="w-4 h-4" />
            </a>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

function EducationLevelTable() {
  const data = [
    { level: "Primary One", completion: "Kindergarten", birth: "2018", age: 6, category: "Primary" },
    { level: "Primary Two", completion: "Primary One", birth: "2017", age: 7, category: "Primary" },
    { level: "Primary Three", completion: "Primary Two", birth: "2016", age: 8, category: "Primary" },
    { level: "Primary Four", completion: "Primary Three", birth: "2015", age: 9, category: "Primary" },
    { level: "Primary Five", completion: "Primary Four", birth: "2014", age: 10, category: "Primary" },
    { level: "Primary Six", completion: "Primary Five", birth: "2013", age: 11, category: "Primary" },
    { level: "Secondary One", completion: "Primary Six", birth: "2012", age: 12, category: "Secondary" },
    { level: "Secondary Two", completion: "Secondary One", birth: "2011", age: 13, category: "Secondary" },
    { level: "Secondary Three", completion: "Secondary Two", birth: "2010", age: 14, category: "Secondary" },
    { level: "Secondary Four", completion: "Secondary Three", birth: "2009", age: 15, category: "Secondary" },
  ];

  return (
    <div className="w-full space-y-6">
      <div className="space-y-3 text-center md:text-left">
        <div className="flex items-center justify-center md:justify-start gap-3">
          <div className="p-2 bg-blue-600 rounded-lg">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900">Education Level Requirements</h3>
        </div>
        <p className="text-gray-600">Admission requirements based on student's age and academic completion</p>
      </div>

      <div className="border-2 border-gray-100 rounded-2xl overflow-hidden shadow-lg bg-white">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-blue-600 to-blue-700 border-none">
                <th className="px-6 py-4 text-left text-sm font-bold text-white">Level</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-white">Academic Completion</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-white">Year of Birth</th>
                <th className="px-6 py-4 text-right text-sm font-bold text-white">Age</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, index) => (
                <tr
                  key={index}
                  className={`transition-all duration-200 border-b border-gray-100 last:border-none ${
                    index % 2 === 0 ? "bg-white hover:bg-blue-50/50" : "bg-gray-50/50 hover:bg-blue-50/50"
                  }`}>
                  <td className="px-6 py-4 font-semibold text-gray-900">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          row.category === "Primary" ? "bg-blue-500" : "bg-amber-500"
                        }`}
                      />
                      {row.level}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{row.completion}</td>
                  <td className="px-6 py-4">
                    <Badge
                      variant="secondary"
                      className="font-mono font-medium bg-gray-100 text-gray-700 border border-gray-200">
                      {row.birth}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="inline-flex items-center justify-center min-w-[4rem] px-3 py-1.5 text-sm font-bold bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg shadow-sm">
                      {row.age} yrs
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info Footer */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-lg">
        <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-gray-700">
          <span className="font-semibold">Note:</span> All applicants must meet the age requirements by the start of the
          academic year. For specific questions about admission requirements, please contact our admissions office.
        </p>
      </div>
    </div>
  );
}

export default AdmissionGuidelines;
