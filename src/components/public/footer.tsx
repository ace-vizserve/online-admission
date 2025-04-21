import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { FacebookIcon, InstagramIcon, LinkedinIcon } from "lucide-react";
import { Link } from "react-router";
import Logo from "../logo";

const footerLinks = [
  {
    title: "About HFSE",
    to: "#",
  },
  {
    title: "Admission",
    to: "#",
  },
  {
    title: "FAQ",
    to: "#",
  },
  {
    title: "Contact Us",
    to: "#",
  },
  {
    title: "Help",
    to: "#",
  },
  {
    title: "Privacy",
    to: "#",
  },
];

function Footer() {
  return (
    <footer className="border-t bg-background dark">
      <div className="max-w-screen-xl mx-auto">
        <div className="py-12 flex flex-col sm:flex-row items-start justify-between gap-x-8 gap-y-10 px-6 xl:px-0">
          <div>
            {/* Logo */}
            <div className="rounded-lg p-2 bg-white w-max">
              <Logo />
            </div>

            <ul className="mt-6 flex items-center gap-4 flex-wrap">
              {footerLinks.map(({ title, to }) => (
                <li key={title}>
                  <Link to={to} className="text-muted-foreground hover:text-foreground">
                    {title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Subscribe Newsletter */}
          <div className="max-w-full sm:max-w-xs lg:max-w-md w-full">
            <h6 className="font-semibold">Stay up to date</h6>
            <form className="mt-6 flex items-center gap-2">
              <Input className="text-white" type="email" placeholder="Enter your email" />
              <Button>Subscribe</Button>
            </form>
          </div>
        </div>
        <Separator />
        <div className="py-8 flex flex-col-reverse sm:flex-row items-center justify-between gap-x-2 gap-y-5 px-6 xl:px-0">
          {/* Copyright */}
          <span className="text-muted-foreground">
            &copy; {new Date().getFullYear()}{" "}
            <Link to="/" target="_blank">
              HFSE International School Online Admission
            </Link>
            . All rights reserved.
          </span>

          <div className="flex items-center gap-5 text-muted-foreground">
            <Link to="#" target="_blank">
              <FacebookIcon className="h-5 w-5" />
            </Link>
            <Link to="#" target="_blank">
              <InstagramIcon className="h-5 w-5" />
            </Link>
            <Link to="#" target="_blank">
              <LinkedinIcon className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
