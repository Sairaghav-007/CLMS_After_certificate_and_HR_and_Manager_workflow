import React, { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { Session, SessionType } from '@/hr/types/course';
import { useCourseStore } from '@/hr/store/useCourseStore';
import { useThemeStore } from '@/hr/store';
import { cn } from '@/hr/lib/utils';
import { Video, FileText, Presentation, Plus, Upload, CheckCircle2, FileUp, Copy, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import { uploadFileToS3, isS3Configured } from '@/hr/lib/s3';

const sessionSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  type: z.enum(['Video', 'PDF', 'PPT']),
  duration: z.number().min(0),
  videoDescription: z.string().optional(),
  pdfDescription: z.string().optional(),
  pptDescription: z.string().optional(),
});

type SessionFormValues = z.infer<typeof sessionSchema>;

interface SessionFormProps {
  session: Session;
  moduleId: string;
  onClose: () => void;
}

export const SessionForm: React.FC<SessionFormProps> = ({ session, moduleId, onClose }) => {
  const { updateSession } = useCourseStore();
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [uploadedFile, setUploadedFile] = useState<{name: string, url: string} | null>(
    session.videoUrl ? { name: 'Video Uploaded', url: session.videoUrl } :
    session.pdfUrl ? { name: 'PDF Uploaded', url: session.pdfUrl } :
    session.pptUrl ? { name: 'PPT Uploaded', url: session.pptUrl } : null
  );

  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SessionFormValues>({
    resolver: zodResolver(sessionSchema),
    defaultValues: {
      title: session.title,
      description: session.description,
      type: session.type,
      duration: session.duration || 0,
      videoDescription: session.videoDescription,
      pdfDescription: session.pdfDescription,
      pptDescription: session.pptDescription,
    },
  });

  const sessionType = watch('type');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      setUploadProgress(0);

      // Inform user of configuration status
      if (!isS3Configured()) {
        toast.custom(
          (t) => (
            <div className={cn(
              "px-4 py-3 rounded-2xl border flex flex-col shadow-xl animate-fade-in text-xs font-bold leading-relaxed",
              isDark ? "bg-surface-800 border-surface-700 text-surface-200" : "bg-white border-surface-200 text-surface-700"
            )}>
              <span className="text-amber-500 font-extrabold uppercase tracking-wider mb-1">S3 Simulation Fallback</span>
              <span>S3 keys not configured in .env. Simulating S3 upload...</span>
            </div>
          ),
          { duration: 4000 }
        );
      } else {
        toast.success(`Uploading ${file.name} to Amazon S3...`, {
          style: {
            background: isDark ? '#1e293b' : '#ffffff',
            color: isDark ? '#f8fafc' : '#0f172a',
          }
        });
      }

      try {
        const url = await uploadFileToS3(file, (pct) => {
          setUploadProgress(pct);
        });

        setUploadedFile({ name: file.name, url });
        
        // Auto-set duration for demo if it's 0
        if (watch('duration') === 0) {
          setValue('duration', 120); // Default 2 mins for demo
        }

        toast.success(`${file.name} uploaded successfully!`, {
          style: {
            background: isDark ? '#1e293b' : '#ffffff',
            color: isDark ? '#f8fafc' : '#0f172a',
          }
        });
      } catch (err) {
        toast.error(`Upload failed: ${(err as Error).message || "Unknown error"}`, {
          style: {
            background: isDark ? '#1e293b' : '#ffffff',
            color: isDark ? '#f8fafc' : '#0f172a',
          }
        });
      } finally {
        setIsUploading(false);
        setUploadProgress(null);
      }
    }
  };

  const onSubmit = (data: SessionFormValues) => {
    const fileUpdate: Partial<Session> = {};
    if (uploadedFile) {
      if (data.type === 'Video') fileUpdate.videoUrl = uploadedFile.url;
      if (data.type === 'PDF') fileUpdate.pdfUrl = uploadedFile.url;
      if (data.type === 'PPT') fileUpdate.pptUrl = uploadedFile.url;
    }
    
    updateSession(moduleId, session.id, { ...data, ...fileUpdate });
    onClose();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-semibold">Session Title</label>
          <input
            {...register('title')}
            className={cn(
              "w-full px-3 py-2 rounded-lg border text-sm transition-all",
              isDark ? "bg-surface-800 border-surface-700" : "bg-white border-surface-200"
            )}
          />
          {errors.title && <p className="text-[10px] text-red-500">{errors.title.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold">Session Type</label>
          <select
            {...register('type')}
            className={cn(
              "w-full px-3 py-2 rounded-lg border text-sm transition-all",
              isDark ? "bg-surface-800 border-surface-700" : "bg-white border-surface-200"
            )}
            onChange={(e) => {
              register('type').onChange(e);
              setUploadedFile(null); // Reset file when type changes
            }}
          >
            <option value="Video">Video</option>
            <option value="PDF">PDF</option>
            <option value="PPT">PPT</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold">Session Description (Optional)</label>
        <textarea
          {...register('description')}
          rows={2}
          className={cn(
            "w-full px-3 py-2 rounded-lg border text-sm transition-all resize-none",
            isDark ? "bg-surface-800 border-surface-700" : "bg-white border-surface-200"
          )}
        />
      </div>

      {/* Upload Section */}
      <div className={cn(
        "p-4 rounded-xl border transition-all",
        sessionType === 'Video' ? "border-blue-500/20 bg-blue-500/5" :
        sessionType === 'PDF' ? "border-red-500/20 bg-red-500/5" :
        "border-orange-500/20 bg-orange-500/5"
      )}>
        <div className="flex items-center gap-2 mb-4">
          {sessionType === 'Video' && <Video className="w-4 h-4 text-blue-500" />}
          {sessionType === 'PDF' && <FileText className="w-4 h-4 text-red-500" />}
          {sessionType === 'PPT' && <Presentation className="w-4 h-4 text-orange-500" />}
          <span className={cn(
            "text-sm font-bold uppercase tracking-wider",
            sessionType === 'Video' ? "text-blue-500" :
            sessionType === 'PDF' ? "text-red-500" :
            "text-orange-500"
          )}>
            {sessionType === 'PDF' ? "PDF / Document" : sessionType} Content
          </span>
        </div>

        <input 
          type="file" 
          ref={fileInputRef}
          className="hidden" 
          onChange={handleFileChange}
          accept={
            sessionType === 'Video' ? "video/*" :
            sessionType === 'PDF' ? ".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.rtf,.odt" :
            ".ppt,.pptx,.key"
          }
        />

        {isUploading ? (
          <div className={cn(
            "p-5 rounded-xl border space-y-4",
            isDark ? "bg-surface-900 border-surface-800" : "bg-white border-surface-100 shadow-sm"
          )}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center animate-pulse",
                  sessionType === 'Video' ? "bg-blue-500/10 text-blue-500" :
                  sessionType === 'PDF' ? "bg-red-500/10 text-red-500" :
                  "bg-orange-500/10 text-orange-500"
                )}>
                  <Upload className="w-5 h-5 animate-bounce" />
                </div>
                <div>
                  <p className="text-xs font-bold truncate max-w-[200px]">Uploading to cloud...</p>
                  <p className="text-[10px] text-surface-400 font-semibold uppercase tracking-wider">
                    {!isS3Configured() ? "Simulating AWS S3..." : "Directing to Amazon S3..."}
                  </p>
                </div>
              </div>
              <span className={cn(
                "text-xs font-black",
                sessionType === 'Video' ? "text-blue-500" :
                sessionType === 'PDF' ? "text-red-500" :
                "text-orange-500"
              )}>
                {uploadProgress}%
              </span>
            </div>
            
            {/* Progress Bar Track */}
            <div className="h-2 w-full bg-surface-100 dark:bg-surface-800 rounded-full overflow-hidden">
              <div 
                className={cn(
                  "h-full rounded-full transition-all duration-300 ease-out",
                  sessionType === 'Video' ? "bg-blue-500" :
                  sessionType === 'PDF' ? "bg-red-500" :
                  "bg-orange-500"
                )}
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        ) : uploadedFile ? (
          <div className={cn(
            "p-4 rounded-xl border space-y-3",
            isDark ? "bg-surface-900 border-surface-800" : "bg-white border-surface-100 shadow-sm"
          )}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center",
                  sessionType === 'Video' ? "bg-blue-500/10 text-blue-500" :
                  sessionType === 'PDF' ? "bg-red-500/10 text-red-500" :
                  "bg-orange-500/10 text-orange-500"
                )}>
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold truncate max-w-[200px]">{uploadedFile.name}</p>
                  <p className="text-[10px] text-surface-400 uppercase font-bold">Ready to save</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs font-bold text-primary-500 hover:underline"
              >
                Replace
              </button>
            </div>

            {/* CloudFront Link Section */}
            <div className={cn(
              "p-3 rounded-lg border text-xs flex flex-col gap-2 transition-all",
              isDark ? "bg-surface-950/50 border-surface-800 text-surface-300" : "bg-surface-50 border-surface-200 text-surface-600"
            )}>
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-black uppercase tracking-wider text-surface-400">CloudFront URL</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const displayUrl = uploadedFile.url.replace(/^(https?:\/\/)/, '');
                      navigator.clipboard.writeText(displayUrl);
                      toast.success("Link copied to clipboard!");
                    }}
                    className="text-[10px] font-bold text-primary-500 hover:text-primary-600 flex items-center gap-1 transition-colors"
                  >
                    <Copy className="w-3 h-3" />
                    Copy
                  </button>
                  <a
                    href={uploadedFile.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] font-bold text-surface-400 hover:text-surface-600 dark:hover:text-surface-200 flex items-center gap-1 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Open
                  </a>
                </div>
              </div>
              <div className="font-mono bg-surface-100/50 dark:bg-surface-900/50 p-2 rounded border border-surface-200/40 dark:border-surface-800/40 select-all break-all leading-relaxed">
                {uploadedFile.url.replace(/^(https?:\/\/)/, '')}
              </div>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "w-full flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl transition-all group",
              sessionType === 'Video' ? "border-blue-500/30 hover:bg-blue-500/10" :
              sessionType === 'PDF' ? "border-red-500/30 hover:bg-red-500/10" :
              "border-orange-500/30 hover:bg-orange-500/10"
            )}
          >
            <div className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-transform group-hover:scale-110",
              sessionType === 'Video' ? "bg-blue-500/10 text-blue-500" :
              sessionType === 'PDF' ? "bg-red-500/10 text-red-500" :
              "bg-orange-500/10 text-orange-500"
            )}>
              <FileUp className="w-6 h-6" />
            </div>
            <p className={cn(
              "text-sm font-bold",
              sessionType === 'Video' ? "text-blue-600" :
              sessionType === 'PDF' ? "text-red-600" :
              "text-orange-600"
            )}>
              Click to upload {sessionType === 'PDF' ? "PDF / Document" : sessionType}
            </p>
            <p className="text-[10px] text-surface-400 mt-1">
              {sessionType === 'Video' ? "MP4, MOV, WEBM (Max 500MB)" :
               sessionType === 'PDF' ? "PDF, DOC, DOCX, TXT, XLS, XLSX (Max 50MB)" :
               "PPT, PPTX, KEY (Max 100MB)"}
            </p>
          </button>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onClose}
          disabled={isUploading}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-bold transition-all disabled:opacity-50",
            isDark ? "bg-surface-800 hover:bg-surface-700" : "bg-surface-100 hover:bg-surface-200"
          )}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isUploading}
          className="px-6 py-2 bg-primary-600 text-white rounded-xl text-sm font-bold hover:bg-primary-700 transition-all shadow-lg shadow-primary-500/20 disabled:opacity-50"
        >
          {isUploading ? "Uploading..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
};

