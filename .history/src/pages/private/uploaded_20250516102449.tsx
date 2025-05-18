import SingleDocuments from "@/components/private/documents/single-documents"
import StudentFiles from "@/components/private/documents/student-files"


export const Uploaded = () => {
  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 md:px-6">
    <StudentFiles />
  </div>
  )
}
