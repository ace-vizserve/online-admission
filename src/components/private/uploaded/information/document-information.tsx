import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/lib/client";
import type { DocumentsInformation as DocumentsInformationType } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router";

const documentFields = [
  { label: "Student ID Picture", key: "idPicture" },
  { label: "Birth Certificate", key: "birthCert" },
  { label: "Medical Certificate", key: "medical" },
  { label: "Passport Copy", key: "passport" },
  { label: "Singapore Pass", key: "pass" },
];

const DocumentsInformation = () => {
  const { id } = useParams();

  const { data, isLoading, error } = useQuery<DocumentsInformationType | null>({
    queryKey: ["ay2025_documents_applications_", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ay2025_enrolment_documents")
        .select("idPicture, birthCert, medical, passport, pass")
        .eq("id", id)
        .single();

      if (error) throw error;
      return {
        idPicture: data?.idPicture ?? "",
        birthCert: data?.birthCert ?? "",
        medical: data?.medical ?? "",
        passport: data?.passport ?? "",
        pass: data?.pass ?? "",
      } as DocumentsInformationType;
    },
    enabled: !!id,
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) {
    return <div>Error loading document information: {error.message}</div>;
  }
  if (!data) return <div>No documents information found.</div>;

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>Uploaded Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documentFields.map((field) => (
                <TableRow key={field.key}>
                  <TableCell>{field.label}</TableCell>
                  <TableCell>
                    {data[field.key as keyof DocumentsInformationType] ? (
                      <a
                        href={data[field.key as keyof DocumentsInformationType] as string}
                        target="_blank"
                        rel="noopener noreferrer">
                        <Button className="cursor-pointer" variant="default" size="sm">
                          View
                        </Button>
                      </a>
                    ) : (
                      <span>Not uploaded</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default DocumentsInformation;
