import React, { useState, useEffect } from 'react'
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { useTheme } from '../../src/theme/ThemeProvider';
import AppBackground from '@/components/AppBackground';
import { submitReview, getMyReview } from '../../src/services/review';

const CATEGORIES = [
  { id: 'pickup', label: 'Pickup', icon: 'bicycle-outline' },
  { id: 'quality', label: 'Wash Quality', icon: 'shirt-outline' },
  { id: 'delivery', label: 'Delivery', icon: 'cube-outline' },
  { id: 'packaging', label: 'Packaging', icon: 'gift-outline' },
]

const QUICK_TAGS = [
  'On time delivery',
  'Great quality',
  'Fresh smell',
  'Careful handling',
  'Friendly staff',
  'Will order again',
]

export default function RateUs() {
  const { theme, isDarkMode } = useTheme()

  const [pageLoading, setPageLoading] = useState(true)
  const [submitLoading, setSubmitLoading] = useState(false)

  // Existing review state
  const [existingReview, setExistingReview] = useState<any>(null)

  // Form state
  const [rating, setRating] = useState(0)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [review, setReview] = useState('')
  const [categoryRatings, setCategoryRatings] = useState<Record<string, number>>({})

  // On mount: check if customer already reviewed
  useEffect(() => {
    const fetchMyReview = async () => {
      try {
        const res = await getMyReview()
        if (res.hasReviewed && res.data) {
          setExistingReview(res.data)
        }
      } catch (err) {
        // ignore — just show the form
      } finally {
        setPageLoading(false)
      }
    }
    fetchMyReview()
  }, [])

  const getRatingLabel = (r: number) => {
    switch (r) {
      case 1: return 'Very Poor 😞'
      case 2: return 'Poor 😕'
      case 3: return 'Okay 😐'
      case 4: return 'Good 😊'
      case 5: return 'Excellent 🤩'
      default: return 'Tap to rate'
    }
  }

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Rating required', 'Please give at least an overall star rating.')
      return
    }
    try {
      setSubmitLoading(true)
      const res = await submitReview({
        overallRating: rating,
        categoryRatings: {
          pickup: categoryRatings['pickup'] || undefined,
          quality: categoryRatings['quality'] || undefined,
          delivery: categoryRatings['delivery'] || undefined,
          packaging: categoryRatings['packaging'] || undefined,
        },
        tags: selectedTags,
        review: review.trim(),
      })
      setExistingReview(res.data)
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Could not submit review. Please try again.')
    } finally {
      setSubmitLoading(false)
    }
  }

  const starColor = (filled: boolean) =>
    filled ? '#F59E0B' : (isDarkMode ? '#4B5563' : '#D1D5DB')

  // ── Loading ─────────────────────────────────
  if (pageLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
        <AppBackground>
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        </AppBackground>
      </SafeAreaView>
    )
  }

  // ── Already Reviewed Screen ──────────────────
  if (existingReview) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
        <AppBackground>
          {/* Header */}
          <View style={[styles.header, { backgroundColor: theme.background }]}>
            <TouchableOpacity
              style={[styles.backBtn, { backgroundColor: theme.card || (isDarkMode ? '#1F2937' : '#fff') }]}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={20} color={theme.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: theme.text }]}>Your Review</Text>
            <View style={{ width: 36 }} />
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Thank you banner */}
            <View style={[styles.heroCard, { backgroundColor: theme.primary }]}>
              <Text style={styles.heroEmoji}>🎉</Text>
              <Text style={styles.heroTitle}>Thank You for your feedback!</Text>
              <Text style={styles.heroSubtitle}>You have already submitted a review</Text>
            </View>

            {/* Review Card */}
            <View style={[styles.card, { backgroundColor: theme.card || (isDarkMode ? '#1F2937' : '#fff') }]}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>Overall Rating</Text>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map(s => (
                  <Ionicons
                    key={s}
                    name={existingReview.overallRating >= s ? 'star' : 'star-outline'}
                    size={36}
                    color={starColor(existingReview.overallRating >= s)}
                    style={styles.star}
                  />
                ))}
              </View>
              <Text style={[styles.ratingLabel, { color: theme.primary }]}>
                {getRatingLabel(existingReview.overallRating)}
              </Text>
            </View>

            {/* Category ratings */}
            {Object.values(existingReview.categoryRatings || {}).some(v => v) && (
              <View style={[styles.card, { backgroundColor: theme.card || (isDarkMode ? '#1F2937' : '#fff') }]}>
                <Text style={[styles.cardTitle, { color: theme.text }]}>Category Ratings</Text>
                {CATEGORIES.map(cat => {
                  const val = existingReview.categoryRatings?.[cat.id]
                  if (!val) return null
                  return (
                    <View key={cat.id} style={styles.categoryRow}>
                      <View style={styles.categoryLeft}>
                        <View style={[styles.catIconBox, { backgroundColor: theme.primaryLight || (isDarkMode ? '#374151' : '#E6F4F1') }]}>
                          <Ionicons name={cat.icon as any} size={16} color={theme.primary} />
                        </View>
                        <Text style={[styles.categoryLabel, { color: theme.text }]}>{cat.label}</Text>
                      </View>
                      <View style={styles.miniStars}>
                        {[1, 2, 3, 4, 5].map(s => (
                          <Ionicons
                            key={s}
                            name={val >= s ? 'star' : 'star-outline'}
                            size={18}
                            color={starColor(val >= s)}
                            style={{ marginLeft: 2 }}
                          />
                        ))}
                      </View>
                    </View>
                  )
                })}
              </View>
            )}

            {/* Tags */}
            {existingReview.tags?.length > 0 && (
              <View style={[styles.card, { backgroundColor: theme.card || (isDarkMode ? '#1F2937' : '#fff') }]}>
                <Text style={[styles.cardTitle, { color: theme.text }]}>What you liked</Text>
                <View style={styles.tagsWrap}>
                  {existingReview.tags.map((tag: string) => (
                    <View key={tag} style={[styles.tag, { backgroundColor: theme.primary, borderColor: theme.primary }]}>
                      <Text style={[styles.tagText, { color: '#fff' }]}>✓ {tag}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Written review */}
            {existingReview.review ? (
              <View style={[styles.card, { backgroundColor: theme.card || (isDarkMode ? '#1F2937' : '#fff') }]}>
                <Text style={[styles.cardTitle, { color: theme.text }]}>Your Review</Text>
                <Text style={[styles.reviewText, { color: theme.textSecondary || (isDarkMode ? '#9CA3AF' : '#6B7280') }]}>
                  "{existingReview.review}"
                </Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[styles.submitBtn, { backgroundColor: theme.primary }]}
              onPress={() => router.back()}
            >
              <Text style={[styles.submitText, { color: '#fff' }]}>Back to Profile</Text>
            </TouchableOpacity>

            <View style={{ height: 30 }} />
          </ScrollView>
        </AppBackground>
      </SafeAreaView>
    )
  }

  // ── Review Form ─────────────────────────────
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      <AppBackground>
        <StatusBar
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
          backgroundColor={theme.background}
          translucent={false}
        />

        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.background }]}>
          <TouchableOpacity
            style={[styles.backBtn, { backgroundColor: theme.card || (isDarkMode ? '#1F2937' : '#fff') }]}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={20} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Rate Us</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

          {/* Hero */}
          <View style={[styles.heroCard, { backgroundColor: theme.primary }]}>
            <Text style={styles.heroEmoji}>👕</Text>
            <Text style={styles.heroTitle}>How was your experience?</Text>
            <Text style={styles.heroSubtitle}>Your feedback makes KORA better for everyone</Text>
          </View>

          {/* Overall Rating */}
          <View style={[styles.card, { backgroundColor: theme.card || (isDarkMode ? '#1F2937' : '#fff') }]}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>Overall Rating</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map(star => (
                <TouchableOpacity key={star} onPress={() => setRating(star)} activeOpacity={0.7}>
                  <Ionicons
                    name={rating >= star ? 'star' : 'star-outline'}
                    size={42}
                    color={starColor(rating >= star)}
                    style={styles.star}
                  />
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[styles.ratingLabel, { color: rating > 0 ? theme.primary : (isDarkMode ? '#6B7280' : '#9CA3AF') }]}>
              {getRatingLabel(rating)}
            </Text>
          </View>

          {/* Category Ratings */}
          <View style={[styles.card, { backgroundColor: theme.card || (isDarkMode ? '#1F2937' : '#fff') }]}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>Rate by Category</Text>
            {CATEGORIES.map(cat => (
              <View key={cat.id} style={styles.categoryRow}>
                <View style={styles.categoryLeft}>
                  <View style={[styles.catIconBox, { backgroundColor: theme.primaryLight || (isDarkMode ? '#374151' : '#E6F4F1') }]}>
                    <Ionicons name={cat.icon as any} size={16} color={theme.primary} />
                  </View>
                  <Text style={[styles.categoryLabel, { color: theme.text }]}>{cat.label}</Text>
                </View>
                <View style={styles.miniStars}>
                  {[1, 2, 3, 4, 5].map(s => (
                    <TouchableOpacity key={s} onPress={() => setCategoryRatings(prev => ({ ...prev, [cat.id]: s }))}>
                      <Ionicons
                        name={(categoryRatings[cat.id] || 0) >= s ? 'star' : 'star-outline'}
                        size={20}
                        color={starColor((categoryRatings[cat.id] || 0) >= s)}
                        style={{ marginLeft: 2 }}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}
          </View>

          {/* Quick Tags */}
          <View style={[styles.card, { backgroundColor: theme.card || (isDarkMode ? '#1F2937' : '#fff') }]}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>What did you like?</Text>
            <View style={styles.tagsWrap}>
              {QUICK_TAGS.map(tag => {
                const selected = selectedTags.includes(tag)
                return (
                  <TouchableOpacity
                    key={tag}
                    style={[styles.tag, {
                      backgroundColor: selected ? theme.primary : 'transparent',
                      borderColor: selected ? theme.primary : (isDarkMode ? '#374151' : '#E5E7EB'),
                    }]}
                    onPress={() => toggleTag(tag)}
                  >
                    <Text style={[styles.tagText, { color: selected ? '#fff' : (isDarkMode ? '#9CA3AF' : '#6B7280') }]}>
                      {selected && '✓ '}{tag}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </View>
          </View>

          {/* Review Box */}
          <View style={[styles.card, { backgroundColor: theme.card || (isDarkMode ? '#1F2937' : '#fff') }]}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>
              Write a Review{' '}
              <Text style={{ color: isDarkMode ? '#6B7280' : '#9CA3AF', fontWeight: '400', fontSize: 13 }}>(optional)</Text>
            </Text>
            <TextInput
              style={[styles.textInput, {
                backgroundColor: isDarkMode ? '#111827' : '#F9FAFB',
                color: theme.text,
                borderColor: isDarkMode ? '#374151' : '#E5E7EB',
              }]}
              placeholder="Share your experience with KORA laundry..."
              placeholderTextColor={isDarkMode ? '#6B7280' : '#9CA3AF'}
              multiline
              numberOfLines={4}
              value={review}
              onChangeText={text => text.length <= 300 && setReview(text)}
              textAlignVertical="top"
            />
            <Text style={[styles.charCount, { color: isDarkMode ? '#6B7280' : '#9CA3AF' }]}>
              {review.length}/300
            </Text>
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitBtn, {
              backgroundColor: rating > 0 ? theme.primary : (isDarkMode ? '#374151' : '#E5E7EB'),
            }]}
            onPress={handleSubmit}
            activeOpacity={0.85}
            disabled={submitLoading}
          >
            {submitLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons
                  name="send"
                  size={18}
                  color={rating > 0 ? '#fff' : (isDarkMode ? '#6B7280' : '#9CA3AF')}
                  style={{ marginRight: 8 }}
                />
                <Text style={[styles.submitText, { color: rating > 0 ? '#fff' : (isDarkMode ? '#6B7280' : '#9CA3AF') }]}>
                  Submit Review
                </Text>
              </>
            )}
          </TouchableOpacity>

          <View style={{ height: 30 }} />
        </ScrollView>
      </AppBackground>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scrollContent: { paddingBottom: 20 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  backBtn: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  heroCard: { margin: 16, borderRadius: 16, padding: 24, alignItems: 'center' },
  heroEmoji: { fontSize: 48, marginBottom: 10 },
  heroTitle: { fontSize: 20, fontWeight: '700', color: '#fff', textAlign: 'center' },
  heroSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 6, textAlign: 'center' },
  card: { marginHorizontal: 16, marginBottom: 14, borderRadius: 14, padding: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 },
  cardTitle: { fontSize: 15, fontWeight: '700', marginBottom: 14 },
  starsRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 10 },
  star: { marginHorizontal: 4 },
  ratingLabel: { textAlign: 'center', fontSize: 15, fontWeight: '600' },
  categoryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  categoryLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  catIconBox: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  categoryLabel: { fontSize: 14, fontWeight: '500' },
  miniStars: { flexDirection: 'row' },
  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  tagText: { fontSize: 12, fontWeight: '500' },
  textInput: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 14, minHeight: 100, lineHeight: 20 },
  charCount: { fontSize: 11, textAlign: 'right', marginTop: 6 },
  submitBtn: { marginHorizontal: 16, marginTop: 4, paddingVertical: 15, borderRadius: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  submitText: { fontSize: 16, fontWeight: '700' },
  reviewText: { fontSize: 14, lineHeight: 22, fontStyle: 'italic' },
})
