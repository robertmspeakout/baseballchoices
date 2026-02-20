"use client";

import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";
import SiteNav from "@/components/SiteNav";

const sections = [
  {
    title: "What We Collect",
    content:
      "When you create an account, we collect your name, email address, graduation year, position, and state. If you complete a recruiting profile, we also collect athletic and academic information you choose to provide, such as stats, GPA, and college preferences. We collect this information solely to power the ExtraBase matching and tracking features. We do not currently collect payment information.",
  },
  {
    title: "How We Use Your Information",
    content:
      "We use your information to operate the ExtraBase platform, personalize your experience, generate AI-powered program matches, and communicate with you about your account. We do not sell your personal information to third parties. We do not share your information with college programs or coaches without your explicit consent.",
  },
  {
    title: "Minors",
    content:
      "ExtraBase is designed for use by high school athletes and their families. Users under the age of 13 are not permitted to create accounts. Users between the ages of 13 and 17 should use ExtraBase with the involvement of a parent or guardian. If you believe a minor has provided us personal information without parental consent, contact us at the address below and we will remove it promptly.",
  },
  {
    title: "Data Storage and Security",
    content:
      "Your data is stored securely and we take reasonable technical measures to protect it from unauthorized access. No method of transmission over the internet is 100% secure and we cannot guarantee absolute security.",
  },
  {
    title: "Your Rights",
    content:
      "You may request access to, correction of, or deletion of your personal information at any time by contacting us. We will respond to all requests within 30 days.",
  },
  {
    title: "Changes to This Policy",
    content:
      "We may update this policy as the platform evolves. We will notify registered users of material changes via email.",
  },
  {
    title: "Contact",
    content:
      "ExtraBase is operated in the state of Utah. For privacy questions or requests, contact us at privacy@extrabase.com.",
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="relative text-white overflow-visible z-30">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1629219644109-b4df0ab25a7b?w=1920&q=80')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />

        <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6 py-6 sm:py-10">
          <div className="flex items-start justify-between">
            <BrandLogo size="lg" showTagline={true} />
            <SiteNav variant="dark" />
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-red-700 via-red-500 to-red-700" />
      </header>

      {/* Content */}
      <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12 w-full">
        <div className="bg-white border border-gray-200 rounded-xl p-6 sm:p-10 shadow-sm">
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mb-1">Privacy Policy</h1>
          <p className="text-sm text-gray-500 mb-6">Effective February 19, 2026</p>

          <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-8">
            ExtraBase is a college baseball recruiting platform built by parents of recruits, for recruits and their families. We take your privacy seriously, especially because many of our users are minors.
          </p>

          <div className="space-y-8">
            {sections.map((section) => (
              <div key={section.title}>
                <h2 className="text-lg font-bold text-gray-900 mb-2">{section.title}</h2>
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed">{section.content}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 mt-8">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-5 space-y-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <BrandLogo size="sm" showTagline={false} onClick={() => { handleTabChange(isLoggedIn ? "mylist" : "home"); window.scrollTo({ top: 0, behavior: "smooth" }); }} />
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-gray-400">
              <a href="#" className="hover:text-white transition-colors">Contact</a>
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            </div>
          </div>
          <p className="text-xs text-gray-500 text-center sm:text-left">
            ExtraBase is a product of JackJack Enterprises. Data is for informational purposes only. Go be great!
          </p>
        </div>
      </footer>
    </div>
  );
}
