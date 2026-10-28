import type { Metadata } from "next";
import ShareExperienceForm from "@/components/ShareExperienceForm";

export const metadata: Metadata = {
  title: "Share your experience",
  description: "Tell other shoppers how your TechHulk order went — in words, a voice message or a short video.",
};

export default function SharePage() {
  return (
    <div className="container-page max-w-2xl py-10">
      <h1 className="section-title">Share your experience</h1>
      <p className="mt-2 text-[14px] text-slate">
        Got your order? Tell other shoppers how it went — write a few words, send a voice message, or record a short video.
      </p>
      <div className="mt-6">
        <ShareExperienceForm />
      </div>
    </div>
  );
}
