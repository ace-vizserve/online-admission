import { uploadFileToBucket } from "@/actions/private";
import fileSvg from "@/assets/file.svg";
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
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { passTypes } from "@/data";
import { cn } from "@/lib/utils";
import { ParentGuardianFileUploaderDialogProps } from "@/types";
import { ParentGuardianUploadRequirementsSchema, StudentUploadRequirementsSchema } from "@/zod-schema";
import { useMutation } from "@tanstack/react-query";
import { format, isBefore } from "date-fns";
import { DotPulse } from "ldrs/react";
import "ldrs/react/DotPulse.css";
import { CalendarIcon, CircleAlert, CloudUpload, ExternalLink, Paperclip, Trash2, Upload } from "lucide-react";
import { memo, useEffect } from "react";
import { DropzoneOptions } from "react-dropzone";
import { useFormState } from "react-hook-form";
import { useMediaQuery } from "react-responsive";
import { Link } from "react-router";

const NOT_FILE_INPUTS = [
  "motherPassExpiryDate",
  "motherPassType",
  "motherPassportExpiryDate",
  "motherPassportNumber",
  "fatherPassExpiryDate",
  "fatherPassType",
  "fatherPassportExpiryDate",
  "fatherPassportNumber",
  "guardianPassExpiryDate",
  "guardianPassType",
  "guardianPassportExpiryDate",
  "guardianPassportNumber",
];

const ParentGuardianFileUploaderDialog = memo(function ({
  form,
  value,
  onValueChange,
  name,
  label,
  description,
  formState,
  setFormState,
}: ParentGuardianFileUploaderDialogProps) {
  const { mutate, isPending } = useMutation({
    mutationFn: uploadFileToBucket,
    onSuccess(data) {
      onValueChange(null);
      if (!NOT_FILE_INPUTS.includes(name)) {
        form.setValue(name, data!.imagePath);
        setFormState({
          uploadRequirements: {
            studentUploadRequirements: {
              ...(formState.uploadRequirements?.studentUploadRequirements ?? ({} as StudentUploadRequirementsSchema)),
            },
            parentGuardianUploadRequirements: {
              ...((formState.uploadRequirements?.parentGuardianUploadRequirements ??
                {}) as ParentGuardianUploadRequirementsSchema),
              [name]: data!.imagePath,
            },
          },
        });
      }
    },
  });

  const { errors } = useFormState({ control: form.control });

  const dropZoneConfig: DropzoneOptions = {
    maxFiles: 1,
    disabled: false,
    maxSize: 1024 * 1024 * 4, // 4MB max
    multiple: false,
    accept: {
      "image/jpeg": [],
      "image/png": [],
      "application/pdf": [],
    },
  };

  const isDesktop = useMediaQuery({
    query: "(min-width: 786px)",
  });

  function uploadFile() {
    if (value == null || !value.length) return;
    mutate(value[0]);
  }

  function changeDocument() {
    if (!formState.uploadRequirements?.parentGuardianUploadRequirements[name]) return;
    form.setValue(name, "");

    setFormState({
      uploadRequirements: {
        studentUploadRequirements: {
          ...formState.uploadRequirements.studentUploadRequirements,
        },

        parentGuardianUploadRequirements: {
          ...formState.uploadRequirements.parentGuardianUploadRequirements,
          [name]: "",
        },
      },
    });
  }

  useEffect(() => {
    if (!formState.uploadRequirements?.parentGuardianUploadRequirements) return;

    const {
      motherPassExpiryDate,
      motherPassportExpiryDate,
      fatherPassExpiryDate,
      fatherPassportExpiryDate,
      guardianPassExpiryDate,
      guardianPassportExpiryDate,
    } = formState.uploadRequirements.parentGuardianUploadRequirements;

    if (motherPassExpiryDate && isBefore(motherPassExpiryDate, new Date())) {
      form.setError("motherPass", {
        message: "Please upload a new, update pass.",
      });
      form.setError("motherPassExpiryDate", {
        message: "Document is expired",
      });
    }

    if (motherPassportExpiryDate && isBefore(motherPassportExpiryDate, new Date())) {
      form.setError("motherPassport", {
        message: "Please upload a new, update passport.",
      });
      form.setError("motherPassportExpiryDate", {
        message: "Document is expired",
      });
    }

    if (fatherPassExpiryDate && isBefore(fatherPassExpiryDate, new Date())) {
      form.setError("fatherPass", {
        message: "Please upload a new, update pass.",
      });
      form.setError("fatherPassExpiryDate", {
        message: "Document is expired",
      });
    }

    if (fatherPassportExpiryDate && isBefore(fatherPassportExpiryDate, new Date())) {
      form.setError("fatherPassport", {
        message: "Please upload a new, update passport.",
      });
      form.setError("fatherPassportExpiryDate", {
        message: "Document is expired",
      });
    }

    if (guardianPassExpiryDate && isBefore(guardianPassExpiryDate, new Date())) {
      form.setError("guardianPass", {
        message: "Please upload a new, update pass.",
      });
      form.setError("guardianPassExpiryDate", {
        message: "Document is expired",
      });
    }

    if (guardianPassportExpiryDate && isBefore(guardianPassportExpiryDate, new Date())) {
      form.setError("guardianPassport", {
        message: "Please upload a new, update passport.",
      });
      form.setError("guardianPassportExpiryDate", {
        message: "Document is expired",
      });
    }

    return () => {
      form.clearErrors();
    };
  }, [form, formState.uploadRequirements?.parentGuardianUploadRequirements]);

  const errorKeys = Object.keys(errors);

  const hasMotherError = errorKeys.some((key) => key.includes("mother"));
  const hasFatherError = errorKeys.some((key) => key.includes("father"));
  const hasGuardianError = errorKeys.some((key) => key.includes("guardian"));

  if (isDesktop) {
    return (
      <div
        className={cn("flex items-center justify-between rounded-md border p-4 w-full", {
          "bg-red-50": hasMotherError || hasFatherError || hasGuardianError,
        })}>
        <div className="flex items-center gap-4">
          {errors[name] != null ? <CircleAlert className="size-6 text-destructive" /> : <Upload className="size-6" />}
          <div className="flex flex-col gap-1">
            <span className="text-sm">{label}</span>
            <span className="text-muted-foreground text-xs">{description}</span>
          </div>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant={errors[name] != null ? "destructive" : "outline"}>Upload</Button>
          </DialogTrigger>

          <DialogContent className="!max-w-2xl">
            <DialogHeader className="text-start">
              <DialogTitle>{label}</DialogTitle>
              <DialogDescription>
                Upload a clear and recent photo. Accepted formats: PNG, JPG, or JPEG, and PDF.
              </DialogDescription>
            </DialogHeader>

            {formState.uploadRequirements?.parentGuardianUploadRequirements[name] ? (
              <div className="relative w-full flex items-center justify-center flex-col gap-4 border-dashed bg-muted border-2 rounded-lg py-6">
                <Button onClick={changeDocument} size={"sm"} className="text-xs absolute right-4 top-4">
                  Change document
                </Button>
                <div className="p-6 bg-white rounded-full">
                  <img src={fileSvg} className="size-14" />
                </div>
                <p className="text-muted-foreground font-medium text-sm">{label} has been uploaded</p>

                {!NOT_FILE_INPUTS.includes(name) &&
                  formState.uploadRequirements?.parentGuardianUploadRequirements[name] && (
                    <Link
                      to={formState.uploadRequirements.parentGuardianUploadRequirements[name] as string}
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
                            <p className="text-xs text-gray-500 dark:text-gray-400">PNG, JPG, JPEG, PDF</p>
                          </div>
                        </FileInput>

                        <FileUploaderContent>
                          {value == null && formState.uploadRequirements?.parentGuardianUploadRequirements[name] && (
                            <div className="my-2 flex items-center justify-between px-1 rounded-md hover:bg-muted">
                              <div className="flex items-center gap-1">
                                <Paperclip className="h-4 w-4 stroke-current" />
                                <span className="text-sm font-medium">
                                  {(formState.uploadRequirements.parentGuardianUploadRequirements[name] as string)
                                    .split("\\")
                                    .pop()}
                                </span>
                              </div>
                              <Trash2
                                className="h-4 w-4"
                                onClick={() => {
                                  form.setValue(name, "");
                                  onValueChange(null);
                                  setFormState({
                                    ...formState,
                                    uploadRequirements: {
                                      ...formState.uploadRequirements!,
                                      studentUploadRequirements: {
                                        ...formState.uploadRequirements!.studentUploadRequirements,
                                        [name]: "",
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

            {name === "motherPass" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full">
                <FormField
                  control={form.control}
                  name="motherPassType"
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
                          {passTypes.map((passType) => (
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
                  name="motherPassExpiryDate"
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
                              {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
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

            {name === "motherPassport" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full">
                <FormField
                  control={form.control}
                  name="motherPassportNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Passport Number</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormDescription>Student’s passport number.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="motherPassportExpiryDate"
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
                              {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
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

            {name === "fatherPass" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full">
                <FormField
                  control={form.control}
                  name="fatherPassType"
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
                          {passTypes.map((passType) => (
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
                  name="fatherPassExpiryDate"
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
                              {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
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

            {name === "fatherPassport" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full">
                <FormField
                  control={form.control}
                  name="fatherPassportNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Passport Number</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormDescription>Student’s passport number.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fatherPassportExpiryDate"
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
                              {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
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

            {name === "guardianPass" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full">
                <FormField
                  control={form.control}
                  name="guardianPassType"
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
                          {passTypes.map((passType) => (
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
                  name="guardianPassExpiryDate"
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
                              {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
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

            {name === "guardianPassport" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full">
                <FormField
                  control={form.control}
                  name="guardianPassportNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Passport Number</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormDescription>Student’s passport number.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="guardianPassportExpiryDate"
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
                              {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
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
    <ParentGuardianFileUploaderDrawer
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

function ParentGuardianFileUploaderDrawer({
  description,
  form,
  formState,
  label,
  name,
  onValueChange,
  setFormState,
  value,
}: ParentGuardianFileUploaderDialogProps) {
  const { mutate, isPending } = useMutation({
    mutationFn: uploadFileToBucket,
    onSuccess(data) {
      onValueChange(null);
      if (!NOT_FILE_INPUTS.includes(name)) {
        form.setValue(name, data!.imagePath);
        setFormState({
          uploadRequirements: {
            studentUploadRequirements: {
              ...(formState.uploadRequirements?.studentUploadRequirements ?? ({} as StudentUploadRequirementsSchema)),
            },
            parentGuardianUploadRequirements: {
              ...((formState.uploadRequirements?.parentGuardianUploadRequirements ??
                {}) as ParentGuardianUploadRequirementsSchema),
              [name]: data!.imagePath,
            },
          },
        });
      }
    },
  });

  const { errors } = useFormState({ control: form.control });
  const dropZoneConfig: DropzoneOptions = {
    maxFiles: 1,
    disabled: false,
    maxSize: 1024 * 1024 * 4, // 4MB max
    multiple: false,
    accept: {
      "image/jpeg": [],
      "image/png": [],
      "application/pdf": [],
    },
  };

  function uploadFile() {
    if (value == null || !value.length) return;
    mutate(value[0]);
  }

  function changeDocument() {
    if (!formState.uploadRequirements?.parentGuardianUploadRequirements[name]) return;
    form.setValue(name, "");

    setFormState({
      uploadRequirements: {
        studentUploadRequirements: {
          ...formState.uploadRequirements.studentUploadRequirements,
        },

        parentGuardianUploadRequirements: {
          ...formState.uploadRequirements.parentGuardianUploadRequirements,
          [name]: "",
        },
      },
    });
  }

  return (
    <div
      className={cn("flex items-center justify-between rounded-md border p-4 w-full", {
        "bg-red-50": errors[name] != null,
      })}>
      <div className="flex items-center gap-4">
        {errors[name] != null ? <CircleAlert className="size-6 text-destructive" /> : <Upload className="size-6" />}
        <div className="flex flex-col gap-1">
          <span className="text-sm">{label}</span>
          <span className="text-muted-foreground text-xs text-balance">{description}</span>
        </div>
      </div>
      <Drawer>
        <DrawerTrigger asChild>
          <Button variant={errors[name] != null ? "destructive" : "outline"}>Upload</Button>
        </DrawerTrigger>

        <DrawerContent className="px-4">
          <DrawerHeader className="text-start px-0">
            <DrawerTitle>{label}</DrawerTitle>
            <DrawerDescription className="text-xs">
              Upload a clear and recent photo. Accepted formats: PNG, JPG, or JPEG and PDF.
            </DrawerDescription>
          </DrawerHeader>

          {formState.uploadRequirements?.parentGuardianUploadRequirements[name] ? (
            <div className="relative w-full flex items-center justify-center flex-col gap-4 border-dashed bg-muted border-2 rounded-lg py-6">
              <Button onClick={changeDocument} size={"sm"} className="text-xs absolute right-4 top-4">
                Change document
              </Button>
              <div className="p-6 bg-white rounded-full">
                <img src={fileSvg} className="size-14" />
              </div>
              <p className="text-muted-foreground font-medium text-sm">{label} has been uploaded</p>

              {!NOT_FILE_INPUTS.includes(name) &&
                formState.uploadRequirements?.parentGuardianUploadRequirements[name] && (
                  <Link
                    to={formState.uploadRequirements.parentGuardianUploadRequirements[name] as string}
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
                          <p className="text-xs text-gray-500 dark:text-gray-400">PNG, JPG, JPEG, PDF</p>
                        </div>
                      </FileInput>

                      <FileUploaderContent>
                        {value == null && formState.uploadRequirements?.parentGuardianUploadRequirements[name] && (
                          <div className="my-2 flex items-center justify-between px-1 rounded-md hover:bg-muted">
                            <div className="flex items-center gap-1">
                              <Paperclip className="h-4 w-4 stroke-current" />
                              <span className="text-sm font-medium">
                                {(formState.uploadRequirements.parentGuardianUploadRequirements[name] as string)
                                  .split("\\")
                                  .pop()}
                              </span>
                            </div>
                            <Trash2
                              className="h-4 w-4"
                              onClick={() => {
                                form.setValue(name, "");
                                onValueChange(null);
                                setFormState({
                                  ...formState,
                                  uploadRequirements: {
                                    ...formState.uploadRequirements!,
                                    studentUploadRequirements: {
                                      ...formState.uploadRequirements!.studentUploadRequirements,
                                      [name]: "",
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

          {name === "motherPass" && (
            <div className="grid grid-cols-1 gap-2 pt-4 w-full">
              <FormField
                control={form.control}
                name="motherPassType"
                render={({ field }) => (
                  <FormItem>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a pass type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {passTypes.map((passType) => (
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
                name="motherPassExpiryDate"
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
                            {field.value ? format(field.value, "PPP") : <span>Pass expiration date</span>}
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

          {name === "motherPassport" && (
            <div className="grid grid-cols-1 gap-2 pt-4 w-full">
              <FormField
                control={form.control}
                name="motherPassportNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input className="placeholder:text-sm" placeholder="Enter passport number" {...field} />
                    </FormControl>

                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="motherPassportExpiryDate"
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
                            {field.value ? format(field.value, "PPP") : <span>Passport expiration date</span>}
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

          {name === "fatherPass" && (
            <div className="grid grid-cols-1 gap-2 pt-4 w-full">
              <FormField
                control={form.control}
                name="fatherPassType"
                render={({ field }) => (
                  <FormItem>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a pass type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {passTypes.map((passType) => (
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
                name="fatherPassExpiryDate"
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
                            {field.value ? format(field.value, "PPP") : <span>Pass expiration date</span>}
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

          {name === "fatherPassport" && (
            <div className="grid grid-cols-1 gap-2 pt-4 w-full">
              <FormField
                control={form.control}
                name="fatherPassportNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input className="placeholder:text-sm" placeholder="Enter passport number" {...field} />
                    </FormControl>

                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fatherPassportExpiryDate"
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
                            {field.value ? format(field.value, "PPP") : <span>Passport expiration date</span>}
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

          {name === "guardianPass" && (
            <div className="grid grid-cols-1 gap-2 pt-4 w-full">
              <FormField
                control={form.control}
                name="guardianPassType"
                render={({ field }) => (
                  <FormItem>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a pass type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {passTypes.map((passType) => (
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
                name="guardianPassExpiryDate"
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
                            {field.value ? format(field.value, "PPP") : <span>Pass expiration date</span>}
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

          {name === "guardianPassport" && (
            <div className="grid grid-cols-1 gap-2 pt-4 w-full">
              <FormField
                control={form.control}
                name="guardianPassportNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input className="placeholder:text-sm" placeholder="Enter passport number" {...field} />
                    </FormControl>

                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="guardianPassportExpiryDate"
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
                            {field.value ? format(field.value, "PPP") : <span>Passport expiration date</span>}
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
          <DrawerFooter className="px-0"></DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}

export default ParentGuardianFileUploaderDialog;
