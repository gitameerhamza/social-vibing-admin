import React from "react";
import { ScrollView } from "react-native";
import ListRow from "../components/ListRow";

export default function CommunityInfoDetailScreen() {
  const Row = ({ label, value, badge }) => (<ListRow title={label} rightText={badge || value} onPress={() => {}} />);
  return (
    <ScrollView style={{ flex: 1 }}>
      <ListRow title="Community Icon" rightImage onPress={() => {}} />
      <Row label="Community Name" value="Magical Fantasy" />
      <Row label="Clover ID" value="MagicalFantasy" />
      <Row label="Tagline" value="Welcome to a mysterious domain…" />
      <Row label="Description" value="" />
      <Row label="Tags" badge="#Fandom" />
      <Row label="Welcome Message" value="" />
      <Row label="Language" value="English" />
      <Row label="Category" value="Roleplay" />
    </ScrollView>
  );
}
