import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from "react-native";
import {
  fetchAllTicketsAdmin,
  fetchTicketByTokenAdmin,
  fetchTicketsByPhoneAdmin,
} from "../lib/api";
import { AdminTicketListItem, Booking, Ticket } from "../lib/types";

const formatDateTime = (value?: string) => {
  if (!value) return "-";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "-" : parsed.toLocaleString();
};

function TicketInstanceCard({ ticket }: { ticket: Ticket }) {
  return (
    <View style={styles.ticketCard}>
      <Text style={styles.ticketTitle}>{ticket.title || "Ticket"}</Text>
      <Text style={styles.ticketMeta}>
        {ticket.date || ""} {ticket.time || ""}
      </Text>
      <Text style={styles.ticketMeta}>{ticket.location || ""}</Text>
      <View style={styles.ticketRow}>
        <Text style={styles.ticketMeta}>Seat: {ticket.seat || "-"}</Text>
        <Text style={styles.ticketMeta}>ID: {ticket.id}</Text>
      </View>
      <View
        style={[
          styles.statusChip,
          ticket.isScanned ? styles.statusScanned : styles.statusActive,
        ]}
      >
        <Text style={styles.statusText}>
          {ticket.isScanned ? "Scanned" : "Active"}
        </Text>
      </View>
    </View>
  );
}

function TicketItemCard({
  booking,
  itemIndex,
}: {
  booking: Booking;
  itemIndex: number;
}) {
  const item = booking.cartItems[itemIndex];
  return (
    <View style={styles.ticketCard}>
      <Text style={styles.ticketTitle}>{item.event.title}</Text>
      <Text style={styles.ticketMeta}>
        {item.event.date} {item.event.time}
      </Text>
      <Text style={styles.ticketMeta}>{item.event.location}</Text>
      <Text style={styles.ticketMeta}>Qty: {item.quantity}</Text>
    </View>
  );
}

export default function TicketsScreen() {
  const [phone, setPhone] = useState("");
  const [token, setToken] = useState("");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [focusBooking, setFocusBooking] = useState<Booking | null>(null);
  const [focusTicketId, setFocusTicketId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listTickets, setListTickets] = useState<AdminTicketListItem[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  const loadTicketsList = async () => {
    setListError(null);
    setListLoading(true);
    try {
      const data = await fetchAllTicketsAdmin();
      setListTickets(data.tickets || []);
    } catch (err) {
      setListError(err instanceof Error ? err.message : "Failed to load list");
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    void loadTicketsList();
  }, []);

  const handlePhoneSearch = async () => {
    setError(null);
    setLoading(true);
    try {
      const data = await fetchTicketsByPhoneAdmin(phone);
      setBookings(data);
      setFocusBooking(null);
      setFocusTicketId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch tickets");
    } finally {
      setLoading(false);
    }
  };

  const handleTokenSearch = async () => {
    setError(null);
    setLoading(true);
    try {
      const result = await fetchTicketByTokenAdmin(token);
      setFocusBooking(result.booking);
      setFocusTicketId(result.focusTicketId);
      setBookings(result.booking ? [result.booking] : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch ticket");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.header}>Tickets lookup</Text>
        <Text style={styles.subheader}>
          Search tickets by phone number, booking token, or ticket ID.
        </Text>

        <View style={styles.searchGrid}>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Search by phone</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="Phone number"
              placeholderTextColor="#666"
            />
            <TouchableOpacity style={styles.button} onPress={handlePhoneSearch}>
              <Text style={styles.buttonText}>
                {loading ? "Searching..." : "Find tickets"}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Search by token / ticket ID</Text>
            <TextInput
              style={styles.input}
              value={token}
              onChangeText={setToken}
              placeholder="Ticket token or ticket id"
              placeholderTextColor="#666"
            />
            <TouchableOpacity style={styles.button} onPress={handleTokenSearch}>
              <Text style={styles.buttonText}>
                {loading ? "Searching..." : "Find ticket"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {error && <Text style={styles.errorText}>{error}</Text>}

        {bookings.length > 0 && (
          <View style={{ gap: 16 }}>
            {bookings.map((booking) => (
              <View key={booking.ticketToken} style={{ gap: 8 }}>
                <Text style={styles.sectionTitle}>
                  Booking {booking.ticketToken}
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{ gap: 12 }}
                >
                  <View style={{ flexDirection: "row", gap: 12 }}>
                    {booking.tickets && booking.tickets.length > 0
                      ? booking.tickets
                          .filter((t) =>
                            focusTicketId ? t.id === focusTicketId : true,
                          )
                          .map((t) => (
                            <TicketInstanceCard key={t.id} ticket={t} />
                          ))
                      : booking.cartItems.map((_, idx) => (
                          <TicketItemCard
                            key={`${booking.ticketToken}-${idx}`}
                            booking={booking}
                            itemIndex={idx}
                          />
                        ))}
                  </View>
                </ScrollView>
              </View>
            ))}
          </View>
        )}

        {!loading && bookings.length === 0 && focusBooking === null && (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No tickets found yet.</Text>
          </View>
        )}

        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={styles.sectionTitle}>All tickets</Text>
            <Text style={styles.subheaderSmall}>
              View ticket status with user phone and name.
            </Text>
          </View>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={loadTicketsList}
          >
            <Text style={styles.secondaryButtonText}>
              {listLoading ? "Refreshing..." : "Refresh"}
            </Text>
          </TouchableOpacity>
        </View>

        {listError && <Text style={styles.errorText}>{listError}</Text>}

        <View style={styles.table}>
          {listLoading && (
            <Text style={styles.tableRowText}>Loading tickets...</Text>
          )}
          {!listLoading && listTickets.length === 0 && (
            <Text style={styles.tableRowText}>No tickets available.</Text>
          )}
          {listTickets.map((ticket) => (
            <View key={ticket.id} style={styles.tableRow}>
              <Text style={styles.tableCell}>{ticket.user?.name || "-"}</Text>
              <Text style={styles.tableCell}>{ticket.user?.phone || "-"}</Text>
              <Text style={styles.tableCell}>{ticket.title || "Ticket"}</Text>
              <Text style={styles.tableCell}>
                {ticket.date || ""}
                {ticket.time ? ` · ${ticket.time}` : ""}
              </Text>
              <Text style={styles.tableCell}>{ticket.seat || "-"}</Text>
              <Text style={styles.tableCell}>
                {ticket.isScanned ? "Scanned" : "Active"}
              </Text>
              <Text style={styles.tableCell}>
                {formatDateTime(ticket.scannedAt)}
              </Text>
              <Text style={styles.tableCell}>{ticket.id}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  content: { padding: 24, gap: 16 },
  header: { fontSize: 28, fontWeight: "700", color: "#fff" },
  subheader: { fontSize: 14, color: "rgba(255,255,255,0.7)" },
  subheaderSmall: {
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
    marginTop: 4,
  },
  searchGrid: { gap: 12 },
  card: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  cardLabel: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    textTransform: "uppercase",
  },
  input: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 12,
    padding: 12,
    color: "#fff",
  },
  button: {
    backgroundColor: "#e11d48",
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "700" },
  errorText: { color: "#fca5a5", fontSize: 12 },
  sectionTitle: { color: "#fff", fontWeight: "600", fontSize: 16 },
  ticketCard: {
    width: 220,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 16,
    padding: 12,
    backgroundColor: "rgba(255,255,255,0.05)",
    gap: 6,
  },
  ticketTitle: { color: "#fff", fontWeight: "700" },
  ticketMeta: { color: "rgba(255,255,255,0.6)", fontSize: 12 },
  ticketRow: { flexDirection: "row", justifyContent: "space-between" },
  statusChip: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusScanned: { backgroundColor: "rgba(34,197,94,0.2)" },
  statusActive: { backgroundColor: "rgba(255,255,255,0.1)" },
  statusText: { color: "#fff", fontSize: 11 },
  emptyCard: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 16,
    padding: 16,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  emptyText: { color: "rgba(255,255,255,0.6)" },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  secondaryButtonText: { color: "#fff", fontSize: 12 },
  table: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 16,
    padding: 12,
    backgroundColor: "rgba(255,255,255,0.05)",
    gap: 8,
  },
  tableRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
    paddingTop: 8,
  },
  tableCell: { color: "rgba(255,255,255,0.8)", fontSize: 12, minWidth: "22%" },
  tableRowText: { color: "rgba(255,255,255,0.6)" },
});
