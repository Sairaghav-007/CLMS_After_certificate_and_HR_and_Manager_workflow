import { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Award, 
  Download, 
  Eye, 
  Search, 
  Calendar, 
  ShieldCheck, 
  X,
  FileText,
  Loader2
} from 'lucide-react';
import { useCourseStore, useUIStore } from '@/shared/store';
import { formatDate } from '@/shared/utils';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { api } from '../api/client';

export function CertificatesPage() {
  const { courses } = useCourseStore();
  const { addToast } = useUIStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCert, setSelectedCert] = useState<any | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const certificateRef = useRef<HTMLDivElement>(null);
  const [dbCertificates, setDbCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get('/employee/certificates')
      .then((res) => {
        const mapped = res.data.map((c: any) => ({
          id: String(c.id),
          certificateNumber: c.certificateNumber,
          courseName: c.courseName,
          completionDate: c.issuedAt,
          employeeName: c.employeeName,
          verificationUrl: c.verificationUrl || 'https://verify.clms.com/certificates/' + c.id,
          qrCodeData: c.qrCodeData || 'https://verify.clms.com/certificates/' + c.id,
          instructorSignature: "Corporate Trainer",
          instructorName: "L&D Director",
          employeeId: "EMP-" + String(c.id),
        }));
        setDbCertificates(mapped);
      })
      .catch((err) => {
        console.error("Failed to fetch certificates:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const certificates = useMemo(() => {
    if (!searchQuery) return dbCertificates;
    return dbCertificates.filter(cert => 
      cert.courseName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cert.certificateNumber?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [dbCertificates, searchQuery]);

  const downloadRef = useRef<HTMLDivElement>(null);
  const [downloadCert, setDownloadCert] = useState<any | null>(null);

  const handleDownloadPDF = async (cert: any) => {
    setIsDownloading(true);
    setDownloadCert(cert);
    addToast({
      title: 'Generating PDF',
      message: 'Compiling landscape certificate and assets...',
      type: 'info'
    });

    try {
      // Allow the off-screen element to fully render
      await new Promise((resolve) => setTimeout(resolve, 400));
      
      if (!downloadRef.current) {
        throw new Error("Download element reference not found");
      }

      // html2canvas with explicit background — avoids oklch CSS variable parsing errors
      const canvas = await html2canvas(downloadRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        // Ignore CSS variables that may contain oklch() — render with computed values
        onclone: (doc) => {
          const el = doc.querySelector('[data-cert-download]') as HTMLElement;
          if (el) {
            el.style.color = '#0f172a';
            el.style.backgroundColor = '#ffffff';
          }
        },
      });

      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      pdf.addImage(imgData, 'PNG', 0, 0, 297, 210);
      pdf.save(`${cert.courseName.replace(/\s+/g, '_')}_Certificate.pdf`);

      addToast({
        title: 'Download Successful',
        message: 'Your certificate PDF is now saved to your device.',
        type: 'success'
      });
    } catch (err) {
      console.error(err);
      addToast({
        title: 'Export Failed',
        message: 'Unable to compile certificate PDF file at this time.',
        type: 'error'
      });
    } finally {
      setDownloadCert(null);
      setIsDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
        <p className="text-xs text-surface-450 mt-2 font-semibold">Loading certificates...</p>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto text-left font-sans select-none">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-xl lg:text-2xl font-black text-surface-900 tracking-tight">Your Certificates</h1>
          <p className="text-xs text-surface-450 font-semibold mt-1">Browse, view, and export credentials you have earned.</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-2.5 px-4 py-3 bg-white border border-surface-200 rounded-2xl mb-8 max-w-md">
        <Search size={18} className="text-surface-400" />
        <input 
          type="text" 
          placeholder="Search by course name or cert ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-transparent text-xs text-surface-800 border-none outline-none w-full font-semibold placeholder-surface-400"
        />
      </div>

      {/* Grid List */}
      {certificates.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-3xl border border-surface-200/80 min-h-[300px]">
          <Award className="w-12 h-12 text-surface-300 mb-4 opacity-40 animate-pulse" />
          <h3 className="text-sm font-black text-surface-800">No Credentials Found</h3>
          <p className="text-xs text-surface-450 max-w-xs mt-1.5 leading-relaxed font-semibold">
            {searchQuery 
              ? 'No certificates matched your search criteria.' 
              : 'Complete mandatory or elective training and pass the quiz to obtain completion certificates.'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {certificates.map((cert) => (
            <motion.div
              key={cert.id}
              layoutId={`cert-card-${cert.id}`}
              className="bg-white border border-surface-200 rounded-3xl overflow-hidden hover:shadow-lg transition-all flex flex-col justify-between"
            >
              <div className="p-6 text-left">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20 mb-4">
                  <Award size={20} />
                </div>
                
                <h3 className="font-bold text-sm text-surface-900 leading-snug line-clamp-2 mb-2 min-h-[40px]">
                  {cert.courseName}
                </h3>
                
                <div className="space-y-1.5 text-[11px] text-surface-500 font-semibold mb-4">
                  <div className="flex items-center gap-1.5">
                    <Calendar size={13} className="text-surface-400" />
                    <span>Completed {formatDate(cert.completionDate)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <FileText size={13} className="text-surface-400" />
                    <span className="truncate">Cert ID: {cert.certificateNumber}</span>
                  </div>
                </div>
              </div>

              {/* Actions footer */}
              <div className="px-6 py-4 bg-surface-50 border-t border-surface-100 flex items-center justify-between gap-3">
                <button
                  onClick={() => setSelectedCert(cert)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white border border-surface-200 hover:border-surface-300 text-surface-700 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                >
                  <Eye size={14} />
                  Preview
                </button>
                <button
                  onClick={() => handleDownloadPDF(cert)}
                  disabled={isDownloading}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold text-xs transition-colors cursor-pointer shadow-sm shadow-primary-500/5 disabled:opacity-60"
                >
                  {isDownloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                  Download
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Landscape Preview Modal */}
      <AnimatePresence>
        {selectedCert && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedCert(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-4xl bg-surface-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl z-10 flex flex-col justify-between"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-surface-900">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={16} className="text-success-400" />
                  <span className="text-[10px] font-black uppercase tracking-wider text-white/80">Secured Landscape Preview</span>
                </div>
                <button
                  onClick={() => setSelectedCert(null)}
                  className="p-1.5 rounded-lg hover:bg-white/5 text-white/60 hover:text-white transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Certificate Preview */}
              <div className="p-6 overflow-x-auto overflow-y-hidden bg-surface-950 flex justify-center items-center">
                <div 
                  className="w-[841px] h-[595px] flex-shrink-0 bg-white text-surface-900 p-12 border-[16px] border-double border-amber-600 relative select-none flex flex-col justify-between shadow-lg text-center"
                  style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
                >
                  <div className="absolute top-4 left-4 right-4 bottom-4 border border-amber-600/30 pointer-events-none" />

                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white mb-4 border border-amber-500">
                      <Award size={36} />
                    </div>
                    <h2 className="text-3xl font-bold tracking-wide text-amber-800 uppercase" style={{ letterSpacing: '4px' }}>
                      Certificate of Completion
                    </h2>
                    <div className="w-40 h-[1.5px] bg-amber-500/50 my-3" />
                    <p className="text-[11px] uppercase tracking-widest text-surface-500 font-black" style={{ letterSpacing: '2px' }}>
                      This credential certifies that
                    </p>
                  </div>

                  <div className="my-2">
                    <h1 className="text-4xl font-extrabold text-surface-950 border-b border-surface-200 pb-2 max-w-xl mx-auto italic">
                      {selectedCert.employeeName}
                    </h1>
                    <p className="text-xs text-surface-500 mt-3 max-w-md mx-auto leading-relaxed" style={{ fontWeight: '500' }}>
                      has successfully completed the corporate competency training requirements for:
                    </p>
                    <h3 className="text-lg font-bold text-amber-800 mt-2 max-w-lg mx-auto leading-tight" style={{ fontWeight: '800' }}>
                      {selectedCert.courseName}
                    </h3>
                  </div>

                  <div className="grid grid-cols-3 items-end gap-6 border-t border-surface-100 pt-6">
                    <div className="text-left space-y-1.5 text-[10px] text-surface-500 font-semibold leading-tight">
                      <p className="text-surface-400 uppercase tracking-wider text-[8px] font-black">Credential Details</p>
                      <p>Number: <span className="font-bold text-surface-800">{selectedCert.certificateNumber}</span></p>
                      <p>Date: <span className="font-bold text-surface-800">{formatDate(selectedCert.completionDate)}</span></p>
                      <p>ID: <span className="font-bold text-surface-800">{selectedCert.employeeId}</span></p>
                    </div>

                    <div className="flex flex-col items-center">
                      <div className="w-32 border-b border-surface-300 pb-1 italic font-serif text-sm text-surface-700 font-bold max-w-[150px] truncate">
                        {selectedCert.instructorSignature || selectedCert.instructorName}
                      </div>
                      <p className="text-[9px] uppercase tracking-widest text-surface-500 font-black mt-1.5">Authorized Signatory</p>
                    </div>

                    <div className="flex flex-col items-end">
                      <div className="p-1 bg-white border border-surface-200 rounded-lg">
                        <QRCodeSVG value={selectedCert.verificationUrl} size={55} level="H" />
                      </div>
                      <p className="text-[8px] uppercase tracking-widest text-surface-400 font-black mt-1.5">Scan to Verify</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="px-6 py-4 bg-surface-900 border-t border-white/5 flex items-center justify-end gap-3">
                <button
                  onClick={() => setSelectedCert(null)}
                  className="px-4 py-2 border border-white/10 hover:border-white/20 text-white/70 hover:text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-colors cursor-pointer"
                >
                  Close
                </button>
                <button
                  onClick={() => handleDownloadPDF(selectedCert)}
                  disabled={isDownloading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-500 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-colors cursor-pointer shadow-md shadow-primary-500/10 disabled:opacity-60"
                >
                  {isDownloading ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Exporting...</span>
                    </>
                  ) : (
                    <>
                      <Download size={14} />
                      <span>Export Landscape PDF</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Off-screen download target — ONLY inline hex/rgb styles, NO Tailwind color classes.
          html2canvas cannot parse oklch() color functions that Tailwind v4 emits at runtime. */}
      {downloadCert && (
        <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', overflow: 'hidden' }}>
          <div
            ref={downloadRef}
            data-cert-download="true"
            style={{
              width: '841px',
              height: '595px',
              flexShrink: 0,
              backgroundColor: '#ffffff',
              color: '#0f172a',
              padding: '48px',
              border: '16px double #b45309',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              textAlign: 'center',
              fontFamily: "'Georgia', 'Times New Roman', serif",
            }}
          >
            <div style={{ position: 'absolute', top: '16px', left: '16px', right: '16px', bottom: '16px', border: '1px solid rgba(180,83,9,0.3)', pointerEvents: 'none' }} />

            {/* Header */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg, #f59e0b, #d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', border: '1px solid #d97706' }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="8" r="6"/>
                  <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>
                </svg>
              </div>
              <h2 style={{ fontSize: '28px', fontWeight: 'bold', letterSpacing: '4px', color: '#92400e', textTransform: 'uppercase', margin: '0 0 8px' }}>
                Certificate of Completion
              </h2>
              <div style={{ width: '160px', height: '2px', backgroundColor: 'rgba(245,158,11,0.5)', margin: '12px auto' }} />
              <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '2px', color: '#64748b', fontWeight: 900, fontFamily: 'Inter, system-ui, sans-serif', margin: 0 }}>
                This credential certifies that
              </p>
            </div>

            {/* Employee name */}
            <div style={{ margin: '8px 0' }}>
              <h1 style={{ fontSize: '36px', fontWeight: 800, color: '#020617', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', maxWidth: '520px', margin: '0 auto', fontStyle: 'italic' }}>
                {downloadCert.employeeName}
              </h1>
              <p style={{ fontSize: '12px', color: '#64748b', marginTop: '12px', maxWidth: '400px', margin: '12px auto 0', lineHeight: '1.6', fontFamily: 'Inter, system-ui, sans-serif', fontWeight: 500 }}>
                has successfully completed the corporate competency training requirements for:
              </p>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#92400e', marginTop: '8px', maxWidth: '500px', margin: '8px auto 0', lineHeight: '1.4', fontFamily: 'Inter, system-ui, sans-serif' }}>
                {downloadCert.courseName}
              </h3>
            </div>

            {/* Footer */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px', borderTop: '1px solid #f1f5f9', paddingTop: '24px', fontFamily: 'Inter, system-ui, sans-serif', alignItems: 'end' }}>
              <div style={{ textAlign: 'left' }}>
                <p style={{ fontSize: '8px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 900, color: '#94a3b8', marginBottom: '6px' }}>Credential Details</p>
                <p style={{ fontSize: '10px', color: '#64748b', margin: '2px 0', fontWeight: 600 }}>Number: <strong style={{ color: '#1e293b' }}>{downloadCert.certificateNumber}</strong></p>
                <p style={{ fontSize: '10px', color: '#64748b', margin: '2px 0', fontWeight: 600 }}>Date: <strong style={{ color: '#1e293b' }}>{formatDate(downloadCert.completionDate)}</strong></p>
                <p style={{ fontSize: '10px', color: '#64748b', margin: '2px 0', fontWeight: 600 }}>ID: <strong style={{ color: '#1e293b' }}>{downloadCert.employeeId}</strong></p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ borderBottom: '1px solid #cbd5e1', paddingBottom: '4px', fontSize: '13px', fontStyle: 'italic', color: '#475569', fontWeight: 'bold', width: '128px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'center' }}>
                  {downloadCert.instructorSignature || downloadCert.instructorName}
                </div>
                <p style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '2px', color: '#94a3b8', fontWeight: 900, marginTop: '6px' }}>Authorized Signatory</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <div style={{ padding: '4px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                  <QRCodeSVG value={downloadCert.verificationUrl || 'https://verify.clms.com'} size={55} level="H" fgColor="#000000" bgColor="#ffffff" />
                </div>
                <p style={{ fontSize: '8px', textTransform: 'uppercase', letterSpacing: '2px', color: '#94a3b8', fontWeight: 900, marginTop: '6px' }}>Scan to Verify</p>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
