import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { validateTicket } from "../lib/api";

export default function ScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ticketData, setTicketData] = useState<any>(null);
  if (!permission) {
    // Camera permissions are still loading
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: "center", color: "#fff", marginBottom: 20 }}>
          We need your permission to show the camera
        </Text>
        <TouchableOpacity onPress={requestPermission} style={styles.button}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned || loading) return;
    setScanned(true);
    setLoading(true);
    setTicketData(null);

    // Vibrate or create feedback here if needed

    try {
      const res = await validateTicket(data);
      if (res.error) {
        Alert.alert("Scan Error", res.error, [
          { text: "OK", onPress: () => setScanned(false) }, // Allow rescan manually or automatically?
        ]);
        setScanned(false); // Auto reset for error? Maybe better to keep overlay.
      } else {
        setTicketData(res);
        // Show success
      }
    } catch {
      setScanned(false);
    } finally {
      setLoading(false);
    }
  };

  const resetScan = () => {
    setScanned(false);
    setTicketData(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.cameraContainer}>
        <CameraView
          style={StyleSheet.absoluteFillObject}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ["qr"],
          }}
        />

        {/* Overlay for scan area */}
        {!scanned && (
          <View style={styles.overlay}>
            <View style={styles.unfocusedContainer}></View>
            <View style={styles.middleContainer}>
              <View style={styles.unfocusedContainer}></View>
              <View style={styles.focusedContainer}></View>
              <View style={styles.unfocusedContainer}></View>
            </View>
            <View style={styles.unfocusedContainer}></View>
          </View>
        )}
      </View>

      {/* Result Overlay */}
      {ticketData && (
        <View style={styles.resultContainer}>
          <View
            style={[
              styles.resultCard,
              ticketData.status === "already_scanned"
                ? styles.warningBorder
                : styles.successBorder,
            ]}
          >
            <Text style={styles.resultTitle}>
              {ticketData.status === "already_scanned"
                ? "Already Scanned!"
                : "Ticket Valid!"}
            </Text>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>User:</Text>
              <Text style={styles.infoValue}>
                {ticketData.user?.name || "Guest"}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Phone:</Text>
              <Text style={styles.infoValue}>{ticketData.user?.phone}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Ticket:</Text>
              <Text style={styles.infoValue}>
                {ticketData.ticket?.title || ticketData.ticket?.id}
              </Text>
            </View>
            {/* If multiple tickets were scanned/updated (bulk scan logic from backend) */}
            {ticketData.tickets && (
              <Text style={styles.infoValue}>
                {ticketData.tickets.length} tickets updated
              </Text>
            )}

            <TouchableOpacity onPress={resetScan} style={styles.scanButton}>
              <Text style={styles.scanButtonText}>Scan Next</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {loading && (
        <View style={styles.loadingOverlay}>
          <Text style={styles.loadingText}>Validating...</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  cameraContainer: {
    flex: 1,
  },
  button: {
    backgroundColor: "#e11d48",
    padding: 15,
    borderRadius: 8,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  unfocusedContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  middleContainer: {
    flexDirection: "row",
    flex: 1.5,
  },
  focusedContainer: {
    flex: 10,
    borderWidth: 2,
    borderColor: "#fff",
    backgroundColor: "transparent",
  },
  resultContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.8)",
    padding: 20,
  },
  resultCard: {
    width: "100%",
    backgroundColor: "#1f2937",
    borderRadius: 16,
    padding: 24,
    borderWidth: 2,
  },
  successBorder: {
    borderColor: "#22c55e", // green-500
  },
  warningBorder: {
    borderColor: "#eab308", // yellow-500
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 16,
    textAlign: "center",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  infoLabel: {
    color: "#9ca3af", // gray-400
    fontSize: 16,
  },
  infoValue: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  scanButton: {
    marginTop: 24,
    backgroundColor: "#e11d48",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  scanButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  loadingText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
});
