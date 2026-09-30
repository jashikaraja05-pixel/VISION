import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  Video,
  VideoOff,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShieldCheck,
  SwitchCamera,
  Radio,
  Play,
  Square,
  Layers,
  Info,
  Laptop,
  Smartphone,
  Usb,
} from 'lucide-react';
import { CameraDevice } from '../types';

interface CameraSensorSetupPageProps {
  cameras: CameraDevice[];
  onAddCamera?: (camera: CameraDevice) => void;
  onUpdateCameraStatus?: (id: string, status: 'Online' | 'Offline' | 'Calibrating') => void;
}

type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'permission_required' | 'error' | 'no_camera';

interface DetectedMediaDevice {
  deviceId: string;
  label: string;
  kind: MediaDeviceKind;
  facingMode?: 'user' | 'environment' | 'unknown';
  isDefault?: boolean;
}

export const CameraSensorSetupPage: React.FC<CameraSensorSetupPageProps> = ({
  cameras,
  onAddCamera,
}) => {
  // Real Hardware Camera State
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [availableDevices, setAvailableDevices] = useState<DetectedMediaDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [activeFacingMode, setActiveFacingMode] = useState<'user' | 'environment'>('environment');
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Live Stream Telemetry
  const [streamResolution, setStreamResolution] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [streamFps, setStreamFps] = useState<number>(0);
  const [activeTrackLabel, setActiveTrackLabel] = useState<string>('');
  const [activeTrackId, setActiveTrackId] = useState<string>('');
  const [streamStartTime, setStreamStartTime] = useState<number | null>(null);
  const [streamDuration, setStreamDuration] = useState<string>('00:00');

  // UI Modals & Views
  const [showAddModal, setShowAddModal] = useState(false);
  const [showGridOverlay, setShowGridOverlay] = useState(true);
  const [isScanningDevices, setIsScanningDevices] = useState(false);
  const [lastDisconnectedDeviceName, setLastDisconnectedDeviceName] = useState<string | null>(null);

  // Real device type classifier helper
  const getDeviceType = (label: string): { type: 'laptop' | 'usb' | 'mobile'; icon: typeof Laptop; label: string } => {
    const l = label.toLowerCase();
    if (l.includes('back') || l.includes('front') || l.includes('rear') || l.includes('facing') || l.includes('camera 0') || l.includes('camera 1')) {
      return { type: 'mobile', icon: Smartphone, label: 'Mobile Camera' };
    }
    if (l.includes('usb') || l.includes('external') || l.includes('logitech') || l.includes('c920') || l.includes('cam') || l.includes('brio') || l.includes('elgato')) {
      return { type: 'usb', icon: Usb, label: 'External USB Camera' };
    }
    return { type: 'laptop', icon: Laptop, label: 'Built-in / Integrated Camera' };
  };

  // Helper to enumerate physical video input devices
  const enumerateRealCameras = async (requestPermissionIfEmpty = false): Promise<DetectedMediaDevice[]> => {
    setIsScanningDevices(true);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        setConnectionState('error');
        setErrorMessage('Camera API (MediaDevices) is not supported in this browser.');
        return [];
      }

      let devices = await navigator.mediaDevices.enumerateDevices();
      let videoInputs = devices.filter((d) => d.kind === 'videoinput');

      // In modern browsers, device labels are empty until getUserMedia is called at least once
      const hasLabels = videoInputs.some((d) => d.label && d.label.trim().length > 0);
      if ((!hasLabels || videoInputs.length === 0) && requestPermissionIfEmpty) {
        try {
          const tempStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          // Stop temp stream immediately
          tempStream.getTracks().forEach((t) => t.stop());

          // Re-enumerate to get real hardware labels
          devices = await navigator.mediaDevices.enumerateDevices();
          videoInputs = devices.filter((d) => d.kind === 'videoinput');
        } catch (permErr: any) {
          handleCameraError(permErr);
          return [];
        }
      }

      if (videoInputs.length === 0) {
        setAvailableDevices([]);
        setConnectionState('no_camera');
        return [];
      }

      const formatted: DetectedMediaDevice[] = videoInputs.map((d, index) => {
        let cleanLabel = d.label;
        if (!cleanLabel || cleanLabel.trim().length === 0) {
          cleanLabel = index === 0 ? 'Integrated System Camera' : `Camera Device #${index + 1}`;
        }
        const lower = cleanLabel.toLowerCase();
        let facing: 'user' | 'environment' | 'unknown' = 'unknown';
        if (lower.includes('front') || lower.includes('user')) facing = 'user';
        else if (lower.includes('back') || lower.includes('rear') || lower.includes('environment')) facing = 'environment';

        return {
          deviceId: d.deviceId,
          label: cleanLabel,
          kind: d.kind,
          facingMode: facing,
          isDefault: index === 0,
        };
      });

      setAvailableDevices(formatted);
      return formatted;
    } catch (err: any) {
      console.error('Error enumerating cameras:', err);
      handleCameraError(err);
      return [];
    } finally {
      setIsScanningDevices(false);
    }
  };

  // Standardized Error Handler
  const handleCameraError = (err: any) => {
    console.warn('Physical camera error:', err);
    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
      setConnectionState('permission_required');
      setErrorMessage('Camera permission is required to use this feature.');
    } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
      setConnectionState('error');
      setErrorMessage('Camera is currently being used by another application. Please close that application and try again.');
    } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
      setConnectionState('no_camera');
      setErrorMessage('No camera detected.');
    } else if (err.name === 'OverconstrainedError') {
      setConnectionState('error');
      setErrorMessage('Requested camera configuration is not supported by the hardware.');
    } else {
      setConnectionState('error');
      setErrorMessage(err.message || 'Unable to establish connection with the physical camera hardware.');
    }
  };

  // Start Real Physical Camera Stream
  const startRealCamera = async (targetDeviceId?: string, targetFacing?: 'user' | 'environment') => {
    stopRealCamera(false); // Stop existing without setting state to disconnected yet
    setConnectionState('connecting');
    setErrorMessage(null);

    const deviceToUse = targetDeviceId || selectedDeviceId;
    const facingToUse = targetFacing || activeFacingMode;

    const constraints: MediaStreamConstraints = {
      audio: false,
      video: deviceToUse
        ? {
            deviceId: { exact: deviceToUse },
            width: { ideal: 1920, min: 640 },
            height: { ideal: 1080, min: 480 },
          }
        : {
            facingMode: facingToUse,
            width: { ideal: 1920, min: 640 },
            height: { ideal: 1080, min: 480 },
          },
    };

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      const videoTrack = stream.getVideoTracks()[0];
      if (!videoTrack) {
        throw new Error('No active video track obtained from the camera.');
      }

      // Attach track ended listener (for USB unplug / hardware disconnect)
      videoTrack.addEventListener('ended', handleTrackEnded);

      // Read real hardware track settings
      const settings = videoTrack.getSettings ? videoTrack.getSettings() : {};
      const trackLabel = videoTrack.label || 'Physical Camera Device';
      setActiveTrackLabel(trackLabel);
      setActiveTrackId(videoTrack.id);
      setSelectedDeviceId(settings.deviceId || deviceToUse || '');

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch (playErr) {
          console.warn('AutoPlay play() call failed:', playErr);
        }
      }

      setConnectionState('connected');
      setStreamStartTime(Date.now());

      // Auto-populate / register camera into inspector inventory if not present
      if (onAddCamera) {
        const existing = cameras.find((c) => c.name === trackLabel || (settings.deviceId && c.id === settings.deviceId));
        if (!existing) {
          const detectedInfo = getDeviceType(trackLabel);
          const newCameraEntry: CameraDevice = {
            id: settings.deviceId || `CAM-REAL-${Date.now().toString().slice(-4)}`,
            lineId: 'line-real',
            lineName: 'Active Workstation Scanner',
            name: trackLabel,
            model: detectedInfo.label,
            resolution: `${settings.width || 1920}x${settings.height || 1080}`,
            ipAddress: 'Direct USB / Hardware Link',
            status: 'Online',
            fps: settings.frameRate || 30,
          };
          onAddCamera(newCameraEntry);
        }
      }

      // Re-scan available devices to keep labels fresh
      enumerateRealCameras(false);
    } catch (err: any) {
      handleCameraError(err);
      stopRealCamera(true);
    }
  };

  // Stop Real Physical Camera Stream
  const stopRealCamera = (markDisconnected = true) => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.removeEventListener('ended', handleTrackEnded);
        track.stop();
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStreamStartTime(null);
    setStreamFps(0);
    setStreamResolution({ width: 0, height: 0 });

    if (markDisconnected) {
      setConnectionState('disconnected');
    }
  };

  // Physical USB Unplug / Disconnection Listener
  const handleTrackEnded = () => {
    console.warn('Camera video track ended (hardware unplugged or disconnected)');
    const disconnectedName = activeTrackLabel || 'Camera Device';
    setLastDisconnectedDeviceName(disconnectedName);
    stopRealCamera(true);
    setConnectionState('disconnected');
    setErrorMessage(`Physical camera '${disconnectedName}' was disconnected or unplugged.`);
    // Re-check remaining devices
    enumerateRealCameras(false);
  };

  // Switch Camera (Mobile Front ↔ Rear & Multi-device Toggle)
  const handleSwitchCamera = async () => {
    if (availableDevices.length <= 1) {
      // Toggle facingMode if device list has only 1 entry or on mobile
      const nextFacing = activeFacingMode === 'user' ? 'environment' : 'user';
      setActiveFacingMode(nextFacing);
      await startRealCamera(undefined, nextFacing);
      return;
    }

    // If multiple devices exist, cycle to the next physical device
    const currentIndex = availableDevices.findIndex((d) => d.deviceId === selectedDeviceId);
    const nextIndex = (currentIndex + 1) % availableDevices.length;
    const nextDevice = availableDevices[nextIndex];
    if (nextDevice) {
      setSelectedDeviceId(nextDevice.deviceId);
      if (nextDevice.facingMode && nextDevice.facingMode !== 'unknown') {
        setActiveFacingMode(nextDevice.facingMode);
      }
      await startRealCamera(nextDevice.deviceId);
    }
  };

  // Initial Mount: Enumerate Devices and listen for devicechange
  useEffect(() => {
    enumerateRealCameras(false);

    const handleDeviceChange = async () => {
      console.log('Media devices changed (device plugged or unplugged)');
      const updatedDevices = await enumerateRealCameras(false);

      // If active stream's device is no longer in the list, disconnect
      if (streamRef.current && selectedDeviceId) {
        const stillPresent = updatedDevices.some((d) => d.deviceId === selectedDeviceId);
        if (!stillPresent) {
          handleTrackEnded();
        }
      }
    };

    if (navigator.mediaDevices && navigator.mediaDevices.addEventListener) {
      navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
    }

    return () => {
      if (navigator.mediaDevices && navigator.mediaDevices.removeEventListener) {
        navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
      }
      stopRealCamera(true);
    };
  }, []);

  // Update live stream duration timer
  useEffect(() => {
    if (connectionState !== 'connected' || !streamStartTime) return;
    const timer = setInterval(() => {
      const elapsedSec = Math.floor((Date.now() - streamStartTime) / 1000);
      const mins = String(Math.floor(elapsedSec / 60)).padStart(2, '0');
      const secs = String(elapsedSec % 60).padStart(2, '0');
      setStreamDuration(`${mins}:${secs}`);
    }, 1000);
    return () => clearInterval(timer);
  }, [connectionState, streamStartTime]);

  // Video metadata loaded (read exact hardware resolution and fps)
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const w = videoRef.current.videoWidth;
      const h = videoRef.current.videoHeight;
      setStreamResolution({ width: w, height: h });

      if (streamRef.current) {
        const track = streamRef.current.getVideoTracks()[0];
        if (track && track.getSettings) {
          const settings = track.getSettings();
          setStreamFps(settings.frameRate ? Math.round(settings.frameRate) : 30);
        }
      }
    }
  };

  // Status Badge Component Helper
  const renderStatusBadge = () => {
    switch (connectionState) {
      case 'connected':
        return (
          <div className="flex items-center space-x-2 px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="font-mono text-xs font-black tracking-wider uppercase">Camera Connected</span>
          </div>
        );
      case 'connecting':
        return (
          <div className="flex items-center space-x-2 px-3 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            <span className="font-mono text-xs font-black tracking-wider uppercase">Connecting...</span>
          </div>
        );
      case 'permission_required':
        return (
          <div className="flex items-center space-x-2 px-3 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
            <span className="font-mono text-xs font-black tracking-wider uppercase">Permission Required</span>
          </div>
        );
      case 'no_camera':
        return (
          <div className="flex items-center space-x-2 px-3 py-1 rounded-xl bg-slate-800 text-slate-400 border border-slate-700">
            <VideoOff className="h-3.5 w-3.5 text-slate-500" />
            <span className="font-mono text-xs font-black tracking-wider uppercase">No Camera Detected</span>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center space-x-2 px-3 py-1 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/40">
            <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />
            <span className="font-mono text-xs font-black tracking-wider uppercase">Camera Error</span>
          </div>
        );
      case 'disconnected':
      default:
        return (
          <div className="flex items-center space-x-2 px-3 py-1 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500"></span>
            <span className="font-mono text-xs font-black tracking-wider uppercase">Camera Disconnected</span>
          </div>
        );
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center space-x-2">
            <Video className="h-6 w-6 text-cyan-400" />
            <span>REAL-TIME CAMERA & OPTICAL SENSOR INTEGRATION</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Connect and configure built-in laptop webcams, USB optical sensors, and mobile cameras for physical AI visual inspection
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              setShowAddModal(true);
              enumerateRealCameras(true);
            }}
            className="inline-flex items-center space-x-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2.5 text-xs font-bold text-slate-950 shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:scale-[1.02] transition-transform"
          >
            <Plus className="h-4 w-4" />
            <span>Add Camera</span>
          </button>
        </div>
      </div>

      {/* Disconnection Warning Alert */}
      {lastDisconnectedDeviceName && connectionState === 'disconnected' && (
        <div className="p-4 rounded-2xl border border-rose-500/40 bg-rose-500/10 backdrop-blur-md flex items-start justify-between space-x-3">
          <div className="flex items-start space-x-3">
            <XCircle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="text-xs font-mono space-y-1">
              <p className="font-bold text-rose-200">Physical Camera Unplugged</p>
              <p className="text-rose-300/80">
                The device <span className="font-bold text-white font-mono">{lastDisconnectedDeviceName}</span> was disconnected from your workstation. Please reconnect the USB cable or select an alternative camera.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setLastDisconnectedDeviceName(null);
              enumerateRealCameras(true);
            }}
            className="px-3 py-1.5 rounded-lg bg-rose-500/20 text-rose-200 text-xs font-mono font-bold hover:bg-rose-500/30 transition-colors shrink-0"
          >
            Scan for Reconnection
          </button>
        </div>
      )}

      {/* Permission Denied Notice */}
      {connectionState === 'permission_required' && (
        <div className="p-5 rounded-2xl border border-amber-500/40 bg-amber-500/10 backdrop-blur-md space-y-3">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs font-mono space-y-1">
              <p className="font-bold text-amber-200 text-sm">Camera Permission Required</p>
              <p className="text-amber-300/90 font-medium">
                Camera permission is required to use this feature. Please allow camera access in your browser prompt or site permissions.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3 pt-2">
            <button
              onClick={() => startRealCamera(selectedDeviceId)}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-amber-400 text-slate-950 text-xs font-mono font-black hover:bg-amber-300 transition-colors shadow-lg"
            >
              <ShieldCheck className="h-4 w-4" />
              <span>Grant & Authorize Camera Access</span>
            </button>
          </div>
        </div>
      )}

      {/* Error Notice */}
      {connectionState === 'error' && errorMessage && (
        <div className="p-4 rounded-2xl border border-rose-500/40 bg-rose-500/10 backdrop-blur-md flex items-start space-x-3">
          <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="text-xs font-mono space-y-1">
            <p className="font-bold text-rose-200">Camera Access Error</p>
            <p className="text-rose-300">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Main Grid: Device Inventory + Real Live Stream Viewport */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Physical Hardware Inventory */}
        <div className="lg:col-span-1 space-y-5">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center space-x-2">
                <Camera className="h-4 w-4" />
                <span>Available Physical Cameras</span>
              </h3>
              <button
                onClick={() => enumerateRealCameras(true)}
                disabled={isScanningDevices}
                title="Scan connected USB and integrated cameras"
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isScanningDevices ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Camera Selection List */}
            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {availableDevices.length === 0 ? (
                <div className="p-6 rounded-xl border border-dashed border-slate-800 bg-slate-950/50 text-center space-y-3">
                  <VideoOff className="h-8 w-8 text-slate-600 mx-auto" />
                  <div className="space-y-1">
                    <p className="text-xs font-mono font-bold text-slate-300">No camera detected</p>
                    <p className="text-[11px] text-slate-500 font-mono">
                      Connect a USB webcam or enable camera permissions to detect available devices.
                    </p>
                  </div>
                  <button
                    onClick={() => enumerateRealCameras(true)}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-mono font-bold hover:bg-cyan-500/30 transition-colors"
                  >
                    <RefreshCw className="h-3 w-3" />
                    <span>Detect Cameras</span>
                  </button>
                </div>
              ) : (
                availableDevices.map((device, idx) => {
                  const isSelected = selectedDeviceId === device.deviceId || (connectionState === 'connected' && activeTrackLabel === device.label);
                  const devType = getDeviceType(device.label);
                  const Icon = devType.icon;

                  return (
                    <div
                      key={device.deviceId || `dev-${idx}`}
                      onClick={() => {
                        setSelectedDeviceId(device.deviceId);
                        startRealCamera(device.deviceId);
                      }}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all duration-200 space-y-2 ${
                        isSelected
                          ? 'border-cyan-500/60 bg-cyan-500/10 shadow-[0_0_18px_rgba(6,182,212,0.25)]'
                          : 'border-slate-800 bg-slate-950/80 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center space-x-2 min-w-0">
                          <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-900 text-slate-400'}`}>
                            <Icon className="h-4 w-4 shrink-0" />
                          </div>
                          <span className="font-mono text-xs font-bold text-slate-100 truncate" title={device.label}>
                            {device.label}
                          </span>
                        </div>

                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold shrink-0 ${
                            isSelected && connectionState === 'connected'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : isSelected && connectionState === 'connecting'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}
                        >
                          {isSelected && connectionState === 'connected' ? 'Active Feed' : 'Ready'}
                        </span>
                      </div>

                      <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/60">
                        <span>{devType.label}</span>
                        <span className="text-cyan-400 font-semibold">{isSelected && connectionState === 'connected' ? 'Streaming' : 'Select'}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Quick Switch Camera Button (Mobile & Multi-Device) */}
            <div className="pt-2">
              <button
                onClick={handleSwitchCamera}
                disabled={availableDevices.length === 0 && !streamRef.current}
                className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-xl border border-slate-700 bg-slate-800/90 text-xs font-mono font-bold text-slate-200 hover:bg-slate-700 hover:text-white transition-all disabled:opacity-40"
              >
                <SwitchCamera className="h-4 w-4 text-cyan-400" />
                <span>Switch Camera (Front ↔ Rear / USB)</span>
              </button>
            </div>
          </div>

          {/* Real Hardware Information Panel */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 space-y-3 shadow-xl">
            <h4 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
              <Info className="h-4 w-4 text-cyan-400" />
              <span>Camera Connection Guidelines</span>
            </h4>
            <div className="text-[11px] font-mono text-slate-400 space-y-2 leading-relaxed">
              <p>• <strong className="text-slate-200">Laptop Webcam:</strong> Integrated front sensors are automatically discovered upon browser permission authorization.</p>
              <p>• <strong className="text-slate-200">USB Webcam:</strong> Plug in any UVC-compliant USB optical inspection camera. Real-time unplug/replug events are dynamically detected.</p>
              <p>• <strong className="text-slate-200">Mobile Devices:</strong> Use the Switch Camera toggle to switch between high-resolution rear macro optics and front preview lenses.</p>
            </div>
          </div>
        </div>

        {/* Right Column: Real Live Stream Viewport & Controls */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 space-y-6 shadow-xl">
            {/* Viewport Header & Status */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-base font-mono font-bold text-white flex items-center space-x-2">
                  <Radio className={`h-4 w-4 ${connectionState === 'connected' ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
                  <span className="truncate max-w-sm">{activeTrackLabel || 'Live Physical Camera Feed'}</span>
                </h2>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  {connectionState === 'connected'
                    ? `Hardware Active • ID: ${activeTrackId ? activeTrackId.slice(0, 16) + '...' : 'Live WebRTC Stream'}`
                    : 'Awaiting camera initialization or device selection'}
                </p>
              </div>

              <div className="flex items-center space-x-2">
                {renderStatusBadge()}
              </div>
            </div>

            {/* Real Live Video Frame Container */}
            <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 aspect-video flex flex-col items-center justify-center text-center shadow-inner">
              {/* Actual Video Element */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                onLoadedMetadata={handleLoadedMetadata}
                className={`w-full h-full object-contain ${connectionState === 'connected' ? 'block' : 'hidden'}`}
              />

              {/* Grid / Reticle Overlay for Optical Alignment */}
              {connectionState === 'connected' && showGridOverlay && (
                <div className="absolute inset-0 pointer-events-none border border-cyan-500/20">
                  {/* Grid Lines */}
                  <div className="absolute inset-x-0 top-1/3 border-b border-cyan-500/20"></div>
                  <div className="absolute inset-x-0 top-2/3 border-b border-cyan-500/20"></div>
                  <div className="absolute inset-y-0 left-1/3 border-r border-cyan-500/20"></div>
                  <div className="absolute inset-y-0 left-2/3 border-r border-cyan-500/20"></div>
                  {/* Center Crosshair */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-10 w-10 border border-cyan-400/50 rounded-full flex items-center justify-center">
                    <div className="h-1.5 w-1.5 bg-cyan-400 rounded-full"></div>
                  </div>
                </div>
              )}

              {/* Stream Telemetry Badges (Overlaid on Active Video) */}
              {connectionState === 'connected' && (
                <>
                  <div className="absolute top-3 left-3 flex items-center space-x-2 bg-slate-950/85 backdrop-blur-md px-3 py-1 rounded-lg border border-slate-800 text-[10px] font-mono text-emerald-400">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>LIVE PHYSICAL SENSOR</span>
                  </div>

                  <div className="absolute top-3 right-3 flex items-center space-x-2 bg-slate-950/85 backdrop-blur-md px-3 py-1 rounded-lg border border-slate-800 text-[10px] font-mono text-slate-300">
                    <span>
                      {streamResolution.width > 0 ? `${streamResolution.width}x${streamResolution.height}` : 'Active'} • {streamFps > 0 ? `${streamFps} FPS` : 'Live'} • {streamDuration}
                    </span>
                  </div>
                </>
              )}

              {/* Placeholder / Connecting / Disconnected State View */}
              {connectionState !== 'connected' && (
                <div className="p-8 space-y-4 max-w-md">
                  {connectionState === 'connecting' ? (
                    <>
                      <RefreshCw className="h-12 w-12 text-cyan-400 mx-auto animate-spin" />
                      <div className="space-y-1 font-mono">
                        <h4 className="text-sm font-bold text-slate-100">Connecting Physical Camera...</h4>
                        <p className="text-xs text-slate-400">Establishing hardware MediaStream and synchronizing optical frame rate.</p>
                      </div>
                    </>
                  ) : connectionState === 'permission_required' ? (
                    <>
                      <ShieldCheck className="h-12 w-12 text-amber-400 mx-auto" />
                      <div className="space-y-1 font-mono">
                        <h4 className="text-sm font-bold text-amber-200">Camera Permission Required</h4>
                        <p className="text-xs text-slate-400">Click the button below to grant permission and initiate live preview.</p>
                      </div>
                      <button
                        onClick={() => startRealCamera(selectedDeviceId)}
                        className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold font-mono text-xs hover:bg-cyan-400 transition-colors shadow-lg"
                      >
                        <Play className="h-3.5 w-3.5 fill-current" />
                        <span>Authorize & Open Camera</span>
                      </button>
                    </>
                  ) : connectionState === 'no_camera' ? (
                    <>
                      <VideoOff className="h-12 w-12 text-slate-600 mx-auto" />
                      <div className="space-y-1 font-mono">
                        <h4 className="text-sm font-bold text-slate-300">No Camera Detected</h4>
                        <p className="text-xs text-slate-500">Please connect a USB webcam or open this application on a camera-equipped device.</p>
                      </div>
                      <button
                        onClick={() => enumerateRealCameras(true)}
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-200 font-mono text-xs hover:bg-slate-700 transition-colors"
                      >
                        <RefreshCw className="h-3 w-3" />
                        <span>Re-Scan Hardware</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <VideoOff className="h-12 w-12 text-slate-600 mx-auto" />
                      <div className="space-y-1 font-mono">
                        <h4 className="text-sm font-bold text-slate-300">Camera Disconnected</h4>
                        <p className="text-xs text-slate-500">Select a camera from the inventory on the left or click Start Camera to begin.</p>
                      </div>
                      <button
                        onClick={() => startRealCamera(selectedDeviceId)}
                        className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold font-mono text-xs hover:scale-[1.02] transition-transform shadow-[0_0_20px_rgba(6,182,212,0.4)]"
                      >
                        <Play className="h-4 w-4 fill-current" />
                        <span>Start Camera</span>
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Live Camera Controls Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl border border-slate-800 bg-slate-950/80">
              <div className="flex items-center space-x-2">
                {connectionState === 'connected' ? (
                  <button
                    onClick={() => stopRealCamera(true)}
                    className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-mono font-bold hover:bg-rose-500/30 transition-colors shadow-lg"
                  >
                    <Square className="h-3.5 w-3.5 fill-current" />
                    <span>Stop Camera</span>
                  </button>
                ) : (
                  <button
                    onClick={() => startRealCamera(selectedDeviceId)}
                    className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 text-xs font-mono font-bold hover:bg-cyan-400 transition-colors shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                  >
                    <Play className="h-3.5 w-3.5 fill-current" />
                    <span>Start Camera</span>
                  </button>
                )}

                <button
                  onClick={handleSwitchCamera}
                  disabled={availableDevices.length === 0}
                  className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800 text-slate-200 border border-slate-700 text-xs font-mono font-bold hover:bg-slate-700 transition-colors disabled:opacity-40"
                  title="Switch between front/rear or next USB camera"
                >
                  <SwitchCamera className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Switch Camera</span>
                </button>

                <button
                  onClick={() => setShowGridOverlay(!showGridOverlay)}
                  className={`inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl border text-xs font-mono font-bold transition-colors ${
                    showGridOverlay
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <Layers className="h-3.5 w-3.5" />
                  <span>Optical Reticle</span>
                </button>
              </div>

              {/* Live Status indicator */}
              <div className="text-[11px] font-mono text-slate-400 flex items-center space-x-2">
                <span>Mode:</span>
                <span className="text-slate-200 font-bold">{activeFacingMode === 'user' ? 'Front / User' : 'Rear / Macro'}</span>
              </div>
            </div>

            {/* Real Hardware Technical Specifications */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
              <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/80 space-y-1">
                <span className="text-slate-500 text-[10px]">Hardware Sensor:</span>
                <p className="font-bold text-slate-100 truncate">{activeTrackLabel || 'Camera Hardware'}</p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/80 space-y-1">
                <span className="text-slate-500 text-[10px]">Connection Protocol:</span>
                <p className="font-bold text-cyan-400">MediaStream / WebRTC</p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/80 space-y-1">
                <span className="text-slate-500 text-[10px]">Active Resolution:</span>
                <p className="font-bold text-purple-300">
                  {streamResolution.width > 0 ? `${streamResolution.width} x ${streamResolution.height}` : 'Auto'}
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/80 space-y-1">
                <span className="text-slate-500 text-[10px]">Stream Rate:</span>
                <p className="font-bold text-emerald-400">{streamFps > 0 ? `${streamFps} FPS` : '30 FPS'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Camera Modal with Real Hardware Detection */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div className="w-full max-w-lg rounded-2xl border border-cyan-500/40 bg-slate-900 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white font-mono flex items-center space-x-2">
                <Camera className="h-5 w-5 text-cyan-400" />
                <span>Detect & Add Physical Camera</span>
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white font-mono">
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs font-mono">
              <p className="text-slate-300 leading-relaxed">
                VisionInspect detects all physical video sensors currently plugged into this machine (internal webcam, USB webcams, mobile front/back lenses).
              </p>

              <div className="space-y-2">
                <label className="block text-slate-400 font-bold">Detected Physical Cameras on Device:</label>
                {availableDevices.length === 0 ? (
                  <div className="p-4 rounded-xl border border-slate-800 bg-slate-950 text-center space-y-2">
                    <p className="text-slate-400">No camera detected yet or permission needed.</p>
                    <button
                      type="button"
                      onClick={() => enumerateRealCameras(true)}
                      className="px-3 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold hover:bg-cyan-500/30 transition-colors"
                    >
                      Authorize & Scan Cameras
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {availableDevices.map((d, index) => {
                      const devInfo = getDeviceType(d.label);
                      const Icon = devInfo.icon;
                      const isChosen = selectedDeviceId === d.deviceId;

                      return (
                        <div
                          key={d.deviceId || index}
                          onClick={() => setSelectedDeviceId(d.deviceId)}
                          className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between ${
                            isChosen
                              ? 'border-cyan-500 bg-cyan-500/10 text-white'
                              : 'border-slate-800 bg-slate-950 hover:border-slate-700 text-slate-300'
                          }`}
                        >
                          <div className="flex items-center space-x-2.5">
                            <Icon className="h-4 w-4 text-cyan-400 shrink-0" />
                            <div>
                              <p className="font-bold">{d.label}</p>
                              <p className="text-[10px] text-slate-500">{devInfo.label}</p>
                            </div>
                          </div>
                          {isChosen && <CheckCircle2 className="h-4 w-4 text-cyan-400" />}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    startRealCamera(selectedDeviceId);
                  }}
                  className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                >
                  Connect Selected Camera
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
