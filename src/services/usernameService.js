import { doc, getDoc, collection, getDocs, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { getCurrentUser } from './authService';

// Healthy-themed username pools
const healthyUsernames = {
  fruits: [
    'Avocado', 'Apple', 'Banana', 'Blueberry', 'Cherry', 'Dragonfruit', 'Fig', 'Grape',
    'Kiwi', 'Lemon', 'Mango', 'Orange', 'Papaya', 'Peach', 'Pear', 'Pineapple',
    'Plum', 'Pomegranate', 'Raspberry', 'Strawberry', 'Watermelon', 'Coconut',
    'Goji', 'Acai', 'Mangosteen', 'Jackfruit', 'Durian', 'Lychee', 'Passionfruit',
    'Guava', 'Starfruit', 'Persimmon', 'Mulberry', 'Cranberry', 'Blackberry',
    'Boysenberry', 'Elderberry', 'Currant', 'Gooseberry', 'Huckleberry',
    'JuniperBerry', 'Barberry', 'Cloudberry', 'Lingonberry', 'Salmonberry',
    'Saskatoon', 'Chokeberry', 'Amla', 'Bilberry', 'Buffaloberry', 'Calamansi',
    'Carambola', 'Cherimoya', 'Clementine', 'Date', 'Feijoa', 'Grapefruit',
    'Imbe', 'Jaboticaba', 'Jambul', 'Jocote', 'Kumquat', 'Lime', 'Longan',
    'Loquat', 'Mamey', 'Mandarin', 'Maracuja', 'Marionberry', 'Melon', 'Miracle',
    'Monstera', 'Nance', 'Naranjilla', 'Olive', 'Pomelo', 'Pulasan', 'Rambutan',
    'Soursop', 'Surinam', 'Tamarillo', 'Tamarind', 'Ugli', 'WhiteSapote',
    'Yuzu', 'Ziziphus', 'Akebia', 'Ambrosia', 'Balsam', 'Bignay', 'Canistel',
    'Capulin', 'Cempedak', 'Chayote', 'Citron', 'Cupuacu', 'Entawak', 'Farkleberry',
    'Genip', 'Hautbois', 'Ilama', 'Ita Palm', 'Jaboticaba', 'Kei Apple', 'Lulo'
  ],
  vegetables: [
    'Kale', 'Spinach', 'Broccoli', 'Carrot', 'Beetroot', 'Celery', 'Cucumber', 'Eggplant',
    'Garlic', 'Ginger', 'Pepper', 'Pumpkin', 'SweetPotato', 'Tomato', 'Zucchini',
    'Asparagus', 'Cabbage', 'Cauliflower', 'Lettuce', 'Mushroom', 'Onion',
    'Radish', 'Turnip', 'Yam', 'Artichoke', 'BrusselsSprout', 'BokChoy', 'Chard',
    'Collard', 'Endive', 'Escarole', 'Fennel', 'Kohlrabi', 'Leek', 'Mustard',
    'Parsley', 'Parsnip', 'Radicchio', 'Rutabaga', 'Scallion', 'Shallot', 'Watercress',
    'Arugula', 'BeanSprouts', 'BitterMelon', 'Broccolini', 'Celtuce', 'Chayote',
    'Chicory', 'Corn', 'Daikon', 'Dandelion', 'Edamame', 'Fiddlehead', 'GaiLan',
    'Horseradish', 'Jicama', 'Kale', 'Komatsuna', 'LotusRoot', 'Malanga', 'Mizuna',
    'Moringa', 'Nopale', 'Okra', 'PakChoi', 'Rhubarb', 'Seaweed', 'Shiso',
    'Sorrel', 'Taro', 'Tatsoi', 'Turnip', 'UplandCress', 'Wasabi', 'WaterChestnut',
    'Wheatgrass', 'YamBean', 'YuChoy', 'Amaranth', 'Anise', 'Arrowroot', 'Bamboo',
    'Bean', 'BitterGourd', 'Burdock', 'Cactus', 'Cardoon', 'Carob', 'Cassava',
    'Chervil', 'Chives', 'Cilantro', 'Coriander', 'Cress', 'Culantro', 'Dill',
    'Epazote', 'Fenugreek', 'Galangal', 'Horseradish', 'Hyssop', 'Lavender', 'LemonGrass',
    'Lovage', 'Marjoram', 'Nasturtium', 'Oregano', 'Paprika', 'Rue', 'Sage',
    'Savory', 'Tarragon', 'Thyme', 'Turmeric', 'Vanilla', 'WinterSavory', 'Woodruff'
  ],
  wellness: [
    'Peace', 'Joy', 'Harmony', 'Balance', 'Vitality', 'Energy', 'Strength', 'Clarity',
    'Calm', 'Focus', 'Zen', 'Bliss', 'Serenity', 'Tranquility', 'Wellness', 'Health',
    'Renewal', 'Refresh', 'Revive', 'Thrive', 'Flourish', 'Bloom', 'Glow', 'Radiant',
    'Awaken', 'Breathe', 'Center', 'Cleanse', 'Connect', 'Detox', 'Empower', 'Enlighten',
    'Flow', 'Freedom', 'Gratitude', 'Heal', 'Inspire', 'Intention', 'Journey', 'Light',
    'Love', 'Meditate', 'Mindful', 'Nourish', 'Optimism', 'Passion', 'Purpose', 'Recharge'
  ]
};

// Generate anonymous username
const generateAnonymousUsername = async (userId) => {
  const adjectives = healthyUsernames.fruits;
  const nouns = healthyUsernames.vegetables;
  const wellness = healthyUsernames.wellness;
  
  const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
  const randomWellness = wellness[Math.floor(Math.random() * wellness.length)];
  
  const username = `${randomAdjective}${randomNoun}${randomWellness}`;
  return username;
};

// Get current user's username
export const getCurrentUsername = async () => {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) return null;
    
    const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
    if (userDoc.exists()) {
      return userDoc.data().anonymousUsername;
    }
    
    // Generate username if it doesn't exist
    return await generateAnonymousUsername(currentUser.uid);
    
  } catch (error) {
    console.error('Error getting current username:', error);
    return null;
  }
};

// Get total community members count (only users who have actually signed up)
export const getCommunityMemberCount = async () => {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      // Guest users can see member count but it's read-only
      console.log('📝 Guest user - showing member count without authentication');
      // Return a hardcoded value for guest users to avoid Firebase permission errors
      return 0;
    }

    // Only proceed if user is authenticated
    const usersSnapshot = await getDocs(collection(db, 'users'));
    
    // Count only users who have displayName (indicating they completed signup)
    let memberCount = 0;
    usersSnapshot.forEach((doc) => {
      const userData = doc.data();
      if (userData.displayName) { // Only count users who have actually signed up
        memberCount++;
      }
    });
    
    console.log(`📊 Actual community members: ${memberCount} (total users: ${usersSnapshot.size})`);
    return memberCount;
  } catch (error) {
    console.error('Error getting member count:', error);
    // Return 0 instead of throwing error to prevent app crash
    return 0;
  }
};

// Get today's posts count (guest users can view, but can't post)
export const getTodayPostsCount = async () => {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      // Guest users can't post, so return 0
      console.log('📝 Guest user - cannot post, returning 0 posts');
      return 0;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    console.log(`📅 Date range for today's posts: ${today.toISOString()} to ${tomorrow.toISOString()}`);

    const postsSnapshot = await getDocs(collection(db, 'communityPosts'));
    let todayPostsCount = 0;
    const allPosts = [];
    
    postsSnapshot.forEach((doc) => {
      const postData = doc.data();
      const postDate = postData.timestamp?.toDate() || new Date(postData.timestamp);
      allPosts.push({
        id: doc.id,
        date: postDate.toISOString(),
        isToday: postDate >= today && postDate < tomorrow
      });
      if (postDate >= today && postDate < tomorrow) {
        todayPostsCount++;
      }
    });
    
    console.log(`📊 Today's posts count: ${todayPostsCount} (total posts: ${postsSnapshot.size})`);
    console.log(`📝 All posts:`, allPosts.slice(0, 5)); // Show first 5 posts for debugging
    return todayPostsCount;
  } catch (error) {
    console.error('Error getting today posts count:', error);
    // Return 0 instead of throwing error to prevent app crash
    return 0;
  }
};
