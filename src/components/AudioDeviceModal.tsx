import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Mic,
  Headphones,
  Sliders,
  Check,
  AlertCircle,
  Volume2,
  RefreshCw,
  Radio,
  Zap,
  ShieldCheck,
} from 'lucide-react';
import { deviceManager, AudioDeviceInfo, RecognizedHardware } from '../audio/deviceManager';
import { audioEngine } from '../audio/audioEngine';

interface AudioDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AudioDeviceModal: React.FC<AudioDeviceModalProps> = ({ isOpen, onClose }) => {
  const [inputs, setInputs] = useState<AudioDeviceInfo[]>([]);
  const [outputs, setOutputs] = useState<AudioDeviceInfo[]>([]);
  const [selectedInputId, setSelectedInputId] = useState<string>('default');
  const [selectedOutputId, setSelectedOutputId] = useState<string>('default');
  const [isDirectMonitoring, setIsDirectMonitoring] = useState(false);
  const [monitorVolume, setMonitorVolume] = useState(0.8);
  const [liveTestLevel, setLiveTestLevel] = useState(0);
  const [isTestingInput, setIsTestingInput] = useState(false);
  const [hardwareToast, setHardwareToast] = useState<string | null>(null);

  const testStreamRef = useRef<MediaStream | null>(null);
  const testAnalyserRef = useRef<AnalyserNode | null>(null);
  const testAnimFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadDevices();
      setIsDirectMonitoring(deviceManager.getIsDirectMonitoringActive());
    } else {
      stopTestingMic();
    }
  }, [isOpen]);

  const loadDevices = async () => {
    // Request permission once if labels are empty
    try {
      const tempStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      tempStream.getTracks().forEach((t) => t.stop());
    } catch (e) {
      console.warn('Microphone permission request:', e);
    }

    const { inputs: inDevs, outputs: outDevs } = await deviceManager.refreshDevices();
    setInputs(inDevs);
    setOutputs(outDevs);
    setSelectedInputId(deviceManager.getSelectedInputId());
    setSelectedOutputId(deviceManager.getSelectedOutputId());

    // Check if Focusrite or Corsair is detected
    const foundFocusrite = inDevs.find((d) => d.hardware.brand === 'Focusrite');
    const foundCorsair = outDevs.find((d) => d.hardware.brand === 'Corsair') || inDevs.find((d) => d.hardware.brand === 'Corsair');

    if (foundFocusrite) {
      setHardwareToast(`Focusrite ${foundFocusrite.hardware.model} studio interface ready!`);
    } else if (foundCorsair) {
      setHardwareToast(`Corsair USB Audio headset ready!`);
    }
  };

  const handleSelectInput = (deviceId: string) => {
    setSelectedInputId(deviceId);
    deviceManager.setSelectedInputId(deviceId);
    if (isTestingInput) {
      stopTestingMic();
      setTimeout(() => startTestingMic(deviceId), 150);
    }
  };

  const handleSelectOutput = (deviceId: string) => {
    setSelectedOutputId(deviceId);
    const ctx = audioEngine.getAudioContext();
    deviceManager.setSelectedOutputId(deviceId, ctx);
  };

  const handleToggleMonitoring = () => {
    const ctx = audioEngine.getAudioContext();
    if (isDirectMonitoring) {
      deviceManager.stopDirectMonitoring();
      setIsDirectMonitoring(false);
    } else {
      deviceManager.startDirectMonitoring(ctx, monitorVolume);
      setIsDirectMonitoring(true);
    }
  };

  const handleMonitorVolumeChange = (vol: number) => {
    setMonitorVolume(vol);
    deviceManager.setMonitoringVolume(vol);
  };

  const startTestingMic = async (deviceId: string = selectedInputId) => {
    try {
      const constraints: MediaStreamConstraints = {
        audio: {
          deviceId: deviceId && deviceId !== 'default' ? { exact: deviceId } : undefined,
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      testStreamRef.current = stream;

      const ctx = audioEngine.getAudioContext();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128;
      source.connect(analyser);
      testAnalyserRef.current = analyser;
      setIsTestingInput(true);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateMeter = () => {
        if (!testAnalyserRef.current) return;
        testAnalyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        const norm = Math.min(1, (avg / 128) * 1.5);
        setLiveTestLevel(norm);
        testAnimFrameRef.current = requestAnimationFrame(updateMeter);
      };
      testAnimFrameRef.current = requestAnimationFrame(updateMeter);
    } catch (e) {
      console.error('Failed to test microphone:', e);
    }
  };

  const stopTestingMic = () => {
    if (testAnimFrameRef.current) {
      cancelAnimationFrame(testAnimFrameRef.current);
      testAnimFrameRef.current = null;
    }
    if (testStreamRef.current) {
      testStreamRef.current.getTracks().forEach((t) => t.stop());
      testStreamRef.current = null;
    }
    testAnalyserRef.current = null;
    setLiveTestLevel(0);
    setIsTestingInput(false);
  };

  if (!isOpen) return null;

  const activeInputHw = inputs.find((d) => d.deviceId === selectedInputId)?.hardware;
  const activeOutputHw = outputs.find((d) => d.deviceId === selectedOutputId)?.hardware;

  return (
    <div
      id="audio-device-modal"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in"
    >
      <div className="w-full max-w-xl bg-zinc-950 border border-zinc-800 rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-zinc-100">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 bg-zinc-900/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold tracking-tight text-white flex items-center gap-2">
                Audio Hardware & Monitoring
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Live Sync
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Auto-recognized Scarlett, Corsair, and studio audio interfaces
              </p>
            </div>
          </div>
          <button
            id="close-device-modal-btn"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-6">
          {hardwareToast && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-950/40 border border-red-800/60 text-xs text-red-200">
              <Zap className="w-4 h-4 text-red-400 shrink-0" />
              <span>{hardwareToast}</span>
            </div>
          )}

          {/* Active Hardware Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Input Hardware Card */}
            <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-zinc-400 uppercase font-mono flex items-center gap-1.5">
                  <Mic className="w-3.5 h-3.5 text-red-400" /> Active Input
                </span>
                {activeInputHw?.isStudioGrade && (
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-red-900/50 text-red-300 border border-red-700/50">
                    Studio Grade
                  </span>
                )}
              </div>
              <div className="font-medium text-sm text-white truncate">
                {activeInputHw ? activeInputHw.model : 'Default Input'}
              </div>
              <div className="text-xs text-zinc-400 mt-1">
                Brand: <span className="text-zinc-200">{activeInputHw?.brand || 'Generic'}</span>
              </div>
            </div>

            {/* Output Hardware Card */}
            <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-zinc-400 uppercase font-mono flex items-center gap-1.5">
                  <Headphones className="w-3.5 h-3.5 text-amber-400" /> Active Output
                </span>
                {activeOutputHw?.brand === 'Corsair' && (
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    Corsair Audio
                  </span>
                )}
              </div>
              <div className="font-medium text-sm text-white truncate">
                {activeOutputHw ? activeOutputHw.model : 'Default Output'}
              </div>
              <div className="text-xs text-zinc-400 mt-1">
                Brand: <span className="text-zinc-200">{activeOutputHw?.brand || 'Generic'}</span>
              </div>
            </div>
          </div>

          {/* Direct Hardware / Software Monitoring */}
          <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-lg ${isDirectMonitoring ? 'bg-amber-500 text-black font-bold' : 'bg-zinc-800 text-zinc-400'}`}>
                  <Radio className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-medium text-white flex items-center gap-2">
                    Direct Monitoring (Hear Yourself)
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                      Zero-Latency
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400">
                    Routes live microphone signal to your Corsair headphones or Scarlett monitor out
                  </p>
                </div>
              </div>
              <button
                id="toggle-direct-monitoring-btn"
                onClick={handleToggleMonitoring}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isDirectMonitoring
                    ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-500/20'
                    : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                }`}
              >
                {isDirectMonitoring ? 'ON' : 'OFF'}
              </button>
            </div>

            {isDirectMonitoring && (
              <div className="pt-2 border-t border-zinc-800 flex items-center gap-3">
                <Volume2 className="w-4 h-4 text-zinc-400 shrink-0" />
                <span className="text-xs text-zinc-400 shrink-0">Monitor Volume:</span>
                <input
                  type="range"
                  min="0"
                  max="1.2"
                  step="0.05"
                  value={monitorVolume}
                  onChange={(e) => handleMonitorVolumeChange(parseFloat(e.target.value))}
                  className="w-full accent-amber-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                />
                <span className="text-xs font-mono text-zinc-300 w-10 text-right">
                  {Math.round(monitorVolume * 100)}%
                </span>
              </div>
            )}
          </div>

          {/* Live Microphone Test & Level Meter */}
          <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-white">Live Microphone Test</div>
                <p className="text-xs text-zinc-400">Test your microphone levels before recording</p>
              </div>
              <button
                id="mic-test-toggle-btn"
                onClick={() => (isTestingInput ? stopTestingMic() : startTestingMic())}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isTestingInput
                    ? 'bg-red-600 text-white'
                    : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                }`}
              >
                {isTestingInput ? 'Stop Test' : 'Test Mic'}
              </button>
            </div>

            {/* Level Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                <span>-60 dB</span>
                <span>-18 dB</span>
                <span>-6 dB</span>
                <span className="text-red-400">0 dB (Peak)</span>
              </div>
              <div className="h-3 w-full bg-zinc-950 rounded-full overflow-hidden border border-zinc-800 flex">
                <div
                  className="h-full transition-all duration-75"
                  style={{
                    width: `${Math.round(liveTestLevel * 100)}%`,
                    backgroundColor:
                      liveTestLevel > 0.9 ? '#ef4444' : liveTestLevel > 0.7 ? '#eab308' : '#22c55e',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Input Device Selection List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <Mic className="w-3.5 h-3.5 text-red-400" /> Select Audio Input (Mic / Interface)
              </label>
              <button
                onClick={loadDevices}
                className="text-xs text-zinc-400 hover:text-zinc-200 flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" /> Refresh
              </button>
            </div>
            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {inputs.map((device) => {
                const isSelected = device.deviceId === selectedInputId;
                const hw = device.hardware;
                return (
                  <button
                    key={device.deviceId || device.label}
                    onClick={() => handleSelectInput(device.deviceId)}
                    className={`w-full text-left p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                      isSelected
                        ? 'bg-zinc-800 border-red-500/80 text-white'
                        : 'bg-zinc-900/50 border-zinc-800/80 text-zinc-300 hover:bg-zinc-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          hw.brand === 'Focusrite'
                            ? 'bg-red-600 text-white'
                            : hw.brand === 'Corsair'
                            ? 'bg-amber-500 text-black'
                            : 'bg-zinc-800 text-zinc-300'
                        }`}
                      >
                        <Mic className="w-3.5 h-3.5" />
                      </div>
                      <div className="truncate">
                        <div className="text-xs font-medium text-white truncate flex items-center gap-1.5">
                          {device.label || 'Default Microphone'}
                          {hw.isStudioGrade && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-red-950 text-red-300 border border-red-800/60">
                              Pro
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-zinc-400">
                          {hw.brand} • {hw.model}
                        </div>
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-red-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Output Device Selection List */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <Headphones className="w-3.5 h-3.5 text-amber-400" /> Select Audio Output (Headphones / Speakers)
            </label>
            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {outputs.map((device) => {
                const isSelected = device.deviceId === selectedOutputId;
                const hw = device.hardware;
                return (
                  <button
                    key={device.deviceId || device.label}
                    onClick={() => handleSelectOutput(device.deviceId)}
                    className={`w-full text-left p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                      isSelected
                        ? 'bg-zinc-800 border-amber-500/80 text-white'
                        : 'bg-zinc-900/50 border-zinc-800/80 text-zinc-300 hover:bg-zinc-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          hw.brand === 'Corsair'
                            ? 'bg-amber-500 text-black'
                            : hw.brand === 'Focusrite'
                            ? 'bg-red-600 text-white'
                            : 'bg-zinc-800 text-zinc-300'
                        }`}
                      >
                        <Headphones className="w-3.5 h-3.5" />
                      </div>
                      <div className="truncate">
                        <div className="text-xs font-medium text-white truncate flex items-center gap-1.5">
                          {device.label || 'Default Speakers / Headphones'}
                          {hw.brand === 'Corsair' && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-700/60">
                              Corsair
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-zinc-400">
                          {hw.brand} • {hw.model}
                        </div>
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-amber-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-zinc-800 bg-zinc-900/80 flex items-center justify-between">
          <div className="text-[11px] text-zinc-400 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>48kHz / 24-bit Low-Latency Audio Stream</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-semibold transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
