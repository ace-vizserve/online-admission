import { uploadFileToBucket } from "@/actions/private";
import fileSvg from "@/assets/file.svg";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { FileInput, FileUploader, FileUploaderContent, FileUploaderItem } from "@/components/ui/file-input";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { PassportInput } from "@/components/ui/passport-input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { studentPassTypes } from "@/data";
import { cn } from "@/lib/utils";
import { StudentFileUploaderDialogProps } from "@/types";
import { ParentGuardianUploadRequirementsSchema, StudentUploadRequirementsSchema } from "@/zod-schema";
import { useSelectAcademicYear } from "@/zustand-store";
import { useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { DotPulse } from "ldrs/react";
import "ldrs/react/DotPulse.css";
import {
  CalendarIcon,
  CheckCircle2,
  CircleAlert,
  CloudUpload,
  Download,
  ExternalLink,
  Paperclip,
  Trash2,
  Upload,
} from "lucide-react";
import { memo } from "react";
import { DropzoneOptions } from "react-dropzone";
import { useFormState } from "react-hook-form";
import { useMediaQuery } from "react-responsive";
import { Link } from "react-router";

const medicalExamurl = import.meta.env.VITE_MEDICAL_EXAM_FORM_URL as string;

const NOT_FILE_INPUTS = ["passExpiry", "passType", "passportExpiry", "passportNumber"];

const MULTIPLE_FILE_UPLOADS = ["medical", "passport", "pass", "birthCert", "educCert"];

const OPTIONAL_DOCS = ["medical", "educCert"];

const StudentFileUploaderDialog = memo(function ({
  form,
  value,
  onValueChange,
  name,
  label,
  description,
  formState,
  setFormState,
}: StudentFileUploaderDialogProps) {
  const academicYear = useSelectAcademicYear((state) => state.academicYear);

  const { mutate, isPending } = useMutation({
    mutationFn: async (file: File[]) => {
      const isImage = file.length == 1;
      return await uploadFileToBucket(isImage, file, academicYear);
    },
    onSuccess(data) {
      onValueChange(null);
      if (!NOT_FILE_INPUTS.includes(name)) {
        form.setValue(name, data!.imagePath, { shouldValidate: true });
        setFormState({
          uploadRequirements: {
            parentGuardianUploadRequirements: {
              ...(formState.uploadRequirements
                ?.parentGuardianUploadRequirements as unknown as ParentGuardianUploadRequirementsSchema),
            },
            studentUploadRequirements: {
              ...(formState.uploadRequirements
                ?.studentUploadRequirements as unknown as StudentUploadRequirementsSchema),
              [name]: data!.imagePath,
            },
          },
        });
      }
    },
  });

  const { errors } = useFormState({ control: form.control });
  const dropZoneConfig: DropzoneOptions = {
    maxFiles: MULTIPLE_FILE_UPLOADS.includes(name) ? 4 : 1,
    maxSize: 1024 * 1024 * 4, // 4MB max
    accept:
      name === "idPicture"
        ? {
            "image/*": [],
          }
        : {
            "application/pdf": [],
          },
  };

  const isDesktop = useMediaQuery({
    query: "(min-width: 786px)",
  });

  function uploadFile() {
    if (value == null || !value.length) return;
    mutate(value);
  }

  function changeDocument() {
    if (!formState.uploadRequirements?.studentUploadRequirements[name]) return;

    setFormState({
      uploadRequirements: {
        parentGuardianUploadRequirements: {
          ...formState.uploadRequirements.parentGuardianUploadRequirements,
        },
        studentUploadRequirements: {
          ...formState.uploadRequirements.studentUploadRequirements,
          [name]: OPTIONAL_DOCS.includes(name) ? undefined : "",
        },
      },
    });

    form.setValue(name, OPTIONAL_DOCS.includes(name) ? undefined : "");
  }

  if (isDesktop) {
    return (
      <div
        className={cn("flex items-center justify-between rounded-md border p-4 w-full", {
          "bg-red-50": errors[name] != null,
          "bg-green-50": formState.uploadRequirements?.studentUploadRequirements[name],
        })}>
        <div className="flex items-center gap-4">
          {formState.uploadRequirements?.studentUploadRequirements[name] ? (
            <CheckCircle2 className="stroke-white fill-green-600" />
          ) : errors[name] != null ? (
            <CircleAlert className="size-6 text-destructive" />
          ) : (
            <Upload className="size-6" />
          )}
          <div className="flex flex-col gap-1">
            <span className="text-sm">{label}</span>
            <span className="text-muted-foreground text-xs">{description}</span>
          </div>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant={errors[name] != null ? "destructive" : "outline"}>
              {formState.uploadRequirements?.studentUploadRequirements[name] ? "View" : "Upload"}
            </Button>
          </DialogTrigger>

          <DialogContent className="!max-w-2xl">
            <DialogHeader className="text-start">
              <DialogTitle>{label} </DialogTitle>

              <DialogDescription>
                Upload a clear and recent document. Accepted formats:{" "}
                <span className="font-semibold">
                  {" "}
                  {MULTIPLE_FILE_UPLOADS.includes(name) ? "PDF" : "PNG, JPG, or JPEG"}
                </span>
              </DialogDescription>
            </DialogHeader>

            {!formState.uploadRequirements?.studentUploadRequirements[name] && MULTIPLE_FILE_UPLOADS.includes(name) ? (
              <Badge className="w-max mx-auto text-xs bg-amber-600/10 hover:bg-amber-600/10 text-amber-500 shadow-none">
                Upload all pages containing relevant details
              </Badge>
            ) : null}

            {name === "medical" && (
              <Link
                to={medicalExamurl}
                target="_blank"
                className={buttonVariants({
                  className: "gap-2 w-max mx-auto text-xs",
                  variant: "outline",
                })}>
                Download Medical Exam Form <Download />
              </Link>
            )}

            {formState.uploadRequirements?.studentUploadRequirements[name] ? (
              <div className="relative w-full flex items-center justify-center flex-col gap-4 border-dashed bg-muted border-2 rounded-lg py-6">
                <Button onClick={changeDocument} size={"sm"} className="text-xs absolute right-4 top-4">
                  Change document
                </Button>
                <div className="p-6 bg-white rounded-full">
                  <img src={fileSvg} className="size-14" />
                </div>
                <p className="text-muted-foreground font-medium text-sm">{label} has been uploaded</p>

                {!NOT_FILE_INPUTS.includes(name) && formState.uploadRequirements?.studentUploadRequirements[name] && (
                  <Link
                    to={formState.uploadRequirements.studentUploadRequirements[name] as string}
                    target="_blank"
                    className={buttonVariants({
                      className: "gap-2 text-xs hover:bg-white",
                      variant: "outline",
                    })}>
                    View document <ExternalLink />
                  </Link>
                )}
              </div>
            ) : (
              <FormField
                control={form.control}
                name={name}
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <FileUploader
                        value={value}
                        onValueChange={onValueChange}
                        dropzoneOptions={dropZoneConfig}
                        className="relative bg-background rounded-lg">
                        <FileInput {...field} id="fileInput" className="bg-muted border-2 border-dashed">
                          <div className="flex items-center justify-center flex-col p-8 w-full">
                            <CloudUpload className="text-gray-500 w-10 h-10" />
                            <p className="mb-1 text-sm text-gray-500 dark:text-gray-400">
                              <span className="font-semibold">Click to upload</span> or drag and drop
                            </p>
                          </div>
                        </FileInput>

                        <FileUploaderContent>
                          {value == null && formState.uploadRequirements?.studentUploadRequirements[name] && (
                            <div className="my-2 flex items-center justify-between px-1 rounded-md hover:bg-muted">
                              <div className="flex items-center gap-1">
                                <Paperclip className="h-4 w-4 stroke-current" />
                                <span className="text-sm font-medium">
                                  {(formState.uploadRequirements.studentUploadRequirements[name] as string)
                                    .split("\\")
                                    .pop()}
                                </span>
                              </div>
                              <Trash2
                                className="h-4 w-4"
                                onClick={() => {
                                  form.reset({
                                    ...form.getValues(),
                                    [name]: OPTIONAL_DOCS.includes(name) ? undefined : "",
                                  });
                                  onValueChange(null);
                                  setFormState({
                                    ...formState,
                                    uploadRequirements: {
                                      ...formState.uploadRequirements!,
                                      studentUploadRequirements: {
                                        ...formState.uploadRequirements!.studentUploadRequirements,
                                        [name]: OPTIONAL_DOCS.includes(name) ? undefined : "",
                                      },
                                    },
                                  });
                                }}
                              />
                            </div>
                          )}
                          {value &&
                            value.length > 0 &&
                            value.map((file, i) => (
                              <FileUploaderItem setValue={form.setValue} inputKey={name} key={i} index={i}>
                                <Paperclip className="h-4 w-4 stroke-current" />
                                <span>{file.name}</span>
                              </FileUploaderItem>
                            ))}
                        </FileUploaderContent>
                      </FileUploader>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {value != null && value.length > 0 && (
              <Button disabled={isPending} onClick={uploadFile} className="gap-2">
                {isPending ? (
                  <>
                    Uploading <DotPulse size="30" speed="1.3" color="white" />
                  </>
                ) : (
                  <>
                    Upload file <Upload />
                  </>
                )}
              </Button>
            )}

            {name === "pass" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full">
                <FormField
                  control={form.control}
                  name="passType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pass Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select a pass type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {studentPassTypes.map((passType) => (
                            <SelectItem key={passType.value} value={passType.value}>
                              {passType.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>Your student's pass type.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="passExpiry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pass Expiry</FormLabel>
                      <Popover modal>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}>
                              {field.value ? format(field.value, "d MMMM yyyy'") : <span>Pick a date</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            disabled={[
                              {
                                before: new Date(),
                              },
                            ]}
                            selected={field.value}
                            onSelect={field.onChange}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormDescription>Pass expiration date.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {name === "passport" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full">
                <FormField
                  control={form.control}
                  name="passportNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Passport Number</FormLabel>
                      <FormControl>
                        <PassportInput {...field} placeholder="Enter your passport number" />
                      </FormControl>
                      <FormDescription>Student’s passport number.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="passportExpiry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Passport Expiry</FormLabel>
                      <Popover modal>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}>
                              {field.value ? format(field.value, "d MMMM yyyy'") : <span>Pick a date</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            disabled={[
                              {
                                before: new Date(),
                              },
                            ]}
                            selected={field.value}
                            onSelect={field.onChange}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormDescription>Passport expiration date.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <StudentFileUploaderDrawer
      form={form}
      description={description}
      formState={formState}
      label={label}
      name={name}
      onValueChange={onValueChange}
      setFormState={setFormState}
      value={value}
    />
  );
});

function StudentFileUploaderDrawer({
  description,
  form,
  formState,
  label,
  name,
  onValueChange,
  setFormState,
  value,
}: StudentFileUploaderDialogProps) {
  const academicYear = useSelectAcademicYear((state) => state.academicYear);

  const { mutate, isPending } = useMutation({
    mutationFn: async (file: File[]) => {
      const isImage = file.length == 1;
      return await uploadFileToBucket(isImage, file, academicYear);
    },
    onSuccess(data) {
      onValueChange(null);
      if (!NOT_FILE_INPUTS.includes(name)) {
        form.setValue(name, data!.imagePath);
        setFormState({
          uploadRequirements: {
            parentGuardianUploadRequirements: {
              ...(formState.uploadRequirements
                ?.parentGuardianUploadRequirements as unknown as ParentGuardianUploadRequirementsSchema),
            },
            studentUploadRequirements: {
              ...(formState.uploadRequirements
                ?.studentUploadRequirements as unknown as StudentUploadRequirementsSchema),
              [name]: data!.imagePath,
            },
          },
        });
      }
    },
  });

  const { errors } = useFormState({ control: form.control });
  const dropZoneConfig: DropzoneOptions = {
    maxFiles: MULTIPLE_FILE_UPLOADS.includes(name) ? 4 : 1,
    maxSize: 1024 * 1024 * 4, // 4MB max
    accept:
      name === "idPicture"
        ? {
            "image/*": [],
          }
        : {
            "application/pdf": [],
          },
  };

  function uploadFile() {
    if (value == null || !value.length) return;
    mutate(value);
  }

  function changeDocument() {
    if (!formState.uploadRequirements?.studentUploadRequirements[name]) return;

    setFormState({
      uploadRequirements: {
        parentGuardianUploadRequirements: {
          ...formState.uploadRequirements.parentGuardianUploadRequirements,
        },
        studentUploadRequirements: {
          ...formState.uploadRequirements.studentUploadRequirements,
          [name]: OPTIONAL_DOCS.includes(name) ? undefined : "",
        },
      },
    });

    form.setValue(name, OPTIONAL_DOCS.includes(name) ? undefined : "");
  }

  return (
    <div
      className={cn("flex items-center justify-between rounded-md border p-4 w-full", {
        "bg-red-50": errors[name] != null,
        "bg-green-50": formState.uploadRequirements?.studentUploadRequirements[name],
      })}>
      <div className="flex items-center gap-4">
        {formState.uploadRequirements?.studentUploadRequirements[name] ? (
          <CheckCircle2 className="stroke-white fill-green-600" />
        ) : errors[name] != null ? (
          <CircleAlert className="size-6 text-destructive" />
        ) : (
          <Upload className="size-6" />
        )}
        <div className="flex flex-col gap-1">
          <span className="text-sm">{label}</span>
          <span className="text-muted-foreground text-xs">{description}</span>
        </div>
      </div>
      <Drawer>
        <DrawerTrigger asChild>
          <Button variant={errors[name] != null ? "destructive" : "outline"}>
            {formState.uploadRequirements?.studentUploadRequirements[name] ? "View" : "Upload"}
          </Button>
        </DrawerTrigger>

        <DrawerContent className="px-4 space-y-4">
          <DrawerHeader className="text-start px-0">
            <DrawerTitle>{label}</DrawerTitle>

            <DrawerDescription className="text-xs">
              Upload a clear and recent document. Accepted formats:{" "}
              <span className="font-semibold">
                {" "}
                {MULTIPLE_FILE_UPLOADS.includes(name) ? "PDF" : "PNG, JPG, or JPEG"}
              </span>
            </DrawerDescription>
          </DrawerHeader>

          {!formState.uploadRequirements?.studentUploadRequirements[name] && MULTIPLE_FILE_UPLOADS.includes(name) ? (
            <Badge className="w-max mx-auto text-xs bg-amber-600/10 dark:bg-amber-600/20 hover:bg-amber-600/10 text-amber-500 shadow-none">
              Upload all pages containing relevant details
            </Badge>
          ) : null}

          {name === "medical" && (
            <Link
              to={medicalExamurl}
              target="_blank"
              className={buttonVariants({
                className: "gap-2 w-max mx-auto text-xs",
                variant: "outline",
                size: "sm",
              })}>
              Download Medical Exam Form <Download />
            </Link>
          )}

          {formState.uploadRequirements?.studentUploadRequirements[name] ? (
            <div className="relative w-full flex items-center justify-center flex-col gap-4 border-dashed bg-muted border-2 rounded-lg py-6">
              <Button onClick={changeDocument} size={"sm"} className="text-xs absolute right-4 top-4">
                Change
              </Button>
              <div className="p-6 bg-white rounded-full">
                <img src={fileSvg} className="size-14" />
              </div>
              <p className="text-muted-foreground text-xs">{label} has been uploaded</p>

              {!NOT_FILE_INPUTS.includes(name) && formState.uploadRequirements?.studentUploadRequirements[name] && (
                <Link
                  to={formState.uploadRequirements.studentUploadRequirements[name] as string}
                  target="_blank"
                  className={buttonVariants({
                    className: "gap-2 text-xs hover:bg-white",
                    size: "sm",
                    variant: "outline",
                  })}>
                  View document <ExternalLink />
                </Link>
              )}
            </div>
          ) : (
            <FormField
              control={form.control}
              name={name}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <FileUploader
                      value={value}
                      onValueChange={onValueChange}
                      dropzoneOptions={dropZoneConfig}
                      className="relative bg-background rounded-lg">
                      <FileInput {...field} id="fileInput" className="bg-muted border-2 border-dashed">
                        <div className="flex items-center justify-center flex-col p-8 w-full">
                          <CloudUpload className="text-gray-500 w-10 h-10" />
                          <p className="mb-1 text-sm text-gray-500 dark:text-gray-400">
                            <span className="font-semibold">Click to upload</span> or drag and drop
                          </p>
                        </div>
                      </FileInput>

                      <FileUploaderContent>
                        {value == null && formState.uploadRequirements?.studentUploadRequirements[name] && (
                          <div className="my-2 flex items-center justify-between px-1 rounded-md hover:bg-muted">
                            <div className="flex items-center gap-1">
                              <Paperclip className="h-4 w-4 stroke-current" />
                              <span className="text-sm font-medium">
                                {(formState.uploadRequirements.studentUploadRequirements[name] as string)
                                  .split("\\")
                                  .pop()}
                              </span>
                            </div>
                            <Trash2
                              className="h-4 w-4"
                              onClick={() => {
                                form.reset({
                                  ...form.getValues(),
                                  [name]: OPTIONAL_DOCS.includes(name) ? undefined : "",
                                });
                                onValueChange(null);
                                setFormState({
                                  ...formState,
                                  uploadRequirements: {
                                    ...formState.uploadRequirements!,
                                    studentUploadRequirements: {
                                      ...formState.uploadRequirements!.studentUploadRequirements,
                                      [name]: OPTIONAL_DOCS.includes(name) ? undefined : "",
                                    },
                                  },
                                });
                              }}
                            />
                          </div>
                        )}
                        {value &&
                          value.length > 0 &&
                          value.map((file, i) => (
                            <FileUploaderItem setValue={form.setValue} inputKey={name} key={i} index={i}>
                              <Paperclip className="h-4 w-4 stroke-current" />
                              <span>{file.name}</span>
                            </FileUploaderItem>
                          ))}
                      </FileUploaderContent>
                    </FileUploader>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {value != null && value.length > 0 && (
            <Button disabled={isPending} onClick={uploadFile} className="gap-2">
              {isPending ? (
                <>
                  Uploading <DotPulse size="30" speed="1.3" color="white" />
                </>
              ) : (
                <>
                  Upload file <Upload />
                </>
              )}
            </Button>
          )}

          {name === "pass" && (
            <div className="grid grid-cols-1 gap-2 w-full">
              <FormField
                control={form.control}
                name="passType"
                render={({ field }) => (
                  <FormItem>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a pass type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {studentPassTypes.map((passType) => (
                          <SelectItem key={passType.value} value={passType.value}>
                            {passType.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="passExpiry"
                render={({ field }) => (
                  <FormItem>
                    <Popover modal>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}>
                            {field.value ? format(field.value, "d MMMM yyyy'") : <span>Pass expiration date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          disabled={[
                            {
                              before: new Date(),
                            },
                          ]}
                          selected={field.value}
                          onSelect={field.onChange}
                        />
                      </PopoverContent>
                    </Popover>

                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}

          {name === "passport" && (
            <div className="grid grid-cols-1 gap-2 w-full">
              <FormField
                control={form.control}
                name="passportNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <PassportInput
                        className="placeholder:text-sm"
                        placeholder="Enter your passport number"
                        {...field}
                      />
                    </FormControl>

                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="passportExpiry"
                render={({ field }) => (
                  <FormItem>
                    <Popover modal>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}>
                            {field.value ? format(field.value, "d MMMM yyyy'") : <span>Passport expiration date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          disabled={[
                            {
                              before: new Date(),
                            },
                          ]}
                          selected={field.value}
                          onSelect={field.onChange}
                        />
                      </PopoverContent>
                    </Popover>

                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}
          <DrawerFooter className="px-0 py-4">
            <div className="h-4" />
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}

export default StudentFileUploaderDialog;
