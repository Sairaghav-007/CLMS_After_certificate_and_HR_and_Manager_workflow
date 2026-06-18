import React, { useEffect, useRef, useState } from 'react';
import { api } from '@/api/client';
import { useAuthStore } from '@/shared/store';
import { Loader2 } from 'lucide-react';

interface ScormPlayerProps {
  sectionId: string;
  packageUuid: string;
  entryPath: string;
  scormVersion: '1.2' | '2004';
  onComplete: () => void;
}

export const ScormPlayer: React.FC<ScormPlayerProps> = ({
  sectionId,
  packageUuid,
  entryPath,
  scormVersion,
  onComplete,
}) => {
  const user = useAuthStore((state) => state.user);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cmiData = useRef({
    lessonStatus: 'not attempted',
    scoreRaw: 0,
    suspendData: '',
    location: '',
  });

  const cmiValues = useRef<Record<string, string>>({});

  useEffect(() => {
    let active = true;

    const fetchInitialData = async () => {
      try {
        const res = await api.get(`/employee/scorm/${sectionId}/runtime`);
        if (!active) return;

        cmiData.current = {
          lessonStatus: res.data.lessonStatus || 'not attempted',
          scoreRaw: res.data.scoreRaw || 0,
          suspendData: res.data.suspendData || '',
          location: res.data.location || '',
        };

        // Populate initial values mapped to SCORM standards
        const v = cmiValues.current;
        if (scormVersion === '2004') {
          v['cmi._version'] = '4.0';
          v['cmi.completion_status'] = cmiData.current.lessonStatus === 'completed' || cmiData.current.lessonStatus === 'passed' ? 'completed' : 'incomplete';
          v['cmi.success_status'] = cmiData.current.lessonStatus === 'passed' ? 'passed' : cmiData.current.lessonStatus === 'failed' ? 'failed' : 'unknown';
          v['cmi.score.raw'] = String(cmiData.current.scoreRaw);
          v['cmi.suspend_data'] = cmiData.current.suspendData;
          v['cmi.location'] = cmiData.current.location;
          v['cmi.learner_name'] = user ? `${user.fullName}` : 'Employee';
          v['cmi.learner_id'] = user ? `${user.userId}` : 'EMP';
        } else {
          v['cmi._version'] = '3.4';
          v['cmi.core.lesson_status'] = cmiData.current.lessonStatus;
          v['cmi.core.score.raw'] = String(cmiData.current.scoreRaw);
          v['cmi.suspend_data'] = cmiData.current.suspendData;
          v['cmi.core.lesson_location'] = cmiData.current.location;
          v['cmi.core.student_name'] = user ? `${user.fullName}` : 'Employee';
          v['cmi.core.student_id'] = user ? `${user.userId}` : 'EMP';
        }

        initializeScormAPI();
        setLoading(false);
      } catch (err) {
        console.error('Failed to load initial SCORM runtime', err);
        setError('Failed to initialize SCORM player runtime data');
        setLoading(false);
      }
    };

    const commitToBackend = async () => {
      try {
        await api.post(`/employee/scorm/${sectionId}/runtime`, cmiData.current);
      } catch (err) {
        console.error('Failed to auto-commit SCORM runtime data', err);
      }
    };

    const initializeScormAPI = () => {
      const apiObject = {
        LMSInitialize: (param: string) => {
          console.log('[SCORM 1.2] LMSInitialize', param);
          return 'true';
        },
        LMSFinish: (param: string) => {
          console.log('[SCORM 1.2] LMSFinish', param);
          commitToBackend();
          return 'true';
        },
        LMSGetValue: (element: string) => {
          const val = cmiValues.current[element] !== undefined ? cmiValues.current[element] : '';
          console.log('[SCORM 1.2] LMSGetValue', element, '=>', val);
          return val;
        },
        LMSSetValue: (element: string, value: string) => {
          console.log('[SCORM 1.2] LMSSetValue', element, '=', value);
          cmiValues.current[element] = value;

          if (element === 'cmi.core.lesson_status') {
            cmiData.current.lessonStatus = value;
            if (value === 'completed' || value === 'passed') {
              onComplete();
            }
          } else if (element === 'cmi.core.score.raw') {
            cmiData.current.scoreRaw = parseInt(value, 10) || 0;
          } else if (element === 'cmi.suspend_data') {
            cmiData.current.suspendData = value;
          } else if (element === 'cmi.core.lesson_location') {
            cmiData.current.location = value;
          }
          return 'true';
        },
        LMSCommit: (param: string) => {
          console.log('[SCORM 1.2] LMSCommit', param);
          commitToBackend();
          return 'true';
        },
        LMSGetLastError: () => 0,
        LMSGetErrorString: (errorCode: number) => 'No error',
        LMSGetDiagnostic: (errorCode: number) => 'No diagnostic info available',
      };

      const api2004Object = {
        Initialize: (param: string) => {
          console.log('[SCORM 2004] Initialize', param);
          return 'true';
        },
        Terminate: (param: string) => {
          console.log('[SCORM 2004] Terminate', param);
          commitToBackend();
          return 'true';
        },
        GetValue: (element: string) => {
          const val = cmiValues.current[element] !== undefined ? cmiValues.current[element] : '';
          console.log('[SCORM 2004] GetValue', element, '=>', val);
          return val;
        },
        SetValue: (element: string, value: string) => {
          console.log('[SCORM 2004] SetValue', element, '=', value);
          cmiValues.current[element] = value;

          if (element === 'cmi.completion_status') {
            if (value === 'completed') {
              cmiData.current.lessonStatus = 'completed';
              onComplete();
            } else {
              cmiData.current.lessonStatus = value;
            }
          } else if (element === 'cmi.success_status') {
            if (value === 'passed') {
              cmiData.current.lessonStatus = 'passed';
              onComplete();
            } else if (value === 'failed') {
              cmiData.current.lessonStatus = 'failed';
            }
          } else if (element === 'cmi.score.raw') {
            cmiData.current.scoreRaw = parseInt(value, 10) || 0;
          } else if (element === 'cmi.suspend_data') {
            cmiData.current.suspendData = value;
          } else if (element === 'cmi.location') {
            cmiData.current.location = value;
          }
          return 'true';
        },
        Commit: (param: string) => {
          console.log('[SCORM 2004] Commit', param);
          commitToBackend();
          return 'true';
        },
        GetLastError: () => 0,
        GetErrorString: (errorCode: number) => 'No error',
        GetDiagnostic: (element: string) => 'No diagnostic info available',
      };

      if (scormVersion === '2004') {
        (window as any).API_1484_11 = api2004Object;
      } else {
        (window as any).API = apiObject;
      }
    };

    fetchInitialData();

    return () => {
      active = false;
      // Terminate and commit when unmounting
      if (scormVersion === '2004') {
        if ((window as any).API_1484_11) {
          (window as any).API_1484_11.Terminate('');
        }
      } else {
        if ((window as any).API) {
          (window as any).API.LMSFinish('');
        }
      }
    };
  }, [sectionId, scormVersion, user, onComplete]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] gap-3 bg-surface-50 dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800">
        <Loader2 className="w-10 h-10 animate-spin text-primary-500" />
        <p className="text-sm font-semibold">Initializing SCORM Player...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] p-6 text-center bg-surface-50 dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800">
        <p className="text-red-500 font-bold mb-2">Error loading package</p>
        <p className="text-sm text-surface-500 max-w-md">{error}</p>
      </div>
    );
  }

  const iframeSrc = `/scorm-serve/${packageUuid}/${entryPath}`;

  return (
    <div className="w-full h-full min-h-[600px] bg-white rounded-2xl overflow-hidden border border-surface-200 shadow-sm relative">
      <iframe
        src={iframeSrc}
        className="w-full h-[650px] border-none"
        allowFullScreen
        title="SCORM Course Player"
      />
    </div>
  );
};
