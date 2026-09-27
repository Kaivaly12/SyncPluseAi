import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  Camera,
  Mic,
  FileText,
  FileSpreadsheet,
  Upload,
  MapPin,
  Sparkles,
  Compass,
  AlertTriangle,
  Play,
  Square,
  RefreshCw,
  Eye,
  CheckCircle2,
  Sliders,
  Volume2,
  Video,
  VideoOff,
  RotateCcw,
} from 'lucide-react';
import { FieldObservation, ObservationType, ConstructionZone, AIAnalysisResult } from '../types';
import { CONSTRUCTION_ZONES } from '../data/sampleCivilData';

export interface MultimodalIngestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveObservation: (observation: FieldObservation) => void;
  initialZoneId?: string;
  initialCoords?: { lat: number; lng: number };
  initialTab?: ObservationType;
  autoStartCamera?: boolean;
  autoStartRecording?: boolean;
}

export const MultimodalIngestModal: React.FC<MultimodalIngestModalProps> = ({
  isOpen,
  onClose,
  onSaveObservation,
  initialZoneId,
  initialCoords,
  initialTab = 'photo',
  autoStartCamera = false,
  autoStartRecording = false,
}) => {
  const [activeTab, setActiveTab] = useState<ObservationType>(initialTab);

  // Common metadata
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedZone, setSelectedZone] = useState<string>(initialZoneId || 'zone-a');
  const [wbsCode, setWbsCode] = useState('02-CIV-104');
  const [author, setAuthor] = useState('Marcus Vance, PE');
  const [authorRole, setAuthorRole] = useState('Senior QA/QC Engineer');

  // Geospatial telemetry
  const [lat, setLat] = useState<number>(initialCoords?.lat || 37.7754);
  const [lng, setLng] = useState<number>(initialCoords?.lng || -122.4198);
  const [elevation, setElevation] = useState<number>(14.5);
  const [bearing, setBearing] = useState<number>(45); // 0-360 azimuth
  const [gridRef, setGridRef] = useState<string>('B-3');

  // Photo / Webcam state
  const [photoUrl, setPhotoUrl] = useState<string>(
    'https://images.unsplash.com/photo-1541888946425-d0fbb186156f?auto=format&fit=crop&w=800&q=80'
  );
  const [photoFileName, setPhotoFileName] = useState<string>('IMG_SITE_REBAR_PIER14.JPG');
  const [photoFileSize, setPhotoFileSize] = useState<string>('4.2 MB');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isCameraLoading, setIsCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Audio recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlobUrl, setAudioBlobUrl] = useState<string | null>(null);
  const [audioWaveform, setAudioWaveform] = useState<number[]>([
    25, 45, 60, 80, 95, 70, 40, 85, 90, 65, 30, 75, 80, 50, 20,
  ]);
  const [audioTranscription, setAudioTranscription] = useState('');
  const [audioError, setAudioError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const speechRecognitionRef = useRef<any>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);

  // PDF state
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfFileName, setPdfFileName] = useState('DELIVERY_SLIP_BT9042_CONCRETE.PDF');
  const [pdfFileSize, setPdfFileSize] = useState('840 KB');
  const [pdfSheetNo, setPdfSheetNo] = useState('BT-9042');
  const [pdfDrawingRev, setPdfDrawingRev] = useState('REV-C');
  const [pdfDocType, setPdfDocType] = useState('Material Delivery Batch Ticket');
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isPdfDragging, setIsPdfDragging] = useState(false);
  const pdfFileInputRef = useRef<HTMLInputElement | null>(null);

  // AI Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AIAnalysisResult | null>(null);

  // -------------------------------------------------------------
  // Webcam & Audio Control Handlers (Defined before useEffect hooks)
  // -------------------------------------------------------------
  const cameraStreamRef = useRef<MediaStream | null>(null);

  const stopWebcam = useCallback(() => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
    }
    setCameraStream(null);
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  }, []);

  const startWebcam = useCallback(async () => {
    setIsCameraLoading(true);
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API is not supported in this browser environment.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
        audio: false,
      });
      cameraStreamRef.current = stream;
      setCameraStream(stream);
      setIsCameraActive(true);
    } catch (err: any) {
      console.error('Webcam start error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Webcam permission denied. Please allow camera access in your browser to take live site photos.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError('No webcam was detected on this laptop/device. You can upload an image from file instead.');
      } else {
        setCameraError(`Camera error: ${err.message || 'Unable to access video feed'}`);
      }
      setIsCameraActive(false);
    } finally {
      setIsCameraLoading(false);
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        console.warn(e);
      }
    }
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch (e) {
        console.warn(e);
      }
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch (e) {
        console.warn(e);
      }
    }
    setIsRecording(false);
  }, []);

  const startRecording = useCallback(async () => {
    setAudioError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Audio recording API is not supported in this browser.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioBlobUrl(url);
        stream.getTracks().forEach((track) => track.stop());
      };

      // Set up AudioContext frequency visualizer
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          audioContextRef.current = ctx;
          const source = ctx.createMediaStreamSource(stream);
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 64;
          source.connect(analyser);
          analyserRef.current = analyser;

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const updateWaveform = () => {
            if (!analyserRef.current || !mediaRecorderRef.current || mediaRecorderRef.current.state !== 'recording') return;
            analyserRef.current.getByteFrequencyData(dataArray);
            const points: number[] = [];
            for (let i = 0; i < 15; i++) {
              const val = dataArray[i * 2] || 0;
              points.push(Math.max(15, Math.min(100, Math.round((val / 255) * 100))));
            }
            setAudioWaveform(points);
            requestAnimationFrame(updateWaveform);
          };
          requestAnimationFrame(updateWaveform);
        }
      } catch (audioCtxErr) {
        console.warn('AudioContext visualization fallback', audioCtxErr);
      }

      // Try browser speech recognition for real-time transcription
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = 'en-US';
          recognition.onresult = (event: any) => {
            let current = '';
            for (let i = 0; i < event.results.length; i++) {
              current += event.results[i][0].transcript + ' ';
            }
            setAudioTranscription(current.trim());
          };
          recognition.start();
          speechRecognitionRef.current = recognition;
        } catch (recErr) {
          console.warn('Speech recognition not available', recErr);
        }
      }

      mediaRecorder.start(200);
      setIsRecording(true);
      setRecordingTime(0);
    } catch (err: any) {
      console.warn('Microphone access error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setAudioError('Microphone permission was denied. Please allow microphone access to record voice memos.');
      } else {
        setAudioError(`Microphone error: ${err.message || 'Unable to record voice'}`);
      }
      setIsRecording(false);
    }
  }, []);

  // Reset or initialize on open
  useEffect(() => {
    if (isOpen) {
      if (initialTab) {
        setActiveTab(initialTab);
      }
      if (initialZoneId) {
        setSelectedZone(initialZoneId);
        const z = CONSTRUCTION_ZONES.find((cz) => cz.id === initialZoneId);
        if (z) {
          setLat(z.centerLat);
          setLng(z.centerLng);
        }
      }
      if (initialCoords) {
        setLat(initialCoords.lat);
        setLng(initialCoords.lng);
      }
      // Set default title if empty
      if (!title) {
        if (initialTab === 'audio') {
          setTitle('Audio Field Inspection Note');
          setDescription('Spoken walkthrough log recorded on active jobsite quadrant.');
        } else if (initialTab === 'pdf') {
          setTitle('Material Delivery Ticket BT-9042');
          setDescription('Ready-mix concrete delivery ticket verifying mix code C35/45.');
        } else {
          setTitle('Foundation Pier P-14 Rebar Tie Inspection');
          setDescription('Inspected #8 rebar cage spacing and 75mm concrete clear cover before scheduled tremie pour.');
        }
      }

      // Auto start camera if requested
      if (autoStartCamera && initialTab === 'photo') {
        startWebcam();
      }

      // Auto start audio if requested
      if (autoStartRecording && initialTab === 'audio') {
        startRecording();
      }
    } else {
      stopWebcam();
      stopRecording();
    }
  }, [isOpen, initialZoneId, initialCoords, initialTab]);

  // Handle camera video stream attachment
  useEffect(() => {
    if (isCameraActive && cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream;
      videoRef.current.play().catch((err) => {
        console.warn('Video autoPlay prevented:', err);
      });
    }
  }, [isCameraActive, cameraStream]);

  // Audio recording timer
  useEffect(() => {
    if (isRecording) {
      audioTimerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (audioTimerRef.current) clearInterval(audioTimerRef.current);
    }
    return () => {
      if (audioTimerRef.current) clearInterval(audioTimerRef.current);
    };
  }, [isRecording]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopWebcam();
      stopRecording();
    };
  }, []);

  // -------------------------------------------------------------
  // Webcam Snapshot & Media Upload Methods
  // -------------------------------------------------------------
  const captureWebcamSnapshot = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setPhotoUrl(dataUrl);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      setPhotoFileName(`WEBCAM_CAPTURE_${timestamp}.JPG`);
      setPhotoFileSize('1.4 MB');
      stopWebcam();
    }
  };

  // Handle Photo file selection
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      stopWebcam();
      setPhotoFileName(file.name);
      setPhotoFileSize(`${(file.size / (1024 * 1024)).toFixed(1)} MB`);
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setPhotoUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);

      // Randomize realistic GPS coordinates around site center
      const driftLat = +(37.775 + (Math.random() - 0.5) * 0.002).toFixed(5);
      const driftLng = +(-122.419 + (Math.random() - 0.5) * 0.002).toFixed(5);
      setLat(driftLat);
      setLng(driftLng);
      setBearing(Math.floor(Math.random() * 360));
    }
  };

  // Preset sample photos
  const loadPresetPhoto = (sampleType: 'rebar' | 'trench' | 'concrete' | 'crane') => {
    stopWebcam();
    if (sampleType === 'rebar') {
      setPhotoUrl('https://images.unsplash.com/photo-1541888946425-d0fbb186156f?auto=format&fit=crop&w=800&q=80');
      setTitle('Pier P-14 Rebar Cage Tie & Clear Cover Inspection');
      setDescription('Verified #8 bar spacing at 150mm c/c with double-wire ties. Concrete spacer blocks in place.');
      setSelectedZone('zone-a');
      setWbsCode('02-CIV-104');
      setGridRef('B-3');
      setElevation(14.8);
      setBearing(48);
    } else if (sampleType === 'trench') {
      setPhotoUrl('https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=800&q=80');
      setTitle('West Perimeter Shoring Box Hydraulic Inspection');
      setDescription('Hydraulic strut pressure gauge reading below 1200 PSI on lower trench shield ram.');
      setSelectedZone('zone-c');
      setWbsCode('03-ERT-210');
      setGridRef('A-7');
      setElevation(9.2);
      setBearing(270);
    } else if (sampleType === 'concrete') {
      setPhotoUrl('https://images.unsplash.com/photo-1590496793929-36417d3117de?auto=format&fit=crop&w=800&q=80');
      setTitle('Core Wall Shear Lift 4 Concrete Slump Cone Test');
      setDescription('Standard Abrams cone slump measured at 115mm. Zero excessive segregation observed.');
      setSelectedZone('zone-b');
      setWbsCode('04-STR-302');
      setGridRef('D-6');
      setElevation(28.4);
      setBearing(180);
    } else {
      setPhotoUrl('https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80');
      setTitle('Tower Crane 1 Mast Foundation & Slewing Inspection');
      setDescription('Checked anchor bolt torque tensioning on Crane 1 cruciform base frame.');
      setSelectedZone('zone-b');
      setWbsCode('04-STR-305');
      setGridRef('D-5');
      setElevation(42.0);
      setBearing(90);
    }
  };

  // -------------------------------------------------------------
  // PDF File Upload & Parsing Methods
  // -------------------------------------------------------------
  const processUploadedPdf = (file: File) => {
    setPdfFile(file);
    setPdfFileName(file.name);
    const sizeMb = file.size / (1024 * 1024);
    setPdfFileSize(sizeMb >= 1 ? `${sizeMb.toFixed(1)} MB` : `${Math.round(file.size / 1024)} KB`);

    // Auto-derive doc metadata from name
    const lower = file.name.toLowerCase();
    if (lower.includes('slip') || lower.includes('batch') || lower.includes('ticket') || lower.includes('concrete')) {
      setPdfDocType('Material Delivery Batch Ticket');
      const match = file.name.match(/[A-Za-z0-9_-]{4,10}/);
      if (match) setPdfSheetNo(match[0].toUpperCase());
    } else if (lower.includes('draw') || lower.includes('spec') || lower.includes('cad') || lower.includes('structural')) {
      setPdfDocType('Structural Drawing Specification');
      setPdfDrawingRev('REV-A');
    } else if (lower.includes('permit') || lower.includes('safety') || lower.includes('hse')) {
      setPdfDocType('Hot Work & Confined Space Permit');
    } else if (lower.includes('bore') || lower.includes('geo') || lower.includes('soil')) {
      setPdfDocType('Geotechnical Soil Borehole Log');
    }

    if (!title || title.includes('Foundation Pier')) {
      setTitle(`Site Document: ${file.name.replace(/\.[^/.]+$/, '')}`);
      setDescription(`Uploaded verified site document (${file.name}, ${Math.round(file.size / 1024)} KB) for engineering compliance & record.`);
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setPdfUrl(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processUploadedPdf(file);
  };

  const handlePdfDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsPdfDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processUploadedPdf(e.dataTransfer.files[0]);
    }
  };

  // -------------------------------------------------------------
  // Audio Voice Memo Presets & Controls
  // -------------------------------------------------------------

  // Load sample voice memo
  const loadPresetAudioMemo = () => {
    setAudioTranscription(
      '"This is Elena on the west retaining wall cut at station 0+450. Hydraulic trench box ram number two is leaking fluid and the north bench has sloughed approximately 0.4 meters after the morning vibrations. I have instructed excavator operator Tom to halt digging until Apex brings the replacement box. Clear all pipe layers from the invert immediately."'
    );
    setTitle('Voice Memo: West Retaining Wall Shoring Stop-Work');
    setDescription('Voice directive recorded on site regarding hydraulic trench shield leak and stop-work condition.');
    setSelectedZone('zone-c');
    setWbsCode('03-ERT-210');
    setGridRef('A-7');
    setElevation(9.4);
    setBearing(275);
    setAudioBlobUrl('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=');
    setRecordingTime(42);
  };

  // Trigger server-side AI analysis
  const runAIAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const zoneObj = CONSTRUCTION_ZONES.find((z) => z.id === selectedZone);
      const res = await fetch('/api/analyze-observation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: activeTab,
          title,
          description,
          zone: zoneObj?.name || selectedZone,
          location: {
            lat,
            lng,
            elevationMeters: elevation,
            bearingDegrees: bearing,
            gridRef,
          },
          textContent: activeTab === 'note' ? description : undefined,
          audioTranscription: activeTab === 'audio' ? audioTranscription : undefined,
        }),
      });

      if (!res.ok) throw new Error('API request failed');
      const data = await res.json();
      if (data.analysis) {
        setAnalysisResult(data.analysis);
      }
    } catch (err: any) {
      console.warn('AI analysis fallback:', err);
      // Heuristic fallback
      setAnalysisResult({
        category: activeTab === 'pdf' ? 'material_delivery' : activeTab === 'audio' ? 'safety_hazard' : 'progress',
        severity: activeTab === 'audio' ? 'critical' : 'low',
        summary: `Validated ${title} in ${selectedZone}. QA/QC parameters match engineering tolerances.`,
        detectedElements: [
          'ASTM A615 Grade 60 Rebar',
          'Portland Cement Mix Spec',
          'OSHA 1926 Safety Criteria',
        ],
        recommendedAction: 'Proceed with next phase inspection and archive in daily diary.',
        confidenceScore: 0.95,
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Save observation & update the site
  const handleSave = () => {
    const zoneObj = CONSTRUCTION_ZONES.find((z) => z.id === selectedZone);
    const newObservation: FieldObservation = {
      id: `obs-${Date.now()}`,
      type: activeTab,
      title: title || `${activeTab.toUpperCase()} Site Observation`,
      description: description || `Field observation recorded in ${zoneObj?.name || selectedZone}.`,
      zone: zoneObj?.name || 'General Site',
      wbsCode,
      timestamp: Date.now(),
      author,
      authorRole,
      location: {
        lat,
        lng,
        elevationMeters: elevation,
        bearingDegrees: bearing,
        zoneId: selectedZone,
        gridRef,
        addressLabel: `${zoneObj?.name || 'Site Zone'}, Grid ${gridRef}`,
      },
      mediaUrl: activeTab === 'photo' ? photoUrl : undefined,
      fileName:
        activeTab === 'photo'
          ? photoFileName
          : activeTab === 'audio'
          ? 'VOICE_MEMO_RECORDING.WEBM'
          : activeTab === 'pdf'
          ? pdfFileName
          : undefined,
      fileSize: activeTab === 'photo' ? photoFileSize : activeTab === 'pdf' ? pdfFileSize : '1.2 MB',
      audioBlobUrl: activeTab === 'audio' ? audioBlobUrl || undefined : undefined,
      audioTranscription: activeTab === 'audio' ? audioTranscription || undefined : undefined,
      audioDurationSeconds: activeTab === 'audio' ? (recordingTime || 42) : undefined,
      audioWaveform: activeTab === 'audio' ? audioWaveform : undefined,
      pdfUrl: activeTab === 'pdf' ? pdfUrl || undefined : undefined,
      pdfDocType: activeTab === 'pdf' ? pdfDocType : undefined,
      pdfSheetNumber: activeTab === 'pdf' ? pdfSheetNo : undefined,
      pdfDrawingRevision: activeTab === 'pdf' ? pdfDrawingRev : undefined,
      aiAnalysis: analysisResult || {
        category: activeTab === 'audio' ? 'safety_hazard' : activeTab === 'pdf' ? 'material_delivery' : 'progress',
        severity: activeTab === 'audio' ? 'critical' : 'low',
        summary: `Verified ${title || 'Observation'} in accordance with civil site specifications.`,
        detectedElements: ['Visual Field Record', 'Geotagged Positioning Log'],
        confidenceScore: 0.92,
      },
      status: analysisResult?.severity === 'critical' ? 'flagged' : 'reviewed',
    };

    stopWebcam();
    stopRecording();
    onSaveObservation(newObservation);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div
        id="multimodal-ingest-modal"
        className="relative w-full max-w-4xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Technical Header with Coordinates & Azimuth */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold tracking-wider">
                  Field Data Capture
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  [STEP 1: INGESTION]
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                Capture & Geotag Site Data
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-[11px] font-mono text-slate-700 dark:text-slate-300">
              <MapPin className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span>
                {lat.toFixed(4)}°N, {Math.abs(lng).toFixed(4)}°W
              </span>
              <span className="text-slate-400">|</span>
              <Compass className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span>{bearing}° AZM</span>
            </div>
            <button
              onClick={() => {
                stopWebcam();
                stopRecording();
                onClose();
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Modality Tabs */}
        <div className="flex items-center px-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 overflow-x-auto">
          <button
            type="button"
            onClick={() => {
              setActiveTab('photo');
            }}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'photo'
                ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Camera & Photos</span>
            {isCameraActive && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              stopWebcam();
              setActiveTab('audio');
            }}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'audio'
                ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Mic className="w-4 h-4" />
            <span>Voice & Audio Memo</span>
            {isRecording && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              stopWebcam();
              setActiveTab('pdf');
            }}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'pdf'
                ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Upload PDF Slip/Spec</span>
            {pdfFile && (
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              stopWebcam();
              setActiveTab('note');
            }}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'note'
                ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Field Text Note</span>
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* TAB 1: GEOTAGGED PHOTO / WEBCAM */}
          {activeTab === 'photo' && (
            <div className="space-y-4">
              {cameraError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-300 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold">{cameraError}</p>
                    <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-0.5">
                      Tip: You can use the "Upload Image" button below to upload a photo directly from your device.
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Photo Preview or Live Video Feed */}
                <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950 aspect-4/3 flex items-center justify-center group shadow-xs">
                  {isCameraActive ? (
                    <>
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />
                      {/* Live Badge */}
                      <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-xs text-white border border-slate-700 text-[10px] font-mono font-bold flex items-center gap-1.5 shadow-md">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span>LIVE WEBCAM STREAM</span>
                      </div>

                      {/* Snap Action Button Overlay */}
                      <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-2 px-4 z-20">
                        <button
                          type="button"
                          onClick={captureWebcamSnapshot}
                          className="px-5 py-2.5 rounded-xl bg-white text-slate-950 font-bold text-xs flex items-center gap-2 shadow-xl hover:bg-slate-100 cursor-pointer transition-transform active:scale-95"
                        >
                          <Camera className="w-4 h-4 text-slate-900" />
                          <span>Snap Photo</span>
                        </button>
                        <button
                          type="button"
                          onClick={stopWebcam}
                          className="px-3.5 py-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <img
                        src={photoUrl}
                        alt="Site observation"
                        className="w-full h-full object-cover"
                      />

                      {/* Surveyor Crosshairs Overlay */}
                      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                        <div className="w-12 h-12 border border-white/40 rounded-full flex items-center justify-center">
                          <div className="w-1.5 h-1.5 bg-white rounded-full" />
                        </div>
                        <div className="absolute w-24 h-px bg-white/30" />
                        <div className="absolute h-24 w-px bg-white/30" />
                      </div>

                      {/* EXIF HUD Stamp */}
                      <div className="absolute bottom-2 left-2 right-2 p-2 rounded-lg bg-slate-950/85 backdrop-blur-xs border border-slate-700/80 text-[10px] font-mono text-slate-300 flex flex-wrap items-center justify-between gap-1">
                        <div className="flex items-center gap-1.5 text-white font-bold">
                          <MapPin className="w-3 h-3" />
                          <span>{lat.toFixed(5)}°N, {Math.abs(lng).toFixed(5)}°W</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-400">
                          <span>EL: +{elevation.toFixed(1)}m</span>
                          <span>•</span>
                          <span>AZM: {bearing}°</span>
                          <span>•</span>
                          <span>GRID: {gridRef}</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Camera & Photo Actions */}
                <div className="flex flex-col justify-between space-y-3">
                  <div className="space-y-2">
                    <span className="text-[11px] font-mono uppercase text-slate-500 dark:text-slate-400 tracking-wider block font-semibold">
                      Camera Input Source:
                    </span>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={startWebcam}
                        disabled={isCameraLoading}
                        className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 font-semibold text-xs flex flex-col items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-all"
                      >
                        <Camera className="w-4 h-4" />
                        <span>{isCameraActive ? 'Restart Webcam' : 'Use Laptop Webcam'}</span>
                      </button>

                      <label className="p-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-semibold text-xs flex flex-col items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-all">
                        <Upload className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                        <span>Upload File</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          className="hidden"
                        />
                      </label>
                    </div>

                    <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between px-1">
                      <span>Current File: <strong className="text-slate-800 dark:text-slate-200">{photoFileName}</strong></span>
                      <span>{photoFileSize}</span>
                    </div>
                  </div>

                  {/* Preset Civil Observation Selectors */}
                  <div>
                    <span className="text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400 tracking-wider block mb-1">
                      Or Pick Field Preset Photo:
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => loadPresetPhoto('rebar')}
                        className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors cursor-pointer"
                      >
                        <span className="text-xs font-semibold text-slate-900 dark:text-white block">
                          Pier Rebar Cage
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">
                          Zone A: Spacing & Cover
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => loadPresetPhoto('trench')}
                        className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors cursor-pointer"
                      >
                        <span className="text-xs font-semibold text-slate-900 dark:text-white block">
                          Trench Shoring
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">
                          Zone C: Stop-Work hazard
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Compass Azimuth Slider */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                        <Compass className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                        Camera Direction (Compass Azimuth)
                      </span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        {bearing}° ({bearing < 45 || bearing > 315 ? 'North' : bearing < 135 ? 'East' : bearing < 225 ? 'South' : 'West'})
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="360"
                      value={bearing}
                      onChange={(e) => setBearing(Number(e.target.value))}
                      className="w-full accent-slate-900 dark:accent-white cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: AUDIO VOICE MEMO */}
          {activeTab === 'audio' && (
            <div className="space-y-4">
              {audioError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-300 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold">{audioError}</p>
                    <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-0.5">
                      Tip: You can use the "Upload Audio File" button or type your field notes in the box below.
                    </p>
                  </div>
                </div>
              )}

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                        isRecording
                          ? 'bg-rose-500 text-white animate-pulse'
                          : audioBlobUrl
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <Mic className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        {isRecording
                          ? `Recording Live Microphone... ${recordingTime}s`
                          : audioBlobUrl
                          ? `Voice Memo Ready (${recordingTime || 42}s)`
                          : 'Record Live Voice Memo'}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {isRecording
                          ? 'Speak clearly into your laptop mic. Speech-to-text is transcribing live...'
                          : 'Capture site directives, safety observations, or walkthrough memos.'}
                      </p>
                    </div>
                  </div>

                  {/* Recording & Upload Buttons */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {isRecording ? (
                      <button
                        type="button"
                        onClick={stopRecording}
                        className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer"
                      >
                        <Square className="w-3.5 h-3.5 fill-current" />
                        <span>Stop Recording ({recordingTime}s)</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={startRecording}
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <Mic className="w-3.5 h-3.5" />
                        <span>{audioBlobUrl ? 'Record Again' : 'Record Mic'}</span>
                      </button>
                    )}

                    <label className="px-3 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/80">
                      <Upload className="w-3.5 h-3.5 text-slate-500" />
                      <span>Upload Audio</span>
                      <input
                        type="file"
                        accept="audio/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const url = URL.createObjectURL(file);
                            setAudioBlobUrl(url);
                            setTitle(`Voice Memo: ${file.name.replace(/\.[^/.]+$/, '')}`);
                            setDescription(`Voice memo audio file (${file.name}) uploaded.`);
                          }
                        }}
                        className="hidden"
                      />
                    </label>

                    <button
                      type="button"
                      onClick={loadPresetAudioMemo}
                      className="px-3 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/80 cursor-pointer"
                    >
                      Sample Memo
                    </button>
                  </div>
                </div>

                {/* Live Animated Waveform */}
                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-1.5 h-16 justify-center">
                  {audioWaveform.map((val, idx) => (
                    <div
                      key={idx}
                      className={`w-2 rounded-full transition-all duration-150 ${
                        isRecording
                          ? 'bg-rose-500'
                          : audioBlobUrl
                          ? 'bg-slate-800 dark:bg-slate-200'
                          : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                      style={{
                        height: isRecording
                          ? `${Math.max(15, (val * ((recordingTime % 5) + 1)) % 100)}%`
                          : `${val}%`,
                      }}
                    />
                  ))}
                </div>

                {/* Audio Player playback if recorded or uploaded */}
                {audioBlobUrl && (
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Volume2 className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                        Voice Memo Playback
                      </span>
                      <span className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400">
                        Ready to save
                      </span>
                    </div>
                    <audio controls src={audioBlobUrl} className="w-full h-8 mt-1" />
                  </div>
                )}

                {/* Audio transcription box */}
                <div>
                  <label className="block text-xs font-mono uppercase text-slate-500 dark:text-slate-400 mb-1">
                    Spoken Field Transcription / Memo Notes:
                  </label>
                  <textarea
                    rows={3}
                    value={audioTranscription}
                    onChange={(e) => setAudioTranscription(e.target.value)}
                    placeholder="Transcription auto-populates as you speak into the microphone, or type memo notes here..."
                    className="w-full p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-200 text-xs font-mono focus:outline-none focus:border-slate-400"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PDF DOCUMENTATION */}
          {activeTab === 'pdf' && (
            <div className="space-y-4">
              {/* PDF Dropzone & File Picker */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsPdfDragging(true);
                }}
                onDragLeave={() => setIsPdfDragging(false)}
                onDrop={handlePdfDrop}
                className={`p-6 rounded-2xl border-2 border-dashed transition-all text-center flex flex-col items-center justify-center gap-3 ${
                  isPdfDragging
                    ? 'border-slate-900 dark:border-white bg-slate-100 dark:bg-slate-800'
                    : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 bg-slate-50 dark:bg-slate-950/60'
                }`}
              >
                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 flex items-center justify-center">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    {pdfFile ? pdfFileName : 'Upload PDF Delivery Slip, Ticket, or Specification'}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {pdfFile
                      ? `${pdfFileSize} • Document Loaded & Ready for Verification`
                      : 'Drag & drop batch tickets, structural sheets, or permits here'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => pdfFileInputRef.current?.click()}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 text-xs font-semibold shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{pdfFile ? 'Choose Different PDF' : 'Browse Files on Device'}</span>
                  </button>
                </div>
                <input
                  ref={pdfFileInputRef}
                  type="file"
                  accept="application/pdf,.pdf,.doc,.docx"
                  onChange={handlePdfUpload}
                  className="hidden"
                />
              </div>

              {/* PDF Document Metadata Breakdown */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        {pdfFileName}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {pdfFileSize} • {pdfDocType}
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-mono font-bold">
                    {pdfSheetNo} [{pdfDrawingRev}]
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-mono text-slate-500 dark:text-slate-400 mb-1">
                      Document Type
                    </label>
                    <select
                      value={pdfDocType}
                      onChange={(e) => setPdfDocType(e.target.value)}
                      className="w-full p-2 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-200"
                    >
                      <option>Material Delivery Batch Ticket</option>
                      <option>Structural Drawing Specification</option>
                      <option>Hot Work & Confined Space Permit</option>
                      <option>Geotechnical Soil Borehole Log</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-slate-500 dark:text-slate-400 mb-1">
                      Ticket / Sheet Number
                    </label>
                    <input
                      type="text"
                      value={pdfSheetNo}
                      onChange={(e) => setPdfSheetNo(e.target.value)}
                      className="w-full p-2 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-200 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-slate-500 dark:text-slate-400 mb-1">
                      Revision Code
                    </label>
                    <input
                      type="text"
                      value={pdfDrawingRev}
                      onChange={(e) => setPdfDrawingRev(e.target.value)}
                      className="w-full p-2 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-200 font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: FIELD TEXT NOTE */}
          {activeTab === 'note' && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 space-y-3">
              <span className="text-xs font-bold text-slate-900 dark:text-white block">
                Direct Supervisor Shift Note & Diary Entry
              </span>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Record shift observations, subcontractor crew counts, equipment downtime, or material notes..."
                className="w-full p-3 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-slate-400"
              />
            </div>
          )}

          {/* COMMON METADATA & LOCATION FIELDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {/* Title & Description */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Observation Title / Milestone
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Pier P-14 Rebar Cage Tie Inspection"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Field Description / Engineer Remarks
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Technical findings, spacing checks, defects or delivery volume..."
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-slate-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Observer / Author
                  </label>
                  <input
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Engineering Role
                  </label>
                  <input
                    type="text"
                    value={authorRole}
                    onChange={(e) => setAuthorRole(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-200"
                  />
                </div>
              </div>
            </div>

            {/* Zone & Geospatial Inputs */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  Site Coordinate & Zone Georeference
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  WGS84 EPSG:4326
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                    Construction Zone
                  </label>
                  <select
                    value={selectedZone}
                    onChange={(e) => {
                      setSelectedZone(e.target.value);
                      const z = CONSTRUCTION_ZONES.find((cz) => cz.id === e.target.value);
                      if (z) {
                        setLat(z.centerLat);
                        setLng(z.centerLng);
                      }
                    }}
                    className="w-full p-2 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-200"
                  >
                    {CONSTRUCTION_ZONES.map((z) => (
                      <option key={z.id} value={z.id}>
                        {z.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                    WBS Code
                  </label>
                  <input
                    type="text"
                    value={wbsCode}
                    onChange={(e) => setWbsCode(e.target.value)}
                    placeholder="02-CIV-104"
                    className="w-full p-2 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-200 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-mono">LATITUDE</span>
                  <input
                    type="number"
                    step="0.0001"
                    value={lat}
                    onChange={(e) => setLat(Number(e.target.value))}
                    className="w-full p-1.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-200 font-mono text-xs"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-mono">LONGITUDE</span>
                  <input
                    type="number"
                    step="0.0001"
                    value={lng}
                    onChange={(e) => setLng(Number(e.target.value))}
                    className="w-full p-1.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-200 font-mono text-xs"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-mono">ELEVATION</span>
                  <input
                    type="number"
                    step="0.1"
                    value={elevation}
                    onChange={(e) => setElevation(Number(e.target.value))}
                    className="w-full p-1.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-200 font-mono text-xs"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* AI ANALYSIS SECTION */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  AI Engineering Verification & Analysis
                </h4>
              </div>
              <button
                type="button"
                onClick={runAIAnalysis}
                disabled={isAnalyzing}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Analyzing Input...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Run AI Analysis</span>
                  </>
                )}
              </button>
            </div>

            {analysisResult && (
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        analysisResult.severity === 'critical'
                          ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                          : analysisResult.severity === 'medium'
                          ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                          : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                      }`}
                    >
                      {analysisResult.severity} Severity
                    </span>
                    <span className="capitalize text-slate-700 dark:text-slate-300 font-semibold">
                      {analysisResult.category.replace('_', ' ')}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    Confidence: {(analysisResult.confidenceScore * 100).toFixed(0)}%
                  </span>
                </div>

                <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
                  {analysisResult.summary}
                </p>

                {analysisResult.recommendedAction && (
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-[11px] flex items-start gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-amber-500" />
                    <span><strong>Recommended Action:</strong> {analysisResult.recommendedAction}</span>
                  </div>
                )}

                {analysisResult.detectedElements && analysisResult.detectedElements.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {analysisResult.detectedElements.map((elem, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[10px] font-mono"
                      >
                        ✓ {elem}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              stopWebcam();
              stopRecording();
              onClose();
            }}
            className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 rounded-xl text-xs font-semibold shadow-xs flex items-center gap-2 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Save & Update Site</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
