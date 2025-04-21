import MaxWidthWrapper from "@/components/max-width-wrapper";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { faq } from "@/data";

function FAQ() {
  return (
    <MaxWidthWrapper className="py-12 md:py-16 lg:py-20">
      <div className="flex flex-col md:flex-row items-start justify-center gap-x-12 gap-y-6">
        <h2 className="text-4xl lg:text-5xl !leading-[1.15] font-bold tracking-tight">
          Frequently Asked <br /> Questions
        </h2>
        <Accordion type="single" defaultValue="question-0" className="max-w-xl">
          {faq.map(({ question, answer }, index) => (
            <AccordionItem key={question} value={`question-${index}`}>
              <AccordionTrigger className="text-left text-lg">{question}</AccordionTrigger>
              <AccordionContent>{answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </MaxWidthWrapper>
  );
}

export default FAQ;
