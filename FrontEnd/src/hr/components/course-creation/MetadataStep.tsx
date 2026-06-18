import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useCourseStore } from '@/hr/store/useCourseStore';
import { useThemeStore } from '@/hr/store';
import { cn } from '@/hr/lib/utils';
import { Sparkles, Upload, RotateCcw, ImageIcon, Info } from 'lucide-react';
import { generateAIThumbnails } from '@/hr/lib/gemini';
import type { CourseCategory } from '@/hr/types/course';
import { motion } from 'framer-motion';

const metadataSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Max 100 characters'),
  description: z.string().min(1, 'Description is required').max(1000, 'Max 1000 characters'),
  passingScore: z.number().min(0).max(100),
  maxAttempts: z.number().min(1),
  category: z.enum(['Mandatory', 'Elective', 'Department-Oriented']),
  startDate: z.string().optional().or(z.literal('')),
  endDate: z.string().optional().or(z.literal('')),
});

type MetadataFormValues = z.infer<typeof metadataSchema>;

interface MetadataStepProps {
  onNext: () => void;
}

export const MetadataStep: React.FC<MetadataStepProps> = ({ onNext }) => {
  const { currentCourse, updateMetadata } = useCourseStore();
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';

  const [aiGenerating, setAiGenerating] = useState(false);
  const [generatedThumbs, setGeneratedThumbs] = useState<string[]>([]);
  const [selectedThumb, setSelectedThumb] = useState<string | null>(currentCourse.thumbnail || null);

  const [objectives, setObjectives] = useState<string[]>(currentCourse.objectives || []);
  const [learningOutcomes, setLearningOutcomes] = useState<string[]>(currentCourse.learningOutcomes || []);
  const [newObjective, setNewObjective] = useState('');
  const [newOutcome, setNewOutcome] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<MetadataFormValues>({
    resolver: zodResolver(metadataSchema),
    defaultValues: {
      title: currentCourse.title || '',
      description: currentCourse.description || '',
      passingScore: currentCourse.passingScore || 70,
      maxAttempts: currentCourse.maxAttempts || 3,
      category: currentCourse.category || 'Mandatory' as CourseCategory,
      startDate: currentCourse.startDate || '',
      endDate: currentCourse.endDate || '',
    },
  });

  const title = watch('title');
  const description = watch('description');

  const onSubmit = (data: MetadataFormValues) => {
    updateMetadata({ 
      ...data, 
      thumbnail: selectedThumb || undefined,
      objectives,
      learningOutcomes,
    });
    onNext();
  };

  const handleGenerateAI = async () => {
    if (!title || !description) return;
    setAiGenerating(true);
    try {
      const thumbs = await generateAIThumbnails(title, description);
      setGeneratedThumbs(thumbs);
    } catch (error) {
      console.error('Failed to generate thumbnails', error);
    } finally {
      setAiGenerating(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedThumb(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-5xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className={cn(
            "p-6 rounded-2xl border transition-all h-full",
            isDark ? "bg-surface-900 border-surface-800" : "bg-white border-surface-200 shadow-sm"
          )}>
            <h3 className="text-lg font-bold mb-6">Course Information</h3>
            
            <div className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <label className="text-sm font-semibold">Course Title</label>
                <input
                  {...register('title')}
                  placeholder="e.g. Cyber Security Fundamentals"
                  className={cn(
                    "w-full px-4 py-3 rounded-xl border transition-all focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500",
                    isDark ? "bg-surface-800 border-surface-700" : "bg-surface-50 border-surface-200"
                  )}
                />
                {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
                <p className="text-right text-[10px] text-surface-400">{title?.length || 0}/100</p>
              </div>


              {/* Description */}
              <div className="space-y-2">
                <label className="text-sm font-semibold">Course Description</label>
                <textarea
                  {...register('description')}
                  rows={6}
                  placeholder="Tell employees what this course is about..."
                  className={cn(
                    "w-full px-4 py-3 rounded-xl border transition-all focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 resize-none",
                    isDark ? "bg-surface-800 border-surface-700" : "bg-surface-50 border-surface-200"
                  )}
                />
                {errors.description && <p className="text-xs text-red-500">{errors.description.message}</p>}
                <p className="text-right text-[10px] text-surface-400">{description?.length || 0}/1000</p>
              </div>

              {/* Start & End Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Start Date</label>
                  <input
                    type="date"
                    {...register('startDate')}
                    className={cn(
                      "w-full px-4 py-3 rounded-xl border transition-all focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500",
                      isDark ? "bg-surface-800 border-surface-700" : "bg-surface-50 border-surface-200"
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold">End Date</label>
                  <input
                    type="date"
                    {...register('endDate')}
                    className={cn(
                      "w-full px-4 py-3 rounded-xl border transition-all focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500",
                      isDark ? "bg-surface-800 border-surface-700" : "bg-surface-50 border-surface-200"
                    )}
                  />
                </div>
              </div>

              {/* Course Objectives */}
              <div className="space-y-3">
                <label className="text-sm font-semibold">Course Objectives</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    id="objective-input"
                    value={newObjective}
                    onChange={(e) => setNewObjective(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (newObjective.trim()) {
                          setObjectives([...objectives, newObjective.trim()]);
                          setNewObjective('');
                        }
                      }
                    }}
                    placeholder="e.g. Identify security risks and phishing emails"
                    className={cn(
                      "flex-1 px-4 py-2.5 rounded-xl border transition-all focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500",
                      isDark ? "bg-surface-800 border-surface-700" : "bg-surface-50 border-surface-200"
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newObjective.trim()) {
                        setObjectives([...objectives, newObjective.trim()]);
                        setNewObjective('');
                      }
                    }}
                    className="px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-semibold text-xs transition-all"
                  >
                    Add
                  </button>
                </div>
                {objectives.length > 0 && (
                  <ul className={cn(
                    "p-4 rounded-xl border space-y-2 max-h-48 overflow-y-auto",
                    isDark ? "bg-surface-800/50 border-surface-700" : "bg-surface-50/50 border-surface-200"
                  )}>
                    {objectives.map((obj, index) => (
                      <li key={index} className="flex justify-between items-center text-sm gap-2">
                        <span className="flex-1 line-clamp-2">{obj}</span>
                        <button
                          type="button"
                          onClick={() => setObjectives(objectives.filter((_, i) => i !== index))}
                          className="text-red-500 hover:text-red-600 text-xs font-semibold px-2 py-1 transition-colors"
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Learning Outcomes */}
              <div className="space-y-3">
                <label className="text-sm font-semibold">Learning Outcomes</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    id="outcome-input"
                    value={newOutcome}
                    onChange={(e) => setNewOutcome(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (newOutcome.trim()) {
                          setLearningOutcomes([...learningOutcomes, newOutcome.trim()]);
                          setNewOutcome('');
                        }
                      }
                    }}
                    placeholder="e.g. Implement password policies correctly"
                    className={cn(
                      "flex-1 px-4 py-2.5 rounded-xl border transition-all focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500",
                      isDark ? "bg-surface-800 border-surface-700" : "bg-surface-50 border-surface-200"
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newOutcome.trim()) {
                        setLearningOutcomes([...learningOutcomes, newOutcome.trim()]);
                        setNewOutcome('');
                      }
                    }}
                    className="px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-semibold text-xs transition-all"
                  >
                    Add
                  </button>
                </div>
                {learningOutcomes.length > 0 && (
                  <ul className={cn(
                    "p-4 rounded-xl border space-y-2 max-h-48 overflow-y-auto",
                    isDark ? "bg-surface-800/50 border-surface-700" : "bg-surface-50/50 border-surface-200"
                  )}>
                    {learningOutcomes.map((out, index) => (
                      <li key={index} className="flex justify-between items-center text-sm gap-2">
                        <span className="flex-1 line-clamp-2">{out}</span>
                        <button
                          type="button"
                          onClick={() => setLearningOutcomes(learningOutcomes.filter((_, i) => i !== index))}
                          className="text-red-500 hover:text-red-600 text-xs font-semibold px-2 py-1 transition-colors"
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Settings & Thumbnail */}
        <div className="space-y-6">
          {/* Settings */}
          <div className={cn(
            "p-6 rounded-2xl border transition-all",
            isDark ? "bg-surface-900 border-surface-800" : "bg-white border-surface-200 shadow-sm"
          )}>
            <h3 className="text-lg font-bold mb-4">Course Settings</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold">Passing Score (%)</label>
                  <input
                    type="number"
                    {...register('passingScore', { valueAsNumber: true })}
                    className={cn(
                      "w-full px-3 py-2 rounded-lg border transition-all",
                      isDark ? "bg-surface-800 border-surface-700" : "bg-surface-50 border-surface-200"
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold">Max Attempts</label>
                  <input
                    type="number"
                    {...register('maxAttempts', { valueAsNumber: true })}
                    className={cn(
                      "w-full px-3 py-2 rounded-lg border transition-all",
                      isDark ? "bg-surface-800 border-surface-700" : "bg-surface-50 border-surface-200"
                    )}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold">Category</label>
                <select
                  {...register('category')}
                  className={cn(
                    "w-full px-3 py-2 rounded-lg border transition-all",
                    isDark ? "bg-surface-800 border-surface-700" : "bg-surface-50 border-surface-200"
                  )}
                >
                  <option value="Mandatory">Mandatory</option>
                  <option value="Elective">Elective</option>
                  <option value="Department-Oriented">Department-Oriented</option>
                </select>
              </div>

              {/* Target Department — shown when Department-Oriented is chosen */}
              {watch('category') === 'Department-Oriented' && (
                <div className="space-y-2">
                  <label className="text-xs font-semibold">Target Department *</label>
                  <select
                    value={currentCourse.department || ''}
                    onChange={(e) => updateMetadata({ department: e.target.value })}
                    className={cn(
                      "w-full px-3 py-2 rounded-lg border transition-all",
                      isDark ? "bg-surface-800 border-surface-700" : "bg-surface-50 border-surface-200"
                    )}
                    required
                  >
                    <option value="">Select Target Department</option>
                    <option value="Frontend Development">Frontend Development</option>
                    <option value="Backend Development">Backend Development</option>
                    <option value="Full Stack Development">Full Stack Development</option>
                    <option value="AI / ML">AI / ML</option>
                    <option value="Data Science">Data Science</option>
                    <option value="Cloud Engineering">Cloud Engineering</option>
                    <option value="DevOps">DevOps</option>
                    <option value="Cyber Security">Cyber Security</option>
                    <option value="QA / Testing">QA / Testing</option>
                    <option value="UI / UX">UI / UX</option>
                    <option value="Mobile Development">Mobile Development</option>
                    <option value="Business Analyst">Business Analyst</option>
                    <option value="Product Management">Product Management</option>
                  </select>
                </div>
              )}
              
              <div className="pt-2">
                 <div className={cn(
                   "flex items-center gap-2 p-3 rounded-xl border border-dashed text-xs",
                   isDark ? "bg-primary-500/5 border-primary-500/20 text-primary-400" : "bg-primary-50 border-primary-100 text-primary-700"
                 )}>
                   <Info className="w-4 h-4 flex-shrink-0" />
                   Duration is auto-calculated based on sessions.
                 </div>
              </div>
            </div>
          </div>

          {/* Thumbnail */}
          <div className={cn(
            "p-6 rounded-2xl border transition-all",
            isDark ? "bg-surface-900 border-surface-800" : "bg-white border-surface-200 shadow-sm"
          )}>
            <h3 className="text-lg font-bold mb-4">Course Thumbnail</h3>
            
            <div className="space-y-4">
              {/* Preview Area */}
              <div className={cn(
                "relative aspect-video rounded-xl overflow-hidden border-2 border-dashed flex items-center justify-center",
                isDark ? "bg-surface-800 border-surface-700" : "bg-surface-50 border-surface-200"
              )}>
                {selectedThumb ? (
                  <>
                    <img src={selectedThumb} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setSelectedThumb(null)}
                      className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <div className="text-center p-4">
                    <ImageIcon className="w-10 h-10 mx-auto text-surface-400 mb-2" />
                    <p className="text-xs text-surface-500">Pick an image or generate one</p>
                  </div>
                )}
              </div>

              {/* Options */}
              <div className="flex gap-2">
                <label className={cn(
                  "flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg font-medium cursor-pointer transition-all border",
                  isDark ? "bg-surface-800 border-surface-700 hover:bg-surface-700" : "bg-white border-surface-200 hover:bg-surface-50"
                )}>
                  <Upload className="w-4 h-4" />
                  <span className="text-xs">Upload</span>
                  <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                </label>
                
                <button
                  type="button"
                  onClick={handleGenerateAI}
                  disabled={!title || !description || aiGenerating}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg font-medium transition-all bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50"
                  )}
                >
                  {aiGenerating ? (
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }}>
                      <RotateCcw className="w-4 h-4" />
                    </motion.div>
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  <span className="text-xs">AI Generate</span>
                </button>
              </div>

              {/* AI Generated Grid */}
              {generatedThumbs.length > 0 && (
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {generatedThumbs.map((url, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setSelectedThumb(url)}
                      className={cn(
                        "relative aspect-video rounded-lg overflow-hidden border-2 transition-all",
                        selectedThumb === url ? "border-primary-500 scale-95" : "border-transparent hover:border-surface-400"
                      )}
                    >
                      <img src={url} alt={`Option ${i+1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Hidden submit for the footer button */}
      <button type="submit" id="metadata-submit" className="hidden" />
    </form>
  );
};

