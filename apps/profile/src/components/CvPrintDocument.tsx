import type {
  CvEducationCertItem,
  CvExperienceItem,
  CvProfileData,
  CvProjectItem,
} from '../config/profile-api';

interface CvPrintDocumentProps {
  profile: CvProfileData | null;
  experiences: CvExperienceItem[];
  projects: CvProjectItem[];
  educations: CvEducationCertItem[];
  certifications: CvEducationCertItem[];
}

function splitLines(text?: string): string[] {
  if (!text) return [];
  return text
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
}

function splitTags(text?: string): string[] {
  if (!text) return [];
  return text
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Executive ATS/AI-Readable Print CV (`hidden print:block`).
 * Single-column linear DOM order for 100% AI/ATS parser accuracy,
 * paired with refined executive typography, navy accent hierarchy, and clean card framing.
 */
export function CvPrintDocument({
  profile,
  experiences,
  projects,
  educations,
  certifications,
}: CvPrintDocumentProps) {
  const fullName = profile?.nama_lengkap || 'Bagus Hartiansyah';
  const contactParts = [profile?.lokasi, profile?.email, profile?.telepon].filter(Boolean);

  const skillRows = [
    { label: 'Frontend', raw: profile?.keahlian_frontend },
    { label: 'Backend', raw: profile?.keahlian_backend },
    { label: 'Mobile', raw: profile?.keahlian_mobile },
    { label: 'Database', raw: profile?.keahlian_database },
    { label: 'Architecture & Other', raw: profile?.keahlian_lainnya },
  ].filter((r) => Boolean(r.raw));

  return (
    <article
      className="hidden print:block text-[#0f172a] bg-white font-sans text-[10pt] leading-[1.5]"
      aria-label="Executive ATS Readable Curriculum Vitae"
    >
      {/* Executive Header */}
      <header className="cv-print-header block rounded-lg bg-[#f8fafc] border border-[#cbd5e1] border-t-4 border-t-[#1e3a8a] px-5 py-4 mb-4">
        <h1 className="text-[22pt] font-extrabold tracking-tight text-[#0f172a] m-0 leading-tight">
          {fullName}
        </h1>
        {profile?.headline && (
          <p className="text-[10.5pt] font-semibold text-[#1e40af] mt-1 mb-2">
            {profile.headline}
          </p>
        )}
        {contactParts.length > 0 && (
          <p className="text-[9.5pt] text-[#334155] m-0 font-medium">
            {contactParts.join('  •  ')}
          </p>
        )}
      </header>

      {/* Key Career Impact Highlights (Linear Table for ATS + Visual Polish) */}
      <table className="w-full border-collapse mb-4 cv-print-avoid-break">
        <tbody>
          <tr>
            {[
              { value: '6+ Years', label: 'Fullstack & Architecture' },
              { value: '54+ Institutions', label: 'Government & Enterprise' },
              { value: 'Up to 80%', label: 'Operational Efficiency' },
              { value: '75,000+', label: 'Scale Data Processed' },
            ].map((stat, i) => (
              <td
                key={stat.value}
                className={`border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2 text-center ${
                  i === 0 ? 'rounded-l-md' : ''
                }`}
              >
                <div className="text-[11pt] font-extrabold text-[#1e3a8a]">{stat.value}</div>
                <div className="text-[8.5pt] text-[#475569]">{stat.label}</div>
              </td>
            ))}
          </tr>
        </tbody>
      </table>

      {/* Professional Summary */}
      {profile?.ringkasan_profesional && (
        <section className="mb-4">
          <h2 className="cv-print-heading text-[11pt] font-extrabold uppercase tracking-wider text-[#1e3a8a] border-l-4 border-[#1e3a8a] pl-2.5 border-b border-b-[#e2e8f0] pb-1 mb-2">
            PROFESSIONAL SUMMARY
          </h2>
          <div className="space-y-1.5 text-[#1e293b]">
            {splitLines(profile.ringkasan_profesional).map((para, idx) => (
              <p key={idx} className="m-0">
                {para}
              </p>
            ))}
          </div>
        </section>
      )}

      {/* Core Skills */}
      {skillRows.length > 0 && (
        <section className="cv-print-avoid-break mb-4">
          <h2 className="cv-print-heading text-[11pt] font-extrabold uppercase tracking-wider text-[#1e3a8a] border-l-4 border-[#1e3a8a] pl-2.5 border-b border-b-[#e2e8f0] pb-1 mb-2.5">
            CORE SKILLS
          </h2>
          <table className="w-full border-collapse text-[9.5pt]">
            <tbody>
              {skillRows.map((row) => (
                <tr key={row.label} className="border-b border-[#f1f5f9]">
                  <td className="py-1.5 pr-3 font-bold text-[#0f172a] w-[155px] align-top">
                    {row.label}
                  </td>
                  <td className="py-1.5 text-[#1e293b]">
                    {splitTags(row.raw).map((tag, idx) => (
                      <span
                        key={tag}
                        className="inline-block bg-[#f1f5f9] border border-[#cbd5e1] text-[#0f172a] rounded px-1.5 py-0.5 mr-1.5 mb-1 text-[8.8pt] font-medium"
                      >
                        {tag}
                        {idx < splitTags(row.raw).length - 1 ? '' : ''}
                      </span>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* Professional Experience */}
      {experiences.length > 0 && (
        <section className="mb-4">
          <h2 className="cv-print-heading text-[11pt] font-extrabold uppercase tracking-wider text-[#1e3a8a] border-l-4 border-[#1e3a8a] pl-2.5 border-b border-b-[#e2e8f0] pb-1 mb-2.5">
            PROFESSIONAL EXPERIENCE
          </h2>
          <div className="space-y-3">
            {experiences.map((exp, idx) => (
              <div
                key={exp.id || idx}
                className="cv-print-avoid-break rounded-md border border-[#e2e8f0] bg-white px-3.5 py-2.5"
              >
                <table className="w-full border-collapse mb-1">
                  <tbody>
                    <tr>
                      <td className="align-top">
                        <h3 className="text-[10.8pt] font-bold text-[#0f172a] m-0">
                          {exp.posisi}
                        </h3>
                        <p className="text-[9.8pt] font-semibold text-[#1e40af] m-0">
                          {exp.perusahaan}
                        </p>
                      </td>
                      <td className="align-top text-right whitespace-nowrap">
                        <span className="inline-block bg-[#eff6ff] border border-[#bfdbfe] text-[#1e3a8a] rounded px-2 py-0.5 text-[8.5pt] font-semibold">
                          {exp.periode}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
                {exp.pencapaian && (
                  <ul className="list-disc pl-5 m-0 space-y-0.5 text-[9.6pt] text-[#334155]">
                    {splitLines(exp.pencapaian).map((line, i) => (
                      <li key={i}>{line}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Project Highlights */}
      {projects.length > 0 && (
        <section className="mb-4">
          <h2 className="cv-print-heading text-[11pt] font-extrabold uppercase tracking-wider text-[#1e3a8a] border-l-4 border-[#1e3a8a] pl-2.5 border-b border-b-[#e2e8f0] pb-1 mb-2.5">
            PROJECT HIGHLIGHTS
          </h2>
          <div className="space-y-2.5">
            {projects.map((proj, idx) => (
              <div
                key={proj.id || idx}
                className="cv-print-avoid-break rounded-md border border-[#e2e8f0] border-l-4 border-l-[#3b82f6] bg-[#f8fafc] px-3.5 py-2.5"
              >
                <h3 className="text-[10.3pt] font-bold text-[#0f172a] m-0">
                  {proj.nama_proyek}
                  {proj.kategori && (
                    <span className="font-normal text-[9pt] text-[#475569]">
                      {' '}— {proj.kategori}
                    </span>
                  )}
                </h3>
                <ul className="list-disc pl-5 mt-1 mb-0 space-y-0.5 text-[9.5pt] text-[#334155]">
                  {splitLines(proj.ringkasan).map((line, i) => (
                    <li key={i}>{line}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Education */}
      {educations.length > 0 && (
        <section className="cv-print-avoid-break mb-4">
          <h2 className="cv-print-heading text-[11pt] font-extrabold uppercase tracking-wider text-[#1e3a8a] border-l-4 border-[#1e3a8a] pl-2.5 border-b border-b-[#e2e8f0] pb-1 mb-2">
            EDUCATION
          </h2>
          <div className="space-y-2">
            {educations.map((ed, idx) => (
              <div
                key={ed.id || idx}
                className="rounded-md border border-[#e2e8f0] bg-[#f8fafc] px-3.5 py-2.5"
              >
                <p className="font-bold text-[10.3pt] text-[#0f172a] m-0">{ed.judul}</p>
                <p className="text-[9.5pt] text-[#334155] mt-0.5 mb-0">
                  <strong className="text-[#1e40af]">{ed.institusi}</strong>
                  {ed.tahun ? ` • ${ed.tahun}` : ''}
                  {ed.keterangan ? ` • ${ed.keterangan}` : ''}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Certifications */}
      {certifications.length > 0 && (
        <section className="cv-print-avoid-break mb-4">
          <h2 className="cv-print-heading text-[11pt] font-extrabold uppercase tracking-wider text-[#1e3a8a] border-l-4 border-[#1e3a8a] pl-2.5 border-b border-b-[#e2e8f0] pb-1 mb-2">
            CERTIFICATIONS
          </h2>
          <ul className="list-disc pl-5 m-0 space-y-1 text-[9.5pt] text-[#1e293b]">
            {certifications.map((cert, idx) => (
              <li key={cert.id || idx}>
                <strong>{cert.judul}</strong> — {cert.institusi}
                {cert.tahun ? ` (${cert.tahun})` : ''}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Additional Strengths */}
      {profile?.keunggulan_tambahan && (
        <section className="cv-print-avoid-break mb-2">
          <h2 className="cv-print-heading text-[11pt] font-extrabold uppercase tracking-wider text-[#1e3a8a] border-l-4 border-[#1e3a8a] pl-2.5 border-b border-b-[#e2e8f0] pb-1 mb-2">
            ADDITIONAL STRENGTHS
          </h2>
          <ul className="list-disc pl-5 m-0 space-y-1 text-[9.5pt] text-[#1e293b]">
            {splitLines(profile.keunggulan_tambahan).map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
