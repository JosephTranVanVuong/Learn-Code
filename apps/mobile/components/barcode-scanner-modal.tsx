import { useRef } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from "expo-camera";
import { vi } from "@thuvien/shared";

interface Props {
  visible: boolean;
  title: string;
  onScanned: (data: string) => void;
  onClose: () => void;
}

export function BarcodeScannerModal({ visible, title, onScanned, onClose }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const hasScannedRef = useRef(false);

  function handleBarcodeScanned(result: BarcodeScanningResult) {
    if (hasScannedRef.current) return;
    hasScannedRef.current = true;
    onScanned(result.data);
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      onShow={() => {
        hasScannedRef.current = false;
      }}
    >
      <View style={{ flex: 1, backgroundColor: "black" }}>
        {visible && permission?.granted && (
          <CameraView
            style={{ flex: 1 }}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ["code128"] }}
            onBarcodeScanned={handleBarcodeScanned}
          />
        )}
        {visible && permission && !permission.granted && (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
            <Text style={{ color: "white", textAlign: "center", marginBottom: 16 }}>
              Cần cấp quyền camera để quét mã vạch
            </Text>
            <Pressable
              onPress={requestPermission}
              style={{ backgroundColor: "white", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 }}
            >
              <Text style={{ fontWeight: "600" }}>Cấp quyền</Text>
            </Pressable>
          </View>
        )}

        <View
          style={{
            position: "absolute",
            top: 56,
            left: 0,
            right: 0,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 20,
          }}
        >
          <Text style={{ color: "white", fontSize: 16, fontWeight: "600" }}>{title}</Text>
          <Pressable
            onPress={onClose}
            style={{ backgroundColor: "rgba(255,255,255,0.15)", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 }}
          >
            <Text style={{ color: "white", fontWeight: "600", fontSize: 13 }}>{vi.loan.scanCancel}</Text>
          </Pressable>
        </View>

        <View
          style={{
            position: "absolute",
            bottom: 60,
            left: 0,
            right: 0,
            alignItems: "center",
          }}
        >
          <View style={{ width: 240, height: 140, borderWidth: 2, borderColor: "white", borderRadius: 12 }} />
        </View>
      </View>
    </Modal>
  );
}
