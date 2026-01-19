import { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import { createEvent, updateEvent, uploadImage } from "../lib/api";
import { EventItem } from "../lib/types";

const toList = (value: string) =>
  value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);

export default function AdminEventsScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<"create" | "update">("create");
  const [id, setId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [photo, setPhoto] = useState("");
  const [images, setImages] = useState("");
  const [media, setMedia] = useState("");
  const [placename, setPlacename] = useState("");
  const [venue, setVenue] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [type, setType] = useState<EventItem["type"]>("event");
  const [isActive, setIsActive] = useState(true);
  const [aboutJson, setAboutJson] = useState("[]");
  const [result, setResult] = useState<EventItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedMedia, setUploadedMedia] = useState<
    { url: string; mime: string }[]
  >([]);

  const parsedAbout = useMemo(() => {
    if (!aboutJson.trim()) return { value: [], error: null };
    try {
      const parsed = JSON.parse(aboutJson);
      return { value: parsed, error: null };
    } catch {
      return { value: [], error: "Invalid JSON" };
    }
  }, [aboutJson]);

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      if (parsedAbout.error) {
        throw new Error("About JSON is invalid");
      }
      const payload = {
        id,
        title,
        description,
        price: Number(price),
        photo,
        images: toList(images),
        media: toList(media),
        placename,
        venue,
        category,
        date,
        time,
        location,
        type,
        isActive,
        about: parsedAbout.value,
      };

      const event =
        mode === "create"
          ? await createEvent(payload)
          : await updateEvent(id, payload);
      setResult(event);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save event");
    } finally {
      setLoading(false);
    }
  };

  const appendText = (prev: string, value: string) =>
    prev.trim().length === 0 ? value : `${prev}\n${value}`;

  const handlePickMedia = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission required", "Media library permission required.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (result.canceled) return;
    const assets = result.assets || [];

    setUploading(true);
    try {
      const uploaded: { url: string; mime: string }[] = [];
      for (const asset of assets) {
        const mime =
          asset.mimeType ||
          (asset.type === "video" ? "video/mp4" : "image/jpeg");
        const name =
          asset.fileName ||
          `upload-${Date.now()}-${Math.random().toString(36).slice(2)}.${mime.includes("video") ? "mp4" : "jpg"}`;
        const file = { uri: asset.uri, name, type: mime };
        const res = await uploadImage(file);
        uploaded.push({ url: res.url, mime: res.mime });
      }
      if (uploaded.length > 0) {
        setUploadedMedia((prev) => [...uploaded, ...prev]);
      }
    } catch (err) {
      Alert.alert(
        "Upload failed",
        err instanceof Error ? err.message : "Upload failed",
      );
    } finally {
      setUploading(false);
    }
  };

  const handleCopy = async (value: string) => {
    await Clipboard.setStringAsync(value);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.header}>Manage events</Text>
            <Text style={styles.subheader}>
              Create or update event details. Upload images or videos below.
            </Text>
          </View>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.push("/upload")}
          >
            <Text style={styles.secondaryButtonText}>Uploader</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.segmentRow}>
          <TouchableOpacity
            style={[
              styles.segmentButton,
              mode === "create" ? styles.segmentActive : null,
            ]}
            onPress={() => setMode("create")}
          >
            <Text style={styles.segmentText}>Create</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.segmentButton,
              mode === "update" ? styles.segmentActive : null,
            ]}
            onPress={() => setMode("update")}
          >
            <Text style={styles.segmentText}>Update</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View>
              <Text style={styles.cardTitle}>Upload media</Text>
              <Text style={styles.cardSubtitle}>
                Upload images or videos and insert URLs directly into fields.
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.button, uploading ? styles.buttonDisabled : null]}
              onPress={handlePickMedia}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Upload selected</Text>
              )}
            </TouchableOpacity>
          </View>

          {uploadedMedia.length > 0 && (
            <View style={{ marginTop: 16, gap: 12 }}>
              {uploadedMedia.map((item) => (
                <View key={item.url} style={styles.mediaItem}>
                  <Text style={styles.mediaUrl}>{item.url}</Text>
                  <View style={styles.mediaActions}>
                    <TouchableOpacity
                      style={styles.chip}
                      onPress={() => handleCopy(item.url)}
                    >
                      <Text style={styles.chipText}>Copy URL</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.chip}
                      onPress={() => setPhoto(item.url)}
                    >
                      <Text style={styles.chipText}>Use as cover</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.chip}
                      onPress={() =>
                        setMedia((prev) => appendText(prev, item.url))
                      }
                    >
                      <Text style={styles.chipText}>Add to media</Text>
                    </TouchableOpacity>
                    {item.mime.startsWith("image/") && (
                      <TouchableOpacity
                        style={styles.chip}
                        onPress={() =>
                          setImages((prev) => appendText(prev, item.url))
                        }
                      >
                        <Text style={styles.chipText}>Add to images</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.card}>
          <View style={styles.gridRow}>
            <View style={styles.field}>
              <Text style={styles.label}>Event ID</Text>
              <TextInput
                style={styles.input}
                value={id}
                onChangeText={setId}
                placeholder="evt-delhi-night"
                placeholderTextColor="#666"
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Title</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="Karan Aujla Live"
                placeholderTextColor="#666"
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholderTextColor="#666"
              multiline
            />
          </View>

          <View style={styles.gridRow}>
            <View style={styles.field}>
              <Text style={styles.label}>Price</Text>
              <TextInput
                style={styles.input}
                value={price}
                onChangeText={setPrice}
                placeholder="1200"
                placeholderTextColor="#666"
                keyboardType="numeric"
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Date</Text>
              <TextInput
                style={styles.input}
                value={date}
                onChangeText={setDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#666"
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Time</Text>
              <TextInput
                style={styles.input}
                value={time}
                onChangeText={setTime}
                placeholder="18:30"
                placeholderTextColor="#666"
              />
            </View>
          </View>

          <View style={styles.gridRow}>
            <View style={styles.field}>
              <Text style={styles.label}>Location</Text>
              <TextInput
                style={styles.input}
                value={location}
                onChangeText={setLocation}
                placeholder="Delhi"
                placeholderTextColor="#666"
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Place name</Text>
              <TextInput
                style={styles.input}
                value={placename}
                onChangeText={setPlacename}
                placeholderTextColor="#666"
              />
            </View>
          </View>

          <View style={styles.gridRow}>
            <View style={styles.field}>
              <Text style={styles.label}>Venue</Text>
              <TextInput
                style={styles.input}
                value={venue}
                onChangeText={setVenue}
                placeholderTextColor="#666"
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Category</Text>
              <TextInput
                style={styles.input}
                value={category}
                onChangeText={setCategory}
                placeholderTextColor="#666"
              />
            </View>
          </View>

          <View style={styles.gridRow}>
            <View style={styles.field}>
              <Text style={styles.label}>Photo URL</Text>
              <TextInput
                style={styles.input}
                value={photo}
                onChangeText={setPhoto}
                placeholderTextColor="#666"
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Type</Text>
              <View style={styles.typeRow}>
                <TouchableOpacity
                  style={[
                    styles.typeChip,
                    type === "event" ? styles.typeChipActive : null,
                  ]}
                  onPress={() => setType("event")}
                >
                  <Text style={styles.typeChipText}>Event</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.typeChip,
                    type === "class" ? styles.typeChipActive : null,
                  ]}
                  onPress={() => setType("class")}
                >
                  <Text style={styles.typeChipText}>Class</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.checkboxRow}>
            <TouchableOpacity
              onPress={() => setIsActive((prev) => !prev)}
              style={styles.checkbox}
            >
              <View
                style={[
                  styles.checkboxBox,
                  isActive ? styles.checkboxChecked : null,
                ]}
              />
              <Text style={styles.checkboxLabel}>Active</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Images (URLs)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={images}
              onChangeText={setImages}
              placeholder="One URL per line"
              placeholderTextColor="#666"
              multiline
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Media (image/video URLs)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={media}
              onChangeText={setMedia}
              placeholder="One URL per line"
              placeholderTextColor="#666"
              multiline
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>About (JSON)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={aboutJson}
              onChangeText={setAboutJson}
              placeholderTextColor="#666"
              multiline
            />
            {parsedAbout.error && (
              <Text style={styles.errorText}>Invalid JSON</Text>
            )}
          </View>

          <TouchableOpacity
            style={[styles.button, loading ? styles.buttonDisabled : null]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>
                {mode === "create" ? "Create Event" : "Update Event"}
              </Text>
            )}
          </TouchableOpacity>

          {result && (
            <View style={styles.resultBox}>
              <Text style={styles.resultTitle}>Saved</Text>
              <Text style={styles.resultText}>ID: {result.id}</Text>
              <Text style={styles.resultText}>Title: {result.title}</Text>
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
  headerRow: { flexDirection: "row", gap: 12, alignItems: "center" },
  header: { fontSize: 28, fontWeight: "700", color: "#fff" },
  subheader: { fontSize: 14, color: "rgba(255,255,255,0.7)", marginTop: 8 },
  segmentRow: { flexDirection: "row", gap: 8 },
  segmentButton: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
  },
  segmentActive: { backgroundColor: "#e11d48", borderColor: "#e11d48" },
  segmentText: { color: "#fff", fontWeight: "600" },
  card: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  cardTitle: { color: "#fff", fontWeight: "600" },
  cardSubtitle: { color: "rgba(255,255,255,0.6)", fontSize: 12, marginTop: 4 },
  button: {
    backgroundColor: "#e11d48",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontWeight: "700" },
  secondaryButton: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  secondaryButtonText: { color: "#fff", fontSize: 12 },
  mediaItem: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    padding: 12,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  mediaUrl: { color: "#fff", fontSize: 12 },
  mediaActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  chip: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  chipText: { color: "#fff", fontSize: 11 },
  gridRow: { flexDirection: "row", gap: 12 },
  field: { flex: 1, gap: 6 },
  label: { color: "#fff", fontSize: 12, fontWeight: "600" },
  input: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 12,
    padding: 12,
    color: "#fff",
  },
  textArea: { minHeight: 90, textAlignVertical: "top" },
  typeRow: { flexDirection: "row", gap: 8 },
  typeChip: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  typeChipActive: {
    backgroundColor: "rgba(225,29,72,0.4)",
    borderColor: "#e11d48",
  },
  typeChipText: { color: "#fff", fontSize: 12 },
  checkboxRow: { flexDirection: "row" },
  checkbox: { flexDirection: "row", alignItems: "center", gap: 8 },
  checkboxBox: {
    width: 18,
    height: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.5)",
    borderRadius: 4,
  },
  checkboxChecked: { backgroundColor: "#e11d48", borderColor: "#e11d48" },
  checkboxLabel: { color: "#fff" },
  resultBox: {
    marginTop: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  resultTitle: { color: "#fff", fontWeight: "700", marginBottom: 4 },
  resultText: { color: "rgba(255,255,255,0.7)", fontSize: 12 },
  errorText: { color: "#fca5a5", fontSize: 12, marginTop: 8 },
});
