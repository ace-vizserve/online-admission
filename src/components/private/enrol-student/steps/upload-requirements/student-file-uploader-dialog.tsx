import { deleteFile, uploadFileToBucket } from "@/actions/private";
import { Button, buttonVariants } from "@/components/ui/button";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { studentPassTypes } from "@/data";
import { cn } from "@/lib/utils";
import { StudentFileUploaderDialogProps } from "@/types";
import { ParentGuardianUploadRequirementsSchema, StudentUploadRequirementsSchema } from "@/zod-schema";
import { useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { DotPulse } from "ldrs/react";
import "ldrs/react/DotPulse.css";
import {
  CalendarIcon,
  CheckCircle2,
  CircleAlert,
  Clock,
  CloudUpload,
  Download,
  ExternalLink,
  InfoIcon,
  Loader2,
  Paperclip,
  Trash2,
  Upload,
} from "lucide-react";
import { memo, useState } from "react";
import { DropzoneOptions } from "react-dropzone";
import { useFormState } from "react-hook-form";
import { useMediaQuery } from "react-responsive";
import { Link } from "react-router";

import fileSvg from "@/assets/file.svg";
import AdvancedCalendarSelection from "@/components/ui/advanced-calendar-selection";
import { Badge } from "@/components/ui/badge";
import { PassportInput } from "@/components/ui/passport-input";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAutoSave } from "@/hooks/use-autosave";
import { useDebounce } from "@/hooks/use-debounce";
import { useSelectAcademicYear } from "@/zustand-store";

const medicalExamurl = import.meta.env.VITE_MEDICAL_EXAM_FORM_URL as string;

const NOT_FILE_INPUTS = ["passExpiry", "passType", "passportExpiry", "passportNumber"];

const MULTIPLE_FILE_UPLOADS = ["medical", "passport", "pass", "birthCert", "educCert"];

const TO_FOLLOW_DOCS = ["idPicture", "passport", "pass", "birthCert"];

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
  const [isChangingDocument, setIsChangingDocument] = useState<boolean>(false);
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
    onSettled() {
      form.trigger();
    },
  });

  const { errors } = useFormState({ control: form.control });
  const dropZoneConfig: DropzoneOptions = {
    maxFiles: MULTIPLE_FILE_UPLOADS.includes(name) ? 4 : 1,
    maxSize: 1024 * 1024 * 4, // 4MB max
    accept:
      name === "idPicture"
        ? {
            "image/png": [],
            "image/jpeg": [],
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

  async function changeDocument() {
    if (!formState.uploadRequirements?.studentUploadRequirements[name]) return;

    try {
      setIsChangingDocument(true);
      await deleteFile(formState.uploadRequirements?.studentUploadRequirements[name] as string, academicYear);

      const updatedStudentReqs = {
        ...formState.uploadRequirements!.studentUploadRequirements,
        [name]: "",
        isValid: false,
      };

      if (name === "passport") {
        updatedStudentReqs.passportNumber = "";
        updatedStudentReqs.passportExpiry = null as unknown as undefined;
        form.setValue("passportNumber", "");
        form.setValue("passportExpiry", null as unknown as undefined);
      }
      if (name === "pass") {
        updatedStudentReqs.passType = "";
        updatedStudentReqs.passExpiry = null as unknown as undefined;
        form.setValue("passType", "");
        form.setValue("passExpiry", null as unknown as undefined);
      }

      form.setValue(name, "");
      onValueChange(null);

      setFormState({
        uploadRequirements: {
          parentGuardianUploadRequirements: {
            ...formState.uploadRequirements.parentGuardianUploadRequirements,
          },
          studentUploadRequirements: {
            ...formState.uploadRequirements.studentUploadRequirements,
            ...updatedStudentReqs,
          },
        },
      });

      setIsChangingDocument(false);
    } catch (error) {
      setIsChangingDocument(false);
    } finally {
      form.setValue("isValid", false);
      form.trigger();
    }
  }

  function getWatchedFields() {
    const obj: Record<string, unknown> = {};

    NOT_FILE_INPUTS.map((key) => {
      obj[key] = form.watch(key as keyof StudentUploadRequirementsSchema);
    });

    return obj;
  }

  const debouncedAutoSaveValue = useDebounce(getWatchedFields(), 500);

  useAutoSave(
    setFormState,
    {
      ...formState,
      uploadRequirements: {
        parentGuardianUploadRequirements: {
          ...formState.uploadRequirements?.parentGuardianUploadRequirements,
        },
        studentUploadRequirements: {
          ...formState.uploadRequirements?.studentUploadRequirements,
          ...debouncedAutoSaveValue,
        },
      },
    },
    0
  );

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
          ) : formState.uploadRequirements?.studentUploadRequirements.toFollowDocs?.includes(name) ? (
            <Clock className="size-6" />
          ) : (
            <Upload className="size-6" />
          )}
          <div className="flex flex-col gap-1">
            <span className="text-sm font-semibold">{label}</span>
            <span className="text-muted-foreground font-medium text-xs">{description}</span>
          </div>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button
              className="font-semibold"
              variant={
                errors[name] != null ||
                (form.formState.errors.toFollowDocs != null && form.getValues("toFollowDocs")?.includes(name))
                  ? "destructive"
                  : "outline"
              }>
              {formState.uploadRequirements?.studentUploadRequirements?.[name]
                ? "View"
                : form.getValues("toFollowDocs")?.includes(name)
                ? "To follow"
                : "Upload"}
            </Button>
          </DialogTrigger>

          <DialogContent className="!max-w-3xl">
            <DialogHeader className="text-start">
              <DialogTitle className="font-black text-2xl">{label}</DialogTitle>
              <DialogDescription className="font-semibold">
                Upload a clear and recent document in{" "}
                <strong> {MULTIPLE_FILE_UPLOADS.includes(name) ? "PDF" : "PNG, JPG, or JPEG"}</strong> format.
              </DialogDescription>
            </DialogHeader>

            {MULTIPLE_FILE_UPLOADS.includes(name) ? (
              <Badge className="text-center !whitespace-normal mx-auto text-xs bg-amber-600/10 hover:bg-amber-600/10 text-amber-500 shadow-none">
                Upload up to 4 PDF documents. Provide all necessary information, then click Upload Files and Save
                Changes.
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
                <Button
                  disabled={isChangingDocument}
                  onClick={async () => await changeDocument()}
                  size={"sm"}
                  className="text-xs absolute right-4 top-4 font-bold">
                  {isChangingDocument && <Loader2 className="size-4 animate-spin" />}
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
                        className="relative bg-background rounded-lg cursor-no-drop">
                        <FileInput
                          {...field}
                          id="fileInput"
                          className={cn("bg-muted border-2 border-dashed pointer-events-auto", {
                            "opacity-70 cursor-not-allowed pointer-events-none":
                              formState.uploadRequirements?.studentUploadRequirements.toFollowDocs?.includes(name),
                          })}>
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
                                    [name]: undefined,
                                  });
                                  onValueChange(null);
                                  setFormState({
                                    ...formState,
                                    uploadRequirements: {
                                      ...formState.uploadRequirements!,
                                      studentUploadRequirements: {
                                        ...formState.uploadRequirements!.studentUploadRequirements,
                                        [name]: undefined,
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
              <Button disabled={isPending} onClick={uploadFile} className="gap-2 font-bold">
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

            {!formState.uploadRequirements?.studentUploadRequirements?.[name] &&
              TO_FOLLOW_DOCS.includes(name) &&
              !OPTIONAL_DOCS.includes(name) && (
                <FormField
                  control={form.control}
                  name="toFollowDocs"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-end gap-3 pt-2">
                      <div className="flex items-center gap-2">
                        <FormLabel>Document to follow</FormLabel>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <InfoIcon className="size-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent side="left" className="max-w-xs">
                            <p className="text-sm">
                              Enable this if you don't have the document ready now. You can submit it after enrollment
                              is complete.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <FormControl>
                        <Switch
                          {...field}
                          checked={form.getValues("toFollowDocs")?.includes(name)}
                          onCheckedChange={(checked) => {
                            const current = form.getValues("toFollowDocs") || [];
                            const updatedDocs = checked ? [...current, name] : current.filter((item) => item !== name);

                            const updatedStudentReqs = {
                              ...formState.uploadRequirements!.studentUploadRequirements,
                              isValid: false,
                              [name]: "",
                              toFollowDocs: updatedDocs,
                            };

                            if (checked) {
                              if (name === "passport") {
                                updatedStudentReqs.passportNumber = "";
                                updatedStudentReqs.passportExpiry = null as unknown as undefined;
                                form.setValue("passportNumber", "");
                                form.setValue("passportExpiry", null as unknown as undefined);
                              }
                              if (name === "pass") {
                                updatedStudentReqs.passType = "";
                                updatedStudentReqs.passExpiry = null as unknown as undefined;
                                form.setValue("passType", "");
                                form.setValue("passExpiry", null as unknown as undefined);
                              }
                            }

                            form.setValue(name, "");
                            form.setValue("toFollowDocs", updatedDocs);
                            onValueChange(null);

                            setFormState({
                              ...formState,
                              uploadRequirements: {
                                ...formState.uploadRequirements!,
                                studentUploadRequirements: updatedStudentReqs,
                              },
                            });

                            form.trigger();
                          }}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              )}

            {name === "pass" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 items-start gap-4 w-full">
                <FormField
                  control={form.control}
                  name="passType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pass Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger disabled={form.getValues("toFollowDocs")?.includes("pass")} className="w-full">
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
                              disabled={form.getValues("toFollowDocs")?.includes("pass")}
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}>
                              {field.value ? format(field.value, "dd/MM/yyyy") : <span>Pick a date</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <AdvancedCalendarSelection
                            setDate={(date) => {
                              if (date) {
                                const fixedDate = new Date(
                                  Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
                                );

                                field.onChange(fixedDate);

                                setFormState({
                                  uploadRequirements: {
                                    parentGuardianUploadRequirements: {
                                      ...(formState.uploadRequirements?.parentGuardianUploadRequirements ??
                                        ({} as ParentGuardianUploadRequirementsSchema)),
                                    },
                                    studentUploadRequirements: {
                                      ...(formState.uploadRequirements?.studentUploadRequirements ??
                                        ({} as StudentUploadRequirementsSchema)),
                                      passExpiry: fixedDate,
                                    },
                                  },
                                });
                              } else {
                                field.onChange(date);
                              }
                              form.trigger();
                            }}
                            date={field.value}
                            disablePastDates
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
              <div className="grid grid-cols-1 lg:grid-cols-2 items-start gap-4 w-full">
                <FormField
                  control={form.control}
                  name="passportNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Passport Number</FormLabel>
                      <FormControl>
                        <PassportInput
                          disabled={form.getValues("toFollowDocs")?.includes("passport")}
                          {...field}
                          placeholder="Enter your passport number"
                        />
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
                              disabled={form.getValues("toFollowDocs")?.includes("passport")}
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}>
                              {field.value ? format(field.value, "dd/MM/yyyy") : <span>Pick a date</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <AdvancedCalendarSelection
                            setDate={(date) => {
                              if (date) {
                                const fixedDate = new Date(
                                  Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
                                );

                                field.onChange(fixedDate);

                                setFormState({
                                  uploadRequirements: {
                                    parentGuardianUploadRequirements: {
                                      ...(formState.uploadRequirements?.parentGuardianUploadRequirements ??
                                        ({} as ParentGuardianUploadRequirementsSchema)),
                                    },
                                    studentUploadRequirements: {
                                      ...(formState.uploadRequirements?.studentUploadRequirements ??
                                        ({} as StudentUploadRequirementsSchema)),
                                      passportExpiry: fixedDate,
                                    },
                                  },
                                });
                              } else {
                                field.onChange(date);
                              }
                              form.trigger();
                            }}
                            date={field.value}
                            disablePastDates
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
  const [isChangingDocument, setIsChangingDocument] = useState<boolean>(false);
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
    onSettled() {
      form.trigger();
    },
  });

  const { errors } = useFormState({ control: form.control });
  const dropZoneConfig: DropzoneOptions = {
    maxFiles: MULTIPLE_FILE_UPLOADS.includes(name) ? 4 : 1,
    maxSize: 1024 * 1024 * 4, // 4MB max
    accept:
      name === "idPicture"
        ? {
            "image/png": [],
            "image/jpeg": [],
          }
        : {
            "application/pdf": [],
          },
  };

  function uploadFile() {
    if (value == null || !value.length) return;
    mutate(value);
  }

  async function changeDocument() {
    if (!formState.uploadRequirements?.studentUploadRequirements[name]) return;

    try {
      setIsChangingDocument(true);
      await deleteFile(formState.uploadRequirements?.studentUploadRequirements[name] as string, academicYear);

      const updatedStudentReqs = {
        ...formState.uploadRequirements!.studentUploadRequirements,
        [name]: "",
        isValid: false,
      };

      if (name === "passport") {
        updatedStudentReqs.passportNumber = "";
        updatedStudentReqs.passportExpiry = null as unknown as undefined;
        form.setValue("passportNumber", "");
        form.setValue("passportExpiry", null as unknown as undefined);
      }
      if (name === "pass") {
        updatedStudentReqs.passType = "";
        updatedStudentReqs.passExpiry = null as unknown as undefined;
        form.setValue("passType", "");
        form.setValue("passExpiry", null as unknown as undefined);
      }

      form.setValue(name, "");
      onValueChange(null);

      setFormState({
        uploadRequirements: {
          parentGuardianUploadRequirements: {
            ...formState.uploadRequirements.parentGuardianUploadRequirements,
          },
          studentUploadRequirements: {
            ...formState.uploadRequirements.studentUploadRequirements,
            ...updatedStudentReqs,
          },
        },
      });

      setIsChangingDocument(false);
    } catch (error) {
      setIsChangingDocument(false);
    } finally {
      form.setValue("isValid", false);
      form.trigger();
    }
  }

  function getWatchedFields() {
    const obj: Record<string, unknown> = {};

    NOT_FILE_INPUTS.map((key) => {
      obj[key] = form.watch(key as keyof StudentUploadRequirementsSchema);
    });

    return obj;
  }

  const debouncedAutoSaveValue = useDebounce(getWatchedFields(), 500);

  useAutoSave(
    setFormState,
    {
      ...formState,
      uploadRequirements: {
        parentGuardianUploadRequirements: {
          ...formState.uploadRequirements?.parentGuardianUploadRequirements,
        },
        studentUploadRequirements: {
          ...formState.uploadRequirements?.studentUploadRequirements,
          ...debouncedAutoSaveValue,
        },
      },
    },
    0
  );

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
          <CircleAlert className="text-destructive" />
        ) : formState.uploadRequirements?.studentUploadRequirements.toFollowDocs?.includes(name) ? (
          <Clock />
        ) : (
          <Upload />
        )}
        <div className="flex flex-col gap-1">
          <span className="text-sm font-semibold">{label}</span>
          <span className="text-muted-foreground font-medium text-xs">{description}</span>
        </div>
      </div>
      <Drawer repositionInputs={false}>
        <DrawerTrigger asChild>
          <Button
            className="font-semibold"
            variant={
              errors[name] != null ||
              (form.formState.errors.toFollowDocs != null && form.getValues("toFollowDocs")?.includes(name))
                ? "destructive"
                : "outline"
            }>
            {formState.uploadRequirements?.studentUploadRequirements?.[name]
              ? "View"
              : form.getValues("toFollowDocs")?.includes(name)
              ? "To follow"
              : "Upload"}
          </Button>
        </DrawerTrigger>

        <DrawerContent className="px-4 space-y-4">
          <DrawerHeader className="!text-start px-0 mb-0">
            <DrawerTitle className="text-xl font-black">{label}</DrawerTitle>

            <DrawerDescription className="text-xs font-semibold">
              Upload a clear and recent document in{" "}
              <strong> {MULTIPLE_FILE_UPLOADS.includes(name) ? "PDF" : "PNG, JPG, or JPEG"}</strong> format.
            </DrawerDescription>
          </DrawerHeader>

          {MULTIPLE_FILE_UPLOADS.includes(name) ? (
            <Badge className="text-center !whitespace-normal mx-auto text-xs bg-amber-600/10 hover:bg-amber-600/10 text-amber-500 shadow-none">
              Upload up to 4 PDF documents. Provide all necessary information, then click Upload Files and Save Changes.
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
              <Button
                disabled={isChangingDocument}
                onClick={async () => await changeDocument()}
                size={"sm"}
                className="text-xs absolute right-4 top-4 font-bold">
                {isChangingDocument && <Loader2 className="size-4 animate-spin" />}
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
                      className="relative bg-background rounded-lg cursor-no-drop">
                      <FileInput
                        {...field}
                        id="fileInput"
                        className={cn("bg-muted border-2 border-dashed pointer-events-auto", {
                          "opacity-70 cursor-not-allowed pointer-events-none":
                            formState.uploadRequirements?.studentUploadRequirements.toFollowDocs?.includes(name),
                        })}>
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
                                  [name]: undefined,
                                });
                                onValueChange(null);
                                setFormState({
                                  ...formState,
                                  uploadRequirements: {
                                    ...formState.uploadRequirements!,
                                    studentUploadRequirements: {
                                      ...formState.uploadRequirements!.studentUploadRequirements,
                                      [name]: undefined,
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
            <Button disabled={isPending} onClick={uploadFile} className="gap-2 font-bold">
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

          {!formState.uploadRequirements?.studentUploadRequirements?.[name] &&
            TO_FOLLOW_DOCS.includes(name) &&
            !OPTIONAL_DOCS.includes(name) && (
              <FormField
                control={form.control}
                name="toFollowDocs"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-end gap-3 pt-2">
                    <div className="flex items-center gap-2">
                      <FormLabel>Document to follow</FormLabel>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <InfoIcon className="size-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="left" className="max-w-xs">
                          <p className="text-sm">
                            Enable this if you don't have the document ready now. You can submit it after enrollment is
                            complete.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <FormControl>
                      <Switch
                        {...field}
                        checked={form.getValues("toFollowDocs")?.includes(name)}
                        onCheckedChange={(checked) => {
                          const current = form.getValues("toFollowDocs") || [];
                          const updatedDocs = checked ? [...current, name] : current.filter((item) => item !== name);

                          const updatedStudentReqs = {
                            ...formState.uploadRequirements!.studentUploadRequirements,
                            isValid: false,
                            [name]: undefined,
                            toFollowDocs: updatedDocs,
                          };

                          if (checked) {
                            if (name === "passport") {
                              updatedStudentReqs.passportNumber = "";
                              updatedStudentReqs.passportExpiry = null as unknown as undefined;
                              form.setValue("passportNumber", "");
                              form.setValue("passportExpiry", null as unknown as undefined);
                            }
                            if (name === "pass") {
                              updatedStudentReqs.passType = "";
                              updatedStudentReqs.passExpiry = null as unknown as undefined;
                              form.setValue("passType", "");
                              form.setValue("passExpiry", null as unknown as undefined);
                            }
                          }

                          form.setValue(name, undefined);
                          form.setValue("toFollowDocs", updatedDocs);
                          onValueChange(null);

                          setFormState({
                            ...formState,
                            uploadRequirements: {
                              ...formState.uploadRequirements!,
                              studentUploadRequirements: updatedStudentReqs,
                            },
                          });

                          form.trigger();
                        }}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
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
                        <SelectTrigger disabled={form.getValues("toFollowDocs")?.includes("pass")} className="w-full">
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
                            disabled={form.getValues("toFollowDocs")?.includes("pass")}
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}>
                            {field.value ? format(field.value, "dd/MM/yyyy") : <span>Pass expiration date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <AdvancedCalendarSelection
                          setDate={(date) => {
                            if (date) {
                              const fixedDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));

                              field.onChange(fixedDate);

                              setFormState({
                                uploadRequirements: {
                                  parentGuardianUploadRequirements: {
                                    ...(formState.uploadRequirements?.parentGuardianUploadRequirements ??
                                      ({} as ParentGuardianUploadRequirementsSchema)),
                                  },
                                  studentUploadRequirements: {
                                    ...(formState.uploadRequirements?.studentUploadRequirements ??
                                      ({} as StudentUploadRequirementsSchema)),
                                    passExpiry: fixedDate,
                                  },
                                },
                              });
                            } else {
                              field.onChange(date);
                            }
                            form.trigger();
                          }}
                          date={field.value}
                          disablePastDates
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
                        disabled={form.getValues("toFollowDocs")?.includes("passport")}
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
                            disabled={form.getValues("toFollowDocs")?.includes("passport")}
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}>
                            {field.value ? format(field.value, "dd/MM/yyyy") : <span>Passport expiration date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <AdvancedCalendarSelection
                          setDate={(date) => {
                            if (date) {
                              const fixedDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));

                              field.onChange(fixedDate);

                              setFormState({
                                uploadRequirements: {
                                  parentGuardianUploadRequirements: {
                                    ...(formState.uploadRequirements?.parentGuardianUploadRequirements ??
                                      ({} as ParentGuardianUploadRequirementsSchema)),
                                  },
                                  studentUploadRequirements: {
                                    ...(formState.uploadRequirements?.studentUploadRequirements ??
                                      ({} as StudentUploadRequirementsSchema)),
                                    passportExpiry: fixedDate,
                                  },
                                },
                              });
                            } else {
                              field.onChange(date);
                            }
                            form.trigger();
                          }}
                          date={field.value}
                          disablePastDates
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
