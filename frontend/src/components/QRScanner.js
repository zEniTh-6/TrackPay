import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  StatusBar,
  Alert,
} from 'react-native';
import { Camera, useCameraDevice, useCodeScanner } from 'react-native-vision-camera';

const QRScanner = ({ visible, onScanned, onClose }) => {
  const [hasPermission, setHasPermission] = useState(false);
  const device = useCameraDevice('back');

  useEffect(() => {
    if (visible) {
      requestCameraPermission();
    }
  }, [visible]);

  const requestCameraPermission = async () => {
    const status = await Camera.requestCameraPermission();
    setHasPermission(status === 'granted');
    if (status !== 'granted') {
      Alert.alert(
        'Camera Permission Required',
        'Please allow camera access in Settings to scan QR codes.',
        [{ text: 'OK', onPress: onClose }]
      );
    }
  };

  const codeScanner = useCodeScanner({
    codeTypes: ['qr'],
    onCodeScanned: (codes) => {
      if (codes.length > 0 && codes[0].value) {
        onScanned(codes[0].value);
      }
    },
  });

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={s.root}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />

        {/* Camera View */}
        {hasPermission && device ? (
          <Camera
            style={StyleSheet.absoluteFill}
            device={device}
            isActive={visible}
            codeScanner={codeScanner}
          />
        ) : (
          <View style={s.noCamera}>
            <Text style={s.noCameraText}>
              {hasPermission ? 'No camera found.' : 'Requesting camera access…'}
            </Text>
          </View>
        )}

        {/* Overlay with targeting box */}
        <View style={s.overlay}>
          {/* Top dimmed area */}
          <View style={s.overlayTop} />

          {/* Middle row: dim | clear window | dim */}
          <View style={s.overlayMiddle}>
            <View style={s.overlaySide} />
            <View style={s.scanWindow}>
              {/* Corner brackets */}
              <View style={[s.corner, s.cornerTL]} />
              <View style={[s.corner, s.cornerTR]} />
              <View style={[s.corner, s.cornerBL]} />
              <View style={[s.corner, s.cornerBR]} />
            </View>
            <View style={s.overlaySide} />
          </View>

          {/* Bottom dimmed area + UI */}
          <View style={s.overlayBottom}>
            <Text style={s.hint}>Point at a UPI QR code to scan</Text>
            <TouchableOpacity style={s.closeBtn} onPress={onClose} activeOpacity={0.8}>
              <Text style={s.closeBtnText}>✕  Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const WINDOW_SIZE = 260;
const CORNER_SIZE = 28;
const CORNER_THICKNESS = 4;
const CORNER_COLOR = '#F5F0EB';

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },

  noCamera: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
  },
  noCameraText: { color: '#9C8F84', fontSize: 15 },

  overlay: { ...StyleSheet.absoluteFillObject },
  overlayTop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.62)' },
  overlayMiddle: { flexDirection: 'row', height: WINDOW_SIZE },
  overlaySide: { flex: 1, backgroundColor: 'rgba(0,0,0,0.62)' },
  scanWindow: {
    width: WINDOW_SIZE,
    height: WINDOW_SIZE,
  },

  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderColor: CORNER_COLOR,
  },
  cornerTL: {
    top: 0, left: 0,
    borderTopWidth: CORNER_THICKNESS, borderLeftWidth: CORNER_THICKNESS,
    borderTopLeftRadius: 4,
  },
  cornerTR: {
    top: 0, right: 0,
    borderTopWidth: CORNER_THICKNESS, borderRightWidth: CORNER_THICKNESS,
    borderTopRightRadius: 4,
  },
  cornerBL: {
    bottom: 0, left: 0,
    borderBottomWidth: CORNER_THICKNESS, borderLeftWidth: CORNER_THICKNESS,
    borderBottomLeftRadius: 4,
  },
  cornerBR: {
    bottom: 0, right: 0,
    borderBottomWidth: CORNER_THICKNESS, borderRightWidth: CORNER_THICKNESS,
    borderBottomRightRadius: 4,
  },

  overlayBottom: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.62)',
    alignItems: 'center',
    paddingTop: 32,
  },
  hint: {
    color: '#F5F0EB',
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.3,
    marginBottom: 32,
  },
  closeBtn: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    paddingHorizontal: 28,
    paddingVertical: 14,
  },
  closeBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 0.5,
  },
});

export default QRScanner;
