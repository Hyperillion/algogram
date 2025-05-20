import React, { useEffect, useState } from 'react';
import { Box, FormControl, InputLabel, Select, MenuItem } from '@mui/material';

export default function CameraSelector({ onStreamReady }) {
  const [availableCameras, setAvailableCameras] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');

  // 🔹 Ask for camera permission + get devices
  useEffect(() => {
    const initCameraAccess = async () => {
      try {
        const tempStream = await navigator.mediaDevices.getUserMedia({ video: true });

        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter((d) => d.kind === 'videoinput');

        setAvailableCameras(videoDevices);

        tempStream.getTracks().forEach((track) => track.stop());

        const backCamera = videoDevices.find((d) =>
          d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('rear')
        );

        const defaultId = backCamera?.deviceId || videoDevices[0]?.deviceId;
        if (defaultId) setSelectedDeviceId(defaultId);
      } catch (err) {
        alert('Camera access denied.');
        console.error('Camera init error:', err);
      }
    };

    initCameraAccess();
  }, []);

  // 🔹 Start streaming based on selected camera
  useEffect(() => {
    const startCamera = async () => {
      if (!selectedDeviceId) return;

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { deviceId: selectedDeviceId },
        });
        onStreamReady(stream);
      } catch (err) {
        console.error('Camera stream error:', err);
      }
    };

    startCamera();
  }, [selectedDeviceId, onStreamReady]);

  return (
    <Box sx={{ position: 'absolute', top: 16, right: 16, zIndex: 10, minWidth: 200 }}>
      {availableCameras.length > 0 && (
        <FormControl fullWidth size="small">
          <InputLabel id="camera-select-label">Camera</InputLabel>
          <Select
            labelId="camera-select-label"
            value={selectedDeviceId}
            label="Camera"
            onChange={(e) => setSelectedDeviceId(e.target.value)}
          >
            {availableCameras.map((camera) => (
              <MenuItem key={camera.deviceId} value={camera.deviceId}>
                {camera.label || `Camera ${camera.deviceId.slice(-4)}`}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}
    </Box>
  );
}
