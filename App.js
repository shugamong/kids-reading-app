import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, ScrollView,
  TextInput, Image, Alert, Modal, SafeAreaView
} from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

// 한글 달력 설정
LocaleConfig.locales['kr'] = {
  monthNames: ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'],
  monthNamesShort: ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'],
  dayNames: ['일요일','월요일','화요일','수요일','목요일','금요일','토요일'],
  dayNamesShort: ['일','월','화','수','목','금','토'],
  today: "오늘"
};
LocaleConfig.defaultLocale = 'kr';

const STICKERS = ['🥰 참 재밌어요', '😲 놀라워요', '😢 슬퍼요', '🤔 생각이 많아져요', '🤣 너무 웃겨요'];

export default function App() {
  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const [records, setRecords] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [streakDays, setStreakDays] = useState(0);

  // 폼 상태
  const [bookImage, setBookImage] = useState(null);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [summary, setSummary] = useState('');
  const [momComment, setMomComment] = useState('');
  const [childComment, setChildComment] = useState('');
  const [rating, setRating] = useState(5);
  const [emotion, setEmotion] = useState(STICKERS[0]);

  useEffect(() => {
    loadRecords();
  }, []);

  useEffect(() => {
    calculateStreak();
  }, [records]);

  const getTodayString = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const loadRecords = async () => {
    try {
      const data = await AsyncStorage.getItem('@reading_records');
      if (data !== null) setRecords(JSON.parse(data));
    } catch (e) {
      console.error(e);
    }
  };

  const saveRecordsToStorage = async (newRecords) => {
    try {
      await AsyncStorage.setItem('@reading_records', JSON.stringify(newRecords));
      setRecords(newRecords);
    } catch (e) {
      console.error(e);
    }
  };

  const calculateStreak = () => {
    const sortedDates = Object.keys(records).sort().reverse();
    if (sortedDates.length === 0) { setStreakDays(0); return; }
    
    let streak = 0;
    let checkDate = new Date();
    
    for (let i = 0; i < 365; i++) {
      const dateStr = checkDate.toISOString().split('T')[0];
      if (records[dateStr]) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else if (i === 0) {
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    setStreakDays(streak);
  };

  const openFormForDate = (dateString) => {
    setSelectedDate(dateString);
    const existing = records[dateString];
    if (existing) {
      setBookImage(existing.bookImage || null);
      setTitle(existing.title || '');
      setAuthor(existing.author || '');
      setSummary(existing.summary || '');
      setMomComment(existing.momComment || '');
      setChildComment(existing.childComment || '');
      setRating(existing.rating || 5);
      setEmotion(existing.emotion || STICKERS[0]);
    } else {
      setBookImage(null);
      setTitle('');
      setAuthor('');
      setSummary('');
      setMomComment('');
      setChildComment('');
      setRating(5);
      setEmotion(STICKERS[0]);
    }
    setModalVisible(true);
  };

  const pickImage = async (useCamera = false) => {
    let result;
    if (useCamera) {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("권한 필요", "카메라 접근 권한이 필요합니다.");
        return;
      }
      result = await ImagePicker.launchCameraAsync({
        allowsEditing: true, aspect: [3, 4], quality: 0.7,
      });
    } else {
      result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true, aspect: [3, 4], quality: 0.7,
      });
    }

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setBookImage(result.assets[0].uri);
    }
  };

  const handleSave = () => {
    if (!title.trim()) {
      Alert.alert("안내", "책 제목을 입력해주세요!");
      return;
    }

    const newRecords = {
      ...records,
      [selectedDate]: {
        bookImage, title, author, summary, momComment, childComment, rating, emotion
      }
    };

    saveRecordsToStorage(newRecords);
    setModalVisible(false);
    Alert.alert("성공", "독서 기록이 저장되었습니다! 📚");
  };

  const getMarkedDates = () => {
    const marked = {};
    Object.keys(records).forEach(date => {
      marked[date] = { marked: true, dotColor: '#7CB342' };
    });
    marked[selectedDate] = {
      ...(marked[selectedDate] || {}),
      selected: true,
      selectedColor: '#FFF59D',
      selectedTextColor: '#333'
    };
    return marked;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📖 아이랑 엄마랑 독서 달력</Text>
        <View style={styles.streakBadge}>
          <Text style={styles.streakText}>🔥 {streakDays}일 연속 독서 중!</Text>
        </View>
      </View>

      <Calendar
        onDayPress={(day) => openFormForDate(day.dateString)}
        markedDates={getMarkedDates()}
        theme={{
          backgroundColor: '#FFFDE7',
          calendarBackground: '#FFFDE7',
          textSectionTitleColor: '#558B2F',
          selectedDayBackgroundColor: '#C5E1A5',
          todayTextColor: '#E65100',
          dayTextColor: '#333333',
          arrowColor: '#7CB342',
          monthTextColor: '#33691E',
          textDayFontWeight: 'bold',
          textMonthFontWeight: 'bold',
        }}
      />

      <View style={styles.bottomCard}>
        <Text style={styles.selectedDateText}>{selectedDate}의 독서 기록</Text>
        {records[selectedDate] ? (
          <TouchableOpacity style={styles.viewButton} onPress={() => openFormForDate(selectedDate)}>
            <Ionicons name="book-outline" size={20} color="#fff" />
            <Text style={styles.buttonText}> 기록 수정 / 내용 보기</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.addButton} onPress={() => openFormForDate(selectedDate)}>
            <Ionicons name="add-circle-outline" size={20} color="#fff" />
            <Text style={styles.buttonText}> 오늘 읽은 책 기록하기</Text>
          </TouchableOpacity>
        )}
      </View>

      <Modal visible={modalVisible} animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <SafeAreaView style={styles.modalContainer}>
          <ScrollView style={styles.modalScrollView}>
            <Text style={styles.modalTitle}>📚 {selectedDate} 독후 활동</Text>

            <View style={styles.imageSection}>
              {bookImage ? (
                <Image source={{ uri: bookImage }} style={styles.previewImage} />
              ) : (
                <View style={styles.noImage}>
                  <Text style={{ color: '#888' }}>책 사진을 올려주세요</Text>
                </View>
              )}
              <View style={styles.imageButtonRow}>
                <TouchableOpacity style={styles.iconBtn} onPress={() => pickImage(true)}>
                  <Ionicons name="camera" size={20} color="#fff" />
                  <Text style={styles.btnText}> 촬영</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconBtnAlt} onPress={() => pickImage(false)}>
                  <Ionicons name="images" size={20} color="#fff" />
                  <Text style={styles.btnText}> 갤러리</Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.label}>책 제목 *</Text>
            <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="예: 구름빵" />

            <Text style={styles.label}>지은이 / 저자</Text>
            <TextInput style={styles.input} value={author} onChangeText={setAuthor} placeholder="예: 백희나" />

            <Text style={styles.label}>⭐ 별점 평가</Text>
            <View style={styles.ratingRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setRating(star)}>
                  <Ionicons
                    name={star <= rating ? "star" : "star-outline"}
                    size={32}
                    color="#FBC02D"
                  />
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>😊 오늘 책 읽은 기분</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.stickerRow}>
              {STICKERS.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[styles.stickerChip, emotion === item && styles.selectedSticker]}
                  onPress={() => setEmotion(item)}
                >
                  <Text>{item}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.label}>📝 줄거리 및 주요 내용 요약</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={summary}
              onChangeText={setSummary}
              multiline
              placeholder="어떤 내용이었나요?"
            />

            <View style={styles.commentBoxChild}>
              <Text style={styles.labelChild}>👧 아이의 느낀 점</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={childComment}
                onChangeText={setChildComment}
                multiline
                placeholder="아이가 가장 재미있어한 부분이나 느낀 점"
              />
            </View>

            <View style={styles.commentBoxMom}>
              <Text style={styles.labelMom}>👩 엄마의 느낀 점</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={momComment}
                onChangeText={setMomComment}
                multiline
                placeholder="아이와 함께 읽으며 느낀 점이나 기록하고 싶은 이야기"
              />
            </View>

            <View style={styles.modalButtonRow}>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Text style={styles.saveBtnText}>저장하기</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.closeBtnText}>닫기</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFDE7' },
  header: { padding: 16, alignItems: 'center', backgroundColor: '#F0F4C3' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#33691E' },
  streakBadge: { marginTop: 6, backgroundColor: '#FFE082', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  streakText: { fontSize: 14, fontWeight: 'bold', color: '#E65100' },
  bottomCard: { padding: 20, alignItems: 'center' },
  selectedDateText: { fontSize: 16, fontWeight: 'bold', marginBottom: 10, color: '#333' },
  addButton: { flexDirection: 'row', backgroundColor: '#7CB342', padding: 14, borderRadius: 25, width: '100%', justifyContent: 'center' },
  viewButton: { flexDirection: 'row', backgroundColor: '#FBC02D', padding: 14, borderRadius: 25, width: '100%', justifyContent: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  modalContainer: { flex: 1, backgroundColor: '#FFFDE7' },
  modalScrollView: { padding: 20 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#33691E', marginBottom: 15, textAlign: 'center' },
  imageSection: { alignItems: 'center', marginBottom: 15 },
  previewImage: { width: 140, height: 180, borderRadius: 10, marginBottom: 8 },
  noImage: { width: 140, height: 180, borderRadius: 10, backgroundColor: '#E0E0E0', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  imageButtonRow: { flexDirection: 'row', gap: 10 },
  iconBtn: { flexDirection: 'row', backgroundColor: '#81C784', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  iconBtnAlt: { flexDirection: 'row', backgroundColor: '#AED581', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  btnText: { color: '#fff', fontWeight: 'bold' },
  label: { fontSize: 14, fontWeight: 'bold', color: '#333', marginTop: 12, marginBottom: 4 },
  input: { backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#C5E1A5', padding: 10, borderRadius: 8, fontSize: 15 },
  textArea: { height: 80, textAlignVertical: 'top' },
  ratingRow: { flexDirection: 'row', gap: 8, marginVertical: 4 },
  stickerRow: { flexDirection: 'row', marginVertical: 6 },
  stickerChip: { backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, borderWidth: 1, borderColor: '#DCEDC8', marginRight: 8 },
  selectedSticker: { backgroundColor: '#DCEDC8', borderColor: '#7CB342' },
  commentBoxChild: { backgroundColor: '#E8F5E9', padding: 10, borderRadius: 10, marginTop: 10 },
  labelChild: { fontSize: 14, fontWeight: 'bold', color: '#2E7D32', marginBottom: 4 },
  commentBoxMom: { backgroundColor: '#FFF9C4', padding: 10, borderRadius: 10, marginTop: 10 },
  labelMom: { fontSize: 14, fontWeight: 'bold', color: '#F57F17', marginBottom: 4 },
  modalButtonRow: { flexDirection: 'row', gap: 10, marginVertical: 25 },
  saveBtn: { flex: 2, backgroundColor: '#7CB342', padding: 14, borderRadius: 10, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  closeBtn: { flex: 1, backgroundColor: '#BDBDBD', padding: 14, borderRadius: 10, alignItems: 'center' },
  closeBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
