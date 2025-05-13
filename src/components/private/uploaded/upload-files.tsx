import DocumentsInformation from "./information/document-information";
import EnrolmentInformation from "./information/enrolment-information";
import FatherInformation from "./information/father-information";
import GuardianInformation from "./information/guardian-information";
import MotherInformation from "./information/mother-information";
import StudentInformation from "./information/student-information";

const UploadFiles = () => (
  <div>
    {/* Student information */}
    <StudentInformation />

    {/* Mother's information */}
    <MotherInformation />

    {/* Father's information */}
    <FatherInformation />

    {/* Guardian information */}
    <GuardianInformation />

    {/* Enrolment information */}
    <EnrolmentInformation />

    {/* Documents information */}
    <DocumentsInformation />
  </div>
);

export default UploadFiles;