import { Resend } from "resend";
import { toast } from "sonner";

const RESEND_API_KEY = import.meta.env.VITE_RESEND_API_KEY as string;

const resend = new Resend(RESEND_API_KEY);

export async function sendEmailNotification() {
  try {
    const { data, error } = await resend.emails.send({
      from: "Acme <onboarding@resend.dev>",
      to: ["delivered@resend.dev"],
      subject: "Hello World",
      html: "<strong>It works!</strong>",
    });

    if (error) {
      return console.error({ error });
    }

    console.log({ data });
  } catch (error) {
    const err = error as Error;
    console.log(err);
    toast.error(err.message);
  }
}
