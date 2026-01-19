import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function Layout() {
  return (
    <>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "#000" },
          headerTintColor: "#fff",
          contentStyle: { backgroundColor: "#000" },
        }}
      >
        <Stack.Screen
          name="index"
          options={{ title: "Admin Login", headerShown: false }}
        />
        <Stack.Screen
          name="dashboard"
          options={{
            title: "Admin Dashboard",
            headerLeft: () => null,
            gestureEnabled: false,
          }}
        />
        <Stack.Screen name="events" options={{ title: "Manage Events" }} />
        <Stack.Screen name="upload" options={{ title: "Upload Media" }} />
        <Stack.Screen name="tickets" options={{ title: "Tickets Lookup" }} />
        <Stack.Screen name="scanner" options={{ title: "Scan Ticket" }} />
      </Stack>
      <StatusBar style="light" />
    </>
  );
}
