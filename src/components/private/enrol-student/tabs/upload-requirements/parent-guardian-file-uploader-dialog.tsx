import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FileInput, FileUploader, FileUploaderContent, FileUploaderItem } from "@/components/ui/file-input";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { passTypes } from "@/data";
import { cn } from "@/lib/utils";
import { ParentGuardianFileUploaderDialogProps } from "@/types";
import { format } from "date-fns";
import { CalendarIcon, CircleAlert, CloudUpload, Paperclip, Trash2, Upload } from "lucide-react";
import { memo } from "react";
import { DropzoneOptions } from "react-dropzone";
import { useFormState } from "react-hook-form";

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

  return (
    <div
      className={cn("flex items-center justify-between rounded-md border p-4 w-full", {
        "bg-red-50": errors[name] != null,
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
                name="passExpiryDate"
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

          {name === "passport" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full">
              <FormField
                control={form.control}
                name="passportNumber"
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
                name="passportExpiryDate"
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
});

export default ParentGuardianFileUploaderDialog;
