import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  Button,
  ActivityIndicator,
  View,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import FastTranslator, { Languages } from 'fast-mlkit-translate-text';
import Voice from '@react-native-voice/voice';
import { PaperProvider, Menu } from 'react-native-paper';
import { TouchableOpacity } from 'react-native';
type LanguagePair = {
  label: string;
  source: string;
  target: string;
};
const languagePairs: LanguagePair[] = [
  { label: 'English to Spanish', source: 'English', target: 'Spanish' },
  { label: 'Spanish to English', source: 'Spanish', target: 'English' },
  { label: 'Urdu to English', source: 'Urdu', target: 'English' },
  { label: 'English to Urdu', source: 'English', target: 'Urdu' },
];
const langMap: Record<string, string> = {
  English: 'en-US',
  Spanish: 'es-ES',
  Urdu: 'ur-PK',
};
export default function App() {
  const [input, setInput] = useState('');
  const [translated, setTranslated] = useState('');
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const [recording, setRecording] = useState(false);
  const [selectedPair, setSelectedPair] = useState<LanguagePair>(languagePairs[0]);
  useEffect(() => {
    Voice.onSpeechResults = (e) => {
      if (e.value && e.value.length > 0) {
        setInput(e.value[0]);
      }
    };
    Voice.onSpeechError = (e) => {
      console.warn('Speech Error:', e.error);
      setRecording(false);
    };
    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);
  const requestPermission = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: 'Microphone Permission',
          message: 'App needs access to your microphone for speech recognition.',
          buttonPositive: 'OK',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
  };
  const startListening = async () => {
    const hasPermission = await requestPermission();
    if (!hasPermission) return;
    try {
      await Voice.start(langMap[selectedPair.source] || 'en-US');
      setRecording(true);
    } catch (e) {
      console.error('Voice start error:', e);
    }
  };
  const stopListening = async () => {
    try {
      await Voice.stop();
    } catch (e) {
      console.error('Voice stop error:', e);
    }
    setRecording(false);
  };
  const openMenu = () => setVisible(true);
  const closeMenu = () => setVisible(false);
  const handleTranslate = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setTranslated('');
    try {
      await FastTranslator.prepare({
        source: selectedPair.source as Languages,
        target: selectedPair.target as Languages,
        downloadIfNeeded: true,
      });
      const result = await FastTranslator.translate(input);
      setTranslated(result);
    } catch (error: any) {
      setTranslated(`Error: ${error.message || 'Translation failed'}`);
    } finally {
      setLoading(false);
    }
  };
  return (
    <PaperProvider>
      <SafeAreaView style={styles.container}>
        <Text style={styles.heading}>ML Kit Translator</Text>
        <View style={styles.menuWrapper}>
          <Menu
            visible={visible}
            onDismiss={closeMenu}
            anchor={
              <TouchableOpacity onPress={openMenu} style={styles.menuButton}>
                <Text>{selectedPair.label}</Text>
              </TouchableOpacity>
            }
          >
            {languagePairs.map((pair) => (
              <Menu.Item
                key={pair.label}
                onPress={() => {
                  setSelectedPair(pair);
                  closeMenu();
                }}
                title={pair.label}
              />
            ))}
          </Menu>
        </View>
        <TextInput
          style={styles.input}
          placeholder={`Enter or speak text in ${selectedPair.source}`}
          value={input}
          onChangeText={setInput}
        />
        <View style={styles.buttonRow}>
          <Button title="Translate" onPress={handleTranslate} disabled={loading || !input.trim()} />
          <View style={{ width: 10 }} />
          <Button
            title={recording ? 'Stop' : 'Speak'}
            color={recording ? 'red' : 'green'}
            onPress={recording ? stopListening : startListening}
          />
        </View>
        {loading && <ActivityIndicator size="large" style={{ marginTop: 20 }} />}
        {translated && (
          <Text style={styles.result}>
            {selectedPair.target}: {translated}
          </Text>
        )}
      </SafeAreaView>
    </PaperProvider>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  heading: {
    fontSize: 24,
    marginVertical: 20,
    textAlign: 'center',
  },
  menuWrapper: {
    marginBottom: 15,
  },
  menuButton: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#999',
    borderRadius: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#999',
    padding: 10,
    marginBottom: 15,
    borderRadius: 5,
  },
  result: {
    marginTop: 20,
    fontSize: 18,
    textAlign: 'center',
    color: '#333',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
});



