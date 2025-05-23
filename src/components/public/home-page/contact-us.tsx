import MaxWidthWrapper from "@/components/max-width-wrapper";
import { MailIcon, MapPinIcon, PhoneIcon } from "lucide-react";
import { Link } from "react-router";

function ContactUs() {
  return (
    <MaxWidthWrapper className="py-12 md:py-16 lg:py-20">
      <div className="text-center">
        <b className="text-muted-foreground">Contact Us</b>
        <h2 className="mt-3 text-2xl md:text-4xl font-bold tracking-tight">Get In Touch</h2>
        <p className="mt-4 text-base sm:text-lg">Our friendly team is always here to chat.</p>
        <div className="max-w-screen-xl mx-auto py-24 grid md:grid-cols-2 lg:grid-cols-3 gap-16 md:gap-10 px-6 md:px-0">
          <div className="text-center flex flex-col items-center">
            <div className="h-12 w-12 flex items-center justify-center bg-primary/10 text-primary rounded-full">
              <MailIcon />
            </div>
            <h3 className="mt-6 font-semibold text-xl">Email</h3>
            <p className="mt-2 text-muted-foreground">Our friendly team is here to help.</p>
            <Link className="mt-4 font-medium text-primary" to="mailto:akashmoradiya3444@gmail.com">
              test@gmail.com
            </Link>
          </div>
          <div className="text-center flex flex-col items-center">
            <div className="h-12 w-12 flex items-center justify-center bg-primary/10 text-primary rounded-full">
              <MapPinIcon />
            </div>
            <h3 className="mt-6 font-semibold text-xl">Office</h3>
            <p className="mt-2 text-muted-foreground">Come say hello at our office HQ.</p>
            <Link className="mt-4 font-medium text-primary" to="https://map.google.com" target="_blank">
              223 Mountbatten Road, 01-08 223@Mountbatten Singapore 398008
            </Link>
          </div>
          <div className="text-center flex flex-col items-center">
            <div className="h-12 w-12 flex items-center justify-center bg-primary/10 text-primary rounded-full">
              <PhoneIcon />
            </div>
            <h3 className="mt-6 font-semibold text-xl">Phone</h3>
            <p className="mt-2 text-muted-foreground">Mon-Fri from 8am to 5pm.</p>
            <Link className="mt-4 font-medium text-primary" to="tel:akashmoradiya3444@gmail.com">
              +65 6451 0080
            </Link>
          </div>
        </div>
      </div>
    </MaxWidthWrapper>
  );
}

export default ContactUs;
