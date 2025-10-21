import PageMetaData from "@/components/page-metadata";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ADMISSION_GUIDELINES_TITLE_DESCRIPTION } from "@/data";
import { AlertCircle, BookOpen, CheckCircle2, ExternalLink, GraduationCap, Users } from "lucide-react";

function AdmissionGuidelines() {
  const { title, description } = ADMISSION_GUIDELINES_TITLE_DESCRIPTION;

  const requirements = [
    {
      icon: CheckCircle2,
      text: "HFSE mission, vision and virtues are based on Christian teachings and we require all students to attend our Christian Living/Values Education & Language class. While all are eligible applicants regardless of nationality, culture, race or religion are welcome, it is advised that applicants and their parents should be comfortable with these school practices.",
    },
    {
      icon: AlertCircle,
      text: "Student/Parent/Guardian have read, understood, agreed to and will comply with all the requirements especially in the strict discipline of the school.",
    },
    {
      icon: AlertCircle,
      text: "Any person who smokes, drinks alcoholic beverages, uses prohibited drugs or abuse illegal substances will not be admitted.",
    },
    {
      icon: CheckCircle2,
      text: "Anyone seeking admission must be of good conduct and have attendance of no less than 80% in the previous school.",
    },
    {
      icon: BookOpen,
      text: "A student who has studied in a Singapore government or government-aided school and is seeking admission into a certain class level must have passed the previous level.",
    },
    {
      icon: BookOpen,
      text: "A student who has not studied in a Singapore government or government-aided school previously and is seeking admission must take a placement test in Mathematics and English and must pass both subjects before they are qualified for admission.",
    },
    {
      icon: AlertCircle,
      text: "Students who fail in one or both subject/s and intend to downgrade to a lower level will still need to sit and pass the placement test for that level.",
    },
    {
      icon: Users,
      text: "Student/Parent/Guardian will treat all information received in the application forms as private and confidential and any dissemination, distribution or duplication of such information, unless required by law or other statutory regulations is strictly prohibited and is the sole property of HFSE International School.",
    },
  ];

  return (
    <>
      <PageMetaData title={title} description={description} />
      <div className="relative w-full max-w-6xl mx-auto flex flex-col gap-8 py-8 md:gap-10 md:py-12 px-4 md:px-6">
        <div className="text-center space-y-4 py-8 px-4 md:px-6">
          <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-2xl mb-4">
            <GraduationCap className="size-6 md:size-8 text-primary" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Admission Requirements</h1>
          <p className="text-base md:text-lg text-muted-foreground text-pretty">
            Everything you need to know about joining HFSE International School
          </p>
        </div>

        <Card className="border-none shadow-none">
          <CardHeader className="space-y-2 pb-6">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-sm">
                Requirements
              </Badge>
            </div>
            <CardTitle className="text-2xl">Important Guidelines</CardTitle>
            <p className="text-sm text-muted-foreground">Please review all requirements carefully before applying</p>
          </CardHeader>

          <CardContent className="space-y-4">
            {requirements.map((req, index) => (
              <div
                key={index}
                className="flex gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors group">
                <div className="flex-shrink-0 mt-0.5">
                  <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <req.icon className="size-5 text-primary" />
                  </div>
                </div>
                <p className="text-sm leading-relaxed text-pretty">{req.text}</p>
              </div>
            ))}
          </CardContent>

          <CardFooter className="pt-8 pb-6">
            <EducationLevelTable />
          </CardFooter>
        </Card>

        <Card className="border-none shadow-none overflow-hidden px-4 md:px-6">
          <CardHeader className="p-0">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-sm">
                Resources
              </Badge>
            </div>
            <CardTitle className="text-2xl">Parent Portal Guide</CardTitle>
            <p className="text-sm text-muted-foreground">Learn how to navigate and use the parent portal effectively</p>
          </CardHeader>
          <CardContent className="p-0">
            <div className=" relative w-full" style={{ paddingTop: "56.25%" }}>
              <iframe
                loading="lazy"
                className="absolute top-0 left-0 w-full h-full border-none rounded-xl"
                src="https://www.canva.com/design/DAGsorqq-Co/lHEDFsXWfMrp4U8rsVQY-Q/view?embed"
                allowFullScreen
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-6 px-0">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-secondary">Created by Creatives Team</p>
              <p className="text-xs text-muted-foreground">Last updated: 2024</p>
            </div>
            <a
              href="https://www.canva.com/design/DAGsorqq-Co/lHEDFsXWfMrp4U8rsVQY-Q/view?utm_content=DAGsorqq-Co&utm_campaign=designshare&utm_medium=embeds&utm_source=link"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors">
              View Full Guide
              <ExternalLink className="size-4" />
            </a>
          </CardFooter>
        </Card>
      </div>
    </>
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
    <div className="w-full space-y-4">
      <div className="space-y-2">
        <h3 className="text-xl font-semibold flex items-center gap-2">
          <BookOpen className="size-5 text-primary" />
          Education Level Requirements
        </h3>
        <p className="text-sm text-muted-foreground">
          Admission requirements based on student's age and academic completion
        </p>
      </div>

      <div className="border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="font-semibold">Level</TableHead>
              <TableHead className="font-semibold">Academic Completion</TableHead>
              <TableHead className="font-semibold">Year of Birth</TableHead>
              <TableHead className="font-semibold text-right">Age</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, index) => (
              <TableRow key={index} className="hover:bg-accent/50 transition-colors group">
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">{row.level}</div>
                </TableCell>
                <TableCell className="text-muted-foreground">{row.completion}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className="font-mono">
                    {row.birth}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-1 text-sm font-semibold bg-primary/10 text-primary rounded-md">
                    {row.age} yrs old
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export default AdmissionGuidelines;
