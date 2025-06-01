import React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { motion } from "framer-motion";

const CreditFAQ: React.FC = () => {
  const faqs = [
    {
      question: "What are Tournament Credits?",
      answer:
        "Tournament Credits are used to join tournaments with entry fees. One Tournament Credit equals ₹1 in entry fee value. For example, a tournament with a ₹50 entry fee would require 50 Tournament Credits to join."
    },
    {
      question: "What are Host Credits?",
      answer:
        "Host Credits allow you to create and manage your own tournaments. One Host Credit lets you create one tournament, regardless of the tournament size or prize pool."
    },
    {
      question: "Do credits expire?",
      answer:
        "No, both Tournament Credits and Host Credits do not expire. You can use them at any time."
    },
    {
      question: "Can I convert between credit types?",
      answer:
        "No, Tournament Credits and Host Credits serve different purposes and cannot be converted between each other."
    },
    {
      question: "How do I earn more credits?",
      answer:
        "You can purchase credits through our packages, win them in tournaments, or receive them through special promotions and referral bonuses."
    },
    {
      question: "Are there any refunds for unused credits?",
      answer:
        "Credits are non-refundable once purchased. However, they never expire, so you can use them anytime."
    },
    {
      question: "How do I check my credit balance?",
      answer:
        "Your current credit balance is always displayed in the top section of the Credits page and in your profile dashboard."
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="py-8"
    >
      <h2 className="text-2xl font-bold mb-6 text-center">
        Frequently Asked Questions
      </h2>

      <div className="max-w-3xl mx-auto">
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`} className="border-gaming-border/30">
              <AccordionTrigger className="text-gaming-text hover:text-gaming-accent">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-gaming-muted">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </motion.div>
  );
};

export default CreditFAQ; 