import React, { useEffect, useState, useRef } from 'react';
import { 
  View, 
  FlatList, 
  Image, 
  ActivityIndicator, 
  Dimensions, 
  StyleSheet,
  TouchableOpacity
} from 'react-native';
import { fetchBanners } from '../services/banner';
import { Colors } from '../utils/constants';

const { width } = Dimensions.get('window');

const BannerSlider = ({ refreshing }) => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);

  const loadBanners = async () => {
    setLoading(true);
    try {
      const data = await fetchBanners();
      setBanners(data);
      
      // Reset ke banner pertama saat reload
      setCurrentIndex(0);
      if (flatListRef.current && data.length > 0) {
        flatListRef.current.scrollToIndex({ index: 0, animated: false });
      }
    } catch (error) {
      console.error('Error loading banners:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBanners();
  }, []);

  // Handle refresh dari parent
  useEffect(() => {
    if (refreshing) {
      loadBanners();
    }
  }, [refreshing]);

  const handleScroll = (event) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const viewSize = width * 0.9;
    const newIndex = Math.round(contentOffset / viewSize);
    setCurrentIndex(newIndex);
  };

  const scrollToIndex = (index) => {
    setCurrentIndex(index);
    flatListRef.current?.scrollToIndex({
      index,
      animated: true,
    });
  };

  if (loading && banners.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={banners}
        keyExtractor={(item) => item.id.toString()}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled
        snapToAlignment="center"
        decelerationRate="fast"
        onScroll={handleScroll}
        scrollEventThrottle={16}
        renderItem={({ item }) => (
          <View style={styles.bannerWrapper}>
            <Image
              source={{ uri: item.file_banner }}
              style={styles.bannerImage}
              resizeMode="cover"
              fadeDuration={0}
            />
          </View>
        )}
        getItemLayout={(data, index) => ({
          length: width * 0.9,
          offset: width * 0.9 * index,
          index,
        })}
      />
      
      {/* Dot Indicators */}
      {banners.length > 1 && (
        <View style={styles.dotContainer}>
          {banners.map((_, index) => (
            <TouchableOpacity
              key={index.toString()}
              style={[
                styles.dot,
                index === currentIndex ? styles.activeDot : styles.inactiveDot
              ]}
              onPress={() => scrollToIndex(index)}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 220,
    paddingVertical: 8,
    marginBottom: 8,
    zIndex: 1,
    elevation: 1,
  },
  loadingContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerWrapper: {
    width: width * 0.9,
    height: 180,
    marginHorizontal: width * 0.05 / 8,
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
    backgroundColor: Colors.white,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  dotContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: Colors.primary,
    width: 12,
  },
  inactiveDot: {
    backgroundColor: Colors.gray,
  },
});

export default BannerSlider;