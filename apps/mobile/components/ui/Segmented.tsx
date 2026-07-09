import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../lib/theme";

export interface SegmentedOption<T extends string> {
  key: T;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        backgroundColor: colors.goldBg,
        borderRadius: 10,
        padding: 4,
        gap: 4,
      }}
    >
      {options.map((opt) => {
        const active = opt.key === value;
        return (
          <Pressable
            key={opt.key}
            onPress={() => onChange(opt.key)}
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 5,
              paddingVertical: 8,
              borderRadius: 7,
              backgroundColor: active ? colors.navy : "transparent",
            }}
          >
            <Ionicons name={opt.icon} size={14} color={active ? "#ffffff" : colors.navy} />
            <Text
              style={{
                fontSize: 12,
                fontWeight: "700",
                color: active ? "#ffffff" : colors.navy,
              }}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
