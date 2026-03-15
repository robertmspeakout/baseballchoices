import { Metadata } from "next";
import { readFileSync } from "fs";
import { join } from "path";

/* eslint-disable @typescript-eslint/no-explicit-any */

let schoolsData: any[] | null = null;

function getSchools(): any[] {
  if (!schoolsData) {
    const filePath = join(process.cwd(), "src/data/schools.json");
    schoolsData = JSON.parse(readFileSync(filePath, "utf-8"));
  }
  return schoolsData!;
}

function getSchool(id: string): any | null {
  const schools = getSchools();
  return schools.find((s) => s.id === parseInt(id)) || null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const school = getSchool(id);

  if (!school) {
    return { title: "School Not Found" };
  }

  const title = `${school.name} ${school.mascot} Baseball – ${school.division} | ${school.conference}`;
  const description = `${school.name} ${school.mascot} baseball program in ${school.city}, ${school.state}. ${school.division} – ${school.conference}. ${school.head_coach_name ? `Head Coach: ${school.head_coach_name}.` : ""} ${school.last_season_record ? `Last season: ${school.last_season_record}.` : ""} View recruiting info, stats, and more on ExtraBase.`;

  return {
    title,
    description,
    alternates: {
      canonical: `/school/${id}`,
    },
    openGraph: {
      title,
      description,
      url: `https://extrabase.app/school/${id}`,
      siteName: "ExtraBase",
      type: "website",
      ...(school.logo_url ? { images: [{ url: school.logo_url, alt: `${school.name} ${school.mascot} logo` }] } : {}),
    },
    twitter: {
      card: "summary",
      title,
      description,
      ...(school.logo_url ? { images: [school.logo_url] } : {}),
    },
  };
}

export default async function SchoolLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const school = getSchool(id);

  if (!school) {
    return <>{children}</>;
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SportsTeam",
    name: `${school.name} ${school.mascot} Baseball`,
    sport: "Baseball",
    url: `https://extrabase.app/school/${id}`,
    ...(school.logo_url ? { logo: school.logo_url } : {}),
    memberOf: [
      {
        "@type": "SportsOrganization",
        name: school.conference,
      },
      {
        "@type": "SportsOrganization",
        name: `NCAA ${school.division}`,
      },
    ],
    location: {
      "@type": "Place",
      ...(school.stadium_name ? { name: school.stadium_name } : {}),
      address: {
        "@type": "PostalAddress",
        addressLocality: school.city,
        addressRegion: school.state,
        ...(school.zip ? { postalCode: school.zip } : {}),
      },
    },
    parentOrganization: {
      "@type": "CollegeOrUniversity",
      name: school.name,
      ...(school.website ? { url: school.website } : {}),
    },
    ...(school.head_coach_name
      ? {
          coach: {
            "@type": "Person",
            name: school.head_coach_name,
          },
        }
      : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </>
  );
}
