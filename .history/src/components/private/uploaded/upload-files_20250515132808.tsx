import DocumentsInformation from "./information/document-information";
import EnrolmentInformation from "./information/enrolment-information";
import FatherInformation from "./information/father-information";
import GuardianInformation from "./information/guardian-information";
import MotherInformation from "./information/mother-information";
import StudentInformation from "./information/student-information";

const UploadFiles = () => (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 md:px-6">
    <SingleDocuments />
  </div>
);

export default UploadFiles;