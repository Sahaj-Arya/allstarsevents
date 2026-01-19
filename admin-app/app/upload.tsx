import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as Clipboard from "expo-clipboard";
import { uploadImage } from "../lib/api";

export default function UploadScreen() {
  const [file, setFile] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [uploaded, setUploaded] = useState<null | {
    id: string;
    url: string;
    path: string;
    filename: string;
    size: number;
    mime: string;
    createdAt: string;
  }>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pickFile = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission required", "Media library permission required.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsMultipleSelection: false,
      quality: 0.9,
    });
    if (!result.canceled) {
      setFile(result.assets?.[0] ?? null);
    }
  };

  const handleSubmit = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const mime =
        file.mimeType || (file.type === "video" ? "video/mp4" : "image/jpeg");
      const name =
        file.fileName ||
        `upload-${Date.now()}.${mime.includes("video") ? "mp4" : "jpg"}`;
      const payload = { uri: file.uri, name, type: mime };
      const result = await uploadImage(payload);
      setUploaded(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!uploaded?.url) return;
    await Clipboard.setStringAsync(uploaded.url);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.header}>Upload media</Text>
        <Text style={styles.subheader}>
          Upload an image or video and get a public URL to use in events.
        </Text>

        <View style={styles.card}>
          <TouchableOpacity style={styles.button} onPress={pickFile}>
            <Text style={styles.buttonText}>
              {file ? "Change file" : "Choose file"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              loading || !file ? styles.buttonDisabled : null,
            ]}
            onPress={handleSubmit}
            disabled={loading || !file}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Upload</Text>
            )}
          </TouchableOpacity>

          {uploaded && (
            <View style={styles.resultBox}>
              <Text style={styles.resultUrl}>{uploaded.url}</Text>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handleCopy}
              >
                <Text style={styles.secondaryButtonText}>Copy URL</Text>
              </TouchableOpacity>
              <View style={styles.metaList}>
                <Text style={styles.metaText}>ID: {uploaded.id}</Text>
                <Text style={styles.metaText}>Path: {uploaded.path}</Text>
                <Text style={styles.metaText}>
                  Filename: {uploaded.filename}
                </Text>
                <Text style={styles.metaText}>Type: {uploaded.mime}</Text>
                <Text style={styles.metaText}>
                  Size: {(uploaded.size / 1024).toFixed(1)} KB
                </Text>
                <Text style={styles.metaText}>
                  Created: {new Date(uploaded.createdAt).toLocaleString()}
                </Text>
              </View>
            </View>
          )}

          {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  content: { padding: 24, gap: 16 },
  header: { fontSize: 28, fontWeight: "700", color: "#fff" },
  subheader: { fontSize: 14, color: "rgba(255,255,255,0.7)", marginBottom: 12 },
  card: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  button: {
    backgroundColor: "#e11d48",
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: "center",
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontWeight: "700" },
  resultBox: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  resultUrl: { color: "#fff", fontSize: 12 },
  secondaryButton: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  secondaryButtonText: { color: "#fff", fontSize: 12 },
  metaList: { gap: 4 },
  metaText: { color: "rgba(255,255,255,0.6)", fontSize: 12 },
  errorText: { color: "#fca5a5", fontSize: 12 },
});
