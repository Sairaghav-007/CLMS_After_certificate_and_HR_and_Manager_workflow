import { useState, useEffect, useRef } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  Maximize2,
  Lock,
  Download,
  Printer,
  Eye,
  Loader2
} from 'lucide-react';
import { useAuthStore } from '@/shared/store';
import { api } from '../../api/client';

interface DocumentViewerProps {
  type: 'pdf' | 'ppt';
  url: string;
  totalPages?: number;
  onPageChange: (current: number, total: number) => void;
  onComplete: () => void;
}

export function DocumentViewer({ type, url, totalPages: propTotalPages = 8, onPageChange, onComplete }: DocumentViewerProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(100);
  const user = useAuthStore(state => state.user);
  const [viewedPages, setViewedPages] = useState<Set<number>>(new Set([1]));

  // PDF.js State
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pdfTotalPages, setPdfTotalPages] = useState<number | null>(null);

  const resolvedTotalPages = type === 'pdf' ? (pdfTotalPages || 1) : propTotalPages;

  useEffect(() => {
    setCurrentPage(1);
    setViewedPages(new Set([1]));
    setPdfDoc(null);
    setPdfTotalPages(null);
    setPdfError(null);
  }, [url, type]);

  // Load PDF.js script dynamically
  useEffect(() => {
    if (type !== 'pdf' || !url) return;

    const scriptId = 'pdfjs-script';
    let script = document.getElementById(scriptId) as HTMLScriptElement;

    const initPdf = () => {
      const pdfjsLib = (window as any).pdfjsLib;
      if (!pdfjsLib) {
        setPdfError('PDF reader library failed to initialize.');
        return;
      }
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

      setLoadingPdf(true);
      setPdfError(null);

      const loadPdfFromArrayBuffer = (arrayBuffer: ArrayBuffer) => {
        const typedarray = new Uint8Array(arrayBuffer);
        const loadingTask = pdfjsLib.getDocument({ data: typedarray });
        loadingTask.promise.then((pdf: any) => {
          setPdfDoc(pdf);
          setPdfTotalPages(pdf.numPages);
          setLoadingPdf(false);
          onPageChange(1, pdf.numPages);
        }).catch((err: any) => {
          console.error('Error parsing PDF:', err);
          setPdfError('Failed to parse PDF document.');
          setLoadingPdf(false);
        });
      };

      // Always route through the backend proxy — bypasses CORS on any external URL (CloudFront, S3, etc.)
      api.get(`/employee/proxy/pdf?url=${encodeURIComponent(url)}`, { responseType: 'blob' })
        .then((res: any) => {
          const fileReader = new FileReader();
          fileReader.onload = function() {
            loadPdfFromArrayBuffer(this.result as ArrayBuffer);
          };
          fileReader.readAsArrayBuffer(res.data);
        })
        .catch((err: any) => {
          console.error('Error loading PDF via proxy:', err);
          setPdfError('Failed to load PDF document.');
          setLoadingPdf(false);
        });
    };

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      script.onload = initPdf;
      script.onerror = () => {
        setPdfError('Failed to load PDF library from CDN.');
      };
      document.body.appendChild(script);
    } else {
      if ((window as any).pdfjsLib) {
        initPdf();
      } else {
        script.addEventListener('load', initPdf);
      }
    }

    return () => {
      script.removeEventListener('load', initPdf);
    };
  }, [url, type]);

  // Render current PDF page
  useEffect(() => {
    if (!pdfDoc || type !== 'pdf') return;

    let isCurrent = true;
    pdfDoc.getPage(currentPage).then((page: any) => {
      if (!isCurrent) return;
      const canvas = canvasRef.current;
      if (!canvas) return;

      const context = canvas.getContext('2d');
      if (!context) return;

      const scale = (zoom / 100) * 1.5;
      const viewport = page.getViewport({ scale });

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };

      page.render(renderContext);
    }).catch((err: any) => {
      console.error('Error rendering page:', err);
    });

    return () => {
      isCurrent = false;
    };
  }, [pdfDoc, currentPage, zoom, type]);

  const handleNext = () => {
    if (currentPage < resolvedTotalPages) {
      const next = currentPage + 1;
      setCurrentPage(next);
      const newViewed = new Set(viewedPages).add(next);
      setViewedPages(newViewed);
      onPageChange(next, resolvedTotalPages);
      
      if (newViewed.size === resolvedTotalPages) {
        onComplete();
      }
    }
  };

  const handlePrev = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const name = user?.fullName || 'Authorized User';
  const employeeId = user ? `EMP-${user.userId}` : 'ID';

  return (
    <div className="relative flex flex-col h-full bg-surface-100 rounded-2xl overflow-hidden border border-surface-200 select-none w-full text-surface-900 font-sans">
      {/* Top Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-surface-200">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1 bg-surface-100 rounded-lg text-sm font-medium text-surface-600">
             <span className="tabular-nums">{currentPage} / {resolvedTotalPages}</span>
             <span className="text-surface-300">|</span>
             <span>{Math.round((viewedPages.size / resolvedTotalPages) * 100)}% viewed</span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setZoom(z => Math.max(50, z - 10))} className="p-1.5 hover:bg-surface-100 rounded-lg text-surface-500 transition-colors cursor-pointer">
              <ZoomOut size={18} />
            </button>
            <span className="text-xs font-bold text-surface-700 w-12 text-center">{zoom}%</span>
            <button onClick={() => setZoom(z => Math.min(200, z + 10))} className="p-1.5 hover:bg-surface-100 rounded-lg text-surface-500 transition-colors cursor-pointer">
              <ZoomIn size={18} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button disabled className="p-2 text-surface-300 cursor-not-allowed group relative" title="Download Disabled">
            <Download size={20} />
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-surface-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap">Download Restricted</div>
          </button>
          <button disabled className="p-2 text-surface-300 cursor-not-allowed group relative" title="Print Disabled">
            <Printer size={20} />
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-surface-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap">Print Restricted</div>
          </button>
          <div className="w-px h-6 bg-surface-200 mx-1" />
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-surface-200 rounded-xl text-sm font-semibold text-surface-700 hover:bg-surface-50 transition-colors cursor-pointer">
            <Maximize2 size={16} />
            Fullscreen
          </button>
        </div>
      </div>

      {/* Main Viewer Area */}
      <div className="flex-1 overflow-auto p-8 flex justify-center bg-surface-100 relative group min-h-[400px]">
        {loadingPdf && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 bg-white rounded-sm shadow-2xl p-12">
            <Loader2 className="w-10 h-10 animate-spin text-primary-500" />
            <p className="text-sm text-surface-450 font-bold uppercase tracking-widest">Loading PDF document...</p>
          </div>
        )}
        
        {pdfError && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 bg-white rounded-sm shadow-2xl p-12">
            <p className="text-sm text-danger-500 font-bold">{pdfError}</p>
          </div>
        )}

        {!loadingPdf && !pdfError && (
          <div 
            className="bg-white shadow-2xl rounded-sm transition-all duration-300 relative overflow-hidden flex flex-col justify-between"
            style={{ 
              width: type === 'pdf' ? 'auto' : `${600 * (zoom / 100)}px`, 
              height: type === 'pdf' ? 'auto' : `${800 * (zoom / 100)}px`,
              minHeight: type === 'pdf' ? 'auto' : '600px'
            }}
          >
            {type === 'pdf' && pdfDoc && (
              <div className="flex-1 w-full h-full relative p-2" style={{ pointerEvents: 'auto' }}>
                <canvas ref={canvasRef} className="max-w-full shadow-md mx-auto animate-fade-in" />
              </div>
            )}

            {type === 'ppt' && url && url.trim() !== '' && (() => {
              const isLocalhost = url.includes('localhost') || url.includes('127.0.0.1');
              if (isLocalhost) {
                return (
                  <div className="flex-1 w-full h-full relative flex flex-col items-center justify-center gap-4 p-8 text-center" style={{ pointerEvents: 'auto' }}>
                    <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center border border-primary-100">
                      <Eye className="text-primary-400 w-8 h-8" />
                    </div>
                    <div>
                      <p className="text-base font-bold text-surface-800 mb-1">Slide {currentPage} of {resolvedTotalPages}</p>
                      <p className="text-sm text-surface-500 max-w-sm">
                        PowerPoint preview requires a publicly accessible URL. In production, slides will render via Microsoft Office Online viewer.
                      </p>
                    </div>
                    <div className="mt-2 px-4 py-2 bg-surface-100 rounded-xl text-xs text-surface-400 font-mono break-all max-w-xs">
                      {url.split('/').pop()}
                    </div>
                  </div>
                );
              }
              return (
                <div className="flex-1 w-full h-full relative" style={{ pointerEvents: 'auto' }}>
                  <iframe
                    src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}&wdSlideIndex=${currentPage}`}
                    className="w-full h-full border-none"
                    title="Document Viewer"
                  />
                </div>
              );
            })()}

            {type === 'ppt' && (!url || url.trim() === '') && (
              /* Mock Content */
              <div className="p-12 space-y-8 pointer-events-none select-none text-left flex-1 flex flex-col justify-between">
                <div>
                  <div className="h-6 w-3/4 bg-surface-200/50 rounded-lg mb-6" />
                  <div className="space-y-3">
                    <div className="h-3.5 w-full bg-surface-100 rounded" />
                    <div className="h-3.5 w-full bg-surface-100 rounded" />
                    <div className="h-3.5 w-5/6 bg-surface-100 rounded" />
                  </div>
                  <div className="border border-surface-200/80 rounded-xl p-4 bg-surface-50/50 text-[11px] text-surface-400 mt-6 leading-relaxed">
                    <span>This presentation covers key learning material. Review the content thoroughly before continuing.</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6 py-6">
                   <div className="aspect-video bg-primary-50 rounded-xl flex items-center justify-center border border-primary-100/50">
                      <Eye className="text-primary-300 w-10 h-10" />
                   </div>
                   <div className="aspect-video bg-accent-50 rounded-xl flex items-center justify-center border border-accent-100/50">
                      <Lock className="text-accent-300 w-10 h-10" />
                   </div>
                </div>
              </div>
            )}

            <div className="p-6 text-center text-xs text-surface-400 border-t border-surface-100/50 font-medium">
               Slide {currentPage} of {resolvedTotalPages}
            </div>

            {/* DYNAMIC WATERMARK OVERLAY */}
            <div className="absolute inset-0 pointer-events-none select-none grid grid-cols-2 grid-rows-3 opacity-[0.03] text-surface-900">
               {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex flex-col items-center justify-center -rotate-[25deg] transform">
                     <p className="font-bold text-xs whitespace-nowrap">{name}</p>
                     <p className="text-[10px]">{employeeId}</p>
                     <p className="text-[8px]">{new Date().toLocaleDateString()}</p>
                  </div>
               ))}
            </div>
          </div>
        )}

        {/* Protection Float */}
        <div className="absolute top-4 right-4 bg-danger-500/10 backdrop-blur-md border border-danger-500/20 px-3 py-1.5 rounded-full flex items-center gap-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
           <Lock size={12} className="text-danger-600" />
           <span className="text-[10px] font-bold text-danger-700 uppercase tracking-tighter">Content Protected • Unauthorized Copying Prohibited</span>
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="px-6 py-4 bg-white border-t border-surface-200 flex items-center justify-between">
        <button 
          onClick={handlePrev}
          disabled={currentPage === 1}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-surface-600 hover:bg-surface-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
        >
          <ChevronLeft size={20} />
          Previous {type === 'pdf' ? 'Page' : 'Slide'}
        </button>

        <div className="hidden sm:flex items-center gap-4 text-xs text-surface-400 font-medium italic">
           Read each slide thoroughly to complete this module. {resolvedTotalPages - viewedPages.size} remaining.
        </div>

        <button 
          onClick={handleNext}
          disabled={currentPage === resolvedTotalPages}
          className="flex items-center gap-2 px-6 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-bold hover:bg-primary-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm shadow-primary-500/20 cursor-pointer"
        >
          {currentPage === resolvedTotalPages ? 'Finish Reading' : `Next ${type === 'pdf' ? 'Page' : 'Slide'}`}
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}
