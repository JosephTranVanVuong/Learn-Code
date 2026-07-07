import { Component, type ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error(error);
  }

  render() {
    if (this.state.error) {
      return (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 24, backgroundColor: "white" }}>
          <Text style={{ fontSize: 16, fontWeight: "600", color: "#1e293b" }}>Đã có lỗi không mong muốn</Text>
          <Text style={{ fontSize: 13, color: "#64748b", textAlign: "center" }}>
            Vui lòng thử lại. Nếu vẫn còn lỗi hãy liên hệ thủ thư quản trị.
          </Text>
          <Pressable
            onPress={() => this.setState({ error: null })}
            style={{ backgroundColor: "#0f172a", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 }}
          >
            <Text style={{ color: "white", fontWeight: "600" }}>Thử lại</Text>
          </Pressable>
        </View>
      );
    }
    return this.props.children;
  }
}
