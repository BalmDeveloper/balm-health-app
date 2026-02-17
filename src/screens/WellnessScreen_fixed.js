// Load activities from Firestore
const loadActivities = async () => {
  try {
    const user = getCurrentUser();
    if (!user) return;
    
    const activitiesQuery = query(
      collection(db, 'users', user.uid, 'activities'),
      orderBy('timestamp', 'desc'),
      limit(30)
    );
    
    const querySnapshot = await getDocs(activitiesQuery);
    const activities = querySnapshot.docs.map(doc => ({
      id: doc.id,
      type: doc.data().type || 'Activity',
      title: doc.data().data?.title || 'Activity logged',
      detail: doc.data().data?.detail || '',
      timestamp: doc.data().timestamp?.toDate?.() || new Date(),
      icon: getActivityIcon(doc.data().type)
    }));
    
    setActivityHistory(activities);
  } catch (error) {
    console.error('Error loading activities:', error);
  }
};

// Get icon for activity type
const getActivityIcon = (type) => {
  switch (type) {
    case 'mood_check': return 'happy';
    case 'steps': return 'walk';
    case 'bmi': return 'body';
    case 'sleep': return 'moon';
    case 'nutrition': return 'restaurant';
    default: return 'ellipse';
  }
};
