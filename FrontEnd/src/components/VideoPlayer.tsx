import { useRef, useState } from "react";
import { Maximize, Pause, Play } from "lucide-react";

export function VideoPlayer({ src }: { src: string }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);

  function togglePlay() {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play();
      setPlaying(true);
    } else {
      video.pause();
      setPlaying(false);
    }
  }

  function changeSpeed(value: number) {
    const video = videoRef.current;
    if (!video) return;

    video.playbackRate = value;
    setSpeed(value);
  }

  function fullscreen() {
    videoRef.current?.requestFullscreen();
  }

  function blockCaptureShortcuts(event: React.KeyboardEvent) {
    if (event.key === "PrintScreen") {
      event.preventDefault();
    }
  }

  return (
    <div
      className="overflow-hidden rounded-lg bg-black"
      onContextMenu={(event) => event.preventDefault()}
      onKeyDown={blockCaptureShortcuts}
      tabIndex={0}
    >
      <video
        ref={videoRef}
        src={src}
        className="aspect-video w-full bg-black"
        controls={false}
        controlsList="nodownload noplaybackrate"
        disablePictureInPicture
      />

      <div className="flex flex-wrap items-center gap-3 bg-black px-4 py-3 text-white">
        <button onClick={togglePlay} className="rounded-md p-2 hover:bg-white/10">
          {playing ? <Pause size={20} /> : <Play size={20} />}
        </button>

        <button
          onClick={() => {
            if (videoRef.current) videoRef.current.currentTime -= 10;
          }}
          className="rounded-md px-3 py-2 text-sm hover:bg-white/10"
        >
          -10s
        </button>

        <button
          onClick={() => {
            if (videoRef.current) videoRef.current.currentTime += 10;
          }}
          className="rounded-md px-3 py-2 text-sm hover:bg-white/10"
        >
          +10s
        </button>

        <select
          value={speed}
          onChange={(event) => changeSpeed(Number(event.target.value))}
          className="rounded-md bg-slate-800 px-2 py-2 text-sm"
        >
          <option value={1}>1x</option>
          <option value={1.25}>1.25x</option>
          <option value={1.5}>1.5x</option>
          <option value={2}>2x</option>
        </select>

        <button onClick={fullscreen} className="ml-auto rounded-md p-2 hover:bg-white/10">
          <Maximize size={20} />
        </button>
      </div>
    </div>
  );
}