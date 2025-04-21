import PageMetaData from "@/components/page-metadata";
import Footer from "@/components/public/footer";
import ContactUs from "@/components/public/home-page/contact-us";
import CTABanner from "@/components/public/home-page/cta-banner";
import FAQ from "@/components/public/home-page/faq";
import HeroSection from "@/components/public/home-page/hero-section";
import HowAdmissionsWork from "@/components/public/home-page/how-admissions-work";
import Navbar from "@/components/public/navbar";
import { HOME_PAGE_TITLE_DESCRIPTION } from "@/data";

function Homepage() {
  const { title, description } = HOME_PAGE_TITLE_DESCRIPTION;

  return (
    <>
      <PageMetaData title={title} description={description} />
      <Navbar />
      <HeroSection />
      <HowAdmissionsWork />
      <FAQ />
      <ContactUs />
      <CTABanner />
      <Footer />
    </>
  );
}

export default Homepage;
