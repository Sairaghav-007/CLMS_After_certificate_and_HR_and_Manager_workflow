import { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  Maximize2,
  Lock,
  Download,
  Printer,
  Eye
} from 'lucide-react';
import { useAuthStore } from '@/shared/store';

interface DocumentViewerProps {
  type: 'pdf' | 'ppt';
  url: string;
  totalPages?: number;
  onPageChange: (current: number, total: number) => void;
  onComplete: () => void;
}

export function DocumentViewer({ type, url: _url, totalPages = 10, onPageChange, onComplete }: DocumentViewerProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(100);
  const user = useAuthStore(state => state.user);
  const [viewedPages, setViewedPages] = useState<Set<number>>(new Set([1]));

  const handleNext = () => {
    if (currentPage < totalPages) {
      const next = currentPage + 1;
      setCurrentPage(next);
      const newViewed = new Set(viewedPages).add(next);
      setViewedPages(newViewed);
      onPageChange(next, totalPages);
      
      if (newViewed.size === totalPages) {
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
    <div className="relative flex flex-col h-full bg-surface-100 rounded-2xl overflow-hidden border border-surface-200 select-none w-full text-surface-900">
      {/* Top Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-surface-200">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1 bg-surface-100 rounded-lg text-sm font-medium text-surface-600">
             <span className="tabular-nums">{currentPage} / {totalPages}</span>
             <span className="text-surface-300">|</span>
             <span>{Math.round((viewedPages.size / totalPages) * 100)}% viewed</span>
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
          {/* Disabled buttons to show restrictions */}
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
        {/* The "Page" */}
        <div 
          className="bg-white shadow-2xl rounded-sm transition-all duration-300 relative overflow-hidden flex flex-col justify-between"
          style={{ 
            width: `${600 * (zoom / 100)}px`, 
            height: `${800 * (zoom / 100)}px`,
            minHeight: '600px'
          }}
        >
          {/* Mock Content */}
          <div className="p-12 space-y-8 pointer-events-none select-none text-left">
            <div className="h-6 w-3/4 bg-surface-200/50 rounded-lg mb-6" />
            <div className="space-y-3">
              <div className="h-3.5 w-full bg-surface-100 rounded" />
              <div className="h-3.5 w-full bg-surface-100 rounded" />
              <div className="h-3.5 w-5/6 bg-surface-100 rounded" />
              <div className="h-3.5 w-full bg-surface-100 rounded" />
              <div className="h-3.5 w-2/3 bg-surface-100 rounded" />
            </div>
            
            <div className="border border-surface-200/80 rounded-xl p-4 bg-surface-50/50 text-[11px] text-surface-400 mt-6 leading-relaxed">
              <span>This document covers key learning material for the section. Take notes using the side note panel. Review the content thoroughly before continuing to the next slide.</span>
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

          <div className="p-6 text-center text-xs text-surface-400 border-t border-surface-100/50 font-medium">
             Slide {currentPage} of {totalPages}
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
           Read each slide thoroughly to complete this module. {totalPages - viewedPages.size} remaining.
        </div>

        <button 
          onClick={handleNext}
          disabled={currentPage === totalPages}
          className="flex items-center gap-2 px-6 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-bold hover:bg-primary-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm shadow-primary-500/20 cursor-pointer"
        >
          {currentPage === totalPages ? 'Finish Reading' : `Next ${type === 'pdf' ? 'Page' : 'Slide'}`}
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}
