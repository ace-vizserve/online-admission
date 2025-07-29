import PageMetaData from "@/components/page-metadata";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ADMISSION_GUIDELINES_TITLE_DESCRIPTION } from "@/data";

// const ADMISSION_GUIDELINES_URL = import.meta.env.VITE_ADMISSION_GUIDELINES_URL as string;

function AdmissionGuidelines() {
  const { title, description } = ADMISSION_GUIDELINES_TITLE_DESCRIPTION;

  return (
    <>
      <PageMetaData title={title} description={description} />
      <div className="relative w-full max-w-4xl mx-auto flex flex-col gap-4 py-8 md:gap-6 md:py-12">
        {/* <div className="w-max ml-auto pr-6">
          <Link
            to={ADMISSION_GUIDELINES_URL}
            target="_blank"
            className={buttonVariants({
              variant: "secondary",
              className: "ml-auto w-max",
            })}>
            Download PDF <Download />
          </Link>
        </div> */}

        <Card className="w-full border-none shadow-none">
          <CardHeader>
            <CardTitle className="text-4xl font-bold text-center">Admission Requirements</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4 md:space-y-6 text-sm">
            <p className="text-pretty -tracking-tighter">
              HFSE mission, vision and virtues are based on Christian teachings and we require all students to attend
              our Christian Living/Values Education&Language class. While all are eligible applicants regardless of
              nationality, culture, race or religion are welcome, it is advised that applicants and their parents should
              be comfortable with these school practices. Applicants seeking admission should agree to comply with these
              requirements and maintain strict discipline in attendance, punctuality, uniform, behavior and school work.
            </p>

            <p className="text-pretty -tracking-tighter">
              Student/Parent/Guardian have read, understood, agreed to and will comply with all the requirements
              especially in the strict discipline of the school.
            </p>

            <p className="text-pretty -tracking-tighter">
              Any person who smokes, drinks alcoholic beverages, uses prohibited drugs or abuse illegal substances will
              not be admitted.
            </p>

            <p className="text-pretty -tracking-tighter">
              Anyone seeking admission must be of good conduct and have attendance of no less than 80% in the previous
              school.
            </p>

            <p className="text-pretty -tracking-tighter">
              A student who has studied in a Singapore government or government-aided school and is seeking admission
              into a certain class level must have passed the previous level.
            </p>

            <p className="text-pretty -tracking-tighter">
              A student who has not studied in a Singapore government or government-aided school previously and is
              seeking admission must take a placement test in Mathematics and English and must pass both subjects before
              they are qualified for admission.
            </p>

            <p className="text-pretty -tracking-tighter">
              Students who fail in one or both subject/s and intend to downgrade to a lower level will still need to sit
              and pass the placement test for that level.
            </p>

            <p className="text-pretty -tracking-tighter">
              Student/Parent/Guardian will treat all information received in the application forms as private and
              confidential and any dissemination, distribution or duplication of such information, unless required by
              law or other statutory regulations is strictly prohibited and is the sole property of HFSE International
              School.
            </p>
          </CardContent>
          <CardFooter className="pt-8">
            <EducationLevelTable />
          </CardFooter>
        </Card>
        <div>
          <div
            style={{
              position: "relative",
              width: "100%",
              height: 0,
              paddingTop: "56.25%",
              paddingBottom: 0,
              boxShadow: "0 2px 8px 0 rgba(63,69,81,0.16)",
              marginTop: "1.6em",
              marginBottom: "0.9em",
              overflow: "hidden",
              borderRadius: "8px",
              willChange: "transform",
            }}>
            <iframe
              loading="lazy"
              style={{
                position: "absolute",
                width: "100%",
                height: "100%",
                top: 0,
                left: 0,
                border: "none",
                padding: 0,
                margin: 0,
              }}
              src="https://www.canva.com/design/DAGsorqq-Co/lHEDFsXWfMrp4U8rsVQY-Q/view?embed"
              allowFullScreen></iframe>
          </div>
          <div className="mt-4 w-max ml-auto">
            <a
              href="https://www.canva.com/design/DAGsorqq-Co/lHEDFsXWfMrp4U8rsVQY-Q/view?utm_content=DAGsorqq-Co&utm_campaign=designshare&utm_medium=embeds&utm_source=link"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline font-medium">
              Parent Portal User Guide
            </a>{" "}
            <span className="text-sm font-semibold text-secondary">by Creatives Team</span>
          </div>
        </div>
      </div>
    </>
  );
}

function EducationLevelTable() {
  const data = [
    { level: "Primary One", completion: "Kindergarten", birth: "2018", age: 6 },
    { level: "Primary Two", completion: "Primary One", birth: "2017", age: 7 },
    { level: "Primary Three", completion: "Primary Two", birth: "2016", age: 8 },
    { level: "Primary Four", completion: "Primary Three", birth: "2015", age: 9 },
    { level: "Primary Five", completion: "Primary Four", birth: "2014", age: 10 },
    { level: "Primary Six", completion: "Primary Five", birth: "2013", age: 11 },
    { level: "Secondary One", completion: "Primary Six", birth: "2012", age: 12 },
    { level: "Secondary Two", completion: "Secondary One", birth: "2011", age: 13 },
    { level: "Secondary Three", completion: "Secondary Two", birth: "2010", age: 14 },
    { level: "Secondary Four", completion: "Secondary Three", birth: "2009", age: 15 },
  ];

  return (
    <div className="w-full border rounded-md overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Level</TableHead>
            <TableHead>Academic Completion</TableHead>
            <TableHead>Year of Birth</TableHead>
            <TableHead>Age</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, index) => (
            <TableRow className="odd:bg-muted" key={index}>
              <TableCell>{row.level}</TableCell>
              <TableCell>{row.completion}</TableCell>
              <TableCell>{row.birth}</TableCell>
              <TableCell>{row.age}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default AdmissionGuidelines;
